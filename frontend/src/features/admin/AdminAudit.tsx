import { useEffect, useMemo, useState } from "react";
import { FileDown, Lock, ScrollText, SearchX } from "lucide-react";
import { toast } from "sonner";
import { endpoints, getToken, type AuditLogItem } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { AppShell } from "@/app/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, NativeSelect, Label } from "@/components/ui/Field";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";

const ACTION_TONE: Record<string, "success" | "danger" | "forest"> = {
  profile_approved: "success",
  profile_rejected: "danger",
  promoted_ambassador: "forest",
};

export function AdminAudit() {
  const { t } = useLocale();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [exporting, setExporting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await endpoints.auditLogs();
      setLogs(res.logs ?? res.audit_logs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load the audit trail.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function exportPdf() {
    setExporting(true);
    try {
      const res = await fetch("/api/audit/export-pdf", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `igaFund-audit-trail-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't export the audit trail. Try again.");
    } finally {
      setExporting(false);
    }
  }

  const actions = useMemo(
    () => ["all", ...Array.from(new Set(logs.map((l) => l.action)))],
    [logs],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs
      .filter((l) => (action === "all" ? true : l.action === action))
      .filter((l) =>
        !q ? true : [l.note, l.action, l.target_type].some((f) => f.toLowerCase().includes(q)),
      );
  }, [logs, search, action]);

  return (
    <AppShell
      title={t("page.adminAudit.title")}
      description={t("page.adminAudit.description")}
      actions={
        <Button variant="secondary" onClick={exportPdf} loading={exporting}>
          <FileDown aria-hidden />
          Export PDF
        </Button>
      }
    >
      <div className="space-y-5">
        <Alert tone="info" title="This record is append-only">
          Entries here cannot be edited or deleted from the interface. Each one names the
          administrator who acted, what they acted on, and the note they left.
        </Alert>

        {error ? (
          <ErrorState description={error} onRetry={load} />
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No actions recorded yet"
            description="The first approval, rejection or ambassador promotion will appear here."
          />
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="audit-search">Search</Label>
                <Input
                  id="audit-search"
                  type="search"
                  className="mt-1.5"
                  placeholder="Search notes and actions"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="sm:w-56">
                <Label htmlFor="audit-action">Action</Label>
                <NativeSelect
                  id="audit-action"
                  className="mt-1.5"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                >
                  {actions.map((a) => (
                    <option key={a} value={a}>
                      {a === "all" ? "All actions" : a.replace(/_/g, " ")}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <p className="text-sm text-muted" aria-live="polite">
              {visible.length} {visible.length === 1 ? "entry" : "entries"}
            </p>

            {visible.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No entries match"
                description="Try a different search term or action filter."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch("");
                      setAction("all");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-3">
                {visible.map((log) => (
                  <li key={log.id}>
                    <Card>
                      <CardContent className="p-4 pt-4 sm:p-5 sm:pt-5">
                        <div className="flex gap-3.5">
                          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-sm bg-forest-50 text-forest-700">
                            <Lock className="size-4" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge tone={ACTION_TONE[log.action] ?? "neutral"}>
                                {log.action.replace(/_/g, " ")}
                              </Badge>
                              <span className="text-sm text-muted">
                                {log.target_type.replace(/_/g, " ")} #{log.target_id}
                              </span>
                            </div>
                            <p className="mt-2 text-[0.9375rem] leading-relaxed text-body">
                              {log.note}
                            </p>
                            <p className="mt-2 text-xs text-faint">
                              Administrator #{log.actor_id} · {formatDateTime(log.created_at)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
