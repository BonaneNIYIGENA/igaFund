import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, HeartHandshake, Receipt, ShieldCheck, Wallet } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { RoutingRail, type RailStep } from "@/components/ui/RoutingRail";

const PROMISE: RailStep[] = [
  { key: "give", label: "A donor gives", icon: HeartHandshake, state: "done" },
  { key: "verify", label: "igaFund verifies the student", icon: ShieldCheck, state: "done" },
  { key: "wallet", label: "A personal wallet", detail: "Never touched", icon: Wallet, state: "bypassed" },
  { key: "school", label: "The school is paid directly", icon: Building2, state: "done" },
  { key: "receipt", label: "Both sides keep a receipt", icon: Receipt, state: "done" },
];

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
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[1fr_1.1fr]">
      <aside className="grain relative hidden flex-col justify-between bg-forest-900 p-12 text-forest-100 lg:flex">
        <Link to="/" className="relative z-10 w-fit">
          <Logo inverted />
        </Link>

        <div className="relative z-10">
          <h2 className="max-w-md font-display text-4xl leading-tight tracking-tight text-white">
            School fees that reach the school.
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-forest-200">
            Every profile is verified by a person, and every contribution is paid to a registered
            institution — never to an individual.
          </p>

          <div className="mt-10 rounded-xl border border-forest-800 bg-forest-950/40 p-6 [&_li_p]:text-forest-100">
            <RoutingRail steps={PROMISE} />
          </div>
        </div>

        <p className="relative z-10 text-sm text-forest-400">
          Piloting in Rwanda · Compliant with the Data Protection and Privacy Law
        </p>
      </aside>

      <div className="flex min-h-dvh flex-col px-4 py-8 sm:px-6 lg:px-0 lg:py-12">
        <Link to="/" className="mb-10 w-fit lg:hidden">
          <Logo />
        </Link>

        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center"
        >
          <h1 className="font-display text-3xl tracking-tight sm:text-[2rem]">{title}</h1>
          <p className="mt-2.5 leading-relaxed text-muted">{description}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 text-[0.9375rem] text-muted">{footer}</div>}
        </motion.main>
      </div>
    </div>
  );
}
