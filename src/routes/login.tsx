import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatApiError } from "@/lib/format-api-error";
import { useAuth } from "@/lib/auth-context";

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar text-sm text-sidebar-foreground/80">
        Checking session…
      </div>
    );
  }

  return (
    <AuthShell
      headline="Pick up where you left off."
      description="Manage inventory, farmer chat, and M-Pesa orders from one place."
      footer="New here? Register your store in minutes."
    >
      <Card>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Use the email and password for your agrovet account.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agrovet.co.ke"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="login-password">Password</Label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              onKeyDown={(e) => {
                if (e.key === "Enter") void onSubmit();
              }}
            />
          </div>

          <Button className="w-full" disabled={!valid || submitting} onClick={() => void onSubmit()}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            No account yet?{" "}
            <Link to="/onboarding" className="font-medium text-primary underline-offset-4 hover:underline">
              Register your agrovet
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
