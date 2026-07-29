import { useEffect, useMemo, useState } from "react";
import { FileDown, SearchX, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { endpoints, getToken, type AuditLogItem } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { AppShell } from "@/app/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, NativeSelect, Label } from "@/components/ui/Field";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";

const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await endpoints.auditLogs();
      setLogs(res.logs ?? res.audit_logs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminAudit.errorLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

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
      toast.error(t("adminAudit.exportFailed"));
    } finally {
      setExporting(false);
    }
  }

  const actions = useMemo(
    () => ["all", ...Array.from(new Set(logs.map((l) => l.action)))],
    [logs],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs
      .filter((l) => (action === "all" ? true : l.action === action))
      .filter((l) =>
        !q ? true : [l.note, l.action, l.target_type].some((f) => f?.toLowerCase().includes(q)),
      );
  }, [logs, search, action]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  // Reset page when filters change
  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleAction(v: string) { setAction(v); setPage(1); }

  return (
    <AppShell
      title={t("page.adminAudit.title")}
      description={t("page.adminAudit.description")}
      actions={
        <Button variant="secondary" onClick={exportPdf} loading={exporting}>
          <FileDown aria-hidden />
          {t("adminAudit.action.exportPdf")}
        </Button>
      }
    >
      <div className="space-y-5">
        <Alert tone="info" title={t("adminAudit.appendOnlyTitle")}>
          {t("adminAudit.appendOnlyBody")}
        </Alert>

        {error ? (
          <ErrorState description={error} onRetry={load} />
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={t("adminAudit.empty.title")}
            description={t("adminAudit.empty.description")}
          />
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="audit-search">{t("adminAudit.search.label")}</Label>
                <Input
                  id="audit-search"
                  type="search"
                  className="mt-1.5"
                  placeholder={t("adminAudit.search.placeholder")}
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="sm:w-56">
                <Label htmlFor="audit-action">{t("adminAudit.action.label")}</Label>
                <NativeSelect
                  id="audit-action"
                  className="mt-1.5"
                  value={action}
                  onChange={(e) => handleAction(e.target.value)}
                >
                  {actions.map((a) => (
                    <option key={a} value={a}>
                      {a === "all" ? t("adminAudit.action.all") : a.replace(/_/g, " ")}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <p className="text-sm text-muted" aria-live="polite">
              {t("adminAudit.showing", {
                shown: String(visible.length),
                total: String(filtered.length),
                label: filtered.length === 1 ? t("adminAudit.entry.one") : t("adminAudit.entry.many"),
              })}
            </p>

            {filtered.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={t("adminAudit.noMatch.title")}
                description={t("adminAudit.noMatch.description")}
                action={
                  <Button variant="secondary" onClick={() => { handleSearch(""); handleAction("all"); }}>
                    {t("adminAudit.clearFilters")}
                  </Button>
                }
              />
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-line">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface text-left">
                        <th className="px-4 py-3 font-semibold text-ink">{t("adminAudit.table.action")}</th>
                        <th className="px-4 py-3 font-semibold text-ink">{t("adminAudit.table.target")}</th>
                        <th className="px-4 py-3 font-semibold text-ink">{t("adminAudit.table.actor")}</th>
                        <th className="px-4 py-3 font-semibold text-ink">{t("adminAudit.table.note")}</th>
                        <th className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{t("adminAudit.table.dateTime")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((log, idx) => (
                        <tr
                          key={log.id}
                          className={idx % 2 === 0 ? "bg-canvas" : "bg-surface"}
                        >
                          <td className="px-4 py-3">
                            <Badge tone={ACTION_TONE[log.action] ?? "neutral"}>
                              {log.action.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">
                            {log.target_type.replace(/_/g, " ")} #{log.target_id}
                          </td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">
                            {t("adminAudit.adminPrefix", { id: String(log.actor_id) })}
                          </td>
                          <td className="px-4 py-3 text-body max-w-xs">
                            <span className="line-clamp-2">{log.note || "—"}</span>
                          </td>
                          <td className="px-4 py-3 text-faint whitespace-nowrap">
                            {formatDateTime(log.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                      {t("adminAudit.loadMore", { count: String(filtered.length - visible.length) })}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
