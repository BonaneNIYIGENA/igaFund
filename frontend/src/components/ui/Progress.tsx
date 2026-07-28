import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatMoney, fundingPercent } from "@/lib/format";

/** Funding progress. Amber fill = money already in motion toward the school. */
export function FundingProgress({
  funded,
  goal,
  className,
  showLabels = true,
  size = "md",
}: {
  funded: number;
  goal: number;
  className?: string;
  showLabels?: boolean;
  size?: "sm" | "md";
}) {
  const percent = fundingPercent(funded, goal);
  const reduce = useReducedMotion();
  const complete = percent >= 100;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {showLabels && (
        <div className="flex items-baseline justify-between gap-3">
          <span className="figure text-[0.9375rem] font-semibold text-forest-900">
            {formatMoney(funded)}
          </span>
          <span className="text-sm text-muted">
            of <span className="figure">{formatMoney(goal)}</span>
          </span>
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-sage-200",
          size === "sm" ? "h-1.5" : "h-2.5",
        )}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percent}% of the funding goal raised`}
      >
        <motion.div
          className={cn("h-full rounded-full", complete ? "bg-forest-600" : "bg-amber-500")}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
      </div>
      {showLabels && (
        <p className="text-xs text-muted">
          <span className="figure font-semibold text-forest-700">{percent}%</span> funded
          {complete && " — goal reached"}
        </p>
      )}
    </div>
  );
}

/** Generic step progress for multi-step forms. */
export function StepProgress({
  current,
  total,
  labels,
  className,
}: {
  current: number;
  total: number;
  labels?: string[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-forest-900">
          {labels?.[current - 1] ?? `Step ${current}`}
        </p>
        <p className="figure text-xs text-muted">
          {current} / {total}
        </p>
      </div>
      <div className="flex gap-1.5" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i < current ? "bg-forest-600" : "bg-sage-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}
