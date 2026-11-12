/** Kenya counties (47) — used for signup/settings validation. */
export const KENYA_COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
] as const;

export type KenyaCounty = (typeof KENYA_COUNTIES)[number];

const countyKey = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/murang'a/gi, "muranga")
    .replace(/'/g, "");

export function resolveKenyaCounty(input: string): KenyaCounty | null {
  const key = countyKey(input);
  for (const county of KENYA_COUNTIES) {
    if (countyKey(county) === key) return county;
  }
  return null;
}

const TOWN_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]{1,78}$/u;

export function isValidKenyaTown(town: string): boolean {
  const t = town.trim();
  if (t.length < 2) return false;
  if (/^\d+$/.test(t)) return false;
  return TOWN_RE.test(t);
}

const STORE_NAME_RE = /^[\p{L}\p{M}0-9][\p{L}\p{M}0-9\s&'.-]{1,118}$/u;

export function isValidStoreName(name: string): boolean {
  const n = name.trim();
  if (n.length < 2) return false;
  if (/^\d+$/.test(n)) return false;
  return STORE_NAME_RE.test(n);
}

/** Accept 07xxxxxxxx, 01xxxxxxxx, +2547…, +2541…, 2547… */
export function normalizeKenyaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^0[17]\d{8}$/.test(digits)) return digits;
  if (/^254[17]\d{8}$/.test(digits)) return `0${digits.slice(3)}`;
  return null;
}

export function isValidKenyaPhone(raw: string): boolean {
  return normalizeKenyaPhone(raw) !== null;
}

export function isValidSignupEmail(email: string): boolean {
  const e = email.trim();
  if (e.length < 5 || !e.includes("@")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
