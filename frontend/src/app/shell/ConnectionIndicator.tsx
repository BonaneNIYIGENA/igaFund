import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * A visible signal that offline mode is real, not just a toast that flashed
 * past. Ambassadors enrolling students with patchy signal need to glance up
 * and know whether the app can reach the server right now.
 */
export function ConnectionIndicator() {
  const { t } = useLocale();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <span
      role="status"
      title={t("header.offline")}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        "border-amber-300 bg-amber-50 text-amber-700",
      )}
    >
      <WifiOff className="size-3.5" aria-hidden />
      <span className="hidden sm:inline">{t("header.offline")}</span>
    </span>
  );
}
