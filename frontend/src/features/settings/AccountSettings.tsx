import { useState } from "react";
import { toast } from "sonner";
import { Bell, KeyRound, LogOut, Save, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/features/auth/AuthContext";
import { endpoints, ApiError } from "@/lib/api";
import { stripEmailInput, stripNameInput, validateEmail, validateName, passwordChecklist } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
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

/**
 * Account settings shared by every role: profile details, password, and
 * email notification preferences. Everything here writes to the backend
 * through PUT /auth/me — there is no local-only toggle.
 */
export function AccountSettings() {
  const { user, updateUser, logout } = useAuth();
  const { t } = useLocale();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ fullName?: string; email?: string }>({});

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passErrors, setPassErrors] = useState<{ currentPassword?: string; newPassword?: string }>({});

  const [notifyLoading, setNotifyLoading] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  if (!user) return null;

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();

    const nameErr = validateName(fullName, "full name");
    const emailErr = validateEmail(email);
    if (nameErr || emailErr) {
      setProfileErrors({ fullName: nameErr, email: emailErr });
      return;
    }

    setProfileLoading(true);
    setProfileErrors({});
    try {
      const res = await endpoints.updateSettings({ full_name: fullName.trim(), email: email.trim() });
      updateUser(res.user);
      toast.success("Profile updated", { description: "Your changes have been saved and logged." });
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setProfileErrors({ fullName: err.fields.full_name?.[0], email: err.fields.email?.[0] });
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to update profile settings.");
      }
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword) {
      setPassErrors({ currentPassword: "Enter your current password." });
      return;
    }
    const checks = passwordChecklist(newPassword);
    const allPassed = checks.hasLength && checks.hasLower && checks.hasUpper && checks.hasDigit && checks.hasSymbol;
    if (!allPassed) {
      setPassErrors({ newPassword: "Please satisfy all password requirements above." });
      return;
    }

    setPassLoading(true);
    setPassErrors({});
    try {
      await endpoints.updateSettings({ current_password: currentPassword, new_password: newPassword });
      toast.success("Password changed", { description: "An audit record of this change was created." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setPassErrors({
          currentPassword: err.fields.current_password?.[0],
          newPassword: err.fields.new_password?.[0],
        });
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to update password.");
      }
    } finally {
      setPassLoading(false);
    }
  }

  async function toggleNotify() {
    setNotifyLoading(true);
    try {
      const res = await endpoints.updateSettings({ notify_email: !user?.notify_email });
      updateUser(res.user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update that preference.");
    } finally {
      setNotifyLoading(false);
    }
  }

  return (
    <AppShell title={t("page.settings.title")} description={t("page.settings.description")}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Account information</CardTitle>
            <CardDescription>
              Update your display name and email address. Changes are logged to the audit trail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <Avatar name={user.full_name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-ink">{user.full_name}</p>
                <p className="truncate text-sm text-muted">{user.email}</p>
              </div>
            </div>

            <Separator className="my-5" />

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required error={profileErrors.fullName}>
                  {(props) => (
                    <Input
                      {...props}
                      value={fullName}
                      onChange={(e) => {
                        setFullName(stripNameInput(e.target.value));
                        setProfileErrors((s) => ({ ...s, fullName: undefined }));
                      }}
                    />
                  )}
                </Field>

                <Field label="Email address" required error={profileErrors.email}>
                  {(props) => (
                    <Input
                      {...props}
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(stripEmailInput(e.target.value));
                        setProfileErrors((s) => ({ ...s, email: undefined }));
                      }}
                    />
                  )}
                </Field>
              </div>

              <dl className="space-y-2 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <UserRound className="size-4 shrink-0 text-accent-ink" aria-hidden />
                  <span>
                    Account type: <strong className="font-medium text-ink">{ROLE_LABEL[user.role]}</strong>
                  </span>
                </div>
              </dl>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={profileLoading}>
                  <Save className="size-4" aria-hidden />
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="text-base">Password &amp; security</CardTitle>
            <CardDescription>Update your account password. Changes take effect immediately.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <Field label="Current password" required error={passErrors.currentPassword}>
                {(props) => (
                  <Input
                    {...props}
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPassErrors((s) => ({ ...s, currentPassword: undefined }));
                    }}
                  />
                )}
              </Field>

              <PasswordField
                label="New password"
                value={newPassword}
                onChange={(v) => {
                  setNewPassword(v);
                  setPassErrors((s) => ({ ...s, newPassword: undefined }));
                }}
                error={passErrors.newPassword}
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={passLoading}>
                  <KeyRound className="size-4" aria-hidden />
                  Update password
                </Button>
              </div>
            </form>

            <Separator className="my-5" />

            <p className="flex items-start gap-2 text-sm text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
              Every security action here is recorded in the system's permanent audit trail.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>Choose whether igaFund emails you about your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-md border border-line bg-raised p-4">
              <span className="flex items-start gap-3">
                <Bell className="mt-0.5 size-[18px] shrink-0 text-accent-ink" aria-hidden />
                <span>
                  <span className="block font-medium text-ink">Email me about my account</span>
                  <span className="mt-0.5 block text-sm text-muted">
                    Profile status changes, funding received, and role updates. In-app notifications
                    always continue regardless of this setting.
                  </span>
                </span>
              </span>
              <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center">
                <input
                  type="checkbox"
                  checked={user.notify_email ?? true}
                  onChange={toggleNotify}
                  disabled={notifyLoading}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-sage-300 transition-colors duration-200 peer-checked:bg-forest-600 peer-disabled:opacity-60"
                />
                <span
                  aria-hidden
                  className="absolute left-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform duration-200 peer-checked:translate-x-5"
                />
              </span>
            </label>
          </CardContent>
        </Card>

        <Card className="border-clay-200">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5 pt-5 sm:p-6 sm:pt-6">
            <div className="min-w-0">
              <p className="font-medium text-ink">Sign out</p>
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
