import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,color,box-shadow,transform] duration-200 ease-[var(--ease-out-soft)] cursor-pointer select-none disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 active:scale-[0.985] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-forest-700 text-white shadow-sm hover:bg-forest-800 hover:shadow-lift",
        secondary:
          "bg-surface text-ink border border-line hover:bg-sunk hover:border-forest-200",
        soft: "bg-forest-100 text-forest-800 hover:bg-forest-200",
        /** Reserved for money-moving actions — amber means funds in motion. */
        fund: "bg-amber-500 text-forest-950 shadow-sm hover:bg-amber-600 hover:text-white hover:shadow-lift",
        danger: "bg-clay-500 text-white hover:bg-clay-600",
        dangerSoft: "bg-clay-100 text-clay-700 hover:bg-clay-200",
        ghost: "text-forest-800 hover:bg-forest-100",
        link: "text-accent-ink underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-3.5 text-sm rounded-xs [&_svg]:size-4",
        md: "h-11 px-5 text-[0.9375rem] rounded-sm [&_svg]:size-[18px]",
        lg: "h-13 px-7 text-base rounded-md [&_svg]:size-5",
        icon: "h-11 w-11 rounded-sm [&_svg]:size-[18px]",
        iconSm: "h-9 w-9 rounded-xs [&_svg]:size-4",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
