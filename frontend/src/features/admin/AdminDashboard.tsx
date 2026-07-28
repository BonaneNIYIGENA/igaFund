import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileDown,
  ScrollText,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { getToken, endpoints, type AdminStats, type AuditLogItem } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { fadeUp, stagger } from "@/lib/motion";
import { AppShell } from "@/app/shell/AppShell";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/Stat";
import { Alert, Skeleton } from "@/components/ui/Feedback";

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      endpoints.adminStats().catch(() => null),
      endpoints.auditLogs().catch(() => ({ logs: [] })),
    ])
      .then(([s, a]) => {
        setStats(s);
        setLogs(a?.logs ?? a?.audit_logs ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.full_name.split(" ")[0] ?? "Admin";

  async function exportReport() {
    // The export route is JWT-guarded, so fetch it as a blob rather than linking.
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

  return (
    <AppShell
      title={`Hello, ${firstName}`}
      description="Platform health and anything waiting on you."
      actions={
        <>
          <Button variant="secondary" onClick={exportReport}>
            <FileDown aria-hidden />
            Export report
          </Button>
          <Button asChild>
            <Link to="/admin/queue">
              <ShieldCheck aria-hidden />
              Review queue
            </Link>
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          {(stats?.pending ?? 0) > 0 && (
            <motion.div variants={fadeUp}>
              <Alert
                tone="warning"
                title={`${stats!.pending} ${stats!.pending === 1 ? "application is" : "applications are"} waiting for review`}
              >
                Nothing reaches the donor pool until it's approved, so students are blocked until you
                get to these.
                <div className="mt-3.5">
                  <Button size="sm" variant="fund" asChild>
                    <Link to="/admin/queue">
                      Open the queue
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </div>
              </Alert>
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Awaiting review"
              value={stats?.pending ?? 0}
              countUp
              icon={Clock}
              tone={(stats?.pending ?? 0) > 0 ? "amber" : "plain"}
            />
            <StatTile
              label="Verified profiles"
              value={stats?.approved ?? 0}
              countUp
              icon={CheckCircle2}
              tone="forest"
            />
            <StatTile label="Changes requested" value={stats?.rejected ?? 0} countUp icon={XCircle} />
            <StatTile label="Registered users" value={stats?.total_users ?? 0} countUp icon={Users} />
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Recent administrative actions</CardTitle>
                <Button variant="link" size="sm" asChild>
                  <Link to="/admin/audit">Full audit trail</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted">
                    No administrative actions recorded yet. Every approval, rejection and promotion
                    is logged here permanently.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {logs.slice(0, 6).map((log) => (
                      <li key={log.id} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-forest-50 text-forest-700">
                          <ScrollText className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-body">
                            <span className="font-medium text-ink">
                              {log.action.replace(/_/g, " ")}
                            </span>{" "}
                            on {log.target_type.replace(/_/g, " ")} #{log.target_id}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{log.note}</p>
                          <p className="mt-1 text-xs text-faint">{formatRelative(log.created_at)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AppShell>
  );
}
