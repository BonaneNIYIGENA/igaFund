import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** The routing rail — igaFund's signature structural device. */

export type RailState = "done" | "current" | "todo" | "blocked" | "bypassed";

export interface RailStep {
  key: string;
  label: string;
  detail?: string;
  icon?: LucideIcon;
  state: RailState;
}

const nodeStyles: Record<RailState, string> = {
  done: "bg-forest-700 text-white border-forest-700",
  current: "bg-amber-500 text-forest-950 border-amber-500 shadow-[0_0_0_6px_var(--color-amber-100)]",
  todo: "bg-surface text-sage-500 border-line-strong",
  blocked: "bg-clay-500 text-white border-clay-500",
  /** The node money deliberately never passes through. */
  bypassed: "bg-surface text-clay-500 border-clay-200 border-dashed",
};

const labelStyles: Record<RailState, string> = {
  done: "text-accent-ink",
  current: "text-ink font-semibold",
  todo: "text-muted",
  blocked: "text-clay-700 font-medium",
  bypassed: "text-clay-600 line-through decoration-clay-500/60",
};

function NodeIcon({ step }: { step: RailStep }) {
  if (step.state === "bypassed") return <X aria-hidden strokeWidth={2.5} />;
  if (step.state === "done") return <Check aria-hidden strokeWidth={3} />;
  if (step.icon) {
    const Icon = step.icon;
    return <Icon aria-hidden strokeWidth={2} />;
  }
  return <span className="size-2 rounded-full bg-current" aria-hidden />;
}


export function RoutingRail({
  steps,
  className,
  animate = true,
}: {
  steps: RailStep[];
  className?: string;
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  const shouldAnimate = animate && !reduce;

  return (
    <ol className={cn("relative flex flex-col", className)}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const connectorLit = step.state === "done";
        return (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {/* connector */}
            {!isLast && (
              <span className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-sage-200" aria-hidden>
                <motion.span
                  className={cn(
                    "block w-full origin-top",
                    connectorLit ? "bg-forest-600" : "bg-transparent",
                  )}
                  style={{ height: "100%" }}
                  initial={shouldAnimate ? { scaleY: 0 } : false}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            )}

            <motion.span
              className={cn(
                "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 [&_svg]:size-[18px]",
                nodeStyles[step.state],
              )}
              initial={shouldAnimate ? { scale: 0.6, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 24, delay: i * 0.08 }}
            >
              <NodeIcon step={step} />
            </motion.span>

            <div className="min-w-0 pt-1.5">
              <p className={cn("text-[0.9375rem] leading-tight", labelStyles[step.state])}>
                {step.label}
              </p>
              {step.detail && <p className="mt-1 text-sm text-muted">{step.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}


export function RoutingFlow({
  steps,
  className,
}: {
  steps: RailStep[];
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <ol
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-0",
        className,
      )}
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <React.Fragment key={step.key}>
            <motion.li
              className="flex items-center gap-3 sm:flex-col sm:gap-2.5 sm:text-center"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", stiffness: 300, damping: 26, delay: i * 0.1 }}
            >
              <span
                className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-md border-2 [&_svg]:size-5",
                  nodeStyles[step.state],
                )}
              >
                <NodeIcon step={step} />
              </span>
              <div className="min-w-0 sm:max-w-[10rem]">
                <p className={cn("text-sm leading-tight", labelStyles[step.state])}>{step.label}</p>
                {step.detail && (
                  <p className="mt-0.5 text-xs text-muted leading-snug">{step.detail}</p>
                )}
              </div>
            </motion.li>

            {!isLast && (
              <li aria-hidden className="ml-6 sm:mx-2 sm:mt-6 sm:ml-0 sm:flex-1">
                <span className="block h-5 w-0.5 bg-sage-200 sm:h-0.5 sm:w-full">
                  <motion.span
                    className="block size-full origin-top bg-forest-400 sm:origin-left"
                    initial={reduce ? false : { scaleY: 0, scaleX: 0 }}
                    whileInView={{ scaleY: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.1 + 0.15 }}
                  />
                </span>
              </li>
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}
