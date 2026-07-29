import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Eye, FileUp, Trash2, UploadCloud } from "lucide-react";
import { ApiError, endpoints, type Doc, type DocType, type Profile } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useLocale } from "@/lib/i18n";
import { docLabel, DocumentViewer, docIcon } from "@/features/documents/DocumentViewer";
import { Button } from "@/components/ui/Button";
import { Label, NativeSelect } from "@/components/ui/Field";
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

/** Documents for a student an ambassador enrolled. */
export function AmbassadorDocuments({
  profile,
  open,
  onOpenChange,
  onChange,
}: {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: () => void;
}) {
  const { t } = useLocale();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<DocType>("transcript");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<Doc | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const editable = profile.status === "draft" || profile.status === "rejected";

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    endpoints
      .documents(profile.id)
      .then((res) => setDocs(res.documents ?? []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [open, profile.id]);

  async function reload() {
    const res = await endpoints.documents(profile.id);
    setDocs(res.documents ?? []);
    onChange();
  }

  async function upload(file: File) {
    setError("");
    if (file.size > 10 * 1024 * 1024) {
      setError(t("ambassadorDocuments.toast.uploadFailedTooBig", { file: file.name }));
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("doc_type", docType);
      await endpoints.uploadDocument(profile.id, form);
      toast.success(t("ambassadorDocuments.toast.uploaded"));
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("ambassadorDocuments.toast.uploadFailedGeneric"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(doc: Doc) {
    try {
      await endpoints.deleteDocument(profile.id, doc.id);
      toast.success(t("ambassadorDocuments.toast.removed"));
      await reload();
    } catch (err) {
      toast.error(t("ambassadorDocuments.toast.removeFailed"), { description: err instanceof Error ? err.message : undefined });
    }
  }

  return (
    <>
      <SidePanel open={open} onOpenChange={onOpenChange}>
        <SidePanelContent aria-describedby={undefined}>
          <SidePanelHeader>
            <SidePanelTitle>
              {t("ambassadorDocuments.title", { name: profile.full_name ?? t("ambassadorDocuments.defaultStudent") })}
            </SidePanelTitle>
            <SidePanelDescription>
              {editable ? t("ambassadorDocuments.editableHint") : t("ambassadorDocuments.lockedHint")}
            </SidePanelDescription>
          </SidePanelHeader>

          <SidePanelBody className="space-y-5">
            {error && (
              <Alert tone="danger" title={t("ambassadorDocuments.uploadFailedTitle")}>
                {error}
              </Alert>
            )}

            {profile.is_minor && (
              <Alert tone="warning" title={t("ambassadorDocuments.minorTitle")}>
                {t("ambassadorDocuments.minorBody")}
              </Alert>
            )}

            {editable && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`amb-doc-type-${profile.id}`}>{t("ambassadorDocuments.docType")}</Label>
                  <NativeSelect
                    id={`amb-doc-type-${profile.id}`}
                    className="mt-1.5"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocType)}
                  >
                    {(["transcript", "id_card", "recommendation", "guardian_consent"] as const).map((value) => (
                      <option key={value} value={value}>
                        {docLabel(t, value)}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div className="rounded-md border-2 border-dashed border-line-strong bg-raised p-6 text-center">
                  <span className="mx-auto grid size-11 place-items-center rounded-full bg-forest-100 text-forest-700">
                    <UploadCloud className="size-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-sm text-muted">{docLabel(t, docType)}</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    capture="environment"
                    className="sr-only-focusable"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) upload(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    loading={uploading}
                    onClick={() => inputRef.current?.click()}
                  >
                    <FileUp aria-hidden />
                    {uploading ? t("ambassadorDocuments.uploading") : t("ambassadorDocuments.chooseFile")}
                  </Button>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-ink">
                {t("ambassadorDocuments.onFile")}{docs.length > 0 && ` (${docs.length})`}
              </p>
              {loading ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-14 w-full rounded-md" />
                  <Skeleton className="h-14 w-full rounded-md" />
                </div>
              ) : docs.length === 0 ? (
                <p className="mt-3 rounded-md bg-sunk px-4 py-6 text-center text-sm text-muted">
                  {t("ambassadorDocuments.empty")}
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-line rounded-md border border-line">
                  {docs.map((doc) => {
                    const Icon = docIcon(doc.original_filename);
                    const label = docLabel(t, doc.doc_type);
                    return (
                      <li key={doc.id} className="flex items-center gap-3 px-3 py-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-forest-50 text-forest-700">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">
                            {label}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {formatDate(doc.uploaded_at)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => setViewing(doc)}
                          aria-label={label}
                        >
                          <Eye aria-hidden />
                        </Button>
                        {editable && (
                          <Button
                            variant="ghost"
                            size="iconSm"
                            className="text-clay-600 hover:bg-clay-100"
                            onClick={() => remove(doc)}
                            aria-label={label}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </SidePanelBody>

          <SidePanelFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              {t("ambassadorDocuments.done")}
            </Button>
          </SidePanelFooter>
        </SidePanelContent>
      </SidePanel>

      <DocumentViewer
        profileId={profile.id}
        doc={viewing}
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
      />
    </>
  );
}
