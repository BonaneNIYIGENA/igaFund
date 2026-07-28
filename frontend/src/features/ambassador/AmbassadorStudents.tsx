import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SearchX, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/app/shell/AppShell";
import { useLocale } from "@/lib/i18n";
import { useEnrollees } from "./useEnrollees";
import { StudentRow } from "./StudentRow";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { UnderlineTabs } from "@/components/ui/Tabs";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";

export function AmbassadorStudents() {
  const { t } = useLocale();
  const { students, loading, error, reload, counts } = useEnrollees();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => (tab === "all" ? true : s.status === tab))
      .filter((s) =>
        !q
          ? true
          : [s.full_name, s.academic_level, s.institution?.name]
              .filter(Boolean)
              .some((f) => String(f).toLowerCase().includes(q)),
      );
  }, [students, tab, search]);

  return (
    <AppShell
      title={t("page.ambassadorStudents.title")}
      description={t("page.ambassadorStudents.description")}
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
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("page.ambassadorStudents.empty.title")}
          description={t("page.ambassadorStudents.empty.description")}
          action={
            <Button asChild>
              <Link to="/ambassador/enroll">Enroll your first student</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          <UnderlineTabs
            value={tab}
            onValueChange={setTab}
            tabs={[
              { value: "all", label: "All", count: counts.total },
              { value: "draft", label: "Draft", count: counts.draft },
              { value: "pending", label: "Under review", count: counts.pending },
              { value: "approved", label: "Verified", count: counts.approved },
              { value: "rejected", label: "Needs changes", count: counts.rejected },
            ]}
          />

          <Input
            type="search"
            placeholder="Search by name, level or school"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search your students"
            className="max-w-sm"
          />

          <Card>
            <CardContent className="p-5 pt-5 sm:p-6 sm:pt-6">
              {visible.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="Nobody here"
                  description="No student matches this filter. Try another tab or clear your search."
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setTab("all");
                        setSearch("");
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-line">
                  {visible.map((student) => (
                    <StudentRow key={student.id} student={student} onChange={reload} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
