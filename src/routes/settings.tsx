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
  const [form, setForm] = useState({
    name: profile.name,
    town: profile.town,
    county: profile.county,
    till: profile.till,
    attendantPhone: profile.attendantPhone,
  });

  useEffect(() => {
    setForm({
      name: profile.name,
      town: profile.town,
      county: profile.county,
      till: profile.till,
      attendantPhone: profile.attendantPhone,
    });
  }, [profile.name, profile.town, profile.county, profile.till, profile.attendantPhone]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid =
    form.name.trim().length > 1 &&
    form.town.trim().length > 1 &&
    form.county.trim().length > 1 &&
    form.till.trim().length > 3 &&
    form.attendantPhone.trim().length > 8;

  const onSave = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await updateStore({
        name: form.name.trim(),
        town: form.town.trim(),
        county: form.county.trim(),
        till: form.till.trim(),
        attendantPhone: form.attendantPhone.trim(),
      });
      toast.success("Store profile saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? formatApiError(err) : "Could not save store profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalLayout
      title="Store Settings"
      subtitle="Update how farmers find and pay your agrovet"
    >
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
              <strong className="text-foreground">Known gap:</strong> there is no backend endpoint for
              business permit or agrochemical license upload yet (README Step 2). This control is
              disabled and does not upload or mark you verified.
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
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={onChange} />
    </div>
  );
}
