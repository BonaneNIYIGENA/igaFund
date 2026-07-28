import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { validatePassword } from "@/lib/validation";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { Alert } from "@/components/ui/Feedback";

export function ResetPassword() {
  const { confirmReset } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== password;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validatePassword(password);
    if (problem) {
      setPasswordError(problem);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await confirmReset(token, password);
      toast.success("Password updated", { description: "Sign in with your new password." });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error && err.message.toLowerCase().includes("token")
          ? "That reset link has expired. Request a new one."
          : err instanceof Error
            ? err.message
            : "We couldn't update your password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      description="Choose something you haven't used on igaFund before."
      footer={
        <>
          Link expired?{" "}
          <Link
            to="/forgot-password"
            className="font-medium text-accent-ink underline-offset-4 hover:underline"
          >
            Request a new one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && (
          <Alert tone="danger" title="Couldn't update your password">
            {error}
          </Alert>
        )}

        {!params.get("token") && (
          <Field label="Reset token" hint="Paste the token from your reset email.">
            {(props) => (
              <Input
                {...props}
                required
                value={token}
                onChange={(e) => setToken(e.target.value.trim())}
                className="figure"
              />
            )}
          </Field>
        )}

        <PasswordField
          label="New password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setPasswordError("");
          }}
          error={passwordError}
        />

        <Field
          label="Confirm new password"
          error={mismatch ? "The two passwords don't match." : undefined}
        >
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}
        </Field>

        <Button type="submit" size="lg" block loading={loading}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
