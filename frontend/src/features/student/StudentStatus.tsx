import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  FileText,
  HeartHandshake,
  MessageSquareQuote,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ApiError, endpoints, type ContributionItem } from "@/lib/api";
import { formatDateTime, formatMoney, formatRelative } from "@/lib/format";
import { AppShell } from "@/app/shell/AppShell";
import { useMyProfile, journeyFor } from "./useMyProfile";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { RoutingRail, type RailStep } from "@/components/ui/RoutingRail";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";

export function StudentStatus() {
  const { profile, loading, error, reload } = useMyProfile();
  const [funding, setFunding] = useState<ContributionItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    endpoints
      .profileContributions(profile.id)
      .then((res) => setFunding(res.contributions ?? []))
      .catch(() => setFunding([]));
  }, [profile]);

  async function submitForReview() {
    if (!profile) return;
    setSubmitting(true);
    try {
      await endpoints.submitProfile(profile.id);
      toast.success("Sent for review", {
        description: "A reviewer will look at your profile shortly. We'll notify you.",
      });
      await reload();
    } catch (err) {
      toast.error("Not ready yet", {
        description: err instanceof ApiError ? err.message : "Try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const j = journeyFor(profile);
  const journey: RailStep[] = [
    {
      key: "created",
      label: "Profile created",
      detail: profile ? formatDateTime(profile.created_at) : undefined,
      icon: UserRound,
      state: j.created,
    },
    {
      key: "documents",
      label: "Documents uploaded",
      detail: profile ? `${profile.document_count} on file` : undefined,
      icon: FileText,
      state: j.documents,
    },
    {
      key: "submitted",
      label: "Sent for review",
      detail: profile?.submitted_at ? formatDateTime(profile.submitted_at) : undefined,
      icon: Send,
      state: j.submitted,
    },
    {
      key: "reviewed",
      label: profile?.status === "rejected" ? "Changes requested" : "Verified by igaFund",
      detail: profile?.reviewed_at ? formatDateTime(profile.reviewed_at) : undefined,
      icon: ShieldCheck,
      state: j.reviewed,
    },
    {
      key: "funded",
      label: "Donors fund your fees",
      detail:
        profile && profile.funded_amount > 0
          ? "Funding has started"
          : "Once verified, you appear in the donor pool",
      icon: HeartHandshake,
      state: j.funded,
    },
  ];

  const readyToSubmit =
    profile && (profile.status === "draft" || profile.status === "rejected") && profile.document_count > 0;

  return (
    <AppShell
      title="Progress"
      description="Every step of your application, and who has funded you so far."
      actions={profile ? <StatusBadge status={profile.status} size="md" /> : undefined}
    >
      {error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : loading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : !profile ? (
        <EmptyState
          icon={UserRound}
          title="Nothing to track yet"
          description="Create your funding profile and this page will show you exactly where it stands."
          action={
            <Button asChild>
              <Link to="/student/profile">Create my profile</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] xl:grid-cols-[1fr_22rem] lg:items-start">
          <div className="space-y-5">
            {profile.status === "rejected" && profile.review_note && (
              <Alert tone="danger" title="A reviewer asked for changes">
                {profile.review_note}
                <div className="mt-3.5">
                  <Button size="sm" asChild>
                    <Link to="/student/profile">Update my profile</Link>
                  </Button>
                </div>
              </Alert>
            )}

            {profile.status === "approved" && (
              <Alert tone="success" title="You're verified and live">
                Donors can find and fund you now. Share your profile link with anyone who might help.
              </Alert>
            )}

            {profile.edit_request_reason && profile.status === "pending" && (
              <Alert tone="info" title="Change request under review">
                You asked for: “{profile.edit_request_reason}”
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your journey</CardTitle>
              </CardHeader>
              <CardContent>
                <RoutingRail steps={journey} />

                {readyToSubmit && (
                  <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-5">
                    <p className="font-medium text-ink">Ready to send for review?</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      Check your profile and documents once more. While it's under review you won't
                      be able to change them.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <Button variant="fund" loading={submitting} onClick={submitForReview}>
                        <Send aria-hidden />
                        Send for review
                      </Button>
                      <Button variant="secondary" asChild>
                        <Link to="/student/profile">Check my profile first</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {profile.status === "draft" && profile.document_count === 0 && (
                  <div className="mt-6 rounded-md bg-sunk p-5">
                    <p className="font-medium text-ink">Upload your documents first</p>
                    <p className="mt-1 text-sm text-muted">
                      A reviewer needs your transcript and ID before they can verify you.
                    </p>
                    <Button className="mt-4" asChild>
                      <Link to="/student/documents">Upload documents</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your supporters</CardTitle>
              <CardDescription>
                Every contribution routed to {profile.institution?.name ?? "your school"} on your behalf.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {funding.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  {profile.status === "approved"
                    ? "No contributions yet. They'll appear here as donors give."
                    : "Once you're verified, donors can fund you and their gifts will show here."}
                </p>
              ) : (
                <ul className="space-y-3">
                  {funding.slice(0, 6).map((c) => (
                    <li key={c.id} className="rounded-md border border-line bg-raised p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">{c.donor_name}</p>
                          {c.message && (
                            <p className="mt-1 flex items-start gap-1.5 text-sm leading-snug text-body">
                              <MessageSquareQuote className="mt-0.5 size-3.5 shrink-0 text-forest-500" aria-hidden />
                              {c.message}
                            </p>
                          )}
                          <p className="mt-1.5 text-xs text-faint">{formatRelative(c.created_at)}</p>
                        </div>
                        <span className="figure shrink-0 text-sm font-semibold text-forest-800">
                          {formatMoney(c.amount)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
