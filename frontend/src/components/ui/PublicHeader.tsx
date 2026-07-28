import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/app/shell/LanguageToggle";
import { ThemeToggle } from "@/app/shell/ThemeToggle";
import { useAuth, HOME_FOR_ROLE } from "@/features/auth/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";

/** Unified, consistent header across Landing, Browse Students, Help, and all public pages. */
export function PublicHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-360 items-center justify-between gap-6 px-4 py-3.5 sm:px-6">
        {/* Left: Brand Logo */}
        <Link to="/" aria-label="igaFund home" className="shrink-0">
          <Logo size="lg" />
        </Link>

        {/* Middle-Left: Navlinks (Standard layout, NOT centered) */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          <a href="/#how" className="text-sm font-medium text-muted transition-colors hover:text-accent-ink">
            How it works
          </a>
          <Link to={user?.role === "donor" ? "/donor/browse" : "/students"} className="text-sm font-medium text-muted transition-colors hover:text-accent-ink">
            Students
          </Link>
          <Link to="/help" className="text-sm font-medium text-muted transition-colors hover:text-accent-ink">
            Help
          </Link>
        </nav>

        {/* Right: Controls & Auth Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <ThemeToggle />

          {user ? (
            <Button size="sm" asChild>
              <Link to={HOME_FOR_ROLE[user.role]}>Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu Drawer */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="iconSm" className="md:hidden" aria-label="Open menu">
                <Menu aria-hidden />
              </Button>
            </DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Menu</DialogTitle>
              </DialogHeader>
              <nav className="flex flex-col gap-1 p-4 pt-0">
                <a href="/#how" className="rounded-sm px-3 py-3 text-[0.9375rem] hover:bg-sunk">
                  How it works
                </a>
                <Link to={user?.role === "donor" ? "/donor/browse" : "/students"} className="rounded-sm px-3 py-3 text-[0.9375rem] hover:bg-sunk">
                  Browse students
                </Link>
                <Link to="/help" className="rounded-sm px-3 py-3 text-[0.9375rem] hover:bg-sunk">
                  Help
                </Link>
                {!user ? (
                  <Link to="/login" className="rounded-sm px-3 py-3 text-[0.9375rem] hover:bg-sunk">
                    Sign in
                  </Link>
                ) : (
                  <Link to={HOME_FOR_ROLE[user.role]} className="rounded-sm px-3 py-3 text-[0.9375rem] hover:bg-sunk font-medium text-accent-ink">
                    Dashboard
                  </Link>
                )}
              </nav>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
