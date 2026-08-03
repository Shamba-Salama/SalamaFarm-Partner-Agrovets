import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sprout } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortal } from "@/lib/portal-store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Agrovet Sign Up | SalamaFarm Partner Portal" },
      {
        name: "description",
        content:
          "Register your agrovet store in one short form — store name, town, county, M-Pesa till and attendant phone. Instant access, no permits required.",
      },
      { property: "og:title", content: "Agrovet Sign Up | SalamaFarm Partner Portal" },
      {
        property: "og:description",
        content: "Instant onboarding for Kenyan agrovet stores joining SalamaFarm.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { profile, setProfile } = usePortal();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: profile.name,
    town: profile.town,
    county: profile.county,
    till: profile.till,
    attendantPhone: profile.attendantPhone,
    password: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid =
    form.name.trim().length > 1 &&
    form.town.trim().length > 1 &&
    form.county.trim().length > 1 &&
    form.till.trim().length > 3 &&
    form.attendantPhone.trim().length > 8 &&
    form.password.length >= 6;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        <aside className="hidden flex-col justify-between bg-sidebar p-10 lg:flex">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <Sprout className="h-5 w-5" />
            </span>
            <span className="text-sm font-bold text-sidebar-foreground">
              SalamaFarm Partner Agrovets
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-bold leading-tight text-sidebar-foreground">
              Sell to thousands of farmers from your counter.
            </h2>
            <p className="mt-3 max-w-sm text-sm text-sidebar-foreground/75">
              No permits, no paperwork, no waiting. Fill one form and start listing stock today.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-sidebar-foreground/75">
            <li>✅ Instant access — no license upload required</li>
            <li>✅ Live farmer chat with audible alerts</li>
            <li>✅ Counter STK push and M-Pesa reconciliation</li>
          </ul>
        </aside>

        <main className="flex flex-col justify-center p-6 sm:p-10">
          <Card>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Register your agrovet</h1>
                <p className="text-sm text-muted-foreground">
                  Tell us where farmers can find and pay you. Access is granted immediately.
                </p>
              </div>

              <Field label="Store name" value={form.name} onChange={set("name")} placeholder="Green Valley Agrovet" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Physical location / town" value={form.town} onChange={set("town")} placeholder="Nakuru Town" />
                <Field label="County" value={form.county} onChange={set("county")} placeholder="Nakuru" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="M-Pesa Till / Paybill number" value={form.till} onChange={set("till")} placeholder="5203817" />
                <Field
                  label="Store attendant phone number"
                  value={form.attendantPhone}
                  onChange={set("attendantPhone")}
                  placeholder="0712345678"
                />
              </div>
              <Field
                label="Account password"
                value={form.password}
                onChange={set("password")}
                placeholder="At least 6 characters"
                type="password"
              />

              <Button
                className="w-full"
                disabled={!valid}
                onClick={() => {
                  setProfile({
                    name: form.name,
                    town: form.town,
                    county: form.county,
                    till: form.till,
                    attendantPhone: form.attendantPhone,
                    onboarded: true,
                  });
                  toast.success("Welcome to SalamaFarm Partner Portal!", {
                    description: "Start listing your inventory.",
                  });
                  navigate({ to: "/inventory" });
                }}
              >
                Create store account
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                No business permit or agrochemical license upload needed.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={onChange} placeholder={placeholder} type={type} />
    </div>
  );
}
