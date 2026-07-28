import { useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { COUNTRIES, type Country, stripPhoneInput } from "@/lib/validation";
import { Label } from "./Field";

/** Country code selector plus a digits-only national number. */
export function PhoneField({
  label = "Phone number",
  country,
  digits,
  onCountryChange,
  onDigitsChange,
  error,
  hint,
  required = false,
  id: idProp,
}: {
  label?: string;
  country: Country;
  digits: string;
  onCountryChange: (country: Country) => void;
  onDigitsChange: (digits: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  id?: string;
}) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const helpId = `${id}-help`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      <div
        className={cn(
          "flex overflow-hidden rounded-sm border bg-white transition-[border-color,box-shadow] duration-200",
          "focus-within:border-forest-600 focus-within:ring-4 focus-within:ring-forest-100",
          error ? "border-clay-500 focus-within:ring-clay-100" : "border-line-strong",
        )}
      >
        <select
          value={country.code}
          onChange={(e) => {
            const next = COUNTRIES.find((c) => c.code === e.target.value);
            if (next) onCountryChange(next);
          }}
          aria-label="Country code"
          className="h-11 shrink-0 cursor-pointer border-r border-line bg-sunk pl-3 pr-2 text-sm font-medium text-forest-900 focus:outline-none"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} {c.dial}
            </option>
          ))}
        </select>

        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required={required}
          value={digits}
          maxLength={country.digits}
          placeholder={country.sample}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={helpId}
          onChange={(e) => onDigitsChange(stripPhoneInput(e.target.value))}
          className="figure h-11 min-w-0 flex-1 px-3.5 text-[0.9375rem] text-body placeholder:font-sans placeholder:text-faint focus:outline-none"
        />
      </div>

      <p id={helpId} className={cn("text-sm", error ? "text-clay-600" : "text-muted")}>
        {error ? (
          <span role="alert" className="flex items-start gap-1.5">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </span>
        ) : (
          (hint ?? `${country.digits} digits after ${country.dial}. Numbers only.`)
        )}
      </p>
    </div>
  );
}
