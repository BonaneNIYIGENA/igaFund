import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileText,
  HeartHandshake,
  MessageSquareQuote,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { endpoints, type ContributionItem } from "@/lib/api";
import { formatMoney, formatRelative } from "@/lib/format";
import { fadeUp, stagger } from "@/lib/motion";
import { AppShell } from "@/app/shell/AppShell";
import { useAuth } from "@/features/auth/AuthContext";
import { useMyProfile, journeyFor } from "./useMyProfile";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { FundingProgress } from "@/components/ui/Progress";
import { StatTile } from "@/components/ui/Stat";
import { RoutingRail, type RailStep } from "@/components/ui/RoutingRail";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";

export function StudentDashboard() {
  const { user } = useAuth();
  const { profile, loading, error, reload } = useMyProfile();
  const [supporters, setSupporters] = useState<ContributionItem[]>([]);

  useEffect(() => {
    if (!profile) return;
    endpoints
      .profileContributions(profile.id)
      .then((res) => setSupporters(res.contributions ?? []))
      .catch(() => setSupporters([]));
  }, [profile]);

  const firstName = user?.full_name.split(" ")[0] ?? "there";
  const j = journeyFor(profile);

  const journey: RailStep[] = [
    { key: "created", label: "Profile created", icon: UserRound, state: j.created },
    {
      key: "documents",
      label: "Documents uploaded",
      detail:
        profile && profile.document_count > 0
          ? `${profile.document_count} on file`
          : "Transcript, ID, and consent form if you're under 18",
      icon: FileText,
      state: j.documents,
    },
    { key: "submitted", label: "Sent for review", icon: Send, state: j.submitted },
    {
      key: "reviewed",
      label: profile?.status === "rejected" ? "Changes requested" : "Verified by igaFund",
      detail: profile?.status === "rejected" ? profile.review_note ?? undefined : undefined,
      icon: ShieldCheck,
      state: j.reviewed,
    },
    { key: "funded", label: "Donors fund your fees", icon: HeartHandshake, state: j.funded },
  ];

  /** The one thing worth doing next, given where the profile stands. */
  function nextStep() {
    if (!profile) {
      return {
        title: "Start your funding profile",
        body: "Tell donors who you are, what you're studying and how much you need. You can save and come back to it.",
        cta: { to: "/student/profile", label: "Create my profile" },
        tone: "warning" as const,
      };
    }
    if (profile.status === "rejected") {
      return {
        title: "A reviewer asked for changes",
        body: profile.review_note ?? "Update your profile and send it back for review.",
        cta: { to: "/student/profile", label: "Make the changes" },
        tone: "danger" as const,
      };
    }
    if (profile.document_count === 0) {
      return {
        title: "Upload your documents",
        body: "A reviewer needs your transcript and ID before they can verify you. Photos from your phone are fine.",
        cta: { to: "/student/documents", label: "Upload documents" },
        tone: "warning" as const,
      };
    }
    if (profile.status === "draft") {
      return {
        title: "Send your profile for review",
        body: "Everything looks ready. A reviewer usually responds within a few days.",
        cta: { to: "/student/status", label: "Review and submit" },
        tone: "warning" as const,
      };
    }
    if (profile.status === "pending") {
      return {
        title: "Your profile is with a reviewer",
        body: "Nothing to do right now — we'll notify you the moment there's a decision.",
        cta: { to: "/student/status", label: "See progress" },
        tone: "info" as const,
      };
    }
    return {
      title: "You're live in the donor pool",
      body: "Donors can find and fund you. Share your profile link to reach more of them.",
      cta: { to: "/student/status", label: "See your progress" },
      tone: "success" as const,
    };
  }

  const step = nextStep();

  return (
    <AppShell
      title={`Hello, ${firstName}`}
      description="Here's where your funding stands today."
      actions={
        profile?.status === "approved" ? (
          <Button variant="secondary" asChild>
            <Link to={`/students/${profile.id}`}>
              View my public profile
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        ) : undefined
      }
    >
      {error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-5">
          <Skeleton className="h-32 w-full rounded-lg" />
          <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={fadeUp}>
            <Alert tone={step.tone} title={step.title}>
              {step.body}
              <div className="mt-3.5">
                <Button size="sm" variant={step.tone === "warning" ? "fund" : "primary"} asChild>
                  <Link to={step.cta.to}>
                    {step.cta.label}
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            </Alert>
          </motion.div>

          {profile ? (
            <>
              <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-3">
                <StatTile
                  label="Raised so far"
                  value={formatMoney(profile.funded_amount)}
                  icon={HeartHandshake}
                  tone="amber"
                  hint={`Goal ${formatMoney(profile.funding_goal)}`}
                />
                <StatTile
                  label="Supporters"
                  value={supporters.length}
                  countUp
                  icon={Sparkles}
                  hint={supporters.length === 1 ? "person has given" : "people have given"}
                />
                <StatTile
                  label="Documents on file"
                  value={profile.document_count}
                  countUp
                  icon={ClipboardCheck}
                  hint="Visible to reviewers only"
                />
              </motion.div>

              <div className="grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-start">
                <motion.div variants={fadeUp}>
                  <Card>
                    <CardHeader className="flex-row items-center justify-between">
                      <CardTitle className="text-base">Your verification journey</CardTitle>
                      <StatusBadge status={profile.status} />
                    </CardHeader>
                    <CardContent>
                      <RoutingRail steps={journey} />
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={fadeUp} className="space-y-5">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Funding goal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FundingProgress funded={profile.funded_amount} goal={profile.funding_goal} />
                    </CardContent>
                  </Card>

                  {profile.institution && (
                    <Card tone="sunk">
                      <CardContent className="p-5 pt-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                          Fees are paid to
                        </p>
                        <p className="mt-2 flex items-start gap-2 font-medium text-ink">
                          <Building2 className="mt-0.5 size-[18px] shrink-0 text-forest-600" aria-hidden />
                          {profile.institution.name}
                        </p>
                        <p className="mt-1 pl-6 text-sm text-muted">{profile.institution.location}</p>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </div>

              <motion.div variants={fadeUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Messages from your supporters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {supporters.filter((s) => s.message).length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted">
                        {profile.status === "approved"
                          ? "No messages yet. They'll appear here as donors give."
                          : "Once your profile is verified, donors can give and leave you a message."}
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {supporters
                          .filter((s) => s.message)
                          .slice(0, 5)
                          .map((s) => (
                            <li key={s.id} className="flex gap-3 rounded-md bg-raised p-4">
                              <MessageSquareQuote
                                className="mt-0.5 size-[18px] shrink-0 text-forest-500"
                                aria-hidden
                              />
                              <div className="min-w-0">
                                <p className="text-[0.9375rem] leading-relaxed text-body">
                                  {s.message}
                                </p>
                                <p className="mt-1.5 text-xs text-faint">
                                  {s.donor_name} gave{" "}
                                  <span className="figure">{formatMoney(s.amount)}</span> ·{" "}
                                  {formatRelative(s.created_at)}
                                </p>
                              </div>
                            </li>
                          ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          ) : (
            <motion.div variants={fadeUp}>
              <EmptyState
                icon={UserRound}
                title="No profile yet"
                description="Your funding profile is what donors read. Create it once, and a reviewer will verify it before it goes live."
                action={
                  <Button asChild>
                    <Link to="/student/profile">Create my profile</Link>
                  </Button>
                }
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AppShell>
  );
}
