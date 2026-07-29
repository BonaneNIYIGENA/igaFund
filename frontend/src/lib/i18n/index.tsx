import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DICTIONARIES, type Locale, type TranslationKey } from "./dictionaries";

const STORAGE_KEY = "iga-locale";

export type TranslateFn = (key: TranslationKey, vars?: Record<string, string>) => string;

type LocaleValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  t: TranslateFn;
};

const LocaleContext = createContext<LocaleValue | null>(null);

function interpolate(template: string, vars?: Record<string, string>) {
  if (!vars) return template;
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), v), template);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "rw" ? "rw" : "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(l: Locale) {
    setLocaleState(l);
  }

  function toggle() {
    setLocaleState((l) => (l === "en" ? "rw" : "en"));
  }

  function t(key: TranslationKey, vars?: Record<string, string>) {
    const dict = DICTIONARIES[locale];
    return interpolate(dict[key] ?? DICTIONARIES.en[key] ?? key, vars);
  }

  return <LocaleContext.Provider value={{ locale, setLocale, toggle, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
