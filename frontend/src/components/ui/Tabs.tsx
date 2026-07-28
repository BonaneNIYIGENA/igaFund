import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Scrolls rather than wraps on narrow screens; no horizontal page scroll.
      "flex gap-1 overflow-x-auto rounded-md bg-sunk p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { count?: number }
>(({ className, children, count, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-sm px-3.5 py-2 text-sm font-medium text-muted transition-colors duration-200",
      "hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700",
      "data-[state=active]:text-ink",
      "[&_svg]:size-4 [&_svg]:shrink-0",
      className,
    )}
    {...props}
  >
    <span className="relative z-10 inline-flex items-center gap-2">
      {children}
      {count !== undefined && count > 0 && (
        <span className="figure rounded-full bg-amber-100 px-1.5 py-px text-xs font-semibold text-amber-700">
          {count}
        </span>
      )}
    </span>
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-6 focus-visible:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

/** Underlined tab bar for page-level sections. */
export function UnderlineTabs({
  tabs,
  value,
  onValueChange,
  layoutId = "tab-indicator",
  className,
}: {
  tabs: { value: string; label: string; count?: number }[];
  value: string;
  onValueChange: (v: string) => void;
  layoutId?: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              "relative shrink-0 cursor-pointer px-4 py-3 text-sm font-medium transition-colors duration-200",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700",
              active ? "text-ink" : "text-muted hover:text-accent-ink",
            )}
          >
            <span className="inline-flex items-center gap-2">
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "figure rounded-full px-1.5 py-px text-xs font-semibold",
                    active ? "bg-forest-100 text-forest-800" : "bg-sage-100 text-sage-700",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-forest-700"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
