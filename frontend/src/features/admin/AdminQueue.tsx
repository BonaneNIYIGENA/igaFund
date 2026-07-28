import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, GraduationCap, ShieldAlert, ShieldCheck } from "lucide-react";
import { endpoints, type Profile } from "@/lib/api";
import { formatMoney, formatRelative } from "@/lib/format";
import { stagger, fadeUp } from "@/lib/motion";
import { AppShell } from "@/app/shell/AppShell";
import { ReviewDialog } from "./ReviewDialog";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { UnderlineTabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Menu";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";

const TABS = [
  { value: "pending", label: "Awaiting review" },
  { value: "approved", label: "Verified" },
  { value: "rejected", label: "Changes requested" },
  { value: "draft", label: "Drafts" },
];

export function AdminQueue() {
  const [tab, setTab] = useState("pending");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await endpoints.adminProfiles(tab);
      setProfiles(res.profiles ?? []);
      if (tab === "pending") setPendingCount((res.profiles ?? []).length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load the review queue.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the pending badge honest even while another tab is open.
  useEffect(() => {
    if (tab === "pending") return;
    endpoints
      .adminProfiles("pending")
      .then((res) => setPendingCount((res.profiles ?? []).length))
      .catch(() => undefined);
  }, [tab]);

  return (
    <AppShell
      title="Review queue"
      description="Nothing becomes public until someone here approves it."
    >
      <div className="space-y-5">
        <UnderlineTabs
          value={tab}
          onValueChange={setTab}
          tabs={TABS.map((t) =>
            t.value === "pending" ? { ...t, count: pendingCount } : t,
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
                ? "The queue is clear"
                : tab === "approved"
                  ? "No verified profiles yet"
                  : tab === "rejected"
                    ? "Nothing awaiting changes"
                    : "No drafts in progress"
            }
            description={
              tab === "pending"
                ? "Every submitted application has been reviewed. New submissions will appear here and you'll be notified."
                : "Profiles move here as they progress through verification."
            }
          />
        ) : (
          <motion.ul
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {profiles.map((profile) => (
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
                              Minor
                            </Badge>
                          )}
                          {profile.edit_request_reason && (
                            <Badge tone="amber">Change request</Badge>
                          )}
                        </div>
                        <p className="truncate text-sm text-muted">
                          {profile.academic_level ?? "—"}
                          {profile.institution ? ` · ${profile.institution.name}` : ""}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                          <span className="figure font-medium text-forest-800">
                            {formatMoney(profile.funding_goal)}
                          </span>
                          <span>
                            {profile.document_count}{" "}
                            {profile.document_count === 1 ? "document" : "documents"}
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
                        {profile.status === "pending" ? "Review" : "Open"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.li>
            ))}
          </motion.ul>
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
