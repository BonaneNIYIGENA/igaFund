import { useEffect, useRef } from "react";

/**
 * Re-runs `fn` on an interval, and again the moment the tab regains focus or
 * comes back online — so a card showing a count/total catches up on its own
 * instead of needing a manual page reload. `fn` is expected to manage its own
 * loading/error state; this hook only decides when to call it again.
 */
export function usePolling(fn: () => void, intervalMs = 60_000) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const id = setInterval(() => fnRef.current(), intervalMs);
    function onFocusOrOnline() {
      fnRef.current();
    }
    window.addEventListener("focus", onFocusOrOnline);
    window.addEventListener("online", onFocusOrOnline);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocusOrOnline);
      window.removeEventListener("online", onFocusOrOnline);
    };
  }, [intervalMs]);
}
