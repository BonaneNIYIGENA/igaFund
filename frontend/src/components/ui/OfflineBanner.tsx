import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudOff, Wifi } from "lucide-react";
import { onNetworkChange } from "@/lib/offline";

/**
 * A slim, app-wide banner that slides in at the top of the viewport whenever
 * the device loses connectivity, and slides back out when it reconnects.
 *
 * Drop this once inside <BrowserRouter> so it renders on every page.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    return onNetworkChange(setOnline);
  }, []);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          key="offline-banner"
          role="status"
          aria-live="polite"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
            <CloudOff className="size-4 shrink-0" aria-hidden />
            You're offline — changes are saved locally and will sync when you reconnect.
          </div>
        </motion.div>
      )}
      {online && (
        <ReconnectedToast key="reconnected-toast" />
      )}
    </AnimatePresence>
  );
}

/**
 * A brief "Back online" flash that appears for 3 seconds after reconnecting,
 * so the user knows connectivity has been restored.
 */
function ReconnectedToast() {
  const [wasOffline, setWasOffline] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const goOffline = () => setWasOffline(true);
    window.addEventListener("offline", goOffline);
    return () => window.removeEventListener("offline", goOffline);
  }, []);

  useEffect(() => {
    if (!wasOffline) return;
    setShow(true);
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, [wasOffline]);

  if (!show) return null;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="flex items-center justify-center gap-2 bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
        <Wifi className="size-4 shrink-0" aria-hidden />
        You're back online — syncing your saved work now.
      </div>
    </motion.div>
  );
}
