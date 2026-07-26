import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "./AuthContext";
import { AuthLayout } from "./AuthLayout";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { fadeUp } from "../../lib/motion";

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      nav("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue building futures."
      foot={
        <>
          New here?{" "}
          <Link to="/register">
            Create an account <ArrowRight size={12} style={{ verticalAlign: "middle" }} />
          </Link>
        </>
      }
    >
      <form onSubmit={submit} aria-label="login">
        {error && (
          <motion.div className="alert" variants={fadeUp} role="alert">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
        <motion.div variants={fadeUp}>
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            required
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
            required
          />
        </motion.div>
        <motion.div
          variants={fadeUp}
          style={{ textAlign: "right", marginBottom: "var(--space-4)" }}
        >
          <Link
            to="/forgot-password"
            style={{ fontSize: "var(--step--1)" }}
          >
            Forgot password?
          </Link>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Button type="submit" block loading={busy}>
            <LogIn size={18} /> Sign in
          </Button>
        </motion.div>
      </form>
    </AuthLayout>
  );
}
