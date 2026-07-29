import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Heart,
  HeartHandshake,
  Image as ImageIcon,
  MessageSquareQuote,
  Search,
  ShieldCheck,
} from "lucide-react";
import { endpoints, type ContributionItem, type Profile } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { AppShell } from "@/app/shell/AppShell";
import { useLocale } from "@/lib/i18n";
import { usePolling } from "@/lib/usePolling";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/Stat";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { UnderlineTabs } from "@/components/ui/Tabs";
import { StudentCard } from "@/features/browse/StudentCard";
import { StudentPanel } from "@/features/browse/StudentPanel";
import { useWatchlist } from "./WatchlistContext";

/** My giving: every contribution with its receipt, and the students being followed — one page. */
export function DonorGiving() {
  const { t } = useLocale();
  const [tab, setTab] = useState<"contributions" | "following">("contributions");
  const [given, setGiven] = useState<ContributionItem[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<number | null>(null);
  const watchlist = useWatchlist();

  async function load(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await endpoints.myContributions();
      setGiven(res.contributions ?? []);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "We couldn't load your giving history.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function loadFollowing() {
    setFollowingLoading(true);
    try {
      const res = await endpoints.watchedProfiles();
      setFollowing(res.profiles ?? []);
    } catch {
      setFollowing([]);
    } finally {
      setFollowingLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Keeps totals and the contribution list current if a payment lands while
  // this page is already open, without the donor needing to reload.
  usePolling(() => load(true));

  useEffect(() => {
    if (tab === "following") loadFollowing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, watchlist?.watchedIds.size]);

  const total = given.reduce((sum, c) => sum + (c.amount ?? 0), 0);

  return (
    <AppShell
      title={t("page.donorGiving.title")}
      description={t("page.donorGiving.description")}
      actions={
        <Button variant="fund" asChild>
          <Link to="/donor/browse">
            <Search aria-hidden />
            Find a student
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <UnderlineTabs
          value={tab}
          onValueChange={(v) => setTab(v as typeof tab)}
          tabs={[
            { value: "contributions", label: "Contributions", count: given.length },
            { value: "following", label: "Following", count: following.length },
          ]}
        />

        {tab === "contributions" ? (
          error ? (
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
                <StatTile label="Total given" value={formatMoney(total)} icon={HeartHandshake} tone="amber" />
                <StatTile label="Contributions" value={given.length} countUp icon={ShieldCheck} />
              </div>

              <ul className="space-y-3">
                {given.map((c) => (
                  <li key={c.id}>
                    <Card>
                      <CardContent className="p-5 pt-5 sm:p-5 sm:pt-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-ink">
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
                            <p className="figure text-xl font-semibold text-ink">
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

                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3.5 text-xs">
                          {c.receipt_ref && (
                            <span className="text-muted">
                              Receipt <span className="figure text-accent-ink">{c.receipt_ref}</span>
                            </span>
                          )}
                          <Badge tone="forest" icon={ShieldCheck}>
                            Routed to institution
                          </Badge>
                          {c.proof_image_url && (
                            <a
                              href={c.proof_image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 font-medium text-accent-ink underline-offset-4 hover:underline"
                            >
                              <ImageIcon className="size-3.5" aria-hidden />
                              View your payment slip
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : followingLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : following.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Not following anyone yet"
            description="Tap the heart on a student's card to keep them on your radar — you'll find them here whenever you come back."
            action={
              <Button variant="fund" asChild>
                <Link to="/donor/browse">Find a student</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {following.map((p) => (
              <StudentCard key={p.id} profile={p} to={`/students/${p.id}`} onOpen={setViewing} />
            ))}
          </div>
        )}
      </div>

      <StudentPanel
        profileId={viewing}
        open={viewing !== null}
        onOpenChange={(o) => !o && setViewing(null)}
        onFunded={load}
      />
    </AppShell>
  );
}
