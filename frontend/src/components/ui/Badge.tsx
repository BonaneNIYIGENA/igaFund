import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, Clock, FileEdit, XCircle, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium rounded-full border whitespace-nowrap [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "bg-sage-100 text-sage-700 border-sage-200",
        forest: "bg-forest-100 text-forest-800 border-forest-200",
        success: "bg-success-soft text-success border-forest-200",
        warning: "bg-warning-soft text-amber-700 border-amber-100",
        danger: "bg-danger-soft text-clay-700 border-clay-200",
        amber: "bg-amber-100 text-amber-700 border-amber-300",
        ink: "bg-forest-900 text-forest-50 border-forest-900",
      },
      size: {
        sm: "text-xs px-2 py-0.5 [&_svg]:size-3",
        md: "text-[0.8125rem] px-2.5 py-1 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { tone: "neutral", size: "sm" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: LucideIcon;
}

export function Badge({ className, tone, size, icon: Icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {Icon && <Icon aria-hidden />}
      {children}
    </span>
  );
}

/** Profile status is load-bearing across every role — one component owns its look. */
const STATUS_MAP: Record<
  string,
  { label: string; tone: NonNullable<BadgeProps["tone"]>; icon: LucideIcon }
> = {
  draft: { label: "Draft", tone: "neutral", icon: FileEdit },
  pending: { label: "Under review", tone: "warning", icon: Clock },
  approved: { label: "Verified", tone: "success", icon: CheckCircle2 },
  rejected: { label: "Needs changes", tone: "danger", icon: XCircle },
};

export function StatusBadge({
  status,
  size = "md",
  className,
}: {
  status: string;
  size?: BadgeProps["size"];
  className?: string;
}) {
  const config = STATUS_MAP[status] ?? { label: status, tone: "neutral" as const, icon: FileEdit };
  return (
    <Badge tone={config.tone} size={size} icon={config.icon} className={className}>
      {config.label}
    </Badge>
  );
}

/** The trust mark. Only ever rendered for admin-approved profiles. */
export function VerifiedMark({ className }: { className?: string }) {
  return (
    <Badge tone="forest" size="sm" icon={ShieldCheck} className={className}>
      Verified by igaFund
    </Badge>
  );
}
