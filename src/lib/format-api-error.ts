import { ApiError, messageFromUnknown } from "@/lib/api-error";

/** Flatten DRF / network error payloads for toast copy. */
export function formatApiError(err: unknown, fallback = "Request failed"): string {
  if (!(err instanceof ApiError)) {
    return messageFromUnknown(err) || fallback;
  }

  const nested = messageFromUnknown(err.body);
  if (nested && nested !== err.message) {
    // Prefer the underlying backend message when the wrapper is generic.
    const generic =
      !err.message ||
      /^(request failed|backend request failed\.?|registration failed|login failed)$/i.test(
        err.message,
      );
    if (generic) return nested;
  }

  const body = err.body;
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    if (Array.isArray(record.detail)) return record.detail.map(String).join(" ");

    const bits: string[] = [];
    for (const [key, value] of Object.entries(record)) {
      if (key === "message" || key === "name" || key === "stack") continue;
      if (key === "store" && value && typeof value === "object") {
        for (const [sk, sv] of Object.entries(value as Record<string, unknown>)) {
          bits.push(`${sk}: ${Array.isArray(sv) ? sv.join(" ") : String(sv)}`);
        }
        continue;
      }
      if (Array.isArray(value)) bits.push(`${key}: ${value.join(" ")}`);
      else if (typeof value === "string") bits.push(`${key}: ${value}`);
    }
    if (bits.length) return bits.join(" · ");
  }

  return nested || err.message || fallback;
}
