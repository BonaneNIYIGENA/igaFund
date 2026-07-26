import { motion } from "framer-motion";
import {
  LogOut,
  GraduationCap,
  Users,
  HeartHandshake,
  ShieldCheck,
  LucideIcon,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { Button } from "../components/ui/Button";
import { stagger, fadeUp } from "../lib/motion";

const ROLE_MAP: Record<
  string,
  { icon: LucideIcon; label: string; next: string; color: string }
> = {
  student: {
    icon: GraduationCap,
    label: "Student",
    next: "Complete your profile and add your documents to get verified.",
    color: "var(--primary)",
  },
  ambassador: {
    icon: Users,
    label: "Ambassador",
    next: "Enroll a student from your community to submit for review.",
    color: "var(--amber)",
  },
  donor: {
    icon: HeartHandshake,
    label: "Donor",
    next: "Browse verified students and fund a tuition goal.",
    color: "var(--clay)",
  },
  admin: {
    icon: ShieldCheck,
    label: "Administrator",
    next: "Review pending student profiles awaiting verification.",
    color: "var(--sage)",
  },
};

export function Dashboard() {
  const { user, logout } = useAuth();
  const role = ROLE_MAP[user?.role ?? "donor"] ?? ROLE_MAP.donor;
  const Icon = role.icon;
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <motion.main
      style={{ maxWidth: "60rem", margin: "0 auto", padding: "var(--space-5) var(--space-4) var(--space-8)" }}
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.header
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "var(--space-5)", borderBottom: "1px solid var(--border)" }}
        variants={fadeUp}
      >
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--step-1)", letterSpacing: "-0.03em" }}>
          iga<span style={{ color: "var(--primary)" }}>Fund</span>
        </div>
        <Button variant="ghost" onClick={logout}>
          <LogOut size={16} /> Sign out
        </Button>
      </motion.header>

      <motion.div style={{ padding: "var(--space-6) 0 var(--space-5)" }} variants={fadeUp}>
        <span className="badge badge--approved" style={{ marginBottom: "var(--space-3)", display: "inline-flex" }}>
          <Icon size={14} /> {role.label}
        </span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-4)", marginTop: "var(--space-3)" }}>
          Hello, {firstName}.
        </h1>
        <p style={{ color: "var(--on-surface-muted)", maxWidth: "44ch", marginTop: "var(--space-2)" }}>
          {role.next}
        </p>
      </motion.div>

      <motion.section
        style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "1fr" }}
        variants={fadeUp}
        aria-label="Next steps"
      >
        <article className="card">
          <h2 className="card__title">What's next</h2>
          <p style={{ color: "var(--on-surface-muted)", marginTop: "var(--space-2)" }}>
            The {role.label.toLowerCase()} dashboard is coming soon. Profile, document, and funding workflows are being built.
          </p>
        </article>
        <article className="card" style={{ background: "var(--surface-sunk)", boxShadow: "none" }}>
          <h2 className="card__title">Your account</h2>
          <p className="tabular" style={{ color: "var(--on-surface-muted)", marginTop: "var(--space-2)" }}>
            {user?.email}
          </p>
        </article>
      </motion.section>
    </motion.main>
  );
}
