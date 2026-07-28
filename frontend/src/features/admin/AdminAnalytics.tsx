import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  CheckCircle2,
  Clock,
  FileDown,
  HeartHandshake,
  Table2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { getToken, endpoints, type AdminStats, type Profile } from "@/lib/api";
import { formatCompact, formatMoney } from "@/lib/format";
import { AppShell } from "@/app/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/Stat";
import { FundingProgress } from "@/components/ui/Progress";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { AXIS, STATUS_COLOR, SEQUENTIAL, chartFont } from "./chartTheme";

const STATUS_META = [
  { key: "verified", label: "Verified", color: STATUS_COLOR.verified, icon: CheckCircle2 },
  { key: "awaiting", label: "Awaiting review", color: STATUS_COLOR.awaiting, icon: Clock },
  { key: "changes", label: "Changes requested", color: STATUS_COLOR.changes, icon: XCircle },
] as const;

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-line bg-surface px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-ink">{label}</p>
      <p className="figure mt-0.5 text-sm font-semibold text-accent-ink">
        {formatter ? formatter(payload[0].value) : payload[0].value}
      </p>
    </div>
  );
}

export function AdminAnalytics() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTable, setShowTable] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [s, p] = await Promise.all([endpoints.adminStats(), endpoints.adminProfiles("all")]);
      setStats(s);
      setProfiles(p.profiles ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load the analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const raised = profiles.reduce((s, p) => s + (p.funded_amount ?? 0), 0);
    const goal = profiles
      .filter((p) => p.status === "approved")
      .reduce((s, p) => s + (p.funding_goal ?? 0), 0);
    const institutions = new Set(
      profiles.filter((p) => (p.funded_amount ?? 0) > 0).map((p) => p.institution?.name).filter(Boolean),
    ).size;
    return { raised, goal, institutions };
  }, [profiles]);

  /** Verification outcomes — status colors, always paired with an icon and a value. */
  const statusData = useMemo(
    () => [
      { name: "Verified", key: "verified", value: stats?.approved ?? 0, color: STATUS_COLOR.verified },
      { name: "Awaiting review", key: "awaiting", value: stats?.pending ?? 0, color: STATUS_COLOR.awaiting },
      { name: "Changes requested", key: "changes", value: stats?.rejected ?? 0, color: STATUS_COLOR.changes },
    ],
    [stats],
  );

  /** Applications received per month — genuine time series from profile creation dates. */
  const overTime = useMemo(() => {
    const buckets = new Map<string, number>();
    profiles.forEach((p) => {
      if (!p.created_at) return;
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, value]) => {
        const [year, month] = key.split("-");
        return {
          label: new Date(Number(year), Number(month) - 1).toLocaleDateString("en-GB", {
            month: "short",
            year: "2-digit",
          }),
          value,
        };
      });
  }, [profiles]);

  /** Funds routed per institution — one hue, sorted, top 8. */
  const byInstitution = useMemo(() => {
    const buckets = new Map<string, number>();
    profiles.forEach((p) => {
      const name = p.institution?.name;
      if (!name || !(p.funded_amount > 0)) return;
      buckets.set(name, (buckets.get(name) ?? 0) + p.funded_amount);
    });
    return [...buckets.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [profiles]);

  async function exportReport() {
    const res = await fetch("/api/admin/export-pdf", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `igaFund-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasProfiles = profiles.length > 0;

  return (
    <AppShell
      title="Analytics"
      description="Verification throughput and where funds have been routed."
      actions={
        <Button variant="secondary" onClick={exportReport}>
          <FileDown aria-hidden />
          Export PDF
        </Button>
      }
    >
      {error ? (
        <ErrorState description={error} onRetry={load} />
      ) : loading ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Routed to schools"
              value={formatMoney(totals.raised)}
              icon={HeartHandshake}
              tone="amber"
              hint="Across every verified profile"
            />
            <StatTile
              label="Verified profiles"
              value={stats?.approved ?? 0}
              countUp
              icon={CheckCircle2}
              tone="forest"
            />
            <StatTile
              label="Institutions paid"
              value={totals.institutions}
              countUp
              icon={Building2}
            />
            <StatTile label="Registered users" value={stats?.total_users ?? 0} countUp icon={TrendingUp} />
          </div>

          {totals.goal > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Funding across the verified pool</CardTitle>
                <CardDescription>
                  Total raised against the combined goal of every approved profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FundingProgress funded={totals.raised} goal={totals.goal} />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">Verification outcomes</CardTitle>
                  <CardDescription>Every profile by its current review state.</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTable((v) => !v)}
                  aria-pressed={showTable}
                >
                  <Table2 aria-hidden />
                  {showTable ? "Chart" : "Table"}
                </Button>
              </CardHeader>
              <CardContent>
                {!hasProfiles ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No profiles yet"
                    description="Once students apply, their review outcomes appear here."
                  />
                ) : showTable ? (
                  <table className="w-full text-sm">
                    <caption className="sr-only-focusable">Profiles by review state</caption>
                    <thead>
                      <tr className="border-b border-line text-left">
                        <th scope="col" className="pb-2 font-semibold text-ink">
                          State
                        </th>
                        <th scope="col" className="pb-2 text-right font-semibold text-ink">
                          Profiles
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {STATUS_META.map((meta) => {
                        const row = statusData.find((d) => d.key === meta.key);
                        return (
                          <tr key={meta.key} className="border-b border-line last:border-0">
                            <th scope="row" className="py-2.5 text-left font-normal">
                              <span className="flex items-center gap-2">
                                <meta.icon className="size-4" style={{ color: meta.color }} aria-hidden />
                                {meta.label}
                              </span>
                            </th>
                            <td className="figure py-2.5 text-right font-semibold text-ink">
                              {row?.value ?? 0}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={statusData}
                        layout="vertical"
                        margin={{ top: 4, right: 44, bottom: 4, left: 4 }}
                        barCategoryGap={10}
                      >
                        <CartesianGrid horizontal={false} stroke={AXIS.grid} />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={132}
                          tickLine={false}
                          axisLine={false}
                          tick={{ ...chartFont, fill: AXIS.text }}
                        />
                        <Tooltip
                          cursor={{ fill: AXIS.grid }}
                          content={<ChartTooltip formatter={(v) => `${v} profiles`} />}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={26}>
                          {statusData.map((entry) => (
                            <Cell key={entry.key} fill={entry.color} />
                          ))}
                          {/* Direct labels are the required relief for the amber's contrast. */}
                          <LabelList
                            dataKey="value"
                            position="right"
                            className="figure"
                            style={{ fill: "#2B3B35", fontWeight: 600, fontSize: 13 }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Identity is never colour alone. */}
                    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                      {STATUS_META.map((meta) => (
                        <li key={meta.key} className="flex items-center gap-1.5 text-xs text-muted">
                          <meta.icon className="size-3.5" style={{ color: meta.color }} aria-hidden />
                          {meta.label}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Applications received</CardTitle>
                <CardDescription>New student profiles per month, last 12 months.</CardDescription>
              </CardHeader>
              <CardContent>
                {overTime.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="Not enough history yet"
                    description="This chart fills in as students apply over time."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={228}>
                    <AreaChart data={overTime} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
                      <defs>
                        <linearGradient id="applications" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SEQUENTIAL.fill} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={SEQUENTIAL.fill} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={AXIS.grid} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={{ stroke: AXIS.line }}
                        tick={{ ...chartFont, fill: AXIS.text }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ ...chartFont, fill: AXIS.text }}
                      />
                      <Tooltip
                        cursor={{ stroke: AXIS.line }}
                        content={<ChartTooltip formatter={(v) => `${v} applications`} />}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={SEQUENTIAL.hue}
                        strokeWidth={2}
                        fill="url(#applications)"
                        dot={{ r: 3, fill: SEQUENTIAL.hue, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: SEQUENTIAL.hue, stroke: "#fff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funds routed by institution</CardTitle>
              <CardDescription>
                Every franc on this chart was paid to a registered school account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {byInstitution.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No funds routed yet"
                  description="Once donors start giving, the institutions receiving those payments appear here."
                />
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, byInstitution.length * 44)}>
                  <BarChart
                    data={byInstitution}
                    layout="vertical"
                    margin={{ top: 4, right: 72, bottom: 4, left: 4 }}
                    barCategoryGap={10}
                  >
                    <CartesianGrid horizontal={false} stroke={AXIS.grid} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={180}
                      tickLine={false}
                      axisLine={false}
                      tick={{ ...chartFont, fill: AXIS.text }}
                    />
                    <Tooltip
                      cursor={{ fill: AXIS.grid }}
                      content={<ChartTooltip formatter={(v) => formatMoney(v)} />}
                    />
                    <Bar
                      dataKey="value"
                      fill={SEQUENTIAL.fill}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={26}
                    >
                      <LabelList
                        dataKey="value"
                        position="right"
                        formatter={(v: unknown) => `${formatCompact(Number(v))} RWF`}
                        className="figure"
                        style={{ fill: "#2B3B35", fontWeight: 600, fontSize: 12 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Alert tone="info" title="About this data">
            Figures are aggregated from verified profiles and their recorded contributions.
            Month-by-month funding totals need per-contribution timestamps from a reporting
            endpoint, which this build doesn't expose yet.
          </Alert>
        </div>
      )}
    </AppShell>
  );
}
