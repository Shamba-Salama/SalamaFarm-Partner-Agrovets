export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Best-effort message from ApiError, Error, fetch failures, or Supabase payloads. */
export function messageFromUnknown(err: unknown): string | null {
  if (typeof err === "string" && err.trim()) return err.trim();
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (!err || typeof err !== "object") return null;

  const record = err as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
  if (typeof record.detail === "string" && record.detail.trim()) return record.detail.trim();
  if (typeof record.error_description === "string" && record.error_description.trim()) {
    return record.error_description.trim();
  }
  if (typeof record.hint === "string" && record.hint.trim()) return record.hint.trim();
  return null;
}
