import { useId, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { passwordStrength } from "@/lib/validation";
import { Input, Label } from "./Field";

const BAR_COLOR = ["bg-sage-300", "bg-clay-500", "bg-amber-500", "bg-forest-500", "bg-forest-700"];
const TEXT_COLOR = ["text-muted", "text-clay-600", "text-amber-700", "text-forest-700", "text-forest-700"];

/** Password input with a strength meter instead of a list of rules. */
export function PasswordField({
  label = "Password",
  value,
  onChange,
  error,
  autoComplete = "new-password",
  showMeter = true,
  required = true,
  id: idProp,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  showMeter?: boolean;
  required?: boolean;
  id?: string;
}) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [visible, setVisible] = useState(false);

  const strength = passwordStrength(value);
  const meterId = `${id}-meter`;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          invalid={Boolean(error)}
          aria-describedby={error ? errorId : showMeter ? meterId : undefined}
          className="pr-12"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-xs text-muted transition-colors hover:bg-forest-50 hover:text-forest-800"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
        </button>
      </div>

      {showMeter && (
        <div id={meterId}>
          <div className="mt-0.5 flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-sage-200">
                <motion.span
                  className={cn("block h-full origin-left rounded-full", BAR_COLOR[strength.score])}
                  initial={false}
                  animate={{ scaleX: strength.score > i ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            ))}
          </div>

          <p className="mt-1.5 text-sm" aria-live="polite">
            <span className={cn("font-medium", TEXT_COLOR[strength.score])}>{strength.label}</span>
            {value && <span className="text-muted"> — {strength.hint}</span>}
          </p>
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-clay-600">
          {error}
        </p>
      )}
    </div>
  );
}
