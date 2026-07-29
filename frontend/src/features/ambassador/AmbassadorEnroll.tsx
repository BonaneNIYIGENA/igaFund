import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CloudOff, Info, UserPlus, Wifi } from "lucide-react";
import { ApiError, endpoints, type Institution } from "@/lib/api";
import { saveDraftOffline } from "@/lib/offline";
import { AppShell } from "@/app/shell/AppShell";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { StepProgress } from "@/components/ui/Progress";

const LEVELS = ["S4", "S5", "S6", "Year 1", "Year 2", "Year 3", "Year 4", "TVET"];

type Form = {
  on_behalf_of_name: string;
  on_behalf_of_email: string;
  bio: string;
  date_of_birth: string;
  phone: string;
  institution_id: string;
  academic_level: string;
  field_of_study: string;
  funding_goal: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_consent: boolean;
};

const EMPTY: Form = {
  on_behalf_of_name: "",
  on_behalf_of_email: "",
  bio: "",
  date_of_birth: "",
  phone: "",
  institution_id: "",
  academic_level: "S6",
  field_of_study: "",
  funding_goal: "",
  guardian_name: "",
  guardian_phone: "",
  guardian_consent: false,
};

function ageFrom(dob: string) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

/** Ambassador-assisted enrolment. */
export function AmbassadorEnroll() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const STEPS = [t("ambassadorEnroll.step.who"), t("ambassadorEnroll.step.studies"), t("ambassadorEnroll.step.consent")];
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(EMPTY);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    endpoints
      .institutions()
      .then((res) => setInstitutions(res.institutions ?? []))
      .catch(() => setInstitutions([]));

    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const age = ageFrom(form.date_of_birth);
  const isMinor = age !== null && age < 18;
  const totalSteps = isMinor ? 3 : 2;

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validateStep(which: number) {
    const next: Partial<Record<keyof Form, string>> = {};

    if (which === 1) {
      if (!form.on_behalf_of_name.trim()) next.on_behalf_of_name = t("ambassadorEnroll.validation.fullName");
      if (!form.on_behalf_of_email.trim())
        next.on_behalf_of_email = t("ambassadorEnroll.validation.emailRequired");
      else if (!/^\S+@\S+\.\S+$/.test(form.on_behalf_of_email))
        next.on_behalf_of_email = t("ambassadorEnroll.validation.emailInvalid");
      if (!form.date_of_birth) next.date_of_birth = t("ambassadorEnroll.validation.dob");
      if (!form.bio.trim()) next.bio = t("ambassadorEnroll.validation.bioRequired");
      else if (form.bio.trim().length < 40) next.bio = t("ambassadorEnroll.validation.bioShort");
    }

    if (which === 2) {
      if (!form.institution_id) next.institution_id = t("ambassadorEnroll.validation.institution");
      if (!form.funding_goal.trim()) next.funding_goal = t("ambassadorEnroll.validation.fundingGoalRequired");
      else if (Number(form.funding_goal) <= 0) next.funding_goal = t("ambassadorEnroll.validation.fundingGoalPositive");
    }

    if (which === 3 && isMinor) {
      if (!form.guardian_name.trim()) next.guardian_name = t("ambassadorEnroll.validation.guardianName");
      if (!form.guardian_phone.trim()) next.guardian_phone = t("ambassadorEnroll.validation.guardianPhone");
      if (!form.guardian_consent)
        next.guardian_consent = t("ambassadorEnroll.validation.guardianConsent");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function payload() {
    return {
      on_behalf_of_name: form.on_behalf_of_name.trim(),
      on_behalf_of_email: form.on_behalf_of_email.trim().toLowerCase(),
      bio: form.bio.trim(),
      date_of_birth: form.date_of_birth,
      phone: form.phone.trim(),
      institution_id: form.institution_id ? Number(form.institution_id) : null,
      academic_level: form.academic_level,
      field_of_study: form.field_of_study.trim(),
      funding_goal: Number(form.funding_goal),
      guardian_name: form.guardian_name.trim(),
      guardian_phone: form.guardian_phone.trim(),
      guardian_consent: form.guardian_consent,
    };
  }

  function next() {
    if (!validateStep(step)) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setStep((s) => Math.min(totalSteps, s + 1));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep(step)) return;
    setFormError("");
    setSaving(true);

    try {
      await endpoints.createProfile(payload());
      toast.success(t("ambassadorEnroll.toast.enrolled"), {
        description: t("ambassadorEnroll.toast.enrolledDescription"),
      });
      navigate("/ambassador/students");
    } catch (err) {
      if (!navigator.onLine) {
        await saveDraftOffline("/profiles/", "POST", payload());
        toast.info(t("ambassadorEnroll.toast.savedOffline"), {
          description: t("ambassadorEnroll.toast.savedOfflineDescription"),
        });
        navigate("/ambassador/students");
        return;
      }
      setFormError(
        err instanceof ApiError && err.status === 409
          ? t("ambassadorEnroll.error.emailTaken")
          : err instanceof ApiError
            ? err.message
            : t("ambassadorEnroll.error.saveFailedGeneric"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title={t("page.ambassadorEnroll.title")}
      description={t("page.ambassadorEnroll.description")}
    >
      <div className="max-w-2xl space-y-5">
        {!online && (
          <Alert tone="warning" title={t("ambassadorEnroll.offline.title")}>
            {t("ambassadorEnroll.offline.body")}
          </Alert>
        )}

        {formError && (
          <Alert tone="danger" title={t("ambassadorEnroll.errorTitle")}>
            {formError}
          </Alert>
        )}

        <StepProgress current={step} total={totalSteps} labels={STEPS} />

        <form onSubmit={submit} noValidate>
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("ambassadorEnroll.who.title")}</CardTitle>
                <CardDescription>
                  {t("ambassadorEnroll.who.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Field label={t("ambassadorEnroll.field.fullName")} required error={errors.on_behalf_of_name}>
                  {(props) => (
                    <Input
                      {...props}
                      value={form.on_behalf_of_name}
                      onChange={(e) => set("on_behalf_of_name", e.target.value)}
                      placeholder="Keza Uwase"
                    />
                  )}
                </Field>

                <Field
                  label={t("ambassadorEnroll.field.email")}
                  required
                  error={errors.on_behalf_of_email}
                  hint={t("ambassadorEnroll.field.emailHint")}
                >
                  {(props) => (
                    <Input
                      {...props}
                      type="email"
                      value={form.on_behalf_of_email}
                      onChange={(e) => set("on_behalf_of_email", e.target.value)}
                      placeholder="student@example.com"
                    />
                  )}
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t("ambassadorEnroll.field.dob")} required error={errors.date_of_birth}>
                    {(props) => (
                      <Input
                        {...props}
                        type="date"
                        max={new Date().toISOString().slice(0, 10)}
                        value={form.date_of_birth}
                        onChange={(e) => set("date_of_birth", e.target.value)}
                      />
                    )}
                  </Field>
                  <Field label={t("ambassadorEnroll.field.phone")} hint={t("ambassadorEnroll.field.phoneHint")}>
                    {(props) => (
                      <Input
                        {...props}
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        placeholder="+250 7…"
                      />
                    )}
                  </Field>
                </div>

                <Field
                  label={t("ambassadorEnroll.field.story")}
                  required
                  error={errors.bio}
                  hint={t("ambassadorEnroll.field.storyHint")}
                >
                  {(props) => (
                    <Textarea
                      {...props}
                      rows={5}
                      maxLength={1500}
                      value={form.bio}
                      onChange={(e) => set("bio", e.target.value)}
                      placeholder={t("ambassadorEnroll.field.storyPlaceholder")}
                    />
                  )}
                </Field>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("ambassadorEnroll.studies.title")}</CardTitle>
                <CardDescription>
                  {t("ambassadorEnroll.studies.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t("ambassadorEnroll.field.academicLevel")} required>
                    {(props) => (
                      <NativeSelect
                        {...props}
                        value={form.academic_level}
                        onChange={(e) => set("academic_level", e.target.value)}
                      >
                        {LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  </Field>
                  <Field label={t("ambassadorEnroll.field.fieldOfStudy")}>
                    {(props) => (
                      <Input
                        {...props}
                        value={form.field_of_study}
                        onChange={(e) => set("field_of_study", e.target.value)}
                        placeholder="Nursing"
                      />
                    )}
                  </Field>
                </div>

                <Field label={t("ambassadorEnroll.field.institution")} required error={errors.institution_id}>
                  {(props) => (
                    <NativeSelect
                      {...props}
                      value={form.institution_id}
                      onChange={(e) => set("institution_id", e.target.value)}
                    >
                      <option value="">{t("ambassadorEnroll.field.institutionPlaceholder")}</option>
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} — {i.location}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </Field>

                <Field
                  label={t("ambassadorEnroll.field.fundingGoal")}
                  required
                  error={errors.funding_goal}
                  hint={t("ambassadorEnroll.field.fundingGoalHint")}
                >
                  {(props) => (
                    <Input
                      {...props}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1000}
                      value={form.funding_goal}
                      onChange={(e) => set("funding_goal", e.target.value)}
                      className="figure text-lg font-semibold"
                    />
                  )}
                </Field>
              </CardContent>
            </Card>
          )}

          {step === 3 && isMinor && (
            // Fixed amber-50 card — text stays on fixed literals throughout,
            // including nested field labels, since text-ink/text-muted flip
            // light in dark mode and vanish against this pale, unmoving bg.
            <Card className="border-amber-300 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-base text-forest-950">{t("ambassadorEnroll.consent.title")}</CardTitle>
                <CardDescription className="text-forest-700">
                  {t("ambassadorEnroll.consent.description", { age: String(age) })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 [&_label]:text-forest-950">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t("ambassadorEnroll.field.guardianName")} required error={errors.guardian_name}>
                    {(props) => (
                      <Input
                        {...props}
                        value={form.guardian_name}
                        onChange={(e) => set("guardian_name", e.target.value)}
                      />
                    )}
                  </Field>
                  <Field label={t("ambassadorEnroll.field.guardianPhone")} required error={errors.guardian_phone}>
                    {(props) => (
                      <Input
                        {...props}
                        type="tel"
                        value={form.guardian_phone}
                        onChange={(e) => set("guardian_phone", e.target.value)}
                      />
                    )}
                  </Field>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-amber-300 bg-surface p-4">
                  <input
                    type="checkbox"
                    checked={form.guardian_consent}
                    onChange={(e) => set("guardian_consent", e.target.checked)}
                    aria-invalid={Boolean(errors.guardian_consent)}
                    className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-[var(--color-forest-700)]"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-ink">
                      {t("ambassadorEnroll.consent.checkboxLabel")}
                    </span>
                    <span className="mt-0.5 block text-muted">
                      {t("ambassadorEnroll.consent.checkboxHint")}
                    </span>
                  </span>
                </label>
                {errors.guardian_consent && (
                  <p role="alert" className="text-sm text-clay-600">
                    {errors.guardian_consent}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => (step === 1 ? navigate(-1) : setStep((s) => s - 1))}
            >
              {step === 1 ? t("ambassadorEnroll.action.cancel") : t("ambassadorEnroll.action.back")}
            </Button>

            {step < totalSteps ? (
              <Button type="button" onClick={next}>
                {t("ambassadorEnroll.action.continue")}
              </Button>
            ) : (
              <Button type="submit" variant="fund" loading={saving}>
                <UserPlus aria-hidden />
                {t("ambassadorEnroll.action.submit")}
              </Button>
            )}
          </div>
        </form>

        <p className="flex items-start gap-2 text-sm text-muted">
          {online ? (
            <Wifi className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <CloudOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          {online ? t("ambassadorEnroll.online.body") : t("ambassadorEnroll.offline.queued")}
        </p>

        <p className="flex items-start gap-2 text-sm text-muted">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t("ambassadorEnroll.onlyYourStudents")}
        </p>
      </div>
    </AppShell>
  );
}
