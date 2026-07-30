import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, FileCheck2, Sprout, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePortal } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Agrovet Sign Up & Verification | SalamaFarm" },
      {
        name: "description",
        content:
          "Register your agrovet store in two steps: store details and business permit verification for the SalamaFarm partner network.",
      },
      { property: "og:title", content: "Agrovet Sign Up & Verification | SalamaFarm" },
      {
        property: "og:description",
        content: "Two-step onboarding for Kenyan agrovet stores joining SalamaFarm.",
      },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { profile, setProfile } = usePortal();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: profile.name,
    town: profile.town,
    county: profile.county,
    till: profile.till,
    whatsapp: profile.whatsapp,
  });
  const [file, setFile] = useState<string | null>(profile.permitFile);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const step1Valid = Object.values(form).every((v) => v.trim().length > 1);

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
              List your stock, receive direct M-Pesa payments to your till, and follow up with every
              farmer after purchase — all from one dashboard.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-sidebar-foreground/75">
            <li>✅ Verified merchant badge in the mobile app</li>
            <li>✅ Real-time M-Pesa reconciliation at the counter</li>
            <li>✅ Expiry & low-stock alerts on every batch</li>
          </ul>
        </aside>

        <main className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mb-6 flex items-center gap-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {s}
                </span>
                <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">
                  {s === 1 ? "Store details" : "Verification upload"}
                </span>
              </div>
            ))}
          </div>

          <Card>
            <CardContent className="space-y-4 p-5 sm:p-6">
              {step === 1 ? (
                <>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight">Register your agrovet</h1>
                    <p className="text-sm text-muted-foreground">
                      Tell us where farmers can find and pay you.
                    </p>
                  </div>
                  <Field label="Agrovet name" value={form.name} onChange={set("name")} placeholder="Green Valley Agrovet" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Physical location / town" value={form.town} onChange={set("town")} placeholder="Nakuru Town" />
                    <Field label="County" value={form.county} onChange={set("county")} placeholder="Nakuru" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="M-Pesa Till / Paybill number" value={form.till} onChange={set("till")} placeholder="5203817" />
                    <Field label="WhatsApp phone number" value={form.whatsapp} onChange={set("whatsapp")} placeholder="2547XXXXXXXX" />
                  </div>
                  <Button className="w-full" disabled={!step1Valid} onClick={() => setStep(2)}>
                    Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight">Verify your business</h1>
                    <p className="text-sm text-muted-foreground">
                      Upload your Business Permit or Agrochemical License. Review takes up to 48 hours.
                    </p>
                  </div>

                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center transition-colors hover:bg-muted">
                    <UploadCloud className="h-7 w-7 text-primary" />
                    <span className="text-sm font-medium">Tap to upload permit or license</span>
                    <span className="text-xs text-muted-foreground">PDF, JPG or PNG up to 10MB</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)}
                    />
                  </label>

                  {file && (
                    <div className="flex items-center gap-2 rounded-lg bg-primary-soft p-3 text-sm text-accent-foreground">
                      <FileCheck2 className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 truncate">{file}</span>
                      <Badge variant="secondary" className="ml-auto shrink-0">
                        Ready
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                      <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={!file}
                      onClick={() => {
                        setProfile({ ...form, permitFile: file, onboarded: true, verified: false });
                        toast.success("Submitted for verification — we'll review within 48 hours");
                        navigate({ to: "/" });
                      }}
                    >
                      Submit for Verification
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full text-xs"
                    onClick={() => {
                      setProfile({ ...form, permitFile: file, verified: true, onboarded: true });
                      toast.success("Demo: store marked as a Verified Merchant");
                      navigate({ to: "/" });
                    }}
                  >
                    Demo shortcut: approve verification instantly
                  </Button>
                </>
              )}
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
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}
