import { useEffect, useState } from "react";
import { Download, FileText, ImageIcon, Loader2 } from "lucide-react";
import { apiFileUrl, endpoints, type Doc } from "@/lib/api";
import { useLocale, type TranslateFn } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/Feedback";
import {
  SidePanel,
  SidePanelBody,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from "@/components/ui/SidePanel";

const DOC_TYPE_KEY: Record<string, TranslationKey> = {
  id_card: "doc.type.id_card",
  transcript: "doc.type.transcript",
  recommendation: "doc.type.recommendation",
  guardian_consent: "doc.type.guardian_consent",
};

export function docLabel(t: TranslateFn, docType: string): string {
  const key = DOC_TYPE_KEY[docType];
  return key ? t(key) : docType;
}

/** Opens a verification document. */
export function DocumentViewer({
  profileId,
  doc,
  open,
  onOpenChange,
}: {
  profileId: number;
  doc: Doc | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLocale();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !doc) return;
    let revoked: string | null = null;
    setLoading(true);
    setError("");
    setUrl(null);

    apiFileUrl(endpoints.documentFileUrl(profileId, doc.id))
      .then(({ url: resolved, revoke }) => {
        if (revoke) revoked = resolved;
        setUrl(resolved);
      })
      .catch(() => setError(t("doc.viewer.openFailed")))
      .finally(() => setLoading(false));

    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [open, doc, profileId]);

  const isPdf = doc?.original_filename.toLowerCase().endsWith(".pdf");

  return (
    <SidePanel open={open} onOpenChange={onOpenChange}>
      <SidePanelContent width="wide" aria-describedby={undefined}>
        <SidePanelHeader>
          <SidePanelTitle>{doc ? docLabel(t, doc.doc_type) : t("doc.viewer.defaultTitle")}</SidePanelTitle>
          <SidePanelDescription>{doc?.original_filename}</SidePanelDescription>
        </SidePanelHeader>

        <SidePanelBody>
          {loading ? (
            <div className="grid h-80 place-items-center rounded-md bg-sunk">
              <span className="flex flex-col items-center gap-3 text-muted">
                <Loader2 className="size-6 animate-spin" aria-hidden />
                <span className="text-sm">{t("doc.viewer.opening")}</span>
              </span>
            </div>
          ) : error ? (
            <ErrorState title={t("doc.viewer.openFailedTitle")} description={error} />
          ) : url ? (
            isPdf ? (
              <iframe
                src={url}
                title={doc?.original_filename ?? t("doc.viewer.defaultTitle")}
                className="h-[60vh] w-full rounded-md border border-line bg-surface"
              />
            ) : (
              <img
                src={url}
                alt={doc ? docLabel(t, doc.doc_type) : t("doc.viewer.defaultTitle")}
                className="mx-auto max-h-[60vh] w-auto rounded-md border border-line"
              />
            )
          ) : null}
        </SidePanelBody>

        <SidePanelFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("doc.viewer.close")}
          </Button>
          {url && (
            <Button asChild>
              <a href={url} download={doc?.original_filename}>
                <Download aria-hidden />
                {t("doc.viewer.download")}
              </a>
            </Button>
          )}
        </SidePanelFooter>
      </SidePanelContent>
    </SidePanel>
  );
}

export function docIcon(filename: string) {
  return filename.toLowerCase().endsWith(".pdf") ? FileText : ImageIcon;
}
