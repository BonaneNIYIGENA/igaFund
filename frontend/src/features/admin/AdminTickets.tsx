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

const PROCESS_LABEL: Record<string, string> = {
  profile_approved: "Verification",
  profile_submitted: "Submission",
  ambassador_promoted: "Promotion",
  contribution_funded: "Payment sent",
  funding_received: "Funding received",
};

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
      setError(e instanceof Error ? e.message : "We couldn't load the ticket record.");
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
          title="No tickets yet"
          description="Every completed step — verification, funding, promotion — issues a numbered ticket. They'll collect here."
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Showing {visible.length} of {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
          </p>

          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left">
                  <th className="px-4 py-3 font-semibold text-ink whitespace-nowrap">Ticket #</th>
                  <th className="px-4 py-3 font-semibold text-ink">Type</th>
                  <th className="px-4 py-3 font-semibold text-ink">Title</th>
                  <th className="px-4 py-3 font-semibold text-ink">Summary</th>
                  <th className="px-4 py-3 font-semibold text-ink whitespace-nowrap">User ID</th>
                  <th className="px-4 py-3 font-semibold text-ink whitespace-nowrap">Issued At</th>
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
                Load more ({tickets.length - visible.length} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
