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

const PAGE_SIZE = 10;

export function DonorBrowse() {
  const { t } = useLocale();
  const SORTS = [
    { value: "need", label: t("donorBrowse.sort.need") },
    { value: "newest", label: t("donorBrowse.sort.newest") },
    { value: "closest", label: t("donorBrowse.sort.closest") },
  ] as const;
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState<"need" | "newest" | "closest">("need");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await endpoints.publicProfiles({ academic_level: level });
      setProfiles(res.profiles ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("donorBrowse.errorLoad"));
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
            <Label htmlFor="donor-search">{t("donorBrowse.search.label")}</Label>
            <Input
              id="donor-search"
              type="search"
              className="mt-1.5"
              placeholder={t("donorBrowse.search.placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sm:w-44">
            <Label htmlFor="donor-level">{t("donorBrowse.level.label")}</Label>
            <NativeSelect
              id="donor-level"
              className="mt-1.5"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l === "all" ? t("donorBrowse.level.all") : l}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="sm:w-52">
            <Label htmlFor="donor-sort">{t("donorBrowse.sort.label")}</Label>
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
          {loading
            ? t("donorBrowse.loading")
            : `${visible.length} ${visible.length === 1 ? t("donorBrowse.count.one") : t("donorBrowse.count.many")}`}
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
              title={t("donorBrowse.empty.noneVerified.title")}
              description={t("donorBrowse.empty.noneVerified.description")}
            />
          ) : (
            <EmptyState
              icon={SearchX}
              title={t("donorBrowse.empty.noMatch.title")}
              description={t("donorBrowse.empty.noMatch.description")}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setLevel("all");
                  }}
                >
                  {t("donorBrowse.clearFilters")}
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
              {visible.slice(0, page * PAGE_SIZE).map((p) => (
                <StudentCard key={p.id} profile={p} to={`/students/${p.id}`} onOpen={setViewing} />
              ))}
            </motion.div>

            {visible.length > page * PAGE_SIZE && (
              <div className="mt-8 flex justify-center">
                <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                  {t("donorBrowse.loadMore", { count: String(visible.length - page * PAGE_SIZE) })}
                </Button>
              </div>
            )}
          </>
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
