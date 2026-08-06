import { api } from "@/lib/api-client";

/** Raw row from GET /analytics/weekly-sales/ — category totals are strings. */
export type ApiWeeklySalesRow = {
  week: string;
  year: number;
  iso_week: number;
  [category: string]: string | number;
};

export type WeeklySalesRow = {
  week: string;
  year: number;
  isoWeek: number;
  Fertilizer: number;
  Seeds: number;
  "Vet Supplies": number;
  Pesticides: number;
};

const CATEGORIES = ["Fertilizer", "Seeds", "Vet Supplies", "Pesticides"] as const;

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

export function apiWeeklySalesRowToRow(r: ApiWeeklySalesRow): WeeklySalesRow {
  const num = (key: (typeof CATEGORIES)[number]) => Number(r[key] ?? 0) || 0;
  return {
    week: String(r.week ?? ""),
    year: Number(r.year),
    isoWeek: Number(r.iso_week),
    Fertilizer: num("Fertilizer"),
    Seeds: num("Seeds"),
    "Vet Supplies": num("Vet Supplies"),
    Pesticides: num("Pesticides"),
  };
}

export async function fetchWeeklySales(): Promise<WeeklySalesRow[]> {
  const data = await api.get<unknown>("/analytics/weekly-sales/");
  return unwrapList<ApiWeeklySalesRow>(data).map(apiWeeklySalesRowToRow);
}

/**
 * Prepare rows for Recharts: keep API sort, cap at 8 most recent weeks,
 * rebuild axis labels (include year only when the visible window spans years).
 * Does not gap-fill missing weeks.
 */
export function prepareWeeklySalesChartRows(rows: WeeklySalesRow[]): WeeklySalesRow[] {
  const recent = rows.slice(-8);
  const years = new Set(recent.map((r) => r.year));
  const multiYear = years.size > 1;
  return recent.map((r) => ({
    ...r,
    week: multiYear ? `Wk ${r.isoWeek} · ${r.year}` : `Wk ${r.isoWeek}`,
  }));
}
