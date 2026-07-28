import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CloudOff, Info, UserPlus, Wifi } from "lucide-react";
import { ApiError, endpoints, type Institution } from "@/lib/api";
import { saveDraftOffline } from "@/lib/offline";
import { AppShell } from "@/app/shell/AppShell";
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

const STEPS = ["Who they are", "Their studies", "Guardian consent"];

/** Ambassador-assisted enrolment. */
export function AmbassadorEnroll() {
  const navigate = useNavigate();
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
      if (!form.on_behalf_of_name.trim()) next.on_behalf_of_name = "Enter the student's full name.";
      if (!form.on_behalf_of_email.trim())
        next.on_behalf_of_email = "An email creates their account so they can sign in later.";
      else if (!/^\S+@\S+\.\S+$/.test(form.on_behalf_of_email))
        next.on_behalf_of_email = "That doesn't look like an email address.";
      if (!form.date_of_birth) next.date_of_birth = "Needed to apply the right consent rules.";
      if (!form.bio.trim()) next.bio = "Write a few sentences in the student's words.";
      else if (form.bio.trim().length < 40) next.bio = "A little more detail helps donors decide.";
    }

    if (which === 2) {
      if (!form.institution_id) next.institution_id = "Choose the school that receives the funds.";
      if (!form.funding_goal.trim()) next.funding_goal = "Enter the fees they need.";
      else if (Number(form.funding_goal) <= 0) next.funding_goal = "Enter an amount above zero.";
    }

    if (which === 3 && isMinor) {
      if (!form.guardian_name.trim()) next.guardian_name = "Required for students under 18.";
      if (!form.guardian_phone.trim()) next.guardian_phone = "Required for students under 18.";
      if (!form.guardian_consent)
        next.guardian_consent = "Confirm the guardian has agreed before submitting.";
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
      toast.success("Student enrolled", {
        description: "Add their documents next, then send them for review.",
      });
      navigate("/ambassador/students");
    } catch (err) {
      if (!navigator.onLine) {
        await saveDraftOffline("/profiles/", "POST", payload());
        toast.info("Saved on this device", {
          description: "No signal right now — this enrolment uploads itself when you reconnect.",
        });
        navigate("/ambassador/students");
        return;
      }
      setFormError(
        err instanceof ApiError && err.status === 409
          ? "That email already has an igaFund account. Use a different address."
          : err instanceof ApiError
            ? err.message
            : "We couldn't save this enrolment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Enroll a student"
      description="Capture their details here. You can do this without a connection."
    >
      <div className="max-w-2xl space-y-5">
        {!online && (
          <Alert tone="warning" title="You're offline">
            Keep going. Everything you enter is saved on this device and uploads itself the moment
            you have a signal again.
          </Alert>
        )}

        {formError && (
          <Alert tone="danger" title="Couldn't enroll this student">
            {formError}
          </Alert>
        )}

        <StepProgress current={step} total={totalSteps} labels={STEPS} />

        <form onSubmit={submit} noValidate>
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Who they are</CardTitle>
                <CardDescription>
                  This creates an account for the student so they can sign in later and follow their
                  own progress.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Field label="Student's full name" required error={errors.on_behalf_of_name}>
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
                  label="Student's email"
                  required
                  error={errors.on_behalf_of_email}
                  hint="If they have no email, use one you can pass on to them."
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
                  <Field label="Date of birth" required error={errors.date_of_birth}>
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
                  <Field label="Phone number" hint="Theirs or a relative's.">
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
                  label="Their story"
                  required
                  error={errors.bio}
                  hint="Write it as they tell it to you — donors read this first."
                >
                  {(props) => (
                    <Textarea
                      {...props}
                      rows={5}
                      maxLength={1500}
                      value={form.bio}
                      onChange={(e) => set("bio", e.target.value)}
                      placeholder="What are they studying, what do they want to become, and what is standing in the way?"
                    />
                  )}
                </Field>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Their studies</CardTitle>
                <CardDescription>
                  Funds are paid to the institution you choose here, never to the student.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Academic level" required>
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
                  <Field label="Field of study">
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

                <Field label="School or university" required error={errors.institution_id}>
                  {(props) => (
                    <NativeSelect
                      {...props}
                      value={form.institution_id}
                      onChange={(e) => set("institution_id", e.target.value)}
                    >
                      <option value="">Choose their institution</option>
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} — {i.location}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </Field>

                <Field
                  label="Funding goal in RWF"
                  required
                  error={errors.funding_goal}
                  hint="Total fees for this academic year."
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
            <Card className="border-amber-300 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-base">Guardian consent</CardTitle>
                <CardDescription>
                  This student is {age}. A guardian must consent in writing before their profile can
                  be published, and their name stays hidden from donors.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Guardian's full name" required error={errors.guardian_name}>
                    {(props) => (
                      <Input
                        {...props}
                        value={form.guardian_name}
                        onChange={(e) => set("guardian_name", e.target.value)}
                      />
                    )}
                  </Field>
                  <Field label="Guardian's phone" required error={errors.guardian_phone}>
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
                      The guardian has agreed to this profile being published.
                    </span>
                    <span className="mt-0.5 block text-muted">
                      You'll photograph their signed consent form on the next screen.
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
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            {step < totalSteps ? (
              <Button type="button" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button type="submit" variant="fund" loading={saving}>
                <UserPlus aria-hidden />
                Enroll student
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
          {online
            ? "You're online — this enrolment submits immediately."
            : "Offline. This enrolment is queued on your device."}
        </p>

        <p className="flex items-start gap-2 text-sm text-muted">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          You'll only ever see students you enrolled yourself.
        </p>
      </div>
    </AppShell>
  );
}
