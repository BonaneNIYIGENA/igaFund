import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/** Right-hand detail panel. */

export const SidePanel = DialogPrimitive.Root;
export const SidePanelTrigger = DialogPrimitive.Trigger;
export const SidePanelClose = DialogPrimitive.Close;

export const SidePanelContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { width?: "half" | "wide" }
>(({ className, children, width = "half", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="anim-overlay fixed inset-0 z-50 bg-forest-950/35 backdrop-blur-md" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "anim-drawer fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-canvas shadow-xl outline-none",
        width === "half" ? "md:w-[55vw] lg:w-1/2" : "md:w-[70vw] lg:w-[62%]",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/80 text-muted shadow-sm backdrop-blur transition-colors hover:bg-forest-100 hover:text-forest-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
        aria-label="Close panel"
      >
        <X className="size-[18px]" aria-hidden />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SidePanelContent.displayName = "SidePanelContent";

export function SidePanelHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shrink-0 border-b border-line bg-white px-6 py-5 pr-16 sm:px-8",
        className,
      )}
      {...props}
    />
  );
}

export function SidePanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto px-6 py-6 sm:px-8", className)} {...props} />;
}

export function SidePanelFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-line bg-white px-6 py-4 sm:px-8",
        "flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end",
        "pb-[max(1rem,env(safe-area-inset-bottom))]",
        className,
      )}
      {...props}
    />
  );
}

export const SidePanelTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("font-display text-2xl font-semibold tracking-tight text-ink", className)}
    {...props}
  />
));
SidePanelTitle.displayName = "SidePanelTitle";

export const SidePanelDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("mt-1.5 text-[0.9375rem] leading-relaxed text-muted", className)}
    {...props}
  />
));
SidePanelDescription.displayName = "SidePanelDescription";
