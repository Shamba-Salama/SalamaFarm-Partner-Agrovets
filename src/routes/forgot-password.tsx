import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/AuthShell";
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
    <AuthShell
      headline="Reset your store password."
      description="We will email you a reset link so you can choose a new password and sign in again."
      footer="Remembered it? Sign in instead."
    >
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
    </AuthShell>
  );
}
