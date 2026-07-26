import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, AlertCircle, MailCheck } from "lucide-react";
import { useAuth } from "./AuthContext";
import { AuthLayout } from "./AuthLayout";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { fadeUp } from "../../lib/motion";

export function ForgotPassword() {
  const { requestReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await requestReset(email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send a reset link to your email."
      foot={<><Link to="/login">Back to sign in</Link></>}
    >
      {sent ? (
        <motion.div className="notice" variants={fadeUp}>
          <p style={{ margin: 0, display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <MailCheck size={18} /> If that email exists, a reset link is on its way.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={submit} aria-label="forgot-password">
          {error && (
            <motion.div className="alert" variants={fadeUp} role="alert">
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}
          <motion.div variants={fadeUp}>
            <TextField label="Email" name="email" type="email" autoComplete="email" value={email} onChange={setEmail} required />
          </motion.div>
          <motion.div variants={fadeUp}>
            <Button type="submit" block loading={busy}>
              <Send size={18} /> Send reset link
            </Button>
          </motion.div>
        </form>
      )}
    </AuthLayout>
  );
}
