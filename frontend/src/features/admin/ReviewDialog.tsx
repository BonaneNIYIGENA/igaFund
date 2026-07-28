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
import { DOC_LABEL, DocumentViewer, docIcon } from "@/features/documents/DocumentViewer";
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
      setError("We couldn't load this profile.");
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
      toast.error("Couldn't update that document");
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

      toast.success(action === "approve" ? "Profile approved" : "Changes requested", {
        description:
          action === "approve"
            ? "The student is now visible to donors and has been notified."
            : "The student has been told what to fix and can resubmit.",
      });
      onReviewed();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setBlockers(err.blockers ?? []);
      } else {
        setError("The decision didn't save. Try again.");
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
            <SidePanelTitle>Review application</SidePanelTitle>
            <SidePanelDescription>
              Check the documents against the details, then record your decision.
            </SidePanelDescription>
          </SidePanelHeader>

          <SidePanelBody className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-md" />
                <Skeleton className="h-40 w-full rounded-md" />
              </div>
            ) : !profile ? (
              <Alert tone="danger">{error || "This profile could not be loaded."}</Alert>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl text-forest-900">
                      {profile.full_name ?? "Student"}
                    </h3>
                    <p className="text-sm text-muted">{profile.email}</p>
                  </div>
                  <StatusBadge status={profile.status} size="md" />
                </div>

                {profile.edit_request_reason && (
                  <Alert tone="info" title="This is a change request on an approved profile">
                    “{profile.edit_request_reason}”
                  </Alert>
                )}

                <dl className="grid gap-4 rounded-md bg-sunk p-4 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5">
                    <UserRound className="mt-0.5 size-4 shrink-0 text-forest-600" aria-hidden />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                        Date of birth
                      </dt>
                      <dd className="text-sm text-body">
                        {formatDate(profile.date_of_birth)}
                        {profile.is_minor && (
                          <Badge tone="warning" className="ml-2">
                            Minor
                          </Badge>
                        )}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 size-4 shrink-0 text-forest-600" aria-hidden />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                        Phone
                      </dt>
                      <dd className="text-sm text-body">{profile.phone || "—"}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <GraduationCap className="mt-0.5 size-4 shrink-0 text-forest-600" aria-hidden />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                        Studies
                      </dt>
                      <dd className="text-sm text-body">
                        {profile.academic_level ?? "—"}
                        {profile.field_of_study ? ` · ${profile.field_of_study}` : ""}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Building2 className="mt-0.5 size-4 shrink-0 text-forest-600" aria-hidden />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                        Institution
                      </dt>
                      <dd className="text-sm text-body">
                        {profile.institution?.name ?? "Not set"}
                      </dd>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                      Funding goal
                    </dt>
                    <dd className="figure mt-0.5 text-lg font-semibold text-forest-900">
                      {formatMoney(profile.funding_goal)}
                    </dd>
                  </div>
                </dl>

                {profile.is_minor && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-4">
                    <p className="flex items-center gap-2 font-medium text-forest-900">
                      <ShieldAlert className="size-[18px] text-amber-700" aria-hidden />
                      Guardian consent required
                    </p>
                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                          Guardian
                        </dt>
                        <dd className="text-body">{profile.guardian_name || "Not provided"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                          Guardian phone
                        </dt>
                        <dd className="text-body">{profile.guardian_phone || "Not provided"}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={profile.guardian_consent ? "success" : "danger"}>
                        {profile.guardian_consent ? "Consent confirmed" : "Consent not confirmed"}
                      </Badge>
                      <Badge tone={consentDoc ? "success" : "danger"}>
                        {consentDoc ? "Consent form uploaded" : "No consent form"}
                      </Badge>
                      <Badge tone={consentDoc?.verified ? "success" : "warning"}>
                        {consentDoc?.verified ? "Form verified" : "Form not verified"}
                      </Badge>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-forest-900">Their story</h4>
                  <p className="mt-2 whitespace-pre-line rounded-md bg-raised p-4 text-sm leading-relaxed text-body">
                    {profile.bio || "No story provided."}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-forest-900">
                    Documents ({docs.length})
                  </h4>
                  {docs.length === 0 ? (
                    <Alert tone="warning" className="mt-2">
                      No documents were uploaded. There is nothing to verify this student against.
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
                              <p className="truncate text-sm font-medium text-forest-900">
                                {DOC_LABEL[doc.doc_type] ?? doc.doc_type}
                              </p>
                              <p className="truncate text-xs text-muted">
                                {doc.original_filename} · {formatDate(doc.uploaded_at)}
                              </p>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => setViewing(doc)}>
                              <Eye aria-hidden />
                              Open
                            </Button>
                            <Button
                              variant={doc.verified ? "soft" : "ghost"}
                              size="sm"
                              onClick={() => toggleVerified(doc)}
                              aria-pressed={doc.verified}
                            >
                              <CheckCircle2 aria-hidden />
                              {doc.verified ? "Verified" : "Mark verified"}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {error && (
                  <Alert tone="danger" title="Can't record that decision">
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
                  <Alert tone="warning" title="Approval is blocked for this minor">
                    Guardian consent must be confirmed on the profile, and the signed consent form
                    must be uploaded and marked verified above.
                  </Alert>
                )}

                <Field
                  label="Review note"
                  required
                  hint="Recorded permanently in the audit trail and shown to the student. At least 5 characters."
                  error={
                    note.length > 0 && !noteValid ? "Write a little more — the student reads this." : undefined
                  }
                >
                  {(props) => (
                    <Textarea
                      {...props}
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Transcript and national ID checked against the profile details."
                    />
                  )}
                </Field>

                {profile.reviewed_at && (
                  <p className="text-xs text-faint">
                    Last reviewed {formatDateTime(profile.reviewed_at)}
                  </p>
                )}
              </>
            )}
          </SidePanelBody>

          <SidePanelFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="dangerSoft"
              loading={busy === "reject"}
              disabled={!noteValid || busy !== null}
              onClick={() => decide("reject")}
            >
              <XCircle aria-hidden />
              Request changes
            </Button>
            <Button
              loading={busy === "approve"}
              disabled={!noteValid || !minorReady || busy !== null}
              onClick={() => decide("approve")}
            >
              <ShieldCheck aria-hidden />
              Approve
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
