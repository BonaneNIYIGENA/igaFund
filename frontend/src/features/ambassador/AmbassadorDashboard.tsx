import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, HeartHandshake, UserPlus, Users } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { fadeUp, stagger } from "@/lib/motion";
import { AppShell } from "@/app/shell/AppShell";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/features/auth/AuthContext";
import { useEnrollees } from "./useEnrollees";
import { StudentRow } from "./StudentRow";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/Stat";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";

export function AmbassadorDashboard() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { students, loading, error, reload, counts } = useEnrollees();
  const firstName = user?.full_name.split(" ")[0] ?? "there";

  const needsAttention = students.filter(
    (s) => s.status === "draft" || s.status === "rejected",
  );

  return (
    <AppShell
      title={t("dash.hello", { name: firstName })}
      description={t("dash.ambassador.description")}
      actions={
        <Button asChild>
          <Link to="/ambassador/enroll">
            <UserPlus aria-hidden />
            Enroll a student
          </Link>
        </Button>
      }
    >
      {error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Students enrolled" value={counts.total} countUp icon={Users} />
            <StatTile
              label="Awaiting review"
              value={counts.pending}
              countUp
              icon={Clock}
              tone={counts.pending > 0 ? "amber" : "plain"}
            />
            <StatTile label="Verified" value={counts.approved} countUp icon={CheckCircle2} tone="forest" />
            <StatTile
              label="Raised for them"
              value={formatMoney(counts.raised)}
              icon={HeartHandshake}
              hint="Routed to their schools"
            />
          </motion.div>

          {needsAttention.length > 0 && (
            <motion.div variants={fadeUp}>
              <Alert tone="warning" title={`${needsAttention.length} ${needsAttention.length === 1 ? "student needs" : "students need"} your help`}>
                They have a profile that isn't with a reviewer yet. Finish their documents and send
                them for verification.
                <div className="mt-3.5">
                  <Button size="sm" variant="fund" asChild>
                    <Link to="/ambassador/students">
                      See who
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </div>
              </Alert>
            </motion.div>
          )}

          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Recently enrolled</CardTitle>
                {students.length > 4 && (
                  <Button variant="link" size="sm" asChild>
                    <Link to="/ambassador/students">See all {students.length}</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <EmptyState
                    icon={UserPlus}
                    title={t("page.ambassadorDashboard.empty.title")}
                    description={t("page.ambassadorDashboard.empty.description")}
                    action={
                      <Button asChild>
                        <Link to="/ambassador/enroll">Enroll your first student</Link>
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {students.slice(0, 4).map((student) => (
                      <StudentRow key={student.id} student={student} onChange={reload} />
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
