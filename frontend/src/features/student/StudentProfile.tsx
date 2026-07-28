import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  CloudOff, FileText, HeartHandshake, Lock, MessageSquareQuote,
  Save, Send, ShieldAlert, ShieldCheck, UserRound,
} from "lucide-react";
import { ApiError, endpoints, type ContributionItem, type Institution, type Profile } from "@/lib/api";
import { saveDraftOffline } from "@/lib/offline";
import { formatDateTime, formatMoney, formatRelative } from "@/lib/format";
import {
  composePhone, parsePhone, sanitizeText, stripNameInput,
  validateAmount, validateName, validatePhone, type Country, DEFAULT_COUNTRY,
} from "@/lib/validation";
import { AppShell } from "@/app/shell/AppShell";
import { useLocale } from "@/lib/i18n";
import { useMyProfile, editability, journeyFor } from "./useMyProfile";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/Field";
import { PhoneField } from "@/components/ui/PhoneField";
import { Alert, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { StatusBadge } from "@/components/ui/Badge";
import { UnderlineTabs } from "@/components/ui/Tabs";
import { RoutingRail, type RailStep } from "@/components/ui/RoutingRail";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

const LEVELS = ["S4", "S5", "S6", "Year 1", "Year 2", "Year 3", "Year 4", "TVET"];

type FormState = {
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

const EMPTY: FormState = {
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

export function StudentProfile() {
  const { profile, loading, error, reload } = useMyProfile();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "progress" ? "progress" : "profile";

  function setTab(next: "profile" | "progress") {
    setSearchParams(next === "profile" ? {} : { tab: "progress" }, { replace: true });
  }

  const [form, setForm] = useState<FormState>(EMPTY);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [guardianCountry, setGuardianCountry] = useState<Country>(DEFAULT_COUNTRY);

  const [funding, setFunding] = useState<ContributionItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { canEdit, reason, needsRequest } = editability(profile);

  useEffect(() => {
    endpoints
      .institutions()
      .then((res) => setInstitutions(res.institutions ?? []))
      .catch(() => setInstitutions([]));
  }, []);

  useEffect(() => {
    if (!profile) return;
    endpoints
      .profileContributions(profile.id)
      .then((res) => setFunding(res.contributions ?? []))
      .catch(() => setFunding([]));
  }, [profile]);

  async function submitForReview() {
    if (!profile) return;
    setSubmitting(true);
    try {
      await endpoints.submitProfile(profile.id);
      toast.success("Sent for review", {
        description: "A reviewer will look at your profile shortly. We'll notify you.",
      });
      await reload();
    } catch (err) {
      toast.error("Not ready yet", {
        description: err instanceof ApiError ? err.message : "Try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const j = journeyFor(profile);
  const journey: RailStep[] = [
    {
      key: "created",
      label: "Profile created",
      detail: profile ? formatDateTime(profile.created_at) : undefined,
      icon: UserRound,
      state: j.created,
    },
    {
      key: "documents",
      label: "Documents uploaded",
      detail: profile ? `${profile.document_count} on file` : undefined,
      icon: FileText,
      state: j.documents,
    },
    {
      key: "submitted",
      label: "Sent for review",
      detail: profile?.submitted_at ? formatDateTime(profile.submitted_at) : undefined,
      icon: Send,
      state: j.submitted,
    },
    {
      key: "reviewed",
      label: profile?.status === "rejected" ? "Changes requested" : "Verified by igaFund",
      detail: profile?.reviewed_at ? formatDateTime(profile.reviewed_at) : undefined,
      icon: ShieldCheck,
      state: j.reviewed,
    },
    {
      key: "funded",
      label: "Donors fund your fees",
      detail:
        profile && profile.funded_amount > 0
          ? "Funding has started"
          : "Once verified, you appear in the donor pool",
      icon: HeartHandshake,
      state: j.funded,
    },
  ];

  const readyToSubmit =
    profile && (profile.status === "draft" || profile.status === "rejected") && profile.document_count > 0;

  useEffect(() => {
    if (!profile) return;
    const own = parsePhone(profile.phone);
    const guardian = parsePhone(profile.guardian_phone);
    setPhoneCountry(own.country);
    setGuardianCountry(guardian.country);
    setForm({
      bio: profile.bio ?? "",
      date_of_birth: profile.date_of_birth ?? "",
      phone: own.digits,
      institution_id: profile.institution?.id ? String(profile.institution.id) : "",
      academic_level: profile.academic_level ?? "S6",
      field_of_study: profile.field_of_study ?? "",
      funding_goal: profile.funding_goal ? String(profile.funding_goal) : "",
      guardian_name: profile.guardian_name ?? "",
      guardian_phone: guardian.digits,
      guardian_consent: profile.guardian_consent ?? false,
    });
  }, [profile]);

  const age = ageFrom(form.date_of_birth);
  const isMinor = age !== null && age < 18;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.bio.trim()) next.bio = "Tell donors a little about yourself.";
    else if (form.bio.trim().length < 40)
      next.bio = "Write at least a couple of sentences — donors read this first.";
    if (!form.date_of_birth) next.date_of_birth = "We need your date of birth to apply the right rules.";
    if (!form.institution_id) next.institution_id = "Choose the school that will receive the funds.";

    const goalError = validateAmount(form.funding_goal, { min: 1000, label: "amount" });
    if (goalError) next.funding_goal = goalError;

    const phoneError = validatePhone(form.phone, phoneCountry);
    if (phoneError) next.phone = phoneError;

    if (isMinor) {
      const guardianNameError = validateName(form.guardian_name, "guardian name");
      if (guardianNameError) next.guardian_name = guardianNameError;
      const guardianPhoneError = validatePhone(form.guardian_phone, guardianCountry, true);
      if (guardianPhoneError) next.guardian_phone = guardianPhoneError;
      if (!form.guardian_consent)
        next.guardian_consent = "Your guardian must consent before your profile can be published.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function payload() {
    return {
      bio: sanitizeText(form.bio, 1500).trim(),
      date_of_birth: form.date_of_birth,
      phone: composePhone(phoneCountry, form.phone),
      institution_id: form.institution_id ? Number(form.institution_id) : null,
      academic_level: form.academic_level,
      field_of_study: sanitizeText(form.field_of_study, 120).trim(),
      funding_goal: Number(form.funding_goal),
      guardian_name: form.guardian_name.trim(),
      guardian_phone: composePhone(guardianCountry, form.guardian_phone),
      guardian_consent: form.guardian_consent,
    };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!validate()) {
      // Send focus to the first thing that needs attention.
      const firstInvalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
      firstInvalid?.focus();
      firstInvalid?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setSaving(true);
    try {
      if (profile) {
        await endpoints.updateProfile(profile.id, payload());
        toast.success("Profile saved");
      } else {
        await endpoints.createProfile(payload());
        toast.success("Profile created", { description: "Next, upload your documents." });
      }
      await reload();
      if (!profile) navigate("/student/documents");
    } catch (err) {
      // Offline: keep the work rather than losing it, and sync on reconnect.
      if (!navigator.onLine) {
        await saveDraftOffline("/profiles/", profile ? "PUT" : "POST", payload());
        toast.info("Saved on this device", {
          description: "You're offline. It will submit itself when you're back online.",
        });
      } else {
        setFormError(err instanceof ApiError ? err.message : "We couldn't save your profile.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitEditRequest() {
    if (requestReason.trim().length < 10) return;
    setRequesting(true);
    try {
      await endpoints.requestEdit(profile!.id, requestReason.trim());
      toast.success("Change request sent", {
        description: "Your profile is back with a reviewer. It's paused from the donor pool.",
      });
      setRequestOpen(false);
      setRequestReason("");
      await reload();
    } catch (err) {
      toast.error("Couldn't send the request", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRequesting(false);
    }
  }

  return (
    <AppShell
      title={profile ? t("page.myProfile.title") : t("page.myProfile.createTitle")}
      description={profile ? t("page.myProfile.description") : t("page.myProfile.createDescription")}
      actions={profile ? <StatusBadge status={profile.status} size="md" /> : undefined}
    >
      {error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : loading ? (
        <Skeleton className="h-[32rem] w-full rounded-lg" />
      ) : (
        <div className="space-y-5">
          {profile && (
            <UnderlineTabs
              tabs={[
                { value: "profile", label: t("page.myProfile.tab.profile") },
                { value: "progress", label: t("page.myProfile.tab.progress") },
              ]}
              value={tab}
              onValueChange={(v) => setTab(v as "profile" | "progress")}
            />
          )}

          {tab === "progress" && profile ? (
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] xl:grid-cols-[1fr_22rem] lg:items-start">
              <div className="space-y-5">
                {profile.status === "rejected" && profile.review_note && (
                  <Alert tone="danger" title="A reviewer asked for changes">
                    {profile.review_note}
                  </Alert>
                )}

                {profile.status === "approved" && (
                  <Alert tone="success" title="You're verified and live">
                    Donors can find and fund you now. Share your profile link with anyone who might help.
                  </Alert>
                )}

                {profile.edit_request_reason && profile.status === "pending" && (
                  <Alert tone="info" title="Change request under review">
                    You asked for: "{profile.edit_request_reason}"
                  </Alert>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Your journey</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RoutingRail steps={journey} />

                    {readyToSubmit && (
                      <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-5">
                        <p className="font-medium text-forest-950">Ready to send for review?</p>
                        <p className="mt-1 text-sm leading-relaxed text-forest-700">
                          Check your profile and documents once more. While it's under review you
                          won't be able to change them.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2.5">
                          <Button variant="fund" loading={submitting} onClick={submitForReview}>
                            <Send aria-hidden />
                            Send for review
                          </Button>
                          <Button variant="secondary" onClick={() => setTab("profile")}>
                            Check my profile first
                          </Button>
                        </div>
                      </div>
                    )}

                    {profile.status === "draft" && profile.document_count === 0 && (
                      <div className="mt-6 rounded-md bg-sunk p-5">
                        <p className="font-medium text-ink">Upload your documents first</p>
                        <p className="mt-1 text-sm text-muted">
                          A reviewer needs your transcript and ID before they can verify you.
                        </p>
                        <Button className="mt-4" asChild>
                          <Link to="/student/documents">Upload documents</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your supporters</CardTitle>
                  <CardDescription>
                    Every contribution routed to {profile.institution?.name ?? "your school"} on your
                    behalf.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {funding.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted">
                      {profile.status === "approved"
                        ? "No contributions yet. They'll appear here as donors give."
                        : "Once you're verified, donors can fund you and their gifts will show here."}
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {funding.slice(0, 6).map((c) => (
                        <li key={c.id} className="rounded-md border border-line bg-raised p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink">{c.donor_name}</p>
                              {c.message && (
                                <p className="mt-1 flex items-start gap-1.5 text-sm leading-snug text-body">
                                  <MessageSquareQuote
                                    className="mt-0.5 size-3.5 shrink-0 text-forest-500"
                                    aria-hidden
                                  />
                                  {c.message}
                                </p>
                              )}
                              <p className="mt-1.5 text-xs text-faint">{formatRelative(c.created_at)}</p>
                            </div>
                            <span className="figure shrink-0 text-sm font-semibold text-accent-ink">
                              {formatMoney(c.amount)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
          <>
          {!canEdit && (
            <Alert tone={needsRequest ? "info" : "warning"} title={needsRequest ? "Profile locked" : "Under review"}>
              {reason}
              {needsRequest && (
                <div className="mt-3.5">
                  <Button size="sm" onClick={() => setRequestOpen(true)}>
                    <Lock aria-hidden />
                    Request a change
                  </Button>
                </div>
              )}
            </Alert>
          )}

          {profile?.status === "rejected" && profile.review_note && (
            <Alert tone="danger" title="A reviewer asked for changes">
              {profile.review_note}
            </Alert>
          )}

          {formError && (
            <Alert tone="danger" title="Couldn't save">
              {formError}
            </Alert>
          )}

          <form onSubmit={save} noValidate>
            <fieldset disabled={!canEdit} className="disabled:opacity-60">
              <div className="grid items-start gap-5 lg:grid-cols-2">
                <div className="space-y-5">
                  <Card>
                <CardHeader>
                  <CardTitle className="text-base">About you</CardTitle>
                  <CardDescription>
                    Donors read this before anything else. Write it in your own words.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Field
                    label="Your story"
                    required
                    error={errors.bio}
                    hint={`${form.bio.length} characters — aim for 3 or 4 sentences.`}
                  >
                    {(props) => (
                      <Textarea
                        {...props}
                        rows={6}
                        maxLength={1500}
                        value={form.bio}
                        onChange={(e) => set("bio", e.target.value)}
                        placeholder="What are you studying, what do you want to do with it, and what is standing in the way?"
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

                    <PhoneField
                      country={phoneCountry}
                      digits={form.phone}
                      onCountryChange={setPhoneCountry}
                      onDigitsChange={(v) => set("phone", v)}
                      error={errors.phone}
                      hint="Kept private. Reviewers only."
                    />
                  </div>
                </CardContent>
              </Card>

              {isMinor && (
                // Fixed amber-50 card — text stays on fixed literals throughout,
                // including nested field labels, since text-ink/text-muted flip
                // light in dark mode and vanish against this pale, unmoving bg.
                <Card className="border-amber-300 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-forest-950">
                      <ShieldAlert className="size-[18px] text-amber-700" aria-hidden />
                      Guardian consent
                    </CardTitle>
                    <CardDescription className="text-forest-700">
                      You're {age}. Rwandan law requires a guardian's written consent before we can
                      publish your profile, and your name and photo stay hidden from donors.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 [&_label]:text-forest-950">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Guardian's full name" required error={errors.guardian_name}>
                        {(props) => (
                          <Input
                            {...props}
                            value={form.guardian_name}
                            onChange={(e) => set("guardian_name", stripNameInput(e.target.value))}
                          />
                        )}
                      </Field>
                      <PhoneField
                        label="Guardian's phone"
                        required
                        country={guardianCountry}
                        digits={form.guardian_phone}
                        onCountryChange={setGuardianCountry}
                        onDigitsChange={(v) => set("guardian_phone", v)}
                        error={errors.guardian_phone}
                      />
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
                          My guardian has agreed to this profile being published.
                        </span>
                        <span className="mt-0.5 block text-muted">
                          You'll also need to upload their signed consent form on the documents page.
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
                </div>

                <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Studies and funding</CardTitle>
                  <CardDescription>
                    Contributions are paid to the school you choose here — never to you directly.
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

                    <Field label="Field of study" hint="For example: Nursing, Software engineering">
                      {(props) => (
                        <Input
                          {...props}
                          value={form.field_of_study}
                          onChange={(e) =>
                            set("field_of_study", e.target.value.replace(/[^\p{L}\s,'&-]/gu, "").slice(0, 120))
                          }
                        />
                      )}
                    </Field>
                  </div>

                  <Field
                    label="School or university"
                    required
                    error={errors.institution_id}
                    hint="Only registered institutions can receive funds. Ask an admin if yours is missing."
                  >
                    {(props) => (
                      <NativeSelect
                        {...props}
                        value={form.institution_id}
                        onChange={(e) => set("institution_id", e.target.value)}
                      >
                        <option value="">Choose your institution</option>
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
                    hint="The total fees you need for this academic year."
                  >
                    {(props) => (
                      <Input
                        {...props}
                        inputMode="numeric"
                        value={form.funding_goal}
                        onChange={(e) => set("funding_goal", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="figure text-lg font-semibold"
                      />
                    )}
                  </Field>
                </CardContent>
              </Card>

                  {canEdit && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <Button type="submit" size="lg" loading={saving}>
                        <Save aria-hidden />
                        {profile ? "Save changes" : "Create my profile"}
                      </Button>
                    </div>
                  )}

                  {!navigator.onLine && (
                    <p className="flex items-center gap-2 text-sm text-muted">
                      <CloudOff className="size-4" aria-hidden />
                      You're offline. Saving will queue your changes until you reconnect.
                    </p>
                  )}
                </div>
              </div>
            </fieldset>
          </form>
          </>
          )}
        </div>
      )}

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Request a change</DialogTitle>
            <DialogDescription>
              Approved profiles are locked so donors can trust what they read. Tell the reviewer what
              needs to change and they'll reopen it.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="pb-6">
            <Alert tone="warning" className="mb-5">
              While it's under review your profile is paused and won't appear to new donors.
            </Alert>
            <Field
              label="What needs to change, and why?"
              required
              hint="At least 10 characters."
              error={
                requestReason.length > 0 && requestReason.trim().length < 10
                  ? "Give the reviewer a little more detail."
                  : undefined
              }
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={4}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="I transferred to a different school, so my institution and goal need updating."
                />
              )}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRequestOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitEditRequest}
              loading={requesting}
              disabled={requestReason.trim().length < 10}
            >
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
