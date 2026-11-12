import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthCard, authFieldClass, authLabelClass } from "@/components/auth/AuthCard";
import { AuthLoadingScreen, AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { formatApiError } from "@/lib/format-api-error";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In | SalamaFarm Partner Portal" },
      {
        name: "description",
        content: "Sign in to your SalamaFarm partner agrovet account.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      void navigate({ to: "/" });
    }
  }, [isAuthenticated, isBootstrapping, navigate]);

  const valid = email.includes("@") && password.length >= 8;

  const onSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back!");
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(formatApiError(err, "Could not sign in."));
    } finally {
      setSubmitting(false);
    }
  };

  if (isBootstrapping) {
    return <AuthLoadingScreen />;
  }

  return (
    <AuthShell variant="centered">
      <AuthCard
        title="Sign in"
        description="Use the email and password for your agrovet account."
        badge={{ icon: LogIn, label: "Partner sign in" }}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className={authLabelClass}>
              Email
            </Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agrovet.co.ke"
              className={authFieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="login-password" className={authLabelClass}>
                Password
              </Label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={authFieldClass}
              onKeyDown={(e) => {
                if (e.key === "Enter") void onSubmit();
              }}
            />
          </div>

          <Button
            className={cn("h-11 w-full rounded-lg text-sm font-semibold shadow-sm")}
            disabled={!valid || submitting}
            onClick={() => void onSubmit()}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            No account yet?{" "}
            <Link to="/onboarding" className="font-semibold text-primary underline-offset-4 hover:underline">
              Register your agrovet
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
