import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  CheckCircle2,
  Eye,
  FileUp,
  Info,
  Trash2,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { ApiError, endpoints, type Doc, type DocType } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { AppShell } from "@/app/shell/AppShell";
import { useMyProfile, editability } from "./useMyProfile";
import { DOC_LABEL, DocumentViewer, docIcon } from "@/features/documents/DocumentViewer";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { NativeSelect, Label } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

const MAX_MB = 10;
const ACCEPTED = ".pdf,.png,.jpg,.jpeg";

const REQUIRED_TYPES: { type: DocType; why: string }[] = [
  { type: "transcript", why: "Proves your results and current level" },
  { type: "id_card", why: "Confirms you are who you say you are" },
];

export function StudentDocuments() {
  const { profile, loading: profileLoading, error: profileError, reload } = useMyProfile();
  const { canEdit } = editability(profile);

  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<DocType>("transcript");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<Doc | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await endpoints.documents(profile.id);
      setDocs(res.documents ?? []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  async function upload(file: File) {
    if (!profile) return;
    setError("");

    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`${file.name} is larger than ${MAX_MB} MB. Try a smaller photo or a compressed PDF.`);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "png", "jpg", "jpeg"].includes(ext)) {
      setError(`We can't read .${ext} files. Upload a PDF, PNG or JPG.`);
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("doc_type", docType);
      await endpoints.uploadDocument(profile.id, form);
      toast.success("Document uploaded", { description: DOC_LABEL[docType] });
      await loadDocs();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The upload didn't finish. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(doc: Doc) {
    if (!profile) return;
    try {
      await endpoints.deleteDocument(profile.id, doc.id);
      toast.success("Document removed");
      await loadDocs();
      await reload();
    } catch (err) {
      toast.error("Couldn't remove it", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  const needsConsent = profile?.is_minor;
  const missing = [
    ...REQUIRED_TYPES.filter((r) => !docs.some((d) => d.doc_type === r.type)),
    ...(needsConsent && !docs.some((d) => d.doc_type === "guardian_consent")
      ? [{ type: "guardian_consent" as DocType, why: "Required by law for students under 18" }]
      : []),
  ];

  if (!profileLoading && !profile) {
    return (
      <AppShell title="Documents" description="Upload the papers that prove your story.">
        <EmptyState
          icon={UserRound}
          title="Create your profile first"
          description="Documents attach to your funding profile, so that needs to exist before you can upload anything."
          action={
            <Button asChild>
              <Link to="/student/profile">Create my profile</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Documents"
      description="Reviewers read these to verify you. Only igaFund staff can open them — donors never see them."
    >
      {profileError ? (
        <ErrorState description={profileError} onRetry={reload} />
      ) : profileLoading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : (
        <div className="max-w-3xl space-y-5">
          {missing.length > 0 && canEdit && (
            <Alert tone="warning" title="Still needed before review">
              <ul className="mt-1 space-y-1">
                {missing.map((m) => (
                  <li key={m.type}>
                    <span className="font-medium">{DOC_LABEL[m.type]}</span> — {m.why}
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          {!canEdit && (
            <Alert tone="info" title="Documents are locked">
              Your profile is with a reviewer, so documents can't be added or removed right now.
            </Alert>
          )}

          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload a document</CardTitle>
                <CardDescription>
                  A clear photo from your phone is fine. PDF, PNG or JPG, up to {MAX_MB} MB.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert tone="danger" title="Upload failed">
                    {error}
                  </Alert>
                )}

                <div>
                  <Label htmlFor="doc-type">What is this document?</Label>
                  <NativeSelect
                    id="doc-type"
                    className="mt-1.5"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocType)}
                  >
                    {Object.entries(DOC_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) upload(file);
                  }}
                  className={cn(
                    "rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-200",
                    dragging ? "border-forest-600 bg-forest-50" : "border-line-strong bg-raised",
                  )}
                >
                  <span className="mx-auto grid size-12 place-items-center rounded-full bg-forest-100 text-forest-700">
                    <UploadCloud className="size-6" aria-hidden />
                  </span>
                  <p className="mt-4 font-medium text-forest-900">
                    Drag a file here, or choose one
                  </p>
                  <p className="mt-1 text-sm text-muted">{DOC_LABEL[docType]}</p>

                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED}
                    capture="environment"
                    className="sr-only-focusable"
                    id="doc-file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) upload(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-5"
                    loading={uploading}
                    onClick={() => inputRef.current?.click()}
                  >
                    <FileUp aria-hidden />
                    {uploading ? "Uploading…" : "Choose a file"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Your documents{docs.length > 0 && ` (${docs.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }, (_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-md" />
                  ))}
                </div>
              ) : docs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  Nothing uploaded yet. Start with your academic transcript.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {docs.map((doc) => {
                    const Icon = docIcon(doc.original_filename);
                    return (
                      <li key={doc.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                        <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-forest-50 text-forest-700">
                          <Icon className="size-[18px]" aria-hidden />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.9375rem] font-medium text-forest-900">
                            {DOC_LABEL[doc.doc_type] ?? doc.doc_type}
                          </p>
                          <p className="truncate text-sm text-muted">
                            {doc.original_filename} · {formatDate(doc.uploaded_at)}
                          </p>
                        </div>

                        {doc.verified && (
                          <Badge tone="success" icon={CheckCircle2} className="hidden sm:inline-flex">
                            Checked
                          </Badge>
                        )}

                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => setViewing(doc)}
                          aria-label={`Open ${DOC_LABEL[doc.doc_type] ?? doc.doc_type}`}
                        >
                          <Eye aria-hidden />
                        </Button>

                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => remove(doc)}
                            aria-label={`Remove ${DOC_LABEL[doc.doc_type] ?? doc.doc_type}`}
                            className="text-clay-600 hover:bg-clay-100"
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <p className="flex items-start gap-2 text-sm text-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Documents are stored privately and served only to you and igaFund reviewers. They are
            never given a public link.
          </p>
        </div>
      )}

      {profile && (
        <DocumentViewer
          profileId={profile.id}
          doc={viewing}
          open={Boolean(viewing)}
          onOpenChange={(open) => !open && setViewing(null)}
        />
      )}
    </AppShell>
  );
}
