import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sprout } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatApiError } from "@/lib/format-api-error";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password | SalamaFarm Partner Portal" },
      {
        name: "description",
        content: "Request a password reset link for your SalamaFarm partner agrovet account.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const valid = email.includes("@");

  const onSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
      toast.success("Check your email for a reset link.", {
        description: "If you do not see it, look in spam. The link expires after a short time.",
      });
    } catch (err) {
      toast.error(formatApiError(err, "Could not send reset email."));
    } finally {
      setSubmitting(false);
    }
  };

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
              Reset your store password.
            </h2>
            <p className="mt-3 max-w-sm text-sm text-sidebar-foreground/75">
              We will email you a Supabase Auth link so you can choose a new password and sign in again.
            </p>
          </div>
          <p className="text-sm text-sidebar-foreground/75">Remembered it? Sign in instead.</p>
        </aside>

        <main className="flex flex-col justify-center p-6 sm:p-10">
          <Card>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Forgot password</h1>
                <p className="text-sm text-muted-foreground">
                  Enter the email you used to register. We will send a reset link if that account exists.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agrovet.co.ke"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void onSubmit();
                  }}
                />
              </div>

              <Button className="w-full" disabled={!valid || submitting} onClick={() => void onSubmit()}>
                {submitting ? "Sending…" : sent ? "Send again" : "Send reset link"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                  Back to sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
