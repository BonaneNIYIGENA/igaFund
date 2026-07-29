import { useCallback, useEffect, useState } from "react";
import { endpoints, type Profile } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";

/**
 * The signed-in student's (or ambassador's own) profile.
 *
 * `poll: true` keeps funding/status current in the background — safe for a
 * read-only view like the dashboard, but left off by default because a
 * silent refresh would otherwise overwrite in-progress edits on the profile
 * form the moment a background fetch lands.
 */
export function useMyProfile({ poll = false }: { poll?: boolean } = {}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      const res = await endpoints.myProfiles();
      setProfile((res.profiles ?? [])[0] ?? null);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "We couldn't load your profile.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  usePolling(() => {
    if (poll) load(true);
  });

  return { profile, setProfile, loading, error, reload: load };
}

/** Whether the student may edit right now, and why not if they can't. */
export function editability(profile: Profile | null) {
  if (!profile) return { canEdit: true, reason: "" as const, needsRequest: false };
  if (profile.status === "draft" || profile.status === "rejected") {
    return { canEdit: true, reason: "", needsRequest: false };
  }
  if (profile.status === "approved") {
    return {
      canEdit: false,
      reason:
        "Your profile is approved and visible to donors, so it's locked. Request a change and it will go back for a quick review.",
      needsRequest: true,
    };
  }
  return {
    canEdit: false,
    reason: "Your profile is with a reviewer. You'll be able to edit it once they respond.",
    needsRequest: false,
  };
}

/** The verification journey, expressed as rail states. */
export function journeyFor(profile: Profile | null) {
  const status = profile?.status;
  const funded = (profile?.funded_amount ?? 0) > 0;

  return {
    created: profile ? ("done" as const) : ("current" as const),
    documents:
      !profile
        ? ("todo" as const)
        : (profile.document_count ?? 0) > 0
          ? ("done" as const)
          : status === "draft"
            ? ("current" as const)
            : ("blocked" as const),
    submitted:
      status === "pending" || status === "approved" || status === "rejected"
        ? ("done" as const)
        : profile && (profile.document_count ?? 0) > 0
          ? ("current" as const)
          : ("todo" as const),
    reviewed:
      status === "approved"
        ? ("done" as const)
        : status === "rejected"
          ? ("blocked" as const)
          : status === "pending"
            ? ("current" as const)
            : ("todo" as const),
    funded: funded ? ("done" as const) : status === "approved" ? ("current" as const) : ("todo" as const),
  };
}
