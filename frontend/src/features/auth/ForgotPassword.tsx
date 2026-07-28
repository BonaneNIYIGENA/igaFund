import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send the reset link.");
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
            Back to sign in
          </Link>
        }
      >
        {/* Fixed forest-50 card — text stays on fixed literals, never
            text-ink/text-muted, since those flip light in dark mode. */}
        <div className="rounded-lg border border-forest-200 bg-forest-50 p-6">
          <span className="grid size-11 place-items-center rounded-full bg-forest-100 text-forest-700">
            <MailCheck className="size-5" aria-hidden />
          </span>
          <p className="mt-4 font-medium text-forest-950">Sent to {email}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-forest-700">
            The link expires in 30 minutes. If nothing arrives, check your spam folder or try a
            different address.
          </p>
          <Button variant="secondary" className="mt-5" onClick={() => setSent(false)}>
            Use a different email
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
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-accent-ink underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}

        <Field label="Email">
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
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
