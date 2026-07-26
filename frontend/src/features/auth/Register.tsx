import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserPlus,
  AlertCircle,
  GraduationCap,
  Users,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { AuthLayout } from "./AuthLayout";
import { TextField } from "../../components/ui/TextField";
import { RoleCard } from "../../components/ui/RoleCard";
import { Button } from "../../components/ui/Button";
import { fadeUp } from "../../lib/motion";

const ROLES = [
  {
    value: "student",
    title: "A student",
    desc: "Build a verified profile and receive funding for your education.",
    icon: GraduationCap,
  },
  {
    value: "donor",
    title: "A donor",
    desc: "Browse verified students and fund their school fees directly.",
    icon: HeartHandshake,
  },
];

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState<{
    email: string;
    full_name: string;
    password: string;
    role: string;
    date_of_birth?: string;
    guardian_name?: string;
    guardian_phone?: string;
  }>({
    email: "",
    full_name: "",
    password: "",
    role: "student",
    date_of_birth: "",
    guardian_name: "",
    guardian_phone: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      nav("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start by telling us how you'll use igaFund."
      foot={
        <>
          Already have an account?{" "}
          <Link to="/login">
            Sign in <ArrowRight size={12} style={{ verticalAlign: "middle" }} />
          </Link>
        </>
      }
    >
      <form onSubmit={submit} aria-label="register">
        {error && (
          <motion.div className="alert" variants={fadeUp} role="alert">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
        <motion.p className="eyebrow" variants={fadeUp}>
          I am…
        </motion.p>
        <motion.div
          className="rolegrid"
          variants={fadeUp}
          role="group"
          aria-label="Choose your role"
        >
          {ROLES.map((r) => (
            <RoleCard
              key={r.value}
              icon={r.icon}
              title={r.title}
              desc={r.desc}
              active={form.role === r.value}
              onSelect={() => update("role", r.value)}
            />
          ))}
        </motion.div>
        <motion.div variants={fadeUp}>
          <TextField
            label="Full name"
            name="full_name"
            autoComplete="name"
            placeholder="Bonane Niyigena"
            value={form.full_name}
            onChange={(v) => update("full_name", v)}
            required
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(v) => update("email", v)}
            required
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="8+ chars, uppercase, number, symbol"
            value={form.password}
            onChange={(v) => update("password", v)}
            required
          />
        </motion.div>
        {form.role === "student" && (
          <>
            <motion.div variants={fadeUp}>
              <TextField
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={form.date_of_birth || ""}
                onChange={(v) => update("date_of_birth", v)}
                required
              />
            </motion.div>
            {form.date_of_birth && (new Date().getFullYear() - new Date(form.date_of_birth).getFullYear()) < 18 && (
              <motion.div
                variants={fadeUp}
                className="card"
                style={{
                  background: "rgba(245, 158, 11, 0.08)",
                  borderColor: "rgba(245, 158, 11, 0.3)",
                  marginBottom: "var(--space-4)",
                  padding: "var(--space-3)",
                }}
              >
                <div style={{ color: "var(--amber)", fontSize: "var(--step--1)", fontWeight: 600, marginBottom: "var(--space-2)" }}>
                  🛡️ Guardian Consent Required (Under 18)
                </div>
                <p style={{ fontSize: "var(--step--2)", color: "var(--on-surface-muted)", marginBottom: "var(--space-3)" }}>
                  Applicants under 18 years of age must provide guardian details and upload a signed guardian consent document in their document vault.
                </p>
                <TextField
                  label="Guardian Full Name"
                  name="guardian_name"
                  placeholder="Parent or Legal Guardian Name"
                  value={form.guardian_name || ""}
                  onChange={(v) => update("guardian_name", v)}
                  required
                />
                <TextField
                  label="Guardian Phone Number"
                  name="guardian_phone"
                  placeholder="+250 78X XXX XXX"
                  value={form.guardian_phone || ""}
                  onChange={(v) => update("guardian_phone", v)}
                  required
                />
              </motion.div>
            )}
          </>
        )}
        <motion.div variants={fadeUp}>
          <Button type="submit" block loading={busy}>
            <UserPlus size={18} /> Create account
          </Button>
        </motion.div>
      </form>
    </AuthLayout>
  );
}
