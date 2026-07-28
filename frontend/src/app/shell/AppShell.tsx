import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CircleHelp, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useLocale } from "@/lib/i18n";
import { NAV_BY_ROLE, ROLE_LABEL_KEY } from "./nav";
import { NotificationCenter } from "./NotificationCenter";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { pageTransition } from "@/lib/motion";
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Menu";

/** The signed-in frame for all four roles. */
export function AppShell({
  children,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t } = useLocale();
  if (!user) return null;

  const items = NAV_BY_ROLE[user.role];
  const primary = items.filter((i) => i.primary).slice(0, 5);

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only-focusable absolute left-4 top-4 z-[100] rounded-sm bg-forest-900 px-4 py-2 text-sm font-medium text-white"
      >
        {t("header.skipToContent")}
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-6 py-6">
          <Link to="/" className="inline-flex rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-700">
            <Logo size="lg" />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Main">
          {items.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to !== `/${user.role}` && location.pathname.startsWith(`${item.to}/`));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === `/${user.role}`}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3.5 py-2.5 text-[0.9375rem] font-medium transition-colors duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700",
                  active ? "text-ink" : "text-muted hover:bg-forest-50 hover:text-forest-800",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-md bg-forest-100"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <item.icon className="relative z-10 size-[18px] shrink-0" aria-hidden />
                <span className="relative z-10">{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-md border-2 border-clay-500 bg-clay-100 px-3.5 py-3 text-[0.9375rem] font-bold text-clay-700 transition-colors duration-200 hover:bg-clay-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden />
            {t("header.signOut")}
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
          <div className="flex items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
            <Link to="/" className="lg:hidden" aria-label="igaFund home">
              <Logo compact size="md" />
            </Link>

            <div className="hidden items-center gap-2 lg:flex">
              <ConnectionIndicator />
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <div className="hidden items-center gap-1.5 sm:flex">
                <LanguageToggle />
                <ThemeToggle />
              </div>

              <NotificationCenter />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-forest-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
                    aria-label={t("header.accountMenu")}
                  >
                    <Avatar name={user.full_name} size="sm" />
                    <span className="hidden text-sm font-medium text-ink sm:block">
                      {user.full_name.split(" ")[0]}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t(ROLE_LABEL_KEY[user.role])}</DropdownMenuLabel>
                  <div className="px-3 pb-2">
                    <p className="truncate text-sm font-medium text-ink">{user.full_name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />

                  {/* Theme + language repeated here so they're reachable on narrow screens too. */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 sm:hidden">
                    <LanguageToggle />
                    <ThemeToggle />
                  </div>
                  <DropdownMenuSeparator className="sm:hidden" />

                  <DropdownMenuItem asChild>
                    <Link to={`/${user.role}/settings`}>
                      <UserRound aria-hidden />
                      {t("header.accountSettings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/help">
                      <CircleHelp aria-hidden />
                      {t("header.helpCentre")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={logout}>
                    <LogOut aria-hidden />
                    {t("header.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main
          id="main"
          className="px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:pb-16"
        >
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
                    {description}
                  </p>
                )}
              </div>
              {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
            </div>

            <motion.div
              key={location.pathname}
              variants={pageTransition}
              initial="hidden"
              animate="show"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
        aria-label="Main"
      >
        <ul className="flex pb-[env(safe-area-inset-bottom)]">
          {primary.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to !== `/${user.role}` && location.pathname.startsWith(`${item.to}/`));
            return (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  end={item.to === `/${user.role}`}
                  className={cn(
                    "flex min-h-[3.75rem] flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] font-medium transition-colors",
                    active ? "text-forest-800" : "text-muted",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-7 w-12 place-items-center rounded-full transition-colors duration-200",
                      active && "bg-forest-100",
                    )}
                  >
                    <item.icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="max-w-full truncate">{t(item.labelKey)}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
