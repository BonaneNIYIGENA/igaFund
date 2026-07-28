import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  HeartHandshake,
  Search,
  Sparkles,
} from "lucide-react";
import { endpoints, type ContributionItem, type Profile } from "@/lib/api";
import { formatMoney, formatRelative } from "@/lib/format";
import { fadeUp, stagger } from "@/lib/motion";
import { AppShell } from "@/app/shell/AppShell";
import { useAuth } from "@/features/auth/AuthContext";
import { StudentCard } from "@/features/browse/StudentCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/Stat";
import { EmptyState, SkeletonCard, Skeleton } from "@/components/ui/Feedback";

export function DonorDashboard() {
  const { user } = useAuth();
  const [given, setGiven] = useState<ContributionItem[]>([]);
  const [suggested, setSuggested] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      endpoints.myContributions().catch(() => ({ contributions: [] })),
      endpoints.publicProfiles().catch(() => ({ profiles: [] })),
    ])
      .then(([mine, pool]) => {
        setGiven(mine.contributions ?? []);
        // Surface students furthest from their goal — where a gift moves the needle most.
        const profiles: Profile[] = pool.profiles ?? [];
        setSuggested(
          [...profiles]
            .filter((p) => (p.funded_amount ?? 0) < (p.funding_goal ?? 0))
            .sort(
              (a, b) =>
                (a.funded_amount ?? 0) / (a.funding_goal || 1) -
                (b.funded_amount ?? 0) / (b.funding_goal || 1),
            )
            .slice(0, 3),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const totalGiven = given.reduce((sum, c) => sum + (c.amount ?? 0), 0);
  const studentsHelped = new Set(given.map((c) => c.profile_id)).size;
  const schools = new Set(given.map((c) => c.institution?.name).filter(Boolean)).size;
  const firstName = user?.full_name.split(" ")[0] ?? "there";

  return (
    <AppShell
      title={`Hello, ${firstName}`}
      description="Your giving, and students who still need help."
      actions={
        <Button variant="fund" asChild>
          <Link to="/donor/browse">
            <Search aria-hidden />
            Find a student
          </Link>
        </Button>
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-3">
          <StatTile
            label="Total given"
            value={formatMoney(totalGiven)}
            icon={HeartHandshake}
            tone="amber"
            hint="Every franc routed to a school"
          />
          <StatTile
            label="Students supported"
            value={studentsHelped}
            countUp
            icon={GraduationCap}
          />
          <StatTile label="Institutions paid" value={schools} countUp icon={Building2} />
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-start">
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Students who need the most</CardTitle>
                <Button variant="link" size="sm" asChild>
                  <Link to="/donor/browse">See all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                ) : suggested.length === 0 ? (
                  <EmptyState
                    icon={Sparkles}
                    title="Every verified student is fully funded"
                    description="There's nobody waiting right now. Check back soon — new profiles are verified regularly."
                  />
                ) : (
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    {suggested.map((p) => (
                      <StudentCard key={p.id} profile={p} to={`/students/${p.id}`} />
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Your recent giving</CardTitle>
                {given.length > 0 && (
                  <Button variant="link" size="sm" asChild>
                    <Link to="/donor/giving">All</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-md" />
                    <Skeleton className="h-16 w-full rounded-md" />
                  </div>
                ) : given.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted">
                      You haven't given yet. Find a verified student and fund their fees directly.
                    </p>
                    <Button variant="fund" size="sm" className="mt-4" asChild>
                      <Link to="/donor/browse">
                        Find a student
                        <ArrowRight aria-hidden />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-line">
                    {given.slice(0, 5).map((c) => (
                      <li key={c.id} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-forest-900">
                              {c.student_name ?? "A student"}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {c.institution?.name ?? "Institution"} ·{" "}
                              {formatRelative(c.created_at)}
                            </p>
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
          </motion.div>
        </div>
      </motion.div>
    </AppShell>
  );
}
