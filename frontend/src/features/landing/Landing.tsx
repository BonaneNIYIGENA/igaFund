import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  FileCheck2,
  HeartHandshake,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { endpoints, type Profile } from "@/lib/api";
import { formatCompact } from "@/lib/format";
import { fadeUp, staggerSlow } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { RoutingFlow, type RailStep } from "@/components/ui/RoutingRail";
import { StudentCard } from "@/features/browse/StudentCard";
import { SkeletonCard } from "@/components/ui/Feedback";
import { useAuth } from "@/features/auth/AuthContext";
import { useLocale } from "@/lib/i18n";
import { PublicHeader } from "@/components/ui/PublicHeader";
import { PublicFooter } from "@/components/ui/PublicFooter";

export function Landing() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  /** The money path. */
  const MONEY_PATH: RailStep[] = [
    { key: "donor", label: t("landing.moneyPath.donor.label"), detail: t("landing.moneyPath.donor.detail"), icon: HeartHandshake, state: "done" },
    { key: "igafund", label: t("landing.moneyPath.igafund.label"), detail: t("landing.moneyPath.igafund.detail"), icon: ShieldCheck, state: "done" },
    { key: "school", label: t("landing.moneyPath.school.label"), detail: t("landing.moneyPath.school.detail"), icon: Building2, state: "done" },
    { key: "receipt", label: t("landing.moneyPath.receipt.label"), detail: t("landing.moneyPath.receipt.detail"), icon: Receipt, state: "done" },
  ];

  useEffect(() => {
    endpoints
      .publicProfiles()
      .then((res) => setProfiles((res.profiles ?? []).slice(0, 3)))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  const totalRaised = profiles.reduce((sum, p) => sum + (p.funded_amount ?? 0), 0);

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only-focusable absolute left-4 top-4 z-50 rounded-sm bg-forest-900 px-4 py-2 text-sm text-white"
      >
        {t("header.skipToContent")}
      </a>

      <PublicHeader />

      <main id="main">
        <section className="grain relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="mx-auto max-w-360">
            <motion.div variants={staggerSlow} initial="hidden" animate="show" className="max-w-3xl">
              <motion.h1
                variants={fadeUp}
                className="font-display text-[2.5rem] leading-[1.05] tracking-[-0.02em] sm:text-6xl lg:text-[4.25rem]"
              >
                {t("landing.hero.title.line1")}
                <br />
                <span className="text-accent-ink">{t("landing.hero.title.line2")}</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-xl text-lg leading-relaxed text-muted"
              >
                {t("landing.hero.subtitle")}
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="fund" asChild>
                  <Link to={user?.role === "donor" ? "/donor/browse" : "/students"}>
                    {t("landing.hero.cta.find")}
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/register">{t("landing.hero.cta.apply")}</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="how" className="border-y border-line bg-surface px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-360">
            <h2 className="max-w-2xl font-display text-3xl tracking-tight sm:text-4xl">
              {t("landing.how.title")}
            </h2>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className="mt-9 rounded-2xl border border-line bg-canvas p-6 shadow-sm sm:p-9"
            >
              <p className="text-sm font-medium uppercase tracking-[0.08em] text-faint">
                {t("landing.how.eyebrow")}
              </p>
              <RoutingFlow steps={MONEY_PATH} className="mt-7" />
            </motion.div>

            <motion.ul
              variants={staggerSlow}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-10"
            >
              {[
                {
                  icon: FileCheck2,
                  title: t("landing.proof.checked.title"),
                  body: t("landing.proof.checked.body"),
                },
                {
                  icon: Building2,
                  title: t("landing.proof.routed.title"),
                  body: t("landing.proof.routed.body"),
                },
                {
                  icon: Receipt,
                  title: t("landing.proof.receipt.title"),
                  body: t("landing.proof.receipt.body"),
                },
              ].map((item) => (
                <motion.li key={item.title} variants={fadeUp}>
                  <span className="grid size-12 place-items-center rounded-md bg-forest-100 text-forest-700">
                    <item.icon className="size-[22px]" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">{item.body}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-360">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
                  {t("landing.students.title")}
                </h2>
                <p className="mt-2 text-[0.9375rem] text-muted">
                  {totalRaised > 0 ? (
                    <>
                      <span className="figure font-semibold text-accent-ink">
                        {formatCompact(totalRaised)} RWF
                      </span>{" "}
                      {t("landing.students.raisedSuffix")}
                    </>
                  ) : (
                    t("landing.students.noneRaisedYet")
                  )}
                </p>
              </div>
              <Button variant="secondary" asChild>
                <Link to="/students">
                  {t("landing.students.seeAll")}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>

            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
              ) : profiles.length > 0 ? (
                profiles.map((profile) => (
                  <StudentCard key={profile.id} profile={profile} to={`/students/${profile.id}`} />
                ))
              ) : (
                <div className="col-span-full rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
                  <p className="font-medium text-ink">{t("landing.students.empty.title")}</p>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
                    {t("landing.students.empty.body")}
                  </p>
                  <Button className="mt-5" asChild>
                    <Link to="/register">{t("landing.hero.cta.apply")}</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 overflow-hidden">
          <div className="mx-auto max-w-360 overflow-hidden rounded-2xl bg-forest-900 text-forest-100">
            <div className="grain relative grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:items-center lg:p-14">
              <div className="min-w-0">
                <p className="text-sm font-medium uppercase tracking-[0.08em] text-forest-300">
                  {t("landing.ambassador.eyebrow")}
                </p>
                <h2 className="mt-4 font-display text-2xl tracking-tight text-white sm:text-4xl break-words">
                  {t("landing.ambassador.title")}
                </h2>
                <p className="mt-4 max-w-lg leading-relaxed text-forest-200 text-sm sm:text-base">
                  {t("landing.ambassador.body")}
                </p>
                <Button variant="fund" className="mt-7" asChild>
                  <Link to="/help">
                    {t("landing.ambassador.cta")}
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {[
                  { value: t("landing.ambassador.stat.offline.value"), label: t("landing.ambassador.stat.offline.label") },
                  { value: t("landing.ambassador.stat.autosync.value"), label: t("landing.ambassador.stat.autosync.label") },
                  { value: t("landing.ambassador.stat.ownStudents.value"), label: t("landing.ambassador.stat.ownStudents.label") },
                  { value: t("landing.ambassador.stat.fullTrail.value"), label: t("landing.ambassador.stat.fullTrail.label") },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-forest-800/70 p-4 sm:p-5">
                    <dt className="font-display text-lg sm:text-xl text-white">{stat.value}</dt>
                    <dd className="mt-1.5 text-xs sm:text-sm leading-snug text-forest-300">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
