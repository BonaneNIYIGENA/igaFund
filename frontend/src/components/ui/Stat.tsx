import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** Counts up so a number arriving reads as a value being tallied, not a static label. */
function useCountUp(target: number, enabled: boolean) {
  const [value, setValue] = React.useState(enabled ? 0 : target);

  React.useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    let frame = 0;
    const duration = 650;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // ease-out cubic
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);

  return value;
}

export function StatTile({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  tone = "plain",
  countUp = false,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "plain" | "forest" | "amber" | "ink";
  countUp?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const numeric = typeof value === "number";
  const animated = useCountUp(numeric ? value : 0, countUp && numeric && !reduce);
  const display = numeric ? animated.toLocaleString("en-RW") : value;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-5",
        tone === "plain" && "border-line bg-white",
        tone === "forest" && "border-forest-200 bg-forest-50",
        tone === "amber" && "border-amber-100 bg-amber-50",
        tone === "ink" && "border-forest-800 bg-forest-900 text-forest-100",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-sm font-medium",
            tone === "ink" ? "text-forest-200" : "text-muted",
          )}
        >
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-sm",
              tone === "plain" && "bg-forest-50 text-forest-700",
              tone === "forest" && "bg-forest-100 text-forest-700",
              tone === "amber" && "bg-amber-100 text-amber-700",
              tone === "ink" && "bg-forest-800 text-forest-200",
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
          </span>
        )}
      </div>

      <p className="flex items-baseline gap-1.5">
        <motion.span
          className={cn(
            "figure text-3xl font-semibold tracking-tight",
            tone === "ink" ? "text-white" : "text-forest-900",
          )}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {display}
        </motion.span>
        {unit && (
          <span
            className={cn(
              "figure text-sm font-medium",
              tone === "ink" ? "text-forest-300" : "text-muted",
            )}
          >
            {unit}
          </span>
        )}
      </p>

      {hint && (
        <p className={cn("text-xs", tone === "ink" ? "text-forest-300" : "text-muted")}>{hint}</p>
      )}
    </div>
  );
}
