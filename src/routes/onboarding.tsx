import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AuthCard, authFieldClass, authLabelClass } from "@/components/auth/AuthCard";
import { AuthLoadingScreen, AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatApiError } from "@/lib/format-api-error";
import { useAuth } from "@/lib/auth-context";
import {
  isValidKenyaPhone,
  isValidKenyaTown,
  isValidSignupEmail,
  isValidStoreName,
  KENYA_COUNTIES,
  normalizeKenyaPhone,
  resolveKenyaCounty,
} from "@/lib/kenya-locations";
import { usePortal } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Agrovet Sign Up | SalamaFarm Partner Portal" },
      {
        name: "description",
        content:
          "Register your agrovet store — store name, town, county, and attendant phone. Instant access.",
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
  const { profile } = usePortal();
  const { register, isAuthenticated, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: profile.name,
    town: profile.town,
    county: resolveKenyaCounty(profile.county) ?? "",
    attendantPhone: profile.attendantPhone,
    password: "",
  });

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      void navigate({ to: "/" });
    }
  }, [isAuthenticated, isBootstrapping, navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<keyof typeof form | "country", string>> = {};
    if (!isValidSignupEmail(form.email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!isValidStoreName(form.name)) {
      errors.name = "Enter a real store name (letters or numbers, at least 2 characters).";
    }
    if (!isValidKenyaTown(form.town)) {
      errors.town = "Enter a town or area name (letters required, not numbers only).";
    }
    if (!form.county || !resolveKenyaCounty(form.county)) {
      errors.county = "Choose a county from the list.";
    }
    if (!isValidKenyaPhone(form.attendantPhone)) {
      errors.attendantPhone = "Use a Kenyan mobile number (e.g. 0712345678 or +254712345678).";
    }
    if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    return errors;
  }, [form]);

  const valid = Object.keys(fieldErrors).length === 0;

  const onSubmit = async () => {
    setTouched(true);
    if (!valid || submitting) {
      const first = Object.values(fieldErrors)[0];
      if (first) toast.error(first);
      return;
    }
    const county = resolveKenyaCounty(form.county);
    const phone = normalizeKenyaPhone(form.attendantPhone);
    if (!county || !phone) return;

    setSubmitting(true);
    try {
      await register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone,
        store: {
          name: form.name.trim(),
          town: form.town.trim(),
          county,
          till: "",
          attendant_phone: phone,
        },
      });
      toast.success("Welcome to SalamaFarm Partner Portal!", {
        description: "Start listing your inventory.",
      });
      void navigate({ to: "/inventory" });
    } catch (err) {
      toast.error(formatApiError(err, "Could not create account."));
    } finally {
      setSubmitting(false);
    }
  };

  if (isBootstrapping) {
    return <AuthLoadingScreen />;
  }

  return (
    <AuthShell
      headline="Sell to thousands of farmers from your counter."
      description="No permits or long forms—just your store details. List stock the same day farmers walk in."
      footer="Instant access · Live farmer chat · Add M-Pesa till in settings"
      contentClassName="max-w-md lg:max-w-[32rem]"
    >
      <AuthCard
        title="Register your agrovet"
        description="Tell us where farmers can find you. Access is granted immediately."
        badge={{ icon: Store, label: "New store" }}
      >
        <div className="space-y-4">
          <AuthSection title="Account" />
          <Field
            label="Email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@agrovet.co.ke"
            type="email"
            autoComplete="email"
            error={touched ? fieldErrors.email : undefined}
          />
          <AuthSection title="Store location" />
          <Field
            label="Store name"
            value={form.name}
            onChange={set("name")}
            placeholder="Green Valley Agrovet"
            error={touched ? fieldErrors.name : undefined}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Physical location / town"
              value={form.town}
              onChange={set("town")}
              placeholder="Nakuru Town"
              error={touched ? fieldErrors.town : undefined}
            />
            <CountySelect
              value={form.county}
              onChange={(v) => setForm((f) => ({ ...f, county: v }))}
              error={touched ? fieldErrors.county : undefined}
            />
          </div>
          <CountryField />
          <AuthSection title="Contact & security" />
          <Field
            label="Store attendant phone number"
            value={form.attendantPhone}
            onChange={set("attendantPhone")}
            placeholder="0712345678"
            type="tel"
            autoComplete="tel"
            error={touched ? fieldErrors.attendantPhone : undefined}
          />
          <PasswordField
            label="Account password"
            value={form.password}
            onChange={set("password")}
            placeholder="At least 8 characters"
            error={touched ? fieldErrors.password : undefined}
          />

          <Button
            className={cn("h-11 w-full rounded-lg text-sm font-semibold shadow-sm")}
            disabled={submitting}
            onClick={() => void onSubmit()}
          >
            {submitting ? "Creating account…" : "Create store account"}
          </Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Already registered?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            No business permit or agrochemical license upload needed.
          </p>
        </div>
      </AuthCard>
    </AuthShell>
  );
}

function AuthSection({ title }: { title: string }) {
  return (
    <div className="pt-1">
      <span className="text-[11px] font-semibold tracking-wider text-primary uppercase">
        {title}
      </span>
    </div>
  );
}

function CountryField() {
  return (
    <div className="space-y-1.5">
      <Label className={authLabelClass}>Country</Label>
      <Input
        value="Kenya"
        disabled
        className={cn(authFieldClass, "bg-muted/80 text-muted-foreground")}
        aria-readonly
      />
      <p className="text-xs text-muted-foreground">
        SalamaFarm Partner currently onboards stores in Kenya only.
      </p>
    </div>
  );
}

function CountySelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (county: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className={authLabelClass}>County</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className={authFieldClass} aria-invalid={!!error}>
          <SelectValue placeholder="Select county" />
        </SelectTrigger>
        <SelectContent>
          {KENYA_COUNTIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className={authLabelClass}>{label}</Label>
      <PasswordInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
        className={authFieldClass}
        aria-invalid={!!error}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
  autoComplete,
  error,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className={authLabelClass}>{label}</Label>
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        className={authFieldClass}
        aria-invalid={!!error}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
