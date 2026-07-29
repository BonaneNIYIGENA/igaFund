import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, SearchX, ShieldCheck } from "lucide-react";
import { endpoints, type Profile } from "@/lib/api";
import { stagger } from "@/lib/motion";
import { PublicHeader } from "@/components/ui/PublicHeader";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Input, NativeSelect, Label } from "@/components/ui/Field";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/Feedback";
import { StudentCard } from "./StudentCard";
import { StudentPanel } from "./StudentPanel";
import { useAuth, HOME_FOR_ROLE } from "@/features/auth/AuthContext";
import { useLocale } from "@/lib/i18n";

const LEVELS = ["all", "S4", "S5", "S6", "Year 1", "Year 2", "Year 3", "Year 4", "TVET"];

/**
 * Public discovery.
 *
 * Also serves /students/:id: the id in the URL opens a profile in the side
 * panel over this same grid, so there is no separate full-page detail view
 * to keep visually consistent with — it's this page, with the panel open.
 */
const PAGE_SIZE = 10;

export function BrowseStudents() {
  const { user } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [page, setPage] = useState(1);

  const viewing = id ? Number(id) : null;
  function openProfile(profileId: number) {
    navigate(`/students/${profileId}`);
  }
  function closeProfile() {
    navigate("/students");
  }

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
      <PublicHeader />

      <main className="mx-auto max-w-360 px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
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
                title={t("page.browseStudents.empty.title")}
                description={t("page.browseStudents.empty.description")}
                action={
                  <Button asChild>
                    <Link to="/register">Apply for funding</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title={t("page.browseStudents.emptyFiltered.title")}
                description={t("page.browseStudents.emptyFiltered.description")}
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
            <>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {visible.slice(0, page * PAGE_SIZE).map((profile) => (
                  <StudentCard
                  key={profile.id}
                  profile={profile}
                  to={`/students/${profile.id}`}
                  onOpen={openProfile}
                />
                ))}
              </motion.div>

              {visible.length > page * PAGE_SIZE && (
                <div className="mt-8 flex justify-center">
                  <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                    Load more ({visible.length - page * PAGE_SIZE} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <PublicFooter />

      <StudentPanel
        profileId={viewing}
        open={viewing !== null}
        onOpenChange={(o) => !o && closeProfile()}
        onFunded={load}
      />
    </div>
  );
}
