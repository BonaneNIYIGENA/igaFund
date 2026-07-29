import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck, UserX } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "./AuthContext";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";

export function ForgotPassword() {
  const { requestReset } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      await requestReset(email);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "account_not_found") {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : "We couldn't send the reset link.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title={t("page.forgotPassword.checkEmail.title")}
        description={t("page.forgotPassword.checkEmail.description")}
        footer={
          <Link to="/login" className="font-medium text-accent-ink underline-offset-4 hover:underline">
            {t("auth.footer.backToSignIn")}
          </Link>
        }
      >
        {/* Fixed forest-50 card — text stays on fixed literals, never
            text-ink/text-muted, since those flip light in dark mode. */}
        <div className="rounded-lg border border-forest-200 bg-forest-50 p-6">
          <span className="grid size-11 place-items-center rounded-full bg-forest-100 text-forest-700">
            <MailCheck className="size-5" aria-hidden />
          </span>
          <p className="mt-4 font-medium text-forest-950">{t("auth.forgotPassword.sentTo", { email })}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-forest-700">
            {t("auth.forgotPassword.expiryNote")}
          </p>
          <Button variant="secondary" className="mt-5" onClick={() => setSent(false)}>
            {t("auth.action.useDifferentEmail")}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t("page.forgotPassword.title")}
      description={t("page.forgotPassword.description")}
      footer={
        <>
          {t("auth.footer.rememberedIt")}{" "}
          <Link to="/login" className="font-medium text-accent-ink underline-offset-4 hover:underline">
            {t("auth.action.signIn")}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}

        {notFound && (
          <Alert tone="warning" title={t("auth.forgotPassword.noAccountTitle")}>
            <p>{t("auth.forgotPassword.noAccountBody")}</p>
            <Link
              to="/register"
              className="mt-2.5 inline-flex items-center gap-1.5 font-medium text-accent-ink underline-offset-4 hover:underline"
            >
              <UserX className="size-4" aria-hidden />
              {t("auth.footer.createAccountInstead")}
            </Link>
          </Alert>
        )}

        <Field label={t("auth.field.email")}>
          {(props) => (
            <Input
              {...props}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          )}
        </Field>

        <Button type="submit" size="lg" block loading={loading}>
          {t("auth.action.sendResetLink")}
        </Button>
      </form>
    </AuthLayout>
  );
}
