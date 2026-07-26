import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, AlertCircle } from "lucide-react";
import { useAuth } from "./AuthContext";
import { AuthLayout } from "./AuthLayout";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { fadeUp } from "../../lib/motion";

export function ResetPassword() {
  const { confirmReset } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await confirmReset(token, password);
      nav("/login");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Pick something strong you'll remember."
      foot={<><Link to="/login">Back to sign in</Link></>}
    >
      <form onSubmit={submit} aria-label="reset-password">
        {!token && (
          <motion.div className="alert" variants={fadeUp} role="alert">
            <AlertCircle size={16} /> This reset link is missing its token. Request a new one.
          </motion.div>
        )}
        {error && (
          <motion.div className="alert" variants={fadeUp} role="alert">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
        <motion.div variants={fadeUp}>
          <TextField label="New password" name="password" type="password" autoComplete="new-password" placeholder="8+ chars, an uppercase, a number, a symbol" value={password} onChange={setPassword} required />
        </motion.div>
        <motion.div variants={fadeUp}>
          <Button type="submit" block loading={busy} disabled={!token}>
            <KeyRound size={18} /> Update password
          </Button>
        </motion.div>
      </form>
    </AuthLayout>
  );
}
