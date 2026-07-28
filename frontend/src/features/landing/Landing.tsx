import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  FileCheck2,
  HeartHandshake,
  Menu,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { endpoints, type Profile } from "@/lib/api";
import { formatCompact } from "@/lib/format";
import { fadeUp, staggerSlow } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { RoutingFlow, type RailStep } from "@/components/ui/RoutingRail";
import { StudentCard } from "@/features/browse/StudentCard";
import { SkeletonCard } from "@/components/ui/Feedback";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";

/** The money path. */
const MONEY_PATH: RailStep[] = [
  { key: "donor", label: "A donor gives", detail: "Card or mobile money", icon: HeartHandshake, state: "done" },
  { key: "igafund", label: "igaFund verifies", detail: "Profile and documents checked", icon: ShieldCheck, state: "done" },
  { key: "wallet", label: "A personal wallet", detail: "Never touched", icon: Wallet, state: "bypassed" },
  { key: "school", label: "The school is paid", detail: "Straight to the institution account", icon: Building2, state: "done" },
  { key: "receipt", label: "Everyone gets a receipt", detail: "Timestamped, in the audit trail", icon: Receipt, state: "done" },
];

export function Landing() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

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
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3.5 sm:px-6">
          <Link to="/" aria-label="igaFund home">
            <Logo />
          </Link>

          <nav className="ml-auto hidden items-center gap-7 md:flex" aria-label="Main">
            <a href="#how" className="text-sm font-medium text-muted transition-colors hover:text-forest-800">
              How it works
            </a>
            <Link to="/students" className="text-sm font-medium text-muted transition-colors hover:text-forest-800">
              Students
            </Link>
            <Link to="/help" className="text-sm font-medium text-muted transition-colors hover:text-forest-800">
              Help
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Get started</Link>
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="iconSm" className="md:hidden" aria-label="Open menu">
                  <Menu aria-hidden />
                </Button>
              </DialogTrigger>
              <DialogContent size="sm">
                <DialogHeader>
                  <DialogTitle>Menu</DialogTitle>
                </DialogHeader>
                <nav className="flex flex-col gap-1 p-4 pt-0">
                  <a href="#how" className="rounded-sm px-3 py-3 text-[0.9375rem] hover:bg-forest-50">
                    How it works
                  </a>
                  <Link to="/students" className="rounded-sm px-3 py-3 text-[0.9375rem] hover:bg-forest-50">
                    Browse students
                  </Link>
                  <Link to="/help" className="rounded-sm px-3 py-3 text-[0.9375rem] hover:bg-forest-50">
                    Help
                  </Link>
                  <Link to="/login" className="rounded-sm px-3 py-3 text-[0.9375rem] hover:bg-forest-50">
                    Sign in
                  </Link>
                </nav>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="grain relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="mx-auto max-w-6xl">
            <motion.div variants={staggerSlow} initial="hidden" animate="show" className="max-w-3xl">
              <motion.p
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3.5 py-1.5 text-sm font-medium text-forest-700"
              >
                <ShieldCheck className="size-4" aria-hidden />
                Rwanda pilot · Verified profiles only
              </motion.p>

              <motion.h1
                variants={fadeUp}
                className="mt-6 font-display text-[2.5rem] leading-[1.05] tracking-[-0.02em] sm:text-6xl lg:text-[4.25rem]"
              >
                School fees that reach
                <br />
                <span className="text-forest-700">the school.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-xl text-lg leading-relaxed text-muted"
              >
                Donors hesitate because they cannot tell where the money went. igaFund verifies
                every student, then pays their institution directly — so the answer is on record
                before anyone has to ask.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="fund" asChild>
                  <Link to="/students">
                    Find a student to fund
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/register">Apply for funding</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* The signature device, stated once, at full size. */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 26 }}
              className="mt-14 rounded-2xl border border-line bg-white p-6 shadow-lg sm:p-9"
            >
              <p className="text-sm font-medium uppercase tracking-[0.08em] text-faint">
                Where a contribution actually goes
              </p>
              <RoutingFlow steps={MONEY_PATH} className="mt-7" />
            </motion.div>
          </div>
        </section>

        <section id="how" className="border-y border-line bg-white px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-2xl font-display text-3xl tracking-tight sm:text-4xl">
              Three things we can prove, not just promise
            </h2>

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
                  title: "Every profile is checked by a person",
                  body: "An administrator reads the transcripts, the ID and the guardian consent form before a profile is ever visible. Nothing pending is browsable, and nothing is indexed.",
                },
                {
                  icon: Building2,
                  title: "Funds route to institutions only",
                  body: "A contribution is bound to the student's registered school account. There is no code path that sends money to a personal wallet — the rule lives in the data model, not the interface.",
                },
                {
                  icon: Receipt,
                  title: "Both sides keep a receipt",
                  body: "Each approval and payment issues a numbered, timestamped ticket to the student and the donor, and writes an entry to an audit trail administrators cannot edit.",
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
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
                  Students waiting on fees
                </h2>
                <p className="mt-2 text-[0.9375rem] text-muted">
                  {totalRaised > 0 ? (
                    <>
                      <span className="figure font-semibold text-forest-800">
                        {formatCompact(totalRaised)} RWF
                      </span>{" "}
                      routed to schools so far.
                    </>
                  ) : (
                    "Each profile below has been verified and approved."
                  )}
                </p>
              </div>
              <Button variant="secondary" asChild>
                <Link to="/students">
                  See all students
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
                <div className="col-span-full rounded-lg border border-dashed border-line-strong bg-white px-6 py-14 text-center">
                  <p className="font-medium text-forest-900">No verified profiles yet</p>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
                    Profiles appear here the moment an administrator approves them. If you are a
                    student, you can start your application now.
                  </p>
                  <Button className="mt-5" asChild>
                    <Link to="/register">Apply for funding</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-forest-900 text-forest-100">
            <div className="grain relative grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:items-center lg:p-14">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.08em] text-forest-300">
                  Community ambassadors
                </p>
                <h2 className="mt-4 font-display text-3xl tracking-tight text-white sm:text-4xl">
                  For students the internet hasn't reached yet
                </h2>
                <p className="mt-4 max-w-lg leading-relaxed text-forest-200">
                  Ambassadors are former beneficiaries who enroll students in their own communities.
                  They capture a full profile offline, and it uploads itself the moment a signal
                  comes back — nothing is lost between the village and the server.
                </p>
                <Button variant="fund" className="mt-7" asChild>
                  <Link to="/help">
                    How the ambassador programme works
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>

              <dl className="grid grid-cols-2 gap-4">
                {[
                  { value: "Offline", label: "Profiles captured without a connection" },
                  { value: "Auto-sync", label: "Queued drafts submit on reconnect" },
                  { value: "Own students", label: "Ambassadors see only who they enrolled" },
                  { value: "Full trail", label: "Every submission is ticketed" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-forest-800/70 p-5">
                    <dt className="font-display text-xl text-white">{stat.value}</dt>
                    <dd className="mt-1.5 text-sm leading-snug text-forest-300">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Verified educational funding for underprivileged youth in Sub-Saharan Africa.
              Piloting in Rwanda.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer">
            <Link to="/students" className="text-muted hover:text-forest-800">
              Browse students
            </Link>
            <Link to="/register" className="text-muted hover:text-forest-800">
              Apply for funding
            </Link>
            <Link to="/help" className="text-muted hover:text-forest-800">
              Help
            </Link>
            <Link to="/login" className="text-muted hover:text-forest-800">
              Sign in
            </Link>
          </nav>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-xs text-faint">
          © {new Date().getFullYear()} igaFund. Contributions are recorded as routed to partner
          institutions. No contribution is ever held in a personal account.
        </p>
      </footer>
    </div>
  );
}
