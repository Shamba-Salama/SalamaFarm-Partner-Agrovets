import { getAccessToken, getRefreshToken, setTokens } from "@/lib/auth-storage";
import { ApiError, getApiBaseUrl } from "@/lib/api-client";

/** Allowed image MIME types for R2 direct upload (must match backend). */
export const UPLOAD_ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type UploadAllowedImageType = (typeof UPLOAD_ALLOWED_IMAGE_TYPES)[number];

export interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

function getUploadUrlEndpoint(): string {
  const base = getApiBaseUrl().replace(/\/api\/v1\/?$/i, "");
  return `${base}/api/upload-url/`;
}

function looksLikeHtml(text: string): boolean {
  const t = text.trimStart().toLowerCase();
  return t.startsWith("<!doctype html") || t.startsWith("<html");
}

/** User-facing message when the API returns HTML (e.g. Django 404 page) instead of JSON. */
function humanizeNonJsonFailure(status: number, rawText: string): string {
  if (looksLikeHtml(rawText)) {
    if (status === 404) {
      return "Photo upload isn’t available from the server (link not found). Make sure the backend is updated and running, then try again.";
    }
    if (status === 401 || status === 403) {
      return "Your session may have expired. Sign in again, then try uploading.";
    }
    if (status >= 500) {
      return "The server had a problem preparing your upload. Try again in a moment.";
    }
    return "Something went wrong while starting the upload. Please try again.";
  }
  return rawText.length > 200 ? `${rawText.slice(0, 200)}…` : rawText;
}

async function tryRefreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh }),
    });
    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    const access =
      data && typeof data === "object" && data !== null && "access" in data
        ? String((data as { access?: unknown }).access ?? "")
        : "";
    if (!res.ok || !access) return false;
    const currentRefresh = getRefreshToken() ?? refresh;
    setTokens(access, currentRefresh);
    return true;
  } catch {
    return false;
  }
}

async function requestPresignedUrl(contentType: string, accessToken: string): Promise<UploadUrlResponse> {
  const res = await fetch(getUploadUrlEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ contentType }),
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (res.status === 401) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      const next = getAccessToken();
      if (next) return requestPresignedUrl(contentType, next);
    }
    throw new ApiError("Session expired. Please log in again.", 401, body);
  }

  if (!res.ok) {
    let message: string;
    if (body && typeof body === "object" && body !== null && "detail" in body) {
      const d = (body as { detail: unknown }).detail;
      if (typeof d === "string") {
        message = d;
      } else if (Array.isArray(d) && d.length > 0) {
        message = "Could not start the upload. Check your request and try again.";
      } else {
        message = `Could not start the upload (error ${res.status}).`;
      }
    } else if (typeof body === "string") {
      message = humanizeNonJsonFailure(res.status, body);
    } else if (typeof text === "string" && text) {
      message = humanizeNonJsonFailure(res.status, text);
    } else {
      message = `Could not start the upload (error ${res.status}).`;
    }
    throw new ApiError(message, res.status, body);
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("uploadUrl" in body) ||
    !("publicUrl" in body) ||
    typeof (body as UploadUrlResponse).uploadUrl !== "string" ||
    typeof (body as UploadUrlResponse).publicUrl !== "string"
  ) {
    throw new ApiError("Invalid response from upload service.", res.status, body);
  }

  return body as UploadUrlResponse;
}

function putFileWithProgress(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        const pct = Math.round((ev.loaded / ev.total) * 100);
        onProgress(pct);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve();
        return;
      }
      const rt = xhr.responseText ?? "";
      const msg =
        typeof rt === "string" && looksLikeHtml(rt)
          ? "The image could not be sent to storage. Check your connection and bucket settings, then try again."
          : `The image could not be sent to storage (${xhr.status}). Try again.`;
      reject(new ApiError(msg, xhr.status, xhr.responseText));
    };
    xhr.onerror = () => {
      reject(
        new ApiError(
          "The browser could not send the image to storage (often R2 bucket CORS). " +
            "Ask your admin to run: python manage.py configure_r2_cors — " +
            "and allow your portal origin in Cloudflare R2 → bucket → CORS.",
          0,
          null,
        ),
      );
    };
    xhr.send(file);
  });
}

/**
 * Client-side validate → presigned PUT URL → direct upload to R2.
 * Returns the public HTTPS URL to store on the product record.
 */
export async function uploadImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const allowed = new Set<string>(UPLOAD_ALLOWED_IMAGE_TYPES);
  if (!allowed.has(file.type)) {
    throw new Error("Please choose a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const token = getAccessToken();
  if (!token) {
    throw new Error("You need to sign in to upload images.");
  }

  const { uploadUrl, publicUrl } = await requestPresignedUrl(file.type, token);
  if (onProgress) onProgress(0);
  await putFileWithProgress(uploadUrl, file, onProgress);
  return publicUrl;
}
