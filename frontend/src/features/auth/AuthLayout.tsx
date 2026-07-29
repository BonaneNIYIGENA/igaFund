import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, HeartHandshake, Receipt, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { RoutingRail, type RailStep } from "@/components/ui/RoutingRail";
import { useLocale } from "@/lib/i18n";

import { LanguageToggle } from "@/app/shell/LanguageToggle";
import { ThemeToggle } from "@/app/shell/ThemeToggle";

/** Two-panel auth frame. */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useLocale();

  const promise: RailStep[] = [
    { key: "give", label: t("authLayout.step.give"), icon: HeartHandshake, state: "done" },
    { key: "verify", label: t("authLayout.step.verify"), icon: ShieldCheck, state: "done" },
    { key: "school", label: t("authLayout.step.school"), icon: Building2, state: "done" },
    { key: "receipt", label: t("authLayout.step.receipt"), icon: Receipt, state: "done" },
  ];

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[1fr_1.1fr]">
      <aside className="grain relative hidden flex-col justify-between bg-forest-900 p-12 text-forest-100 lg:flex">
        <Link to="/" className="relative z-10 w-fit">
          <Logo inverted />
        </Link>

        <div className="relative z-10">
          <h2 className="max-w-md font-display text-4xl leading-tight tracking-tight text-white">
            {t("authLayout.headline")}
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-forest-200">
            {t("authLayout.description")}
          </p>

          <div className="mt-10 rounded-xl border border-forest-800 bg-forest-950/40 p-6 [&_li_p]:text-forest-100">
            <RoutingRail steps={promise} />
          </div>
        </div>

        <p className="relative z-10 text-sm text-forest-400">
          {t("authLayout.footer")}
        </p>
      </aside>

      <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-6 lg:px-12 lg:py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link to="/" className="w-fit lg:hidden">
            <Logo />
          </Link>
          <div className="flex items-center gap-2.5 ml-auto">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center"
        >
          <h1 className="font-display text-3xl tracking-tight sm:text-[2rem]">{title}</h1>
          <p className="mt-2.5 leading-relaxed text-muted">{description}</p>

          <div className="mt-8">{children}</div>

          {footer && (
            <div className="mt-8 border-t border-line pt-6 text-center text-[0.9375rem] text-muted">
              {footer}
            </div>
          )}
        </motion.main>
      </div>
    </div>
  );
}
