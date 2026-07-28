import { useState } from "react";
import { toast } from "sonner";
import { FileUp, Send } from "lucide-react";
import { ApiError, endpoints, type Profile } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Menu";
import { AmbassadorDocuments } from "./AmbassadorDocuments";

/** One enrolled student. */
export function StudentRow({ student, onChange }: { student: Profile; onChange: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  const canSubmit = student.status === "draft" || student.status === "rejected";

  async function submit() {
    setSubmitting(true);
    try {
      await endpoints.submitProfile(student.id);
      toast.success("Sent for review", {
        description: `${student.full_name ?? "The student"} is now in the verification queue.`,
      });
      onChange();
    } catch (err) {
      toast.error("Not ready to submit", {
        description: err instanceof ApiError ? err.message : "Try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <li className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0">
        <Avatar name={student.full_name ?? "?"} size="md" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">
            {student.full_name ?? "Student"}
          </p>
          <p className="truncate text-sm text-muted">
            {student.academic_level ?? "—"}
            {student.institution ? ` · ${student.institution.name}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted">
            <span className="figure font-medium text-forest-800">
              {formatMoney(student.funded_amount)}
            </span>{" "}
            of <span className="figure">{formatMoney(student.funding_goal)}</span> ·{" "}
            {student.document_count} {student.document_count === 1 ? "document" : "documents"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={student.status} />
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <Button variant="secondary" size="sm" onClick={() => setDocsOpen(true)} className="flex-1 sm:flex-none">
            <FileUp aria-hidden />
            Documents
          </Button>
          {canSubmit && (
            <Button
              variant="fund"
              size="sm"
              loading={submitting}
              onClick={submit}
              className="flex-1 sm:flex-none"
            >
              <Send aria-hidden />
              Submit
            </Button>
          )}
        </div>
      </li>

      <AmbassadorDocuments
        profile={student}
        open={docsOpen}
        onOpenChange={setDocsOpen}
        onChange={onChange}
      />
    </>
  );
}
