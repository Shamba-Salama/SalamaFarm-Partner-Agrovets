import { api } from "@/lib/api-client";

/** Response shape from GET/PATCH /store/. */
export type ApiStore = {
  id: number;
  name: string;
  town: string;
  county: string;
  till: string;
  attendant_phone: string;
  paystack_subaccount_code?: string;
  open: boolean;
  onboarded: boolean;
  created_at?: string;
  updated_at?: string;
};

/** UI-facing store profile (camelCase for attendant phone). */
export type StoreProfile = {
  name: string;
  town: string;
  county: string;
  till: string;
  attendantPhone: string;
  open: boolean;
  onboarded: boolean;
};

export const emptyStoreProfile = (): StoreProfile => ({
  name: "",
  town: "",
  county: "",
  till: "",
  attendantPhone: "",
  open: true,
  onboarded: false,
});

export function apiStoreToProfile(store: ApiStore): StoreProfile {
  return {
    name: store.name ?? "",
    town: store.town ?? "",
    county: store.county ?? "",
    till: store.till ?? "",
    attendantPhone: store.attendant_phone ?? "",
    open: Boolean(store.open),
    onboarded: Boolean(store.onboarded),
  };
}

export function profilePatchToBody(patch: Partial<StoreProfile>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.town !== undefined) body.town = patch.town;
  if (patch.county !== undefined) body.county = patch.county;
  if (patch.till !== undefined) body.till = patch.till;
  if (patch.attendantPhone !== undefined) body.attendant_phone = patch.attendantPhone;
  if (patch.open !== undefined) body.open = patch.open;
  if (patch.onboarded !== undefined) body.onboarded = patch.onboarded;
  return body;
}

export async function fetchStore(): Promise<ApiStore> {
  return api.get<ApiStore>("/store/");
}

export async function patchStore(patch: Partial<StoreProfile>): Promise<ApiStore> {
  return api.patch<ApiStore>("/store/", profilePatchToBody(patch));
}
