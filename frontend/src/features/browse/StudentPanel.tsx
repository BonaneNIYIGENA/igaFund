import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Building2,
  Link as LinkIcon,
  GraduationCap,
  HeartHandshake,
  MessageSquareQuote,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { endpoints, type ContributionItem, type Profile } from "@/lib/api";
import { formatMoney, formatRelative, fundingPercent } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Badge, VerifiedMark } from "@/components/ui/Badge";
import { FundingProgress } from "@/components/ui/Progress";
import { Avatar } from "@/components/ui/Menu";
import { RoutingRail, type RailStep } from "@/components/ui/RoutingRail";
import { Alert, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { useAuth } from "@/features/auth/AuthContext";
import { ContributeDialog } from "@/features/donor/ContributeDialog";
import { FollowButton } from "@/features/donor/FollowButton";
import {
  SidePanel,
  SidePanelBody,
  SidePanelContent,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from "@/components/ui/SidePanel";

/** A student's full profile, read beside the list it was opened from. */
export function StudentPanel({
  profileId,
  open,
  onOpenChange,
  onFunded,
}: {
  profileId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFunded?: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contributeOpen, setContributeOpen] = useState(false);

  async function load() {
    if (!profileId) return;
    setLoading(true);
    setError("");
    try {
      const res = await endpoints.publicProfile(profileId);
      setProfile(res.profile);
    } catch {
      setError("This profile is not available.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !profileId) return;
    load();
    if (user) {
      endpoints
        .profileContributions(profileId)
        .then((res) => setContributions(res.contributions ?? []))
        .catch(() => setContributions([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profileId, user]);

  function handleFund() {
    if (!user) {
      navigate("/register", { state: { from: `/students/${profileId}` } });
      return;
    }
    if (user.role !== "donor" && user.role !== "admin") {
      toast.info("Only donor accounts can contribute");
      return;
    }
    setContributeOpen(true);
  }

  const routing: RailStep[] = profile
    ? [
        { key: "you", label: "You contribute", icon: HeartHandshake, state: "current" },
        { key: "verified", label: "igaFund confirms the routing details", icon: ShieldCheck, state: "todo" },
        { key: "wallet", label: "A personal wallet", detail: "Never used", icon: Wallet, state: "bypassed" },
        {
          key: "school",
          label: profile.institution ? `${profile.institution.name} is paid` : "The institution is paid",
          icon: Building2,
          state: "todo",
        },
        { key: "receipt", label: "You receive a numbered receipt", icon: Receipt, state: "todo" },
      ]
    : [];

  const complete = profile ? fundingPercent(profile.funded_amount, profile.funding_goal) >= 100 : false;

  return (
    <>
      <SidePanel open={open} onOpenChange={onOpenChange}>
        <SidePanelContent width="wide" aria-describedby={undefined}>
          <SidePanelHeader>
            <SidePanelTitle>{profile?.full_name ?? "Verified Student"}</SidePanelTitle>
          </SidePanelHeader>

          <SidePanelBody className="space-y-7">
            {error ? (
              <ErrorState description={error} onRetry={load} />
            ) : loading || !profile ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-40 w-full rounded-md" />
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <Avatar
                    name={profile.full_name ?? "?"}
                    src={profile.photo_url}
                    size="lg"
                    className="size-20"
                  />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[0.9375rem] text-muted">
                      <GraduationCap className="size-[18px] shrink-0" aria-hidden />
                      {profile.academic_level ?? "Student"}
                      {profile.field_of_study ? ` · ${profile.field_of_study}` : ""}
                    </p>
                    {profile.institution && (
                      <p className="mt-1 flex items-center gap-1.5 text-[0.9375rem] text-muted">
                        <Building2 className="size-[18px] shrink-0" aria-hidden />
                        {profile.institution.name}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2.5">
                      <VerifiedMark />
                      <FollowButton profileId={profile.id} size="sm" />
                    </div>
                  </div>
                </div>

                <FundingProgress funded={profile.funded_amount} goal={profile.funding_goal} />

                {profile.is_minor && (
                  <Alert tone="info" title="This student is under 18">
                    Their legal name, photograph and contact details are withheld under Rwanda's
                    data protection law.
                  </Alert>
                )}

                {profile.bio && (
                  <div>
                    <h3 className="font-display text-lg">Their story</h3>
                    <p className="mt-2 whitespace-pre-line leading-relaxed text-body">
                      {profile.bio}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-display text-lg">Where your money goes</h3>
                  <div className="mt-3 rounded-lg border border-line bg-surface p-5">
                    <RoutingRail steps={routing} />
                  </div>
                </div>

                {profile.institution && (
                  <div className="rounded-md bg-sunk p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                      Paid directly to
                    </p>
                    <p className="mt-1.5 font-medium text-ink">{profile.institution.name}</p>
                    <p className="text-sm text-muted">{profile.institution.location}</p>
                    <Badge tone="forest" className="mt-3" icon={ShieldCheck}>
                      Registered institution
                    </Badge>
                  </div>
                )}

                {contributions.filter((c) => c.message).length > 0 && (
                  <div>
                    <h3 className="font-display text-lg">Messages from supporters</h3>
                    <ul className="mt-3 space-y-2.5">
                      {contributions
                        .filter((c) => c.message)
                        .slice(0, 5)
                        .map((c) => (
                          <li key={c.id} className="rounded-md border border-line bg-surface p-4">
                            <div className="flex items-start gap-2.5">
                              <MessageSquareQuote
                                className="mt-0.5 size-4 shrink-0 text-forest-500"
                                aria-hidden
                              />
                              <div className="min-w-0">
                                <p className="text-sm leading-relaxed text-body">{c.message}</p>
                                <p className="mt-1 text-xs text-faint">
                                  {c.donor_name} · {formatRelative(c.created_at)}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </SidePanelBody>

          {profile && (
            <SidePanelFooter className="sm:justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  const url = `${window.location.origin}/students/${profile.id}`;
                  navigator.clipboard?.writeText(url).then(() => toast.success("Link copied"));
                }}
              >
                <LinkIcon aria-hidden />
                Copy link
              </Button>

              {complete ? (
                <Badge tone="success" size="md">
                  Goal reached
                </Badge>
              ) : (
                <Button variant="fund" size="lg" onClick={handleFund}>
                  <HeartHandshake aria-hidden />
                  Fund {formatMoney(profile.funding_goal - profile.funded_amount)} needed
                </Button>
              )}
            </SidePanelFooter>
          )}
        </SidePanelContent>
      </SidePanel>

      {profile && (
        <ContributeDialog
          profile={profile}
          open={contributeOpen}
          onOpenChange={setContributeOpen}
          onSuccess={() => {
            load();
            onFunded?.();
          }}
        />
      )}
    </>
  );
}
