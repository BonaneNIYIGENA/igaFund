import { useState } from "react";
import { cn } from "@/lib/cn";

/** The wordmark. */
export function Logo({
  compact = false,
  inverted = false,
  className,
}: {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {imageFailed ? (
        <svg
          viewBox="0 0 28 28"
          className={cn("size-7 shrink-0", inverted ? "text-forest-100" : "text-forest-700")}
          aria-hidden
        >
          <circle cx="4" cy="14" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M7 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="14" r="4.5" fill="var(--color-amber-500)" />
          <path d="M20.5 14h3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M24 10.5v7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ) : (
        <img
          src="/logo.png"
          alt=""
          width={28}
          height={28}
          className="size-7 shrink-0 rounded-[6px] object-contain"
          onError={() => setImageFailed(true)}
        />
      )}

      {!compact && (
        <span
          className={cn(
            "font-display text-[1.35rem] font-semibold tracking-tight",
            inverted ? "text-white" : "text-forest-900",
          )}
        >
          iga<span className="text-forest-600">Fund</span>
        </span>
      )}
    </span>
  );
}
