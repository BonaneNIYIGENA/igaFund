/** Input rules shared by every form. The backend enforces the same rules. */

export const COUNTRIES = [
  { code: "RW", dial: "+250", name: "Rwanda", digits: 9, sample: "788123456" },
  { code: "KE", dial: "+254", name: "Kenya", digits: 9, sample: "712345678" },
  { code: "UG", dial: "+256", name: "Uganda", digits: 9, sample: "712345678" },
  { code: "TZ", dial: "+255", name: "Tanzania", digits: 9, sample: "712345678" },
  { code: "BI", dial: "+257", name: "Burundi", digits: 8, sample: "71234567" },
  { code: "CD", dial: "+243", name: "DR Congo", digits: 9, sample: "812345678" },
  { code: "ET", dial: "+251", name: "Ethiopia", digits: 9, sample: "911234567" },
  { code: "NG", dial: "+234", name: "Nigeria", digits: 10, sample: "8012345678" },
  { code: "GH", dial: "+233", name: "Ghana", digits: 9, sample: "241234567" },
  { code: "ZA", dial: "+27", name: "South Africa", digits: 9, sample: "821234567" },
  { code: "GB", dial: "+44", name: "United Kingdom", digits: 10, sample: "7400123456" },
  { code: "US", dial: "+1", name: "United States", digits: 10, sample: "2025550143" },
] as const;

export type Country = (typeof COUNTRIES)[number];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function countryByDial(dial: string) {
  return COUNTRIES.find((c) => c.dial === dial) ?? DEFAULT_COUNTRY;
}


// Letters, spaces, hyphens and apostrophes only — no digits, no other symbols.
const NAME_RE = /^[\p{L}][\p{L}\s'’-]*[\p{L}]$/u;

export function stripNameInput(value: string) {
  return value.replace(/[^\p{L}\s'’-]/gu, "").replace(/\s{2,}/g, " ").slice(0, 80);
}

export function validateName(value: string, label = "name"): string {
  const v = value.trim();
  if (!v) return `Enter your ${label}.`;
  if (v.length < 2) return `That ${label} is too short.`;
  if (/\d/.test(v)) return `A ${label} can't contain numbers.`;
  if (!NAME_RE.test(v)) return `Use letters only — hyphens and apostrophes are fine.`;
  return "";
}


// Letters, digits, dot, hyphen and underscore, one @, and a letters-only TLD.
const EMAIL_RE = /^[A-Za-z0-9]([A-Za-z0-9._-]*[A-Za-z0-9])?@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function stripEmailInput(value: string) {
  return value.replace(/[^A-Za-z0-9@._-]/g, "").slice(0, 254);
}

export function validateEmail(value: string): string {
  const v = value.trim();
  if (!v) return "Enter your email address.";
  if (!v.includes("@")) return "An email address needs an @.";
  if (/[^A-Za-z0-9@._-]/.test(v)) return "Use letters, numbers, dots, hyphens and underscores only.";
  if ((v.match(/@/g) ?? []).length > 1) return "An email address can only have one @.";
  if (!EMAIL_RE.test(v)) return "That doesn't look like a complete email address.";
  return "";
}


export function stripPhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
}

export function validatePhone(digits: string, country: Country, required = false): string {
  if (!digits) return required ? "Enter a phone number." : "";
  if (/\D/.test(digits)) return "A phone number can only contain digits.";
  if (digits.length !== country.digits) {
    return `A ${country.name} number is ${country.digits} digits after ${country.dial}.`;
  }
  return "";
}

export function composePhone(country: Country, digits: string) {
  return digits ? `${country.dial}${digits}` : "";
}

/** Splits a stored "+250788123456" back into a country and its national digits. */
export function parsePhone(stored: string | null | undefined) {
  if (!stored) return { country: DEFAULT_COUNTRY, digits: "" };
  const cleaned = stored.replace(/[^\d+]/g, "");
  const match = [...COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => cleaned.startsWith(c.dial));
  if (!match) return { country: DEFAULT_COUNTRY, digits: cleaned.replace(/\D/g, "") };
  return { country: match, digits: cleaned.slice(match.dial.length).replace(/\D/g, "") };
}


export const PASSWORD_MIN = 8;

export type PasswordCheck = {
  hasLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
};

/** Returns booleans for each NFR1 composition requirement. */
export function passwordChecklist(password: string): PasswordCheck {
  const v = password ?? "";
  return {
    hasLength: v.length >= PASSWORD_MIN,
    hasLower: /[a-z]/.test(v),
    hasUpper: /[A-Z]/.test(v),
    hasDigit: /\d/.test(v),
    hasSymbol: /[^A-Za-z0-9]/.test(v),
  };
}

export type Strength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hint: string;
  acceptable: boolean;
};

const COMMON = [
  "password", "12345678", "qwerty", "letmein", "welcome", "admin123",
  "iloveyou", "abc12345", "password1", "11111111", "igafund",
];

/** Length first, character variety second — but NFR1 composition is mandatory. */
export function passwordStrength(password: string): Strength {
  const value = password ?? "";

  if (!value) {
    return { score: 0, label: "Enter a password", hint: `At least ${PASSWORD_MIN} characters.`, acceptable: false };
  }

  if (value.length < PASSWORD_MIN) {
    return {
      score: 0,
      label: "Too short",
      hint: `${PASSWORD_MIN - value.length} more character${PASSWORD_MIN - value.length === 1 ? "" : "s"} needed.`,
      acceptable: false,
    };
  }

  const lower = value.toLowerCase();
  if (COMMON.some((c) => lower.includes(c))) {
    return {
      score: 1,
      label: "Too easy to guess",
      hint: "This contains a very common password. Choose something else.",
      acceptable: false,
    };
  }

  if (/^(.)\1+$/.test(value)) {
    return { score: 1, label: "Too easy to guess", hint: "Repeating one character isn't a password.", acceptable: false };
  }

  const checks = passwordChecklist(value);
  const allComposition = checks.hasLength && checks.hasLower && checks.hasUpper && checks.hasDigit && checks.hasSymbol;

  let points = 0;
  if (value.length >= 8) points += 1;
  if (value.length >= 12) points += 1;
  if (value.length >= 16) points += 1;
  if (checks.hasLower && checks.hasUpper) points += 1;
  if (checks.hasDigit) points += 1;
  if (checks.hasSymbol) points += 1;
  if (new Set(value).size >= Math.min(8, value.length)) points += 1;

  const score = Math.min(4, Math.max(1, Math.round((points / 7) * 4))) as 1 | 2 | 3 | 4;

  const meta: Record<number, { label: string; hint: string }> = {
    1: { label: "Weak", hint: "Add a few more characters, or mix in a capital or number." },
    2: { label: "Fair", hint: "This will do. A longer phrase would be safer." },
    3: { label: "Strong", hint: "Good password." },
    4: { label: "Very strong", hint: "Excellent password." },
  };

  // NFR1: all four character classes are mandatory for acceptance.
  return { score, ...meta[score], acceptable: allComposition };
}

export function validatePassword(password: string): string {
  const checks = passwordChecklist(password);
  if (!password) return `At least ${PASSWORD_MIN} characters.`;
  if (password.length < PASSWORD_MIN) return `${PASSWORD_MIN - password.length} more character${PASSWORD_MIN - password.length === 1 ? "" : "s"} needed.`;

  const missing: string[] = [];
  if (!checks.hasUpper) missing.push("an uppercase letter");
  if (!checks.hasLower) missing.push("a lowercase letter");
  if (!checks.hasDigit) missing.push("a digit");
  if (!checks.hasSymbol) missing.push("a special character");
  if (missing.length > 0) return `Add ${missing.join(" and ")}.`;

  const lower = password.toLowerCase();
  if (COMMON.some((c) => lower.includes(c))) return "This contains a common password. Choose something else.";

  return "";
}


/** Drops control characters and angle brackets from long-form text. */
export function sanitizeText(value: string, max = 2000) {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    const isNewline = code === 10;
    if ((code < 32 || code === 127) && !isNewline) continue;
    if (ch === "<" || ch === ">") continue;
    out += ch;
  }
  return out.slice(0, max);
}

export function validateAmount(value: string, { min = 1, label = "amount" } = {}): string {
  const v = value.trim();
  if (!v) return `Enter an ${label}.`;
  if (!/^\d+$/.test(v)) return `Use digits only — no spaces or symbols.`;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min) return `The smallest ${label} is ${min.toLocaleString("en-RW")}.`;
  if (n > 1_000_000_000) return "That amount is unrealistically large.";
  return "";
}
