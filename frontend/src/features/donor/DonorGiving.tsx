import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, HeartHandshake, MessageSquareQuote, Search, ShieldCheck } from "lucide-react";
import { endpoints, type ContributionItem } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { AppShell } from "@/app/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/Stat";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";

export function DonorGiving() {
  const [given, setGiven] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await endpoints.myContributions();
      setGiven(res.contributions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load your giving history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const total = given.reduce((sum, c) => sum + (c.amount ?? 0), 0);

  return (
    <AppShell
      title="My giving"
      description="Every contribution you've made, and the institution it was paid to."
      actions={
        <Button variant="fund" asChild>
          <Link to="/donor/browse">
            <Search aria-hidden />
            Find a student
          </Link>
        </Button>
      }
    >
      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : loading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : given.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="You haven't given yet"
          description="Find a verified student whose story speaks to you. Your contribution goes straight to their school, and you'll get a receipt naming it."
          action={
            <Button variant="fund" asChild>
              <Link to="/donor/browse">Find a student</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatTile
              label="Total given"
              value={formatMoney(total)}
              icon={HeartHandshake}
              tone="amber"
            />
            <StatTile label="Contributions" value={given.length} countUp icon={ShieldCheck} />
          </div>

          <ul className="space-y-3">
            {given.map((c) => (
              <li key={c.id}>
                <Card>
                  <CardContent className="p-5 pt-5 sm:p-5 sm:pt-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-forest-900">
                          {c.student_name ?? "A student"}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                          <Building2 className="size-4 shrink-0" aria-hidden />
                          <span className="truncate">
                            Paid to {c.institution?.name ?? "their institution"}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-faint">{formatDateTime(c.created_at)}</p>
                      </div>

                      <div className="text-right">
                        <p className="figure text-xl font-semibold text-forest-900">
                          {formatMoney(c.amount)}
                        </p>
                        {c.is_anonymous && (
                          <Badge tone="neutral" className="mt-1.5">
                            Given anonymously
                          </Badge>
                        )}
                      </div>
                    </div>

                    {c.message && (
                      <p className="mt-4 flex gap-2.5 rounded-md bg-raised p-3.5 text-sm leading-relaxed text-body">
                        <MessageSquareQuote
                          className="mt-0.5 size-4 shrink-0 text-forest-500"
                          aria-hidden
                        />
                        {c.message}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line pt-3.5 text-xs">
                      {c.receipt_ref && (
                        <span className="text-muted">
                          Receipt <span className="figure text-forest-700">{c.receipt_ref}</span>
                        </span>
                      )}
                      {c.ticket_number && (
                        <span className="text-muted">
                          Ticket <span className="figure text-forest-700">{c.ticket_number}</span>
                        </span>
                      )}
                      <Badge tone="forest" icon={ShieldCheck}>
                        Routed to institution
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
