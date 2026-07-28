import { useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { passwordStrength, passwordChecklist } from "@/lib/validation";
import { Input, Label } from "./Field";

const BAR_COLOR_INCOMPLETE = ["bg-sage-300", "bg-clay-500", "bg-amber-500", "bg-forest-500", "bg-forest-700"];
const BAR_COLOR_COMPLETE = "bg-forest-600";
const TEXT_COLOR = ["text-muted", "text-clay-600", "text-amber-700", "text-forest-700", "text-forest-700"];

const REQUIREMENTS = [
  { key: "hasLength" as const, label: "At least 8 characters" },
  { key: "hasLower" as const, label: "One lowercase letter" },
  { key: "hasUpper" as const, label: "One uppercase letter (A–Z)" },
  { key: "hasDigit" as const, label: "One digit (0–9)" },
  { key: "hasSymbol" as const, label: "One special character (!@#…)" },
] as const;

/** Password input with a strength meter and collapsible requirements checklist. */
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
  /** Server-side errors only. Client validation is handled by the built-in checklist. */
  error?: string;
  autoComplete?: string;
  showMeter?: boolean;
  required?: boolean;
  id?: string;
}) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const strength = passwordStrength(value);
  const checks = passwordChecklist(value);
  const allPassed = checks.hasLength && checks.hasLower && checks.hasUpper && checks.hasDigit && checks.hasSymbol;
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
          {/* Strength bars */}
          <div className="mt-0.5 flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-sage-200">
                <motion.span
                  className={cn(
                    "block h-full origin-left rounded-full",
                    allPassed ? BAR_COLOR_COMPLETE : BAR_COLOR_INCOMPLETE[strength.score],
                  )}
                  initial={false}
                  animate={{
                    scaleX: strength.score > i ? 1 : 0,
                    ...(allPassed && strength.score > i
                      ? { scale: [1, 1.15, 1], transition: { delay: i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
                      : {}),
                  }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            ))}
          </div>

          {/* Strength label */}
          {value && (
            <p className="mt-1.5 text-sm" aria-live="polite">
              <span className={cn("font-medium", allPassed ? "text-forest-700" : TEXT_COLOR[strength.score])}>
                {strength.label}
              </span>
              <span className="text-muted"> — {strength.hint}</span>
            </p>
          )}

          {/* Collapsible requirements checklist */}
          {value && !allPassed && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-forest-700 hover:text-ink transition-colors"
                aria-expanded={expanded}
              >
                <motion.span
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex"
                >
                  <ChevronDown className="size-4" aria-hidden />
                </motion.span>
                Password requirements
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-1.5 rounded-md border border-line bg-raised px-3 py-2.5">
                      {REQUIREMENTS.map((req) => {
                        const met = checks[req.key];
                        return (
                          <li key={req.key} className="flex items-center gap-2 text-sm">
                            <motion.span
                              initial={false}
                              animate={{ scale: met ? [1, 1.3, 1] : 1 }}
                              transition={{ duration: 0.25 }}
                            >
                              {met ? (
                                <Check className="size-4 text-forest-600" aria-hidden />
                              ) : (
                                <X className="size-4 text-sage-400" aria-hidden />
                              )}
                            </motion.span>
                            <span className={met ? "text-forest-700" : "text-muted"}>
                              {req.label}
                            </span>
                          </li>
                        );
                      })}
                    </div>
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Celebration when all pass */}
          <AnimatePresence>
            {allPassed && value && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-2 flex items-center gap-1.5 text-sm font-medium text-forest-700"
              >
                <Check className="size-4" aria-hidden />
                All requirements met
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Server-side error only */}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-clay-600">
          {error}
        </p>
      )}
    </div>
  );
}
