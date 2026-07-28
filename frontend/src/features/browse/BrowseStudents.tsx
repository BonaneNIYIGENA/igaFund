import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, SearchX, ShieldCheck } from "lucide-react";
import { endpoints, type Profile } from "@/lib/api";
import { stagger } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Input, NativeSelect, Label } from "@/components/ui/Field";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/Feedback";
import { StudentCard } from "./StudentCard";
import { StudentPanel } from "./StudentPanel";
import { useAuth, HOME_FOR_ROLE } from "@/features/auth/AuthContext";

const LEVELS = ["all", "S4", "S5", "S6", "Year 1", "Year 2", "Year 3", "Year 4", "TVET"];

/** Public discovery. */
export function BrowseStudents() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await endpoints.publicProfiles({ academic_level: level });
      setProfiles(res.profiles ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load students.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      [p.full_name, p.field_of_study, p.academic_level, p.institution?.name, p.bio]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [profiles, search]);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3.5 sm:px-6">
          <Link to="/" aria-label="igaFund home">
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Button size="sm" asChild>
                <Link to={HOME_FOR_ROLE[user.role]}>Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Create an account</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3 py-1.5 text-sm font-medium text-forest-700">
            <ShieldCheck className="size-4" aria-hidden />
            Every profile here has been approved by an administrator
          </p>
          <h1 className="mt-5 font-display text-4xl tracking-tight sm:text-5xl">
            Students waiting on fees
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">
            Read a profile, then fund it. Your contribution goes to the student's registered
            institution — you will get a receipt naming the school.
          </p>
        </div>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="browse-search">Search</Label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-faint"
                aria-hidden
              />
              <Input
                id="browse-search"
                type="search"
                placeholder="Name, school, or field of study"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11"
              />
            </div>
          </div>
          <div className="sm:w-56">
            <Label htmlFor="browse-level">Academic level</Label>
            <NativeSelect
              id="browse-level"
              className="mt-1.5"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l === "all" ? "All levels" : l}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <p className="mt-6 text-sm text-muted" aria-live="polite">
          {loading
            ? "Loading students…"
            : `${visible.length} ${visible.length === 1 ? "student" : "students"} shown`}
        </p>

        <div className="mt-4">
          {error ? (
            <ErrorState description={error} onRetry={load} />
          ) : loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            profiles.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No verified students yet"
                description="Profiles appear the moment an administrator approves them. Check back shortly, or start an application of your own."
                action={
                  <Button asChild>
                    <Link to="/register">Apply for funding</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Nothing matches that search"
                description="Try a different name, school or level — or clear the filters to see everyone."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch("");
                      setLevel("all");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            )
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visible.map((profile) => (
                <StudentCard
                key={profile.id}
                profile={profile}
                to={`/students/${profile.id}`}
                onOpen={setViewing}
              />
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <StudentPanel
        profileId={viewing}
        open={viewing !== null}
        onOpenChange={(o) => !o && setViewing(null)}
        onFunded={load}
      />
    </div>
  );
}
