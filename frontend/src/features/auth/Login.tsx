import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/api";
import { stripEmailInput } from "@/lib/validation";
import { useLocale } from "@/lib/i18n";
import { useAuth, HOME_FOR_ROLE } from "./AuthContext";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { Alert } from "@/components/ui/Feedback";

export function Login() {
  const { login } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password);
      navigate(from ?? HOME_FOR_ROLE[user.role], { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "That email and password don't match. Check them and try again."
          : err instanceof Error
            ? err.message
            : "Sign in failed. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={t("page.login.title")}
      description={t("page.login.description")}
      footer={
        <div className="space-y-3">
          <p>{t("auth.footer.noAccount")}</p>
          <Button variant="secondary" size="md" block asChild>
            <Link to="/register">{t("auth.footer.createAccount")}</Link>
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && (
          <Alert tone="danger" title={t("auth.login.couldntSignIn")}>
            {error}
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
              onChange={(e) => setEmail(stripEmailInput(e.target.value))}
              placeholder={t("auth.login.emailPlaceholder")}
            />
          )}
        </Field>

        <PasswordField
          label={t("auth.field.password")}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder={t("auth.login.passwordPlaceholder")}
          showMeter={false}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-accent-ink underline-offset-4 hover:underline"
          >
            {t("auth.footer.forgotPassword")}
          </Link>
        </div>

        <Button type="submit" size="lg" block loading={loading}>
          {t("auth.action.signIn")}
        </Button>
      </form>
    </AuthLayout>
  );
}
