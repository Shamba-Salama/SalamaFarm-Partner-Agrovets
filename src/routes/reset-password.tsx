import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sprout } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { formatApiError } from "@/lib/format-api-error";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password | SalamaFarm Partner Portal" },
      {
        name: "description",
        content: "Set a new password for your SalamaFarm partner agrovet account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { completePasswordReset } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [linkState, setLinkState] = useState<"checking" | "ready" | "invalid">("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.post("/auth/recover-session/", {}, { auth: false });
        if (!cancelled) setLinkState("ready");
      } catch {
        if (!cancelled) setLinkState("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const valid = password.length >= 8 && password === confirm;

  const onSubmit = async () => {
    if (!valid || submitting || linkState !== "ready") return;
    setSubmitting(true);
    try {
      const me = await completePasswordReset(password);
      toast.success("Password updated. You can sign in now.");
      void navigate({ to: me ? "/" : "/login" });
    } catch (err) {
      toast.error(formatApiError(err, "Could not update password."));
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
              Choose a new password.
            </h2>
            <p className="mt-3 max-w-sm text-sm text-sidebar-foreground/75">
              After you save it, you can sign in with the same email and the new password.
            </p>
          </div>
          <p className="text-sm text-sidebar-foreground/75">Keep it at least 8 characters.</p>
        </aside>

        <main className="flex flex-col justify-center p-6 sm:p-10">
          <Card>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Set new password</h1>
                <p className="text-sm text-muted-foreground">
                  {linkState === "invalid"
                    ? "This reset link is invalid or has expired."
                    : "Enter a new password for your agrovet account."}
                </p>
              </div>

              {linkState === "checking" ? (
                <p className="text-sm text-muted-foreground">Checking reset link…</p>
              ) : linkState === "invalid" ? (
                <Button asChild className="w-full">
                  <Link to="/forgot-password">Request a new reset link</Link>
                </Button>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat the new password"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void onSubmit();
                      }}
                    />
                  </div>
                  {password.length > 0 && password !== confirm ? (
                    <p className="text-xs text-destructive">Passwords do not match.</p>
                  ) : null}
                  <Button className="w-full" disabled={!valid || submitting} onClick={() => void onSubmit()}>
                    {submitting ? "Saving…" : "Save password"}
                  </Button>
                </>
              )}

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
