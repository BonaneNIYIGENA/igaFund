import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { endpoints, type TicketItem } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { AppShell } from "@/app/shell/AppShell";
import { useLocale } from "@/lib/i18n";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";

const PAGE_SIZE = 10;

const PROCESS_TONE: Record<string, "success" | "forest" | "neutral" | "amber"> = {
  profile_approved: "success",
  ambassador_promoted: "forest",
  contribution_funded: "amber",
  funding_received: "success",
};

/**
 * The official process record — every completed milestone across the whole
 * platform, in one place. Admin-only.
 */
export function AdminTickets() {
  const { t } = useLocale();
  const PROCESS_LABEL: Record<string, string> = {
    profile_approved: t("adminTickets.process.profileApproved"),
    profile_submitted: t("adminTickets.process.profileSubmitted"),
    ambassador_promoted: t("adminTickets.process.ambassadorPromoted"),
    contribution_funded: t("adminTickets.process.contributionFunded"),
    funding_received: t("adminTickets.process.fundingReceived"),
  };
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await endpoints.adminTickets();
      setTickets(res.tickets ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminTickets.errorLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const visible = tickets.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < tickets.length;

  return (
    <AppShell
      title={t("page.adminTickets.title")}
      description={t("page.adminTickets.description")}
    >
      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t("adminTickets.empty.title")}
          description={t("adminTickets.empty.description")}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {t("adminTickets.showing", {
              shown: String(visible.length),
              total: String(tickets.length),
              label: tickets.length === 1 ? t("adminTickets.ticket.one") : t("adminTickets.ticket.many"),
            })}
          </p>

          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left">
                  <th className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{t("adminTickets.table.number")}</th>
                  <th className="px-4 py-3 font-semibold text-ink">{t("adminTickets.table.type")}</th>
                  <th className="px-4 py-3 font-semibold text-ink">{t("adminTickets.table.title")}</th>
                  <th className="px-4 py-3 font-semibold text-ink">{t("adminTickets.table.summary")}</th>
                  <th className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{t("adminTickets.table.userId")}</th>
                  <th className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{t("adminTickets.table.issuedAt")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((ticket, idx) => (
                  <tr
                    key={ticket.id}
                    className={idx % 2 === 0 ? "bg-canvas" : "bg-surface"}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-accent-ink whitespace-nowrap">
                      {ticket.ticket_number}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={PROCESS_TONE[ticket.process_type] ?? "neutral"}>
                        {PROCESS_LABEL[ticket.process_type] ?? ticket.process_type.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink max-w-[180px]">
                      <span className="line-clamp-2">{ticket.title}</span>
                    </td>
                    <td className="px-4 py-3 text-muted max-w-xs">
                      <span className="line-clamp-2">{ticket.summary}</span>
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      #{ticket.user_id}
                    </td>
                    <td className="px-4 py-3 text-faint whitespace-nowrap">
                      {formatDateTime(ticket.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                {t("adminTickets.loadMore", { count: String(tickets.length - visible.length) })}
              </Button>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
