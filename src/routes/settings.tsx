import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PortalLayout } from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { formatApiError } from "@/lib/format-api-error";
import { usePortal } from "@/lib/portal-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Store Settings | SalamaFarm Partner Portal" },
      {
        name: "description",
        content: "Update your agrovet store name, location, till number, and attendant phone.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, updateStore } = usePortal();
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    name: profile.name,
    town: profile.town,
    county: profile.county,
    till: profile.till,
    attendantPhone: profile.attendantPhone,
    latitude: profile.latitude != null ? String(profile.latitude) : "",
    longitude: profile.longitude != null ? String(profile.longitude) : "",
  });

  useEffect(() => {
    setForm({
      name: profile.name,
      town: profile.town,
      county: profile.county,
      till: profile.till,
      attendantPhone: profile.attendantPhone,
      latitude: profile.latitude != null ? String(profile.latitude) : "",
      longitude: profile.longitude != null ? String(profile.longitude) : "",
    });
  }, [
    profile.name,
    profile.town,
    profile.county,
    profile.till,
    profile.attendantPhone,
    profile.latitude,
    profile.longitude,
  ]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const parseCoord = (raw: string): number | null | "invalid" => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return "invalid";
    return n;
  };

  const latParsed = parseCoord(form.latitude);
  const lngParsed = parseCoord(form.longitude);

  const valid =
    form.name.trim().length > 1 &&
    form.town.trim().length > 1 &&
    form.county.trim().length > 1 &&
    form.till.trim().length > 3 &&
    form.attendantPhone.trim().length > 8 &&
    latParsed !== "invalid" &&
    lngParsed !== "invalid" &&
    // Both set or both empty — partial pins are rejected.
    ((latParsed === null && lngParsed === null) ||
      (typeof latParsed === "number" && typeof lngParsed === "number"));

  const onUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        toast.success("Location filled — save to apply.");
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || "Could not read your current location.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const onSave = async () => {
    if (!valid || submitting) return;
    if (latParsed === "invalid" || lngParsed === "invalid") return;
    setSubmitting(true);
    try {
      await updateStore({
        name: form.name.trim(),
        town: form.town.trim(),
        county: form.county.trim(),
        till: form.till.trim(),
        attendantPhone: form.attendantPhone.trim(),
        latitude: latParsed,
        longitude: lngParsed,
      });
      toast.success("Store profile saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? formatApiError(err) : "Could not save store profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalLayout title="Store Settings" subtitle="Update how farmers find and pay your agrovet">
      <div className="mx-auto max-w-2xl space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Store profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Store name" value={form.name} onChange={set("name")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Town / location" value={form.town} onChange={set("town")} />
              <Field label="County" value={form.county} onChange={set("county")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="M-Pesa Till / Paybill" value={form.till} onChange={set("till")} />
              <Field
                label="Attendant phone"
                value={form.attendantPhone}
                onChange={set("attendantPhone")}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Map pin (GPS)</p>
                <p className="text-xs text-muted-foreground">
                  Used for customer Get Directions and arrival tracking. Leave blank to clear.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Latitude"
                  value={form.latitude}
                  onChange={set("latitude")}
                  placeholder="-1.286389"
                  inputMode="decimal"
                />
                <Field
                  label="Longitude"
                  value={form.longitude}
                  onChange={set("longitude")}
                  placeholder="36.817223"
                  inputMode="decimal"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={locating}
                onClick={onUseCurrentLocation}
              >
                {locating ? "Locating…" : "Use My Current Location"}
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Verification status:{" "}
              <span className="font-semibold text-foreground">
                {profile.onboarded ? "Verified Merchant ✅" : "Pending Verification ⏳"}
              </span>
              . License upload is not wired to the API yet (see below).
            </div>
            <Button disabled={!valid || submitting} onClick={() => void onSave()}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">License / permit upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Known gap:</strong> there is no backend endpoint
              for business permit or agrochemical license upload yet (README Step 2). This control
              is disabled and does not upload or mark you verified.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="license-file">Upload permit / license</Label>
              <Input id="license-file" type="file" disabled accept=".pdf,image/*" />
            </div>
            <Button type="button" disabled variant="secondary">
              Upload (unavailable)
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={onChange} placeholder={placeholder} inputMode={inputMode} />
    </div>
  );
}
