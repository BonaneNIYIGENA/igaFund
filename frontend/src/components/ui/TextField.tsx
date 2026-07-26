import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

type Props = {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
};

export function TextField({ label, name, type = "text", value, onChange, error, autoComplete, placeholder, required }: Props) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && reveal ? "text" : type;

  return (
    <div className="field">
      <label className="field__label" htmlFor={name}>
        {label}
      </label>
      <div className="field__wrap">
        <input
          id={name}
          name={name}
          className="field__input"
          type={inputType}
          value={value}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? "true" : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            aria-label={reveal ? "Hide password" : "Show password"}
            onClick={() => setReveal((r) => !r)}
          >
            {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="field__error" role="alert">
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </div>
  );
}
