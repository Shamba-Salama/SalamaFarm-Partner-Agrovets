import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sprout } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatApiError } from "@/lib/format-api-error";

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
      toast.error(err instanceof ApiError ? formatApiError(err) : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

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
              Pick up where you left off.
            </h2>
            <p className="mt-3 max-w-sm text-sm text-sidebar-foreground/75">
              Manage inventory, farmer chat, and M-Pesa orders from one place.
            </p>
          </div>
          <p className="text-sm text-sidebar-foreground/75">New here? Register your store in minutes.</p>
        </aside>

        <main className="flex flex-col justify-center p-6 sm:p-10">
          <Card>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Sign in</h1>
                <p className="text-sm text-muted-foreground">Use the email and password for your agrovet account.</p>
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
                <Label htmlFor="login-password">Password</Label>
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
        </main>
      </div>
    </div>
  );
}
