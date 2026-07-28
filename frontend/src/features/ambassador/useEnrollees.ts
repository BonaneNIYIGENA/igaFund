import { useCallback, useEffect, useState } from "react";
import { endpoints, type Profile } from "@/lib/api";

/** Profiles this ambassador personally enrolled — the API already scopes to them (BR5). */
export function useEnrollees() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await endpoints.myProfiles();
      setStudents(res.profiles ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load your students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = {
    total: students.length,
    draft: students.filter((s) => s.status === "draft").length,
    pending: students.filter((s) => s.status === "pending").length,
    approved: students.filter((s) => s.status === "approved").length,
    rejected: students.filter((s) => s.status === "rejected").length,
    raised: students.reduce((sum, s) => sum + (s.funded_amount ?? 0), 0),
  };

  return { students, loading, error, reload: load, counts };
}
