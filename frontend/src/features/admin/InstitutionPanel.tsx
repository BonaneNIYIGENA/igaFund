import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Users,
} from "lucide-react";
import { api, type Institution, type Profile } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { FundingProgress } from "@/components/ui/Progress";
import { Avatar } from "@/components/ui/Menu";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import {
  SidePanel,
  SidePanelBody,
  SidePanelContent,
  SidePanelDescription,
  SidePanelHeader,
  SidePanelTitle,
} from "@/components/ui/SidePanel";

type InstitutionDetail = Institution & {
  bank_reference: string | null;
  applicants: number;
  approved: number;
  pending: number;
  rejected: number;
  funded_students: number;
  fully_funded_students: number;
  total_routed: number;
  total_goal: number;
  contribution_count: number;
};

type RankedProfile = Profile & { funding_percent: number; fully_funded: boolean };

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Users }) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-muted">
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="figure mt-1.5 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}

/** Everything routed through one institution, and who it went to. */
export function InstitutionPanel({
  institutionId,
  open,
  onOpenChange,
}: {
  institutionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<InstitutionDetail | null>(null);
  const [students, setStudents] = useState<RankedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    if (!institutionId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api(`/institutions/${institutionId}`);
      setDetail(res.institution);
      setStudents(res.students ?? []);
    } catch {
      setError("We couldn't load this institution.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, institutionId]);

  return (
    <SidePanel open={open} onOpenChange={onOpenChange}>
      <SidePanelContent width="wide" aria-describedby={undefined}>
        <SidePanelHeader>
          <SidePanelTitle>{detail?.name ?? "Institution"}</SidePanelTitle>
          <SidePanelDescription>
            {detail ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {detail.location}
              </span>
            ) : (
              "Loading statistics…"
            )}
          </SidePanelDescription>
        </SidePanelHeader>

        <SidePanelBody className="space-y-7">
          {error ? (
            <ErrorState description={error} onRetry={load} />
          ) : loading || !detail ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-40 w-full rounded-md" />
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Routed to this institution
                </p>
                <p className="figure mt-1 text-3xl font-semibold text-ink">
                  {formatMoney(detail.total_routed)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Across {detail.contribution_count}{" "}
                  {detail.contribution_count === 1 ? "contribution" : "contributions"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Applicants" value={detail.applicants} icon={Users} />
                <Stat label="Verified" value={detail.approved} icon={CheckCircle2} />
                <Stat label="Awaiting review" value={detail.pending} icon={Clock} />
                <Stat label="Fully funded" value={detail.fully_funded_students} icon={GraduationCap} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink">Where donors pay</h3>
                <div className="mt-2.5 flex items-start gap-3 rounded-md border border-line bg-surface p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-forest-50 text-forest-700">
                    <CreditCard className="size-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                      Account reference
                    </p>
                    <p className="figure mt-0.5 text-base font-semibold text-ink">
                      {detail.bank_reference ?? "Not set"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Every contribution below was recorded against this account.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">
                    Students funded here
                  </h3>
                  <span className="text-xs text-muted">Closest to their goal first</span>
                </div>

                {students.length === 0 ? (
                  <EmptyState
                    className="mt-3"
                    icon={Building2}
                    title="No verified students yet"
                    description="Once a student at this institution is approved, they appear here with their funding progress."
                  />
                ) : (
                  <ul className="mt-3 space-y-3">
                    {students.map((s) => (
                      <li
                        key={s.id}
                        className="rounded-md border border-line bg-surface p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar name={s.full_name ?? "?"} src={s.photo_url} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-medium text-ink">
                                {s.full_name ?? "Verified Student"}
                              </p>
                              {s.fully_funded && (
                                <Badge tone="success" icon={CheckCircle2}>
                                  Fully funded
                                </Badge>
                              )}
                            </div>
                            <p className="truncate text-sm text-muted">
                              {s.academic_level ?? "—"}
                              {s.field_of_study ? ` · ${s.field_of_study}` : ""}
                            </p>
                            <FundingProgress
                              className="mt-3"
                              funded={s.funded_amount}
                              goal={s.funding_goal}
                              size="sm"
                            />
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="figure text-lg font-semibold text-forest-800">
                              {s.funding_percent}%
                            </p>
                            <p className="flex items-center gap-1 text-xs text-muted">
                              <HeartHandshake className="size-3" aria-hidden />
                              funded
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </SidePanelBody>
      </SidePanelContent>
    </SidePanel>
  );
}
