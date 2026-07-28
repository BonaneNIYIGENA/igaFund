import { useState } from "react";
import { toast } from "sonner";
import { Bell, CheckCircle2, KeyRound, LogOut, Save, ShieldCheck, UserRound, Lock, FileDown } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/features/auth/AuthContext";
import { endpoints, ApiError, getToken } from "@/lib/api";
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
 * Account settings shared by every role: profile details, password modal, and
 * email notification preferences.
 */
export function AccountSettings() {
  const { user, updateUser, logout } = useAuth();
  const { t } = useLocale();

  // ── Profile form ─────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ fullName?: string; email?: string }>({});

  // ── Password Modal State ──────────────────────────────────────────────────
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [existingPassword, setExistingPassword] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passErrors, setPassErrors] = useState<Record<string, string | undefined>>({});

  const [notifyLoading, setNotifyLoading] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [exportingAudit, setExportingAudit] = useState(false);

  async function exportAuditPdf() {
    setExportingAudit(true);
    try {
      const res = await fetch("/api/audit/export-pdf", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `igaFund-audit-trail-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't export the audit trail. Try again.");
    } finally {
      setExportingAudit(false);
    }
  }

  if (!user) return null;

  // ── Handlers ─────────────────────────────────────────────────────────────

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

  function openPasswordModal() {
    setExistingPassword("");
    setVerifyError("");
    setPasswordVerified(false);
    setNewPassword("");
    setConfirmPassword("");
    setPassErrors({});
    setPasswordModalOpen(true);
  }

  /** Step 1 — verify the existing password via backend */
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!existingPassword) {
      setVerifyError("Enter the password you are currently using.");
      return;
    }
    setVerifyLoading(true);
    setVerifyError("");
    try {
      await endpoints.verifyPassword(existingPassword);
      setPasswordVerified(true);
      toast.success("Password verified", { description: "You can now enter your new password below." });
    } catch (err) {
      if (err instanceof ApiError && err.fields?.current_password) {
        setVerifyError(err.fields.current_password[0]);
      } else {
        setVerifyError(err instanceof Error ? err.message : "Current password is incorrect.");
      }
    } finally {
      setVerifyLoading(false);
    }
  }

  /** Step 2 — save the new password */
  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    const checks = passwordChecklist(newPassword);
    const allPassed = checks.hasLength && checks.hasLower && checks.hasUpper && checks.hasDigit && checks.hasSymbol;
    if (!allPassed) {
      setPassErrors({ newPassword: "Please satisfy all password requirements." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassErrors({ confirmPassword: "Passwords do not match." });
      return;
    }
    setPassLoading(true);
    setPassErrors({});
    try {
      await endpoints.updateSettings({ current_password: existingPassword, new_password: newPassword });
      toast.success("Password updated", { description: "You can now use your new password to sign in." });
      setPasswordModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setPassErrors({
          newPassword: err.fields.new_password?.[0],
          confirmPassword: err.fields.confirm_password?.[0],
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
        {/* ── Profile details ───────────────────────────────────────────── */}
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

        {/* ── Password & security Card ──────────────────────────────────── */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="text-base">Password &amp; security</CardTitle>
            <CardDescription>
              Manage your password and authentication security settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-line bg-raised p-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-forest-100 text-forest-700">
                  <Lock className="size-5" aria-hidden />
                </span>
                <div>
                  <h4 className="font-semibold text-ink">Account Password</h4>
                  <p className="mt-1 text-sm text-muted leading-relaxed">
                    To change your password, click below to open the security verification form. You will confirm your current password before setting a new one.
                  </p>
                </div>
              </div>

              <Button onClick={openPasswordModal} className="w-full sm:w-auto">
                <KeyRound className="size-4" aria-hidden />
                Change password
              </Button>
            </div>

            <Separator className="my-5" />

            <p className="flex items-start gap-2 text-sm text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
              Every security action here is recorded in the system's permanent audit trail.
            </p>
          </CardContent>
        </Card>

        {/* ── Admin Only: Reports & Export PDF Card ────────────────────── */}
        {user.role === "admin" && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">System Reports &amp; Audit Export</CardTitle>
              <CardDescription>
                Download administrative audit logs and official compliance reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-raised p-4">
                <div>
                  <p className="font-semibold text-ink">System Audit Trail PDF Report</p>
                  <p className="mt-0.5 text-sm text-muted">
                    Generate an official PDF export containing every administrative action and ticket recorded on igaFund.
                  </p>
                </div>
                <Button variant="secondary" onClick={exportAuditPdf} loading={exportingAudit}>
                  <FileDown className="size-4" aria-hidden />
                  Export Audit PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Notifications ─────────────────────────────────────────────── */}
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

        {/* ── Sign out ──────────────────────────────────────────────────── */}
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

      {/* ── Password Change Form Modal / Dialog ─────────────────────────── */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Change your password</DialogTitle>
            <DialogDescription>
              {!passwordVerified
                ? "Step 1 of 2: Enter the password you are currently using."
                : "Step 2 of 2: Enter and confirm your new password."}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 pb-4">
            {!passwordVerified ? (
              <form id="verify-pass-form" onSubmit={handleVerify} className="space-y-4" noValidate autoComplete="off">
                {/* Dummy inputs trap browser password manager autofill so real field remains blank */}
                <input type="text" style={{ display: "none" }} tabIndex={-1} readOnly aria-hidden />
                <input type="password" style={{ display: "none" }} tabIndex={-1} readOnly aria-hidden />
                <Field
                  label="Password you are currently using"
                  required
                  error={verifyError}
                  hint="Enter your existing password to verify your identity."
                >
                  {(props) => (
                    <Input
                      {...props}
                      type="password"
                      autoComplete="off"
                      data-1p-ignore="true"
                      data-lpignore="true"
                      data-bwignore="true"
                      value={existingPassword}
                      onChange={(e) => {
                        setExistingPassword(e.target.value);
                        setVerifyError("");
                      }}
                      placeholder="Enter your current password"
                    />
                  )}
                </Field>
              </form>
            ) : (
              <form id="save-pass-form" onSubmit={handlePasswordSave} className="space-y-4" noValidate>
                <div className="flex items-center gap-2 rounded-md border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-800">
                  <CheckCircle2 className="size-4 shrink-0 text-forest-600" aria-hidden />
                  Identity confirmed. Set your new password.
                </div>

                <PasswordField
                  label="New password"
                  value={newPassword}
                  onChange={(v) => {
                    setNewPassword(v);
                    setPassErrors((s) => ({ ...s, newPassword: undefined }));
                  }}
                  placeholder="Enter new password"
                  error={passErrors.newPassword}
                />

                <Field label="Confirm new password" required error={passErrors.confirmPassword}>
                  {(props) => (
                    <Input
                      {...props}
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPassErrors((s) => ({ ...s, confirmPassword: undefined }));
                      }}
                      placeholder="Re-enter new password"
                    />
                  )}
                </Field>
              </form>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            {!passwordVerified ? (
              <Button type="submit" form="verify-pass-form" loading={verifyLoading}>
                <ShieldCheck className="size-4" aria-hidden />
                Verify password
              </Button>
            ) : (
              <Button type="submit" form="save-pass-form" loading={passLoading}>
                <KeyRound className="size-4" aria-hidden />
                Save password
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sign Out Confirmation Dialog ───────────────────────────────── */}
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
