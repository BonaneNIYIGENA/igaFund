import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SearchX, ShieldCheck } from "lucide-react";
import { endpoints, type Profile } from "@/lib/api";
import { stagger } from "@/lib/motion";
import { AppShell } from "@/app/shell/AppShell";
import { useLocale } from "@/lib/i18n";
import { StudentCard } from "@/features/browse/StudentCard";
import { StudentPanel } from "@/features/browse/StudentPanel";
import { Button } from "@/components/ui/Button";
import { Input, Label, NativeSelect } from "@/components/ui/Field";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/Feedback";

const LEVELS = ["all", "S4", "S5", "S6", "Year 1", "Year 2", "Year 3", "Year 4", "TVET"];
const SORTS = [
  { value: "need", label: "Furthest from goal" },
  { value: "newest", label: "Recently verified" },
  { value: "closest", label: "Closest to goal" },
] as const;

export function DonorBrowse() {
  const { t } = useLocale();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("need");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await endpoints.publicProfiles({ academic_level: level });
      setProfiles(res.profiles ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load the student pool.");
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
    const filtered = profiles.filter((p) =>
      !q
        ? true
        : [p.full_name, p.field_of_study, p.academic_level, p.institution?.name, p.bio]
            .filter(Boolean)
            .some((f) => String(f).toLowerCase().includes(q)),
    );

    const ratio = (p: Profile) => (p.funded_amount ?? 0) / (p.funding_goal || 1);

    return [...filtered].sort((a, b) => {
      if (sort === "need") return ratio(a) - ratio(b);
      if (sort === "closest") return ratio(b) - ratio(a);
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    });
  }, [profiles, search, sort]);

  return (
    <AppShell
      title={t("page.donorBrowse.title")}
      description={t("page.donorBrowse.description")}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="donor-search">Search</Label>
            <Input
              id="donor-search"
              type="search"
              className="mt-1.5"
              placeholder="Name, school, or field of study"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sm:w-44">
            <Label htmlFor="donor-level">Level</Label>
            <NativeSelect
              id="donor-level"
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
          <div className="sm:w-52">
            <Label htmlFor="donor-sort">Sort by</Label>
            <NativeSelect
              id="donor-sort"
              className="mt-1.5"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <p className="text-sm text-muted" aria-live="polite">
          {loading ? "Loading…" : `${visible.length} ${visible.length === 1 ? "student" : "students"}`}
        </p>

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
              title="No verified students right now"
              description="Profiles appear the moment an administrator approves them. We'll notify you when new students join."
            />
          ) : (
            <EmptyState
              icon={SearchX}
              title="Nothing matches that search"
              description="Try a different term, or clear your filters to see every verified student."
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
            {visible.map((p) => (
              <StudentCard key={p.id} profile={p} to={`/students/${p.id}`} onOpen={setViewing} />
            ))}
          </motion.div>
        )}
      </div>

      <StudentPanel
        profileId={viewing}
        open={viewing !== null}
        onOpenChange={(o) => !o && setViewing(null)}
        onFunded={load}
      />
    </AppShell>
  );
}
