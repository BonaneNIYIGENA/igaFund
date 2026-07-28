import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  HeartHandshake,
  MessageSquareQuote,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { ApiError, endpoints, type ContributionItem, type Profile } from "@/lib/api";
import { formatMoney, formatRelative, fundingPercent } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, VerifiedMark } from "@/components/ui/Badge";
import { FundingProgress } from "@/components/ui/Progress";
import { Avatar } from "@/components/ui/Menu";
import { RoutingRail, type RailStep } from "@/components/ui/RoutingRail";
import { Alert, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { useAuth, HOME_FOR_ROLE } from "@/features/auth/AuthContext";
import { ContributeDialog } from "@/features/donor/ContributeDialog";

export function StudentDetail() {
  const { id } = useParams();
  const profileId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contributeOpen, setContributeOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await endpoints.publicProfile(profileId);
      setProfile(res.profile);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 404
          ? "This profile is not available. It may not have been approved yet."
          : "We could not load this profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Supporter messages need a signed-in viewer; anonymous visitors just skip them.
    if (user) {
      endpoints
        .profileContributions(profileId)
        .then((res) => setContributions(res.contributions ?? []))
        .catch(() => setContributions([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, user]);

  function handleFundClick() {
    if (!user) {
      navigate("/register", { state: { from: `/students/${profileId}` } });
      return;
    }
    if (user.role !== "donor" && user.role !== "admin") {
      toast.info("Only donor accounts can contribute", {
        description: "Sign in with a donor account to fund a student.",
      });
      return;
    }
    setContributeOpen(true);
  }

  const routing: RailStep[] = profile
    ? [
        { key: "you", label: "You contribute", detail: "Card or mobile money", icon: HeartHandshake, state: "current" },
        { key: "verified", label: "igaFund confirms the routing details", icon: ShieldCheck, state: "todo" },
        { key: "wallet", label: "A personal wallet", detail: "Never used", icon: Wallet, state: "bypassed" },
        {
          key: "school",
          label: profile.institution ? `${profile.institution.name} is paid` : "The institution is paid",
          detail: profile.institution?.location ?? undefined,
          icon: Building2,
          state: "todo",
        },
        { key: "receipt", label: "You receive a numbered receipt", icon: Receipt, state: "todo" },
      ]
    : [];

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3.5 sm:px-6">
          <Link to="/" aria-label="igaFund home">
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Button variant="ghost" size="sm" asChild>
                <Link to={HOME_FOR_ROLE[user.role]}>Dashboard</Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-6">
          <Link to="/students">
            <ArrowLeft aria-hidden />
            All students
          </Link>
        </Button>

        {error ? (
          <ErrorState title="Profile unavailable" description={error} onRetry={load} />
        ) : loading || !profile ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-4">
              <Skeleton className="h-14 w-2/3" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-36 w-full rounded-lg" />
            </div>
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_21rem] lg:items-start">
            <div>
              <div className="flex items-start gap-4">
                <Avatar name={profile.full_name ?? "?"} src={profile.photo_url} size="lg" className="size-20" />
                <div className="min-w-0">
                  <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
                    {profile.full_name ?? "Verified Student"}
                  </h1>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.9375rem] text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="size-[18px]" aria-hidden />
                      {profile.academic_level ?? "Student"}
                      {profile.field_of_study ? ` · ${profile.field_of_study}` : ""}
                    </span>
                    {profile.institution && (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="size-[18px]" aria-hidden />
                        {profile.institution.name}
                      </span>
                    )}
                  </p>
                  <div className="mt-3">
                    <VerifiedMark />
                  </div>
                </div>
              </div>

              {profile.is_minor && (
                <Alert tone="info" className="mt-6" title="This student is under 18">
                  Their legal name, photograph and contact details are withheld under Rwanda's data
                  protection law. A guardian has signed consent for the profile to be published.
                </Alert>
              )}

              {profile.bio && (
                <div className="mt-7">
                  <h2 className="font-display text-xl">Their story</h2>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-body">{profile.bio}</p>
                </div>
              )}

              {profile.video_url && (
                <div className="mt-7">
                  <h2 className="font-display text-xl">Introduction</h2>
                  <div className="mt-3 overflow-hidden rounded-lg border border-line bg-forest-950">
                    <video
                      src={profile.video_url}
                      controls
                      preload="metadata"
                      className="aspect-video w-full"
                    />
                  </div>
                </div>
              )}

              {/* Routing, restated where the decision is actually made. */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-base">Where your money goes</CardTitle>
                </CardHeader>
                <CardContent>
                  <RoutingRail steps={routing} />
                </CardContent>
              </Card>

              {contributions.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-display text-xl">Messages from supporters</h2>
                  <ul className="mt-4 space-y-3">
                    {contributions
                      .filter((c) => c.message)
                      .slice(0, 6)
                      .map((c) => (
                        <li key={c.id} className="rounded-lg border border-line bg-white p-4">
                          <div className="flex items-start gap-3">
                            <MessageSquareQuote
                              className="mt-0.5 size-[18px] shrink-0 text-forest-500"
                              aria-hidden
                            />
                            <div className="min-w-0">
                              <p className="text-[0.9375rem] leading-relaxed text-body">
                                {c.message}
                              </p>
                              <p className="mt-1.5 text-xs text-faint">
                                {c.donor_name} · {formatRelative(c.created_at)}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="lg:sticky lg:top-24">
              <Card className="overflow-hidden">
                <CardContent className="p-5 pt-5 sm:p-6 sm:pt-6">
                  <FundingProgress funded={profile.funded_amount} goal={profile.funding_goal} />

                  {fundingPercent(profile.funded_amount, profile.funding_goal) >= 100 ? (
                    <Alert tone="success" className="mt-5">
                      This goal has been reached. Every franc was routed to{" "}
                      {profile.institution?.name ?? "the institution"}.
                    </Alert>
                  ) : (
                    <>
                      <p className="mt-5 text-sm leading-relaxed text-muted">
                        Still needed:{" "}
                        <span className="figure font-semibold text-forest-800">
                          {formatMoney(
                            Math.max(0, (profile.funding_goal ?? 0) - (profile.funded_amount ?? 0)),
                          )}
                        </span>
                      </p>
                      <Button variant="fund" size="lg" block className="mt-5" onClick={handleFundClick}>
                        <HeartHandshake aria-hidden />
                        Fund this student
                      </Button>
                      {!user && (
                        <p className="mt-3 text-center text-xs text-muted">
                          You'll create a donor account first — it takes a minute.
                        </p>
                      )}
                    </>
                  )}

                  {profile.institution && (
                    <div className="mt-6 rounded-md bg-sunk p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                        Paid directly to
                      </p>
                      <p className="mt-1.5 font-medium text-forest-900">{profile.institution.name}</p>
                      <p className="text-sm text-muted">{profile.institution.location}</p>
                      <Badge tone="forest" className="mt-3" icon={ShieldCheck}>
                        Registered institution
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>

      {profile && (
        <ContributeDialog
          profile={profile}
          open={contributeOpen}
          onOpenChange={setContributeOpen}
          onSuccess={() => {
            load();
            if (user) {
              endpoints
                .profileContributions(profileId)
                .then((res) => setContributions(res.contributions ?? []))
                .catch(() => undefined);
            }
          }}
        />
      )}
    </div>
  );
}
