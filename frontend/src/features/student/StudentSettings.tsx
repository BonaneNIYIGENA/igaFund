import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Avatar, Separator } from "@/components/ui/Menu";
import { ROLE_LABEL } from "@/app/shell/nav";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

export function StudentSettings() {
  const { user, requestReset, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  if (!user) return null;

  async function sendResetLink() {
    setSending(true);
    try {
      await requestReset(user!.email);
      setSent(true);
      toast.success("Reset link sent", { description: `Check ${user!.email}.` });
    } catch {
      toast.error("Couldn't send the link", { description: "Try again in a moment." });
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell title="Settings" description="Your account details and security.">
      <div className="max-w-2xl space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar name={user.full_name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-forest-900">{user.full_name}</p>
                <p className="truncate text-sm text-muted">{user.email}</p>
              </div>
            </div>

            <Separator className="my-5" />

            <dl className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 size-[18px] shrink-0 text-forest-600" aria-hidden />
                <div>
                  <dt className="font-medium text-forest-900">Account type</dt>
                  <dd className="text-muted">{ROLE_LABEL[user.role]}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-[18px] shrink-0 text-forest-600" aria-hidden />
                <div>
                  <dt className="font-medium text-forest-900">Email</dt>
                  <dd className="text-muted">
                    {user.email} — used for sign in and every notification we send you.
                  </dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security</CardTitle>
            <CardDescription>
              Your password is stored hashed with bcrypt. Nobody at igaFund can read it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent && (
              <Alert tone="success" title="Reset link on its way">
                Open the link in {user.email} to set a new password. It expires in 30 minutes.
              </Alert>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-raised p-4">
              <div className="min-w-0">
                <p className="font-medium text-forest-900">Change your password</p>
                <p className="text-sm text-muted">We'll email you a secure link.</p>
              </div>
              <Button variant="secondary" loading={sending} onClick={sendResetLink}>
                <KeyRound aria-hidden />
                Send reset link
              </Button>
            </div>

            <p className="flex items-start gap-2 text-sm text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              Your documents and guardian details are never shown to donors, and your session ends
              automatically when your sign-in expires.
            </p>
          </CardContent>
        </Card>

        <Card className="border-clay-200">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5 pt-5 sm:p-6 sm:pt-6">
            <div className="min-w-0">
              <p className="font-medium text-forest-900">Sign out</p>
              <p className="text-sm text-muted">You'll need your password to sign back in.</p>
            </div>
            <Button variant="dangerSoft" onClick={() => setSignOutOpen(true)}>
              <LogOut aria-hidden />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Sign out of igaFund?</DialogTitle>
            <DialogDescription>
              Any unsaved changes on this device stay queued until you sign back in.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="pb-4" />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSignOutOpen(false)}>
              Stay signed in
            </Button>
            <Button variant="danger" onClick={logout}>
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
