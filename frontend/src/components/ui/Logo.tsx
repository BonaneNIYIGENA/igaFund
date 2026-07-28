import { useState } from "react";
import { cn } from "@/lib/cn";

/** The igaFund brand logo – graduation-cap mark + optional wordmark. */
export function Logo({
  compact = false,
  inverted = false,
  size = "md",
  className,
}: {
  compact?: boolean;
  inverted?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  // Larger icon sizes so the mark is actually visible
  const iconSizes: Record<string, string> = {
    sm: "size-8",
    md: "size-11",
    lg: "size-14",
    xl: "size-20",
  };

  const textSizes: Record<string, string> = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  return (
    <span className={cn("inline-flex items-center gap-2 select-none", className)}>
      {imageFailed ? (
        /* Fallback SVG if image fails to load */
        <svg
          viewBox="0 0 40 40"
          className={cn(iconSizes[size], "shrink-0", inverted ? "text-forest-100" : "text-accent-ink")}
          aria-hidden
        >
          <text x="4" y="30" fontSize="32" fontWeight="bold" fill="currentColor">iF</text>
        </svg>
      ) : (
        <img
          src="/logo.png"
          alt="igaFund logo"
          className={cn(iconSizes[size], "shrink-0 object-contain rounded-xl bg-white shadow-sm")}
          onError={() => setImageFailed(true)}
        />
      )}

      {!compact && (
        <span
          className={cn(
            "font-display font-bold tracking-tight leading-none",
            textSizes[size],
            inverted ? "text-white" : "text-ink",
          )}
        >
          iga<span className={inverted ? "text-forest-200" : "text-accent-ink"}>Fund</span>
        </span>
      )}
    </span>
  );
}
