import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, HeartHandshake } from "lucide-react";
import { ApiError, type Role } from "@/lib/api";
import {
  stripEmailInput,
  stripNameInput,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/validation";
import { useAuth, HOME_FOR_ROLE } from "./AuthContext";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { Alert } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";

const SIGNUP_ROLES: {
  value: Extract<Role, "student" | "donor">;
  label: string;
  blurb: string;
  icon: typeof GraduationCap;
}[] = [
  { value: "student", label: "A student", blurb: "I need help paying my school fees", icon: GraduationCap },
  { value: "donor", label: "A donor", blurb: "I want to help pay someone's school fees", icon: HeartHandshake },
];

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [role, setRole] = useState<"student" | "donor">("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const next = {
      fullName: validateName(fullName, "full name"),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    const cleaned = Object.fromEntries(Object.entries(next).filter(([, v]) => v));
    setErrors(cleaned);
    return Object.keys(cleaned).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validate()) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }

    setLoading(true);
    try {
      const user = await register({ email: email.trim(), full_name: fullName.trim(), password, role });
      navigate(from ?? HOME_FOR_ROLE[user.role], { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setErrors({
          fullName: err.fields.full_name?.[0],
          email: err.fields.email?.[0],
          password: err.fields.password?.[0],
        });
      }
      setFormError(
        err instanceof ApiError && err.status === 409
          ? "An account already uses that email. Sign in instead."
          : err instanceof ApiError && err.status === 429
            ? "Too many attempts from this device. Wait a few minutes."
            : err instanceof Error
              ? err.message
              : "We couldn't create your account. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      description="It takes about a minute. You can finish your profile afterwards."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-forest-700 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {formError && (
          <Alert tone="danger" title="Couldn't create your account">
            {formError}
          </Alert>
        )}

        <fieldset>
          <legend className="text-sm font-medium text-forest-900">I am…</legend>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {SIGNUP_ROLES.map((option) => {
              const selected = role === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setRole(option.value)}
                  className={cn(
                    "flex cursor-pointer flex-col items-start gap-2 rounded-md border p-4 text-left transition-[border-color,background,box-shadow] duration-200",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700",
                    selected
                      ? "border-forest-600 bg-forest-50 shadow-sm"
                      : "border-line-strong bg-white hover:border-forest-300 hover:bg-forest-50/60",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-sm transition-colors",
                      selected ? "bg-forest-700 text-white" : "bg-forest-100 text-forest-700",
                    )}
                  >
                    <option.icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="font-medium text-forest-900">{option.label}</span>
                  <span className="text-sm leading-snug text-muted">{option.blurb}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" required error={errors.fullName}>
            {(props) => (
              <Input
                {...props}
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(stripNameInput(e.target.value));
                  setErrors((s) => ({ ...s, fullName: undefined }));
                }}
                placeholder="Keza Uwase"
              />
            )}
          </Field>

          <Field label="Email" required error={errors.email}>
            {(props) => (
              <Input
                {...props}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(stripEmailInput(e.target.value));
                  setErrors((s) => ({ ...s, email: undefined }));
                }}
                placeholder="you@example.com"
              />
            )}
          </Field>
        </div>

        <PasswordField
          value={password}
          onChange={(v) => {
            setPassword(v);
            setErrors((s) => ({ ...s, password: undefined }));
          }}
          error={errors.password}
        />

        <Button type="submit" size="lg" block loading={loading}>
          Create account
        </Button>

        <p className="text-center text-xs leading-relaxed text-muted">
          Administrators are appointed by igaFund, and ambassadors are promoted from verified
          students.
        </p>
      </form>
    </AuthLayout>
  );
}
