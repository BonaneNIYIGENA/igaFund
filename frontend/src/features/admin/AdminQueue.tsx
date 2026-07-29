import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, GraduationCap, ShieldAlert, ShieldCheck } from "lucide-react";
import { endpoints, type Profile } from "@/lib/api";
import { formatMoney, formatRelative } from "@/lib/format";
import { stagger, fadeUp } from "@/lib/motion";
import { AppShell } from "@/app/shell/AppShell";
import { useLocale } from "@/lib/i18n";
import { usePolling } from "@/lib/usePolling";
import { ReviewDialog } from "./ReviewDialog";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { UnderlineTabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Menu";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";

const PAGE_SIZE = 10;

export function AdminQueue() {
  const { t } = useLocale();
  const TABS = [
    { value: "pending", label: t("adminQueue.tab.pending") },
    { value: "approved", label: t("adminQueue.tab.approved") },
    { value: "rejected", label: t("adminQueue.tab.rejected") },
    { value: "draft", label: t("adminQueue.tab.draft") },
  ];
  const [tab, setTab] = useState("pending");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      const res = await endpoints.adminProfiles(tab);
      setProfiles(res.profiles ?? []);
      if (tab === "pending") setPendingCount((res.profiles ?? []).length);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : t("adminQueue.errorLoad"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);
  // Reset page on tab change
  useEffect(() => { setPage(1); }, [tab]);

  // Keep the pending badge honest even while another tab is open.
  useEffect(() => {
    if (tab === "pending") return;
    endpoints
      .adminProfiles("pending")
      .then((res) => setPendingCount((res.profiles ?? []).length))
      .catch(() => undefined);
  }, [tab]);

  // New applications and status changes show up without a manual reload.
  usePolling(() => {
    load(true);
    if (tab !== "pending") {
      endpoints
        .adminProfiles("pending")
        .then((res) => setPendingCount((res.profiles ?? []).length))
        .catch(() => undefined);
    }
  });

  return (
    <AppShell
      title={t("page.adminQueue.title")}
      description={t("page.adminQueue.description")}
    >
      <div className="space-y-5">
        <UnderlineTabs
          value={tab}
          onValueChange={setTab}
          tabs={TABS.map((tabItem) =>
            tabItem.value === "pending" ? { ...tabItem, count: pendingCount } : tabItem,
          )}
        />

        {error ? (
          <ErrorState description={error} onRetry={load} />
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <EmptyState
            icon={tab === "pending" ? CheckCircle2 : GraduationCap}
            title={
              tab === "pending"
                ? t("adminQueue.empty.pending.title")
                : tab === "approved"
                  ? t("adminQueue.empty.approved.title")
                  : tab === "rejected"
                    ? t("adminQueue.empty.rejected.title")
                    : t("adminQueue.empty.draft.title")
            }
            description={
              tab === "pending"
                ? t("adminQueue.empty.pending.description")
                : t("adminQueue.empty.other.description")
            }
          />
        ) : (
          <>
            <motion.ul
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {profiles.slice(0, page * PAGE_SIZE).map((profile) => (
                <motion.li key={profile.id} variants={fadeUp}>
                  <Card>
                    <CardContent className="p-4 pt-4 sm:p-5 sm:pt-5">
                      <div className="flex flex-wrap items-center gap-4">
                        <Avatar name={profile.full_name ?? "?"} size="md" />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold text-ink">
                              {profile.full_name ?? "Student"}
                            </p>
                            {profile.is_minor && (
                              <Badge tone="warning" icon={ShieldAlert}>
                                {t("adminQueue.badge.minor")}
                              </Badge>
                            )}
                            {profile.edit_request_reason && (
                              <Badge tone="amber">{t("adminQueue.badge.changeRequest")}</Badge>
                            )}
                          </div>
                          <p className="truncate text-sm text-muted">
                            {profile.academic_level ?? "—"}
                            {profile.institution ? ` · ${profile.institution.name}` : ""}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                            <span className="figure font-medium text-accent-ink">
                              {formatMoney(profile.funding_goal)}
                            </span>
                            <span>
                              {profile.document_count}{" "}
                              {profile.document_count === 1 ? t("adminQueue.document") : t("adminQueue.documents")}
                            </span>
                            {profile.submitted_at && (
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="size-3.5" aria-hidden />
                                {formatRelative(profile.submitted_at)}
                              </span>
                            )}
                          </p>
                        </div>

                        <StatusBadge status={profile.status} />

                        <Button
                          variant={profile.status === "pending" ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => setReviewing(profile.id)}
                          className="w-full sm:w-auto"
                        >
                          <ShieldCheck aria-hidden />
                          {profile.status === "pending" ? t("adminQueue.action.review") : t("adminQueue.action.open")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.li>
              ))}
            </motion.ul>
            {profiles.length > page * PAGE_SIZE && (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                  {t("adminQueue.loadMore", { count: String(profiles.length - page * PAGE_SIZE) })}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ReviewDialog
        profileId={reviewing}
        open={reviewing !== null}
        onOpenChange={(open) => !open && setReviewing(null)}
        onReviewed={load}
      />
    </AppShell>
  );
}
