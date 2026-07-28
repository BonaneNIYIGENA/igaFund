import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";


export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    // The asterisk is drawn, not written, so it stays out of the accessible name.
    className={cn(
      "text-sm font-medium leading-none text-ink",
      required && "after:ml-0.5 after:text-clay-500 after:content-['*']",
      className,
    )}
    {...props}
  >
    {children}
  </LabelPrimitive.Root>
));
Label.displayName = "Label";


const inputBase =
  "w-full bg-surface border rounded-sm px-3.5 text-[0.9375rem] text-body placeholder:text-faint transition-[border-color,box-shadow] duration-200 focus:outline-none focus:border-forest-600 focus:ring-4 focus:ring-forest-100 disabled:bg-sunk disabled:text-muted disabled:cursor-not-allowed";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      inputBase,
      "h-11",
      invalid ? "border-clay-500 focus:border-clay-500 focus:ring-clay-100" : "border-line-strong",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      inputBase,
      "py-3 min-h-28 resize-y leading-relaxed",
      invalid ? "border-clay-500 focus:border-clay-500 focus:ring-clay-100" : "border-line-strong",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <select
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      inputBase,
      "h-11 cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236e8279%22 stroke-width=%222%22 stroke-linecap=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_0.85rem_center] bg-no-repeat pr-10",
      invalid ? "border-clay-500" : "border-line-strong",
      className,
    )}
    {...props}
  />
));
NativeSelect.displayName = "NativeSelect";


let fieldSeq = 0;

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  id: idProp,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; "aria-describedby"?: string; invalid?: boolean }) => React.ReactNode;
  className?: string;
  id?: string;
}) {
  const [fallbackId] = React.useState(() => `field-${++fieldSeq}`);
  const id = idProp ?? fallbackId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({ id, "aria-describedby": describedBy, invalid: Boolean(error) })}
      {/* Errors sit directly below the field they belong to, never only at the top. */}
      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-sm text-clay-600">
          <AlertCircle className="size-4 mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
