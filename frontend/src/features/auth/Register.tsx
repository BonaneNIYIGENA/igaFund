import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, HeartHandshake, ShieldAlert } from "lucide-react";
import { ApiError, type Role } from "@/lib/api";
import {
  stripEmailInput,
  stripNameInput,
  validateEmail,
  validateName,
  passwordChecklist,
} from "@/lib/validation";
import { useLocale } from "@/lib/i18n";
import { useAuth, HOME_FOR_ROLE } from "./AuthContext";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { Alert } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";

function isMinorFromDOB(dobString: string): boolean {
  if (!dobString) return false;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age < 18;
}

export function Register() {
  const { register } = useAuth();
  const { t } = useLocale();

  const SIGNUP_ROLES: {
    value: Extract<Role, "student" | "donor">;
    label: string;
    blurb: string;
    icon: typeof GraduationCap;
  }[] = [
    { value: "student", label: t("auth.register.roleStudent"), blurb: t("auth.register.roleStudentBlurb"), icon: GraduationCap },
    { value: "donor", label: t("auth.register.roleDonor"), blurb: t("auth.register.roleDonorBlurb"), icon: HeartHandshake },
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [role, setRole] = useState<"student" | "donor">("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    dateOfBirth?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const isMinor = role === "student" && Boolean(dateOfBirth) && isMinorFromDOB(dateOfBirth);

  function validate() {
    const checks = passwordChecklist(password);
    const allComposition = checks.hasLength && checks.hasLower && checks.hasUpper && checks.hasDigit && checks.hasSymbol;
    
    let dobErr: string | undefined;
    if (role === "student" && !dateOfBirth) {
      dobErr = "Date of birth is required for student registration.";
    }

    let confirmErr: string | undefined;
    if (password !== confirmPassword) {
      confirmErr = "Passwords do not match.";
    }

    const next = {
      fullName: validateName(fullName, "full name"),
      email: validateEmail(email),
      dateOfBirth: dobErr,
      password: allComposition ? undefined : "Complete all password requirements.",
      confirmPassword: confirmErr,
    };
    const cleaned = Object.fromEntries(Object.entries(next).filter(([, v]) => Boolean(v)));
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
      const payload: any = {
        email: email.trim(),
        full_name: fullName.trim(),
        password,
        role,
      };
      if (role === "student" && dateOfBirth) {
        payload.date_of_birth = dateOfBirth;
      }
      const user = await register(payload);
      navigate(from ?? HOME_FOR_ROLE[user.role], { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setErrors({
          fullName: err.fields.full_name?.[0],
          email: err.fields.email?.[0],
          dateOfBirth: err.fields.date_of_birth?.[0],
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
      title={role === "student" ? t("auth.register.studentTitle") : t("auth.register.donorTitle")}
      description={
        role === "student"
          ? t("auth.register.studentDescription")
          : t("auth.register.donorDescription")
      }
      footer={
        <div className="space-y-3">
          <p>{t("auth.footer.haveAccount")}</p>
          <Button variant="secondary" size="md" block asChild>
            <Link to="/login">{t("auth.action.signIn")}</Link>
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {formError && (
          <Alert tone="danger" title={t("auth.register.couldntCreate")}>
            {formError}
          </Alert>
        )}

        {/* ── Role Selector Tabs ── */}
        <fieldset>
          <legend className="text-sm font-medium text-ink">{t("auth.register.registeringAs")}</legend>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {SIGNUP_ROLES.map((option) => {
              const selected = role === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setRole(option.value);
                    setErrors({});
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-start gap-2 rounded-md border p-4 text-left transition-[border-color,background,box-shadow] duration-200",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700",
                    selected
                      ? "border-forest-600 bg-sunk shadow-sm"
                      : "border-line-strong bg-surface hover:border-forest-300 hover:bg-sunk",
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
                  <span className="font-medium text-ink">{option.label}</span>
                  <span className="text-sm leading-snug text-muted">{option.blurb}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* ── Personal Info ── */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("auth.field.fullName")} required error={errors.fullName}>
            {(props) => (
              <Input
                {...props}
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(stripNameInput(e.target.value));
                  setErrors((s) => ({ ...s, fullName: undefined }));
                }}
                placeholder="e.g. Keza Uwase"
              />
            )}
          </Field>

          <Field label={t("auth.field.email")} required error={errors.email}>
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
                placeholder="e.g. keza@example.com"
              />
            )}
          </Field>
        </div>

        {/* ── Student Flow: Date of Birth & Minor Check ── */}
        {role === "student" && (
          <div className="space-y-3">
            <Field
              label={t("auth.field.dateOfBirth")}
              required
              error={errors.dateOfBirth}
              hint={t("auth.register.dobHint")}
            >
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => {
                    setDateOfBirth(e.target.value);
                    setErrors((s) => ({ ...s, dateOfBirth: undefined }));
                  }}
                />
              )}
            </Field>

            {isMinor && (
              <Alert tone="warning" title={t("auth.register.minorNoticeTitle")}>
                {t("auth.register.minorNoticeBody")}
              </Alert>
            )}
          </div>
        )}

        {/* ── Password Fields (Entered Twice) ── */}
        <div className="space-y-4">
          <PasswordField
            label={t("auth.field.password")}
            value={password}
            onChange={(v) => {
              setPassword(v);
              setErrors((s) => ({ ...s, password: undefined }));
            }}
            placeholder="Create a strong password (min 8 chars)"
            error={errors.password?.startsWith("Complete") ? undefined : errors.password}
          />

          <Field label={t("auth.field.confirmPassword")} required error={errors.confirmPassword}>
            {(props) => (
              <Input
                {...props}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((s) => ({ ...s, confirmPassword: undefined }));
                }}
                placeholder="Re-enter your password"
              />
            )}
          </Field>
        </div>

        <Button type="submit" size="lg" block loading={loading}>
          {role === "student" ? t("auth.action.createStudentAccount") : t("auth.action.createDonorAccount")}
        </Button>

        <p className="text-center text-xs leading-relaxed text-muted">
          {t("auth.register.welcomeEmailNote")}
        </p>
      </form>
    </AuthLayout>
  );
}
