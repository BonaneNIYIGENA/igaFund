import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { endpoints } from "@/lib/api";
import { useAuth } from "@/features/auth/AuthContext";

type WatchlistValue = {
  watchedIds: Set<number>;
  isWatching: (profileId: number) => boolean;
  toggle: (profileId: number) => Promise<void>;
  loading: boolean;
};

const WatchlistContext = createContext<WatchlistValue | null>(null);

/**
 * A donor's followed students, loaded once and shared across every card and
 * panel so the heart icon stays in sync everywhere without refetching.
 */
export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [watchedIds, setWatchedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "donor") {
      setLoading(false);
      return;
    }

    let cancelled = false;
    function refresh() {
      endpoints
        .watchedProfiles()
        .then((res) => {
          if (!cancelled) setWatchedIds(new Set(res.watched_ids ?? []));
        })
        .catch(() => {
          if (!cancelled) setWatchedIds(new Set());
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    refresh();
    // Keeps the following count fresh across tabs/devices without a manual reload.
    const id = setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user?.role]);

  const toggle = useCallback(async (profileId: number) => {
    const watching = watchedIds.has(profileId);
    setWatchedIds((prev) => {
      const next = new Set(prev);
      watching ? next.delete(profileId) : next.add(profileId);
      return next;
    });
    try {
      if (watching) await endpoints.unwatchProfile(profileId);
      else await endpoints.watchProfile(profileId);
    } catch {
      // Roll back on failure so the icon never lies about server state.
      setWatchedIds((prev) => {
        const next = new Set(prev);
        watching ? next.add(profileId) : next.delete(profileId);
        return next;
      });
      throw new Error("Couldn't update your following list. Try again.");
    }
  }, [watchedIds]);

  const value = useMemo<WatchlistValue>(
    () => ({ watchedIds, isWatching: (id) => watchedIds.has(id), toggle, loading }),
    [watchedIds, toggle, loading],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

/** Returns null outside a donor session — callers should hide the follow UI in that case. */
export function useWatchlist() {
  return useContext(WatchlistContext);
}
