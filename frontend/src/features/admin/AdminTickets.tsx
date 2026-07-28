import { useEffect, useState } from "react";
import { Receipt, ShieldCheck, UserPlus, Building2, type LucideIcon } from "lucide-react";
import { endpoints, type TicketItem } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { AppShell } from "@/app/shell/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { Badge } from "@/components/ui/Badge";

const PROCESS: Record<string, { label: string; icon: LucideIcon }> = {
  profile_approved: { label: "Verification", icon: ShieldCheck },
  profile_submitted: { label: "Submission", icon: Receipt },
  ambassador_promoted: { label: "Promotion", icon: UserPlus },
  contribution_funded: { label: "Payment sent", icon: Building2 },
  funding_received: { label: "Funding received", icon: Receipt },
};

/**
 * The official process record — every completed milestone across the whole
 * platform, in one place. Admin-only: students and donors get their own
 * progress and receipt views built from live data instead.
 */
export function AdminTickets() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell
      title="Tickets"
      description="A numbered, timestamped record of every completed milestone platform-wide."
    >
      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No tickets yet"
          description="Every completed step — verification, funding, promotion — issues a numbered ticket. They'll collect here."
        />
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => {
            const meta = PROCESS[ticket.process_type] ?? { label: "Record", icon: Receipt };
            const Icon = meta.icon;
            return (
              <li key={ticket.id}>
                <Card>
                  <CardContent className="p-5 pt-5 sm:p-5 sm:pt-5">
                    <div className="flex gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-forest-50 text-forest-700">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="font-semibold leading-snug text-ink">{ticket.title}</h3>
                          <Badge tone="forest">{meta.label}</Badge>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">{ticket.summary}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="figure text-sm font-semibold text-accent-ink">
                            {ticket.ticket_number}
                          </span>
                          <span className="text-xs text-faint">{formatDateTime(ticket.created_at)}</span>
                          <span className="text-xs text-faint">Issued to user #{ticket.user_id}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
