import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useLocale } from "@/lib/i18n";

/** Light/dark toggle. The icon shows the mode you'd switch to, not the current one. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useLocale();
  const goingTo = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("header.theme", { mode: goingTo })}
      title={t("header.theme", { mode: goingTo })}
      className="grid size-11 cursor-pointer place-items-center rounded-sm text-accent-ink transition-colors hover:bg-forest-100 hover:text-forest-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
    >
      {theme === "dark" ? <Sun className="size-[19px]" aria-hidden /> : <Moon className="size-[19px]" aria-hidden />}
    </button>
  );
}
