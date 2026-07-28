import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const QUOTES = [
  "Every contribution reaches the school, never a personal account.",
  "Bridging the gap between donors and underprivileged students.",
  "Verified profiles, transparent funding, real impact.",
  "Education changes everything. Your contribution makes it possible.",
  "Piloting in Rwanda — empowering youth through verified funding.",
];

/** Branded full-screen loading splash with animated logo and rotating mission quotes. */
export function LoadingScreen({ compact = false }: { compact?: boolean }) {
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % QUOTES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20" role="status" aria-label="Loading">
        <motion.img
          src="/logo.png"
          alt="igaFund"
          width={72}
          height={72}
          className="size-18 object-contain rounded-xl bg-white shadow-md"
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.97, 1.03, 0.97] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <span className="size-5 animate-spin rounded-full border-[2.5px] border-forest-200 border-t-forest-600" />
      </div>
    );
  }

  return (
    <div
      className="grid min-h-dvh place-items-center bg-gradient-to-b from-canvas to-forest-50/40"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-8 px-6 text-center">
        {/* Animated logo — big and prominent */}
        <motion.div
          className="flex flex-col items-center gap-4"
          animate={{ opacity: [0.75, 1, 0.75], scale: [0.97, 1.04, 0.97] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src="/logo.png"
            alt="igaFund"
            width={128}
            height={128}
            className="size-32 object-contain rounded-2xl bg-white shadow-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span className="font-display text-3xl font-bold tracking-tight text-ink">
            iga<span className="text-forest-600">Fund</span>
          </span>
        </motion.div>

        {/* Spinner */}
        <span className="size-7 animate-spin rounded-full border-[3px] border-forest-200 border-t-forest-700" />

        {/* Rotating quotes */}
        <div className="relative h-14 w-[min(30rem,85vw)]">
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 flex items-start justify-center text-sm leading-relaxed text-muted italic"
            >
              "{QUOTES[quoteIdx]}"
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
