import { useEffect, useState } from "react";
import { Download, FileText, ImageIcon, Loader2 } from "lucide-react";
import { apiFileUrl, endpoints, type Doc } from "@/lib/api";
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

export const DOC_LABEL: Record<string, string> = {
  id_card: "National ID or student card",
  transcript: "Academic transcript",
  recommendation: "Recommendation letter",
  guardian_consent: "Guardian consent form",
};

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
      .catch(() =>
        setError("This document could not be opened. It may have been removed from storage."),
      )
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
          <SidePanelTitle>{doc ? (DOC_LABEL[doc.doc_type] ?? doc.doc_type) : "Document"}</SidePanelTitle>
          <SidePanelDescription>{doc?.original_filename}</SidePanelDescription>
        </SidePanelHeader>

        <SidePanelBody>
          {loading ? (
            <div className="grid h-80 place-items-center rounded-md bg-sunk">
              <span className="flex flex-col items-center gap-3 text-muted">
                <Loader2 className="size-6 animate-spin" aria-hidden />
                <span className="text-sm">Opening document…</span>
              </span>
            </div>
          ) : error ? (
            <ErrorState title="Can't open this file" description={error} />
          ) : url ? (
            isPdf ? (
              <iframe
                src={url}
                title={doc?.original_filename ?? "Document"}
                className="h-[60vh] w-full rounded-md border border-line bg-surface"
              />
            ) : (
              <img
                src={url}
                alt={doc ? DOC_LABEL[doc.doc_type] ?? "Uploaded document" : "Document"}
                className="mx-auto max-h-[60vh] w-auto rounded-md border border-line"
              />
            )
          ) : null}
        </SidePanelBody>

        <SidePanelFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {url && (
            <Button asChild>
              <a href={url} download={doc?.original_filename}>
                <Download aria-hidden />
                Download
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
