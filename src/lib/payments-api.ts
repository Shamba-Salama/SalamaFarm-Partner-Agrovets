/**
 * Match backend normalize_kenya_msisdn for client validation.
 * Returns E.164 (+254…) or null if invalid.
 */
export function normalizeKenyaMsisdn(phone: string): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return `+254${digits.slice(1)}`;
  }
  if (digits.startsWith("254") && digits.length === 12) {
    return `+${digits}`;
  }
  return null;
}
