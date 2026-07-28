import { useLocale } from "@/lib/i18n";

/** EN | KIN — a plain two-way switch reads faster than a dropdown for two options. */
export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("header.language")}
      className="flex items-center rounded-full border border-line bg-surface p-0.5 text-xs font-semibold"
    >
      {(["en", "rw"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={`cursor-pointer rounded-full px-2.5 py-1.5 transition-colors ${
            locale === code ? "bg-forest-700 text-white" : "text-muted hover:text-forest-800"
          }`}
        >
          {code === "en" ? "EN" : "KIN"}
        </button>
      ))}
    </div>
  );
}
