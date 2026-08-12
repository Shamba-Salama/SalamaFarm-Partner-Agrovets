import { api } from "@/lib/api-client";

/** Response shape from catalog product endpoints. */
export type ApiProduct = {
  id: number;
  name: string;
  category: string;
  description: string;
  /** DRF DecimalField serializes as a string, e.g. "4850.00". */
  price: string;
  stock: number;
  expiry: string | null;
  image_emoji: string;
  image: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

/** Fields accepted on create/update (no id / store). */
export type ProductWriteBody = {
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  expiry: string | null;
  /** Local emoji fallback shown in the portal when no photo is present. */
  image: string;
  active: boolean;
  /** Optional JPG/PNG chosen in the product drawer — sent as multipart `image`. */
  imageFile?: File | null;
  /** Existing photo URL from the API (edit mode preview only). */
  existingImageUrl?: string | null;
};

export type CsvImportResult = {
  created: number;
  products: ApiProduct[];
};

export function apiProductToProduct(p: ApiProduct) {
  return {
    id: String(p.id),
    name: p.name ?? "",
    category: p.category,
    description: p.description ?? "",
    price: Number(p.price),
    stock: Number(p.stock),
    expiry: p.expiry ?? null,
    image: p.image_emoji || "📦",
    imageUrl: p.image ?? null,
    active: Boolean(p.active),
  };
}

export function productToApiBody(p: ProductWriteBody): Record<string, unknown> {
  const expiry = p.expiry && String(p.expiry).trim() ? String(p.expiry).trim() : null;
  return {
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    stock: p.stock,
    expiry,
    image_emoji: p.image,
    active: p.active,
  };
}

function productToFormData(p: ProductWriteBody): FormData {
  const form = new FormData();
  const body = productToApiBody(p);
  for (const [key, value] of Object.entries(body)) {
    if (value === null || value === undefined) {
      // Omit nulls (e.g. empty expiry) — multipart cannot send JSON null cleanly.
      continue;
    }
    if (typeof value === "boolean") {
      form.append(key, value ? "true" : "false");
    } else {
      form.append(key, String(value));
    }
  }
  if (p.imageFile) {
    form.append("image", p.imageFile, p.imageFile.name);
  }
  return form;
}

function unwrapProductList(data: unknown): ApiProduct[] {
  if (Array.isArray(data)) return data as ApiProduct[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: ApiProduct[] }).results;
  }
  return [];
}

export async function fetchProducts(): Promise<ApiProduct[]> {
  const data = await api.get<unknown>("/products/");
  return unwrapProductList(data);
}

export async function createProduct(p: ProductWriteBody): Promise<ApiProduct> {
  if (p.imageFile) {
    return api.post<ApiProduct>("/products/", productToFormData(p));
  }
  return api.post<ApiProduct>("/products/", productToApiBody(p));
}

export async function updateProduct(id: string | number, p: ProductWriteBody): Promise<ApiProduct> {
  if (p.imageFile) {
    return api.patch<ApiProduct>(`/products/${id}/`, productToFormData(p));
  }
  return api.patch<ApiProduct>(`/products/${id}/`, productToApiBody(p));
}

export async function deleteProductApi(id: string | number): Promise<void> {
  await api.delete(`/products/${id}/`);
}

export async function toggleProductActive(id: string | number): Promise<ApiProduct> {
  return api.post<ApiProduct>(`/products/${id}/toggle/`);
}

export async function importProductsCsv(file: File): Promise<CsvImportResult> {
  const form = new FormData();
  form.append("file", file);
  // Do not set Content-Type — api-client leaves it unset so the browser adds the boundary.
  return api.post<CsvImportResult>("/products/import/", form);
}
