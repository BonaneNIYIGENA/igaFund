import * as React from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";


export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-sage-200/70", className)}
      aria-hidden
      {...props}
    />
  );
}

/** Card-shaped placeholder so async content reserves its space (no layout shift). */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-line bg-surface p-5", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="mt-5 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <Skeleton className="mt-5 h-2.5 w-full rounded-full" />
    </div>
  );
}


/** An empty screen is an invitation to act, so it always offers the next step. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-raised px-6 py-14 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-full bg-forest-100 text-forest-700">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}


/** Failures state what happened and give a way forward — never a bare message. */
export function ErrorState({
  title = "That didn't load",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-lg border border-clay-200 bg-danger-soft px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-clay-100 text-clay-600">
        <AlertCircle className="size-6" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-semibold text-clay-700">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-clay-600">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}


const alertTones = {
  info: { wrap: "bg-info-soft border-forest-200 text-accent-ink", icon: Info },
  success: { wrap: "bg-success-soft border-forest-200 text-accent-ink", icon: CheckCircle2 },
  warning: { wrap: "bg-warning-soft border-amber-300 text-amber-700", icon: TriangleAlert },
  danger: { wrap: "bg-danger-soft border-clay-200 text-clay-700", icon: AlertCircle },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof alertTones;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const { wrap, icon: Icon } = alertTones[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-md border p-4", wrap, className)}
    >
      <Icon className="mt-0.5 size-[18px] shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && "mt-0.5")}>{children}</div>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
