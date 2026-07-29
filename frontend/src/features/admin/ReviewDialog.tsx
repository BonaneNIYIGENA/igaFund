import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Eye,
  GraduationCap,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { ApiError, endpoints, type Doc, type Profile } from "@/lib/api";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { useLocale } from "@/lib/i18n";
import { docLabel, DocumentViewer, docIcon } from "@/features/documents/DocumentViewer";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Field, Textarea } from "@/components/ui/Field";
import { Alert, Skeleton } from "@/components/ui/Feedback";
import {
  SidePanel,
  SidePanelBody,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from "@/components/ui/SidePanel";

const MIN_NOTE = 5;

/** The verification workspace. */
export function ReviewDialog({
  profileId,
  open,
  onOpenChange,
  onReviewed,
}: {
  profileId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewed: () => void;
}) {
  const { t } = useLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [blockers, setBlockers] = useState<string[]>([]);
  const [viewing, setViewing] = useState<Doc | null>(null);

  async function load() {
    if (!profileId) return;
    setLoading(true);
    setError("");
    setBlockers([]);
    try {
      const res = await endpoints.adminProfile(profileId);
      setProfile(res.profile);
      setDocs(res.documents ?? []);
    } catch {
      setError(t("reviewDialog.errorLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setNote("");
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profileId]);

  async function toggleVerified(doc: Doc) {
    if (!profileId) return;
    try {
      await endpoints.verifyDocument(profileId, doc.id, !doc.verified);
      setDocs((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, verified: !d.verified } : d)),
      );
    } catch {
      toast.error(t("reviewDialog.verifyFailed"));
    }
  }

  async function decide(action: "approve" | "reject") {
    if (!profileId || note.trim().length < MIN_NOTE) return;
    setBusy(action);
    setError("");
    setBlockers([]);
    try {
      if (action === "approve") await endpoints.approveProfile(profileId, note.trim());
      else await endpoints.rejectProfile(profileId, note.trim());

      toast.success(
        action === "approve" ? t("reviewDialog.decision.approvedToast") : t("reviewDialog.decision.rejectedToast"),
        {
          description:
            action === "approve"
              ? t("reviewDialog.decision.approvedDescription")
              : t("reviewDialog.decision.rejectedDescription"),
        },
      );
      onReviewed();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setBlockers(err.blockers ?? []);
      } else {
        setError(t("reviewDialog.decision.saveFailed"));
      }
    } finally {
      setBusy(null);
    }
  }

  const consentDoc = docs.find((d) => d.doc_type === "guardian_consent");
  const minorReady =
    !profile?.is_minor ||
    Boolean(profile?.guardian_consent && profile?.guardian_name && profile?.guardian_phone && consentDoc?.verified);
  const noteValid = note.trim().length >= MIN_NOTE;

  return (
    <>
      <SidePanel open={open} onOpenChange={onOpenChange}>
        <SidePanelContent width="wide" aria-describedby={undefined}>
          <SidePanelHeader>
            <SidePanelTitle>{t("reviewDialog.title")}</SidePanelTitle>
            <SidePanelDescription>
              {t("reviewDialog.description")}
            </SidePanelDescription>
          </SidePanelHeader>

          <SidePanelBody className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-md" />
                <Skeleton className="h-40 w-full rounded-md" />
              </div>
            ) : !profile ? (
              <Alert tone="danger">{error || t("reviewDialog.errorFallback")}</Alert>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl text-ink">
                      {profile.full_name ?? "Student"}
                    </h3>
                    <p className="text-sm text-muted">{profile.email}</p>
                  </div>
                  <StatusBadge status={profile.status} size="md" />
                </div>

                {profile.edit_request_reason && (
                  <Alert tone="info" title={t("reviewDialog.editRequestTitle")}>
                    “{profile.edit_request_reason}”
                  </Alert>
                )}

                <dl className="grid gap-4 rounded-md bg-sunk p-4 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5">
                    <UserRound className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                        {t("reviewDialog.field.dob")}
                      </dt>
                      <dd className="text-sm text-body">
                        {formatDate(profile.date_of_birth)}
                        {profile.is_minor && (
                          <Badge tone="warning" className="ml-2">
                            {t("reviewDialog.badge.minor")}
                          </Badge>
                        )}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                        {t("reviewDialog.field.phone")}
                      </dt>
                      <dd className="text-sm text-body">{profile.phone || "—"}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <GraduationCap className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                        {t("reviewDialog.field.studies")}
                      </dt>
                      <dd className="text-sm text-body">
                        {profile.academic_level ?? "—"}
                        {profile.field_of_study ? ` · ${profile.field_of_study}` : ""}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Building2 className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                        {t("reviewDialog.field.institution")}
                      </dt>
                      <dd className="text-sm text-body">
                        {profile.institution?.name ?? t("reviewDialog.institutionNotSet")}
                      </dd>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                      {t("reviewDialog.field.fundingGoal")}
                    </dt>
                    <dd className="figure mt-0.5 text-lg font-semibold text-ink">
                      {formatMoney(profile.funding_goal)}
                    </dd>
                  </div>
                </dl>

                {profile.is_minor && (
                  // Fixed amber-50 card — text inside stays on fixed literals
                  // (never text-ink/text-muted/text-faint/text-body), since
                  // those flip light in dark mode and vanish on this pale bg.
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-4">
                    <p className="flex items-center gap-2 font-medium text-forest-950">
                      <ShieldAlert className="size-[18px] text-amber-700" aria-hidden />
                      {t("reviewDialog.guardian.title")}
                    </p>
                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-forest-600">
                          {t("reviewDialog.guardian.name")}
                        </dt>
                        <dd className="text-forest-800">{profile.guardian_name || t("reviewDialog.guardian.notProvided")}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-forest-600">
                          {t("reviewDialog.guardian.phone")}
                        </dt>
                        <dd className="text-forest-800">{profile.guardian_phone || t("reviewDialog.guardian.notProvided")}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={profile.guardian_consent ? "success" : "danger"}>
                        {profile.guardian_consent ? t("reviewDialog.guardian.consentConfirmed") : t("reviewDialog.guardian.consentNotConfirmed")}
                      </Badge>
                      <Badge tone={consentDoc ? "success" : "danger"}>
                        {consentDoc ? t("reviewDialog.guardian.formUploaded") : t("reviewDialog.guardian.formMissing")}
                      </Badge>
                      <Badge tone={consentDoc?.verified ? "success" : "warning"}>
                        {consentDoc?.verified ? t("reviewDialog.guardian.formVerified") : t("reviewDialog.guardian.formNotVerified")}
                      </Badge>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-ink">{t("reviewDialog.story.title")}</h4>
                  <p className="mt-2 whitespace-pre-line rounded-md bg-raised p-4 text-sm leading-relaxed text-body">
                    {profile.bio || t("reviewDialog.story.empty")}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-ink">
                    {t("reviewDialog.documentsTitle", { count: String(docs.length) })}
                  </h4>
                  {docs.length === 0 ? (
                    <Alert tone="warning" className="mt-2">
                      {t("reviewDialog.documentsEmpty")}
                    </Alert>
                  ) : (
                    <ul className="mt-2 divide-y divide-line rounded-md border border-line">
                      {docs.map((doc) => {
                        const Icon = docIcon(doc.original_filename);
                        return (
                          <li key={doc.id} className="flex flex-wrap items-center gap-3 p-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-forest-50 text-forest-700">
                              <Icon className="size-4" aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-ink">
                                {docLabel(t, doc.doc_type)}
                              </p>
                              <p className="truncate text-xs text-muted">
                                {doc.original_filename} · {formatDate(doc.uploaded_at)}
                              </p>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => setViewing(doc)}>
                              <Eye aria-hidden />
                              {t("reviewDialog.action.open")}
                            </Button>
                            <Button
                              variant={doc.verified ? "soft" : "ghost"}
                              size="sm"
                              onClick={() => toggleVerified(doc)}
                              aria-pressed={doc.verified}
                            >
                              <CheckCircle2 aria-hidden />
                              {doc.verified ? t("reviewDialog.action.verified") : t("reviewDialog.action.markVerified")}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {error && (
                  <Alert tone="danger" title={t("reviewDialog.decision.blockedTitle")}>
                    {error}
                    {blockers.length > 0 && (
                      <ul className="mt-2 list-inside list-disc space-y-1">
                        {blockers.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </Alert>
                )}

                {!minorReady && !error && (
                  <Alert tone="warning" title={t("reviewDialog.decision.minorBlockedTitle")}>
                    {t("reviewDialog.decision.minorBlockedBody")}
                  </Alert>
                )}

                <Field
                  label={t("reviewDialog.note.label")}
                  required
                  hint={t("reviewDialog.note.hint")}
                  error={
                    note.length > 0 && !noteValid ? t("reviewDialog.note.tooShort") : undefined
                  }
                >
                  {(props) => (
                    <Textarea
                      {...props}
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t("reviewDialog.note.placeholder")}
                    />
                  )}
                </Field>

                {profile.reviewed_at && (
                  <p className="text-xs text-faint">
                    {t("reviewDialog.lastReviewed", { when: formatDateTime(profile.reviewed_at) })}
                  </p>
                )}
              </>
            )}
          </SidePanelBody>

          <SidePanelFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              {t("reviewDialog.action.cancel")}
            </Button>
            <Button
              variant="dangerSoft"
              loading={busy === "reject"}
              disabled={!noteValid || busy !== null}
              onClick={() => decide("reject")}
            >
              <XCircle aria-hidden />
              {t("reviewDialog.action.requestChanges")}
            </Button>
            <Button
              loading={busy === "approve"}
              disabled={!noteValid || !minorReady || busy !== null}
              onClick={() => decide("approve")}
            >
              <ShieldCheck aria-hidden />
              {t("reviewDialog.action.approve")}
            </Button>
          </SidePanelFooter>
        </SidePanelContent>
      </SidePanel>

      {profileId && (
        <DocumentViewer
          profileId={profileId}
          doc={viewing}
          open={Boolean(viewing)}
          onOpenChange={(o) => !o && setViewing(null)}
        />
      )}
    </>
  );
}
