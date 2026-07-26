import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { User, Lock, Bell, Check, Shield } from "lucide-react";
import { StudentLayout } from "./StudentLayout";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../auth/AuthContext";
import { fadeUp } from "../../lib/motion";

export function StudentSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: "+250 788 123 456",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    new_pass: "",
    confirm: "",
  });
  const [notifs, setNotifs] = useState({
    email_funding: true,
    email_verification: true,
    sms_alerts: false,
  });

  const [savedMsg, setSavedMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSavedMsg("Profile settings updated successfully!");
      setTimeout(() => setSavedMsg(""), 3000);
    }, 600);
  }

  function handleSavePassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setPasswords({ current: "", new_pass: "", confirm: "" });
      setSavedMsg("Password updated successfully!");
      setTimeout(() => setSavedMsg(""), 3000);
    }, 600);
  }

  return (
    <StudentLayout>
      <div className="page-header">
        <div className="page-header__eyebrow">
          <Shield size={16} /> Account Security & Preferences
        </div>
        <h1>Settings</h1>
        <p>Manage your account credentials, contact information, and security options.</p>
      </div>

      {savedMsg && (
        <motion.div
          className="alert"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: "var(--success-soft)", borderColor: "rgba(16, 185, 129, 0.3)", color: "var(--emerald)", marginBottom: "var(--space-6)" }}
        >
          <Check size={18} /> {savedMsg}
        </motion.div>
      )}

      <div style={{ display: "grid", gap: "var(--space-6)", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        {/* Personal Details */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show">
          <div className="card__header">
            <h2 className="card__title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <User size={20} color="var(--primary)" /> Profile Info
            </h2>
          </div>
          <form onSubmit={handleSaveProfile}>
            <TextField
              label="Full Name"
              value={profile.full_name}
              onChange={(v) => setProfile({ ...profile, full_name: v })}
            />
            <TextField
              label="Email Address"
              type="email"
              value={profile.email}
              onChange={(v) => setProfile({ ...profile, email: v })}
            />
            <TextField
              label="Phone Number"
              value={profile.phone}
              onChange={(v) => setProfile({ ...profile, phone: v })}
            />
            <Button type="submit" loading={busy} style={{ marginTop: "var(--space-4)" }}>
              Save Profile Changes
            </Button>
          </form>
        </motion.div>

        {/* Change Password */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show">
          <div className="card__header">
            <h2 className="card__title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Lock size={20} color="var(--amber)" /> Change Password
            </h2>
          </div>
          <form onSubmit={handleSavePassword}>
            <TextField
              label="Current Password"
              type="password"
              value={passwords.current}
              onChange={(v) => setPasswords({ ...passwords, current: v })}
              required
            />
            <TextField
              label="New Password"
              type="password"
              value={passwords.new_pass}
              onChange={(v) => setPasswords({ ...passwords, new_pass: v })}
              required
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={passwords.confirm}
              onChange={(v) => setPasswords({ ...passwords, confirm: v })}
              required
            />
            <Button type="submit" variant="secondary" loading={busy} style={{ marginTop: "var(--space-4)" }}>
              Update Password
            </Button>
          </form>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show" style={{ gridColumn: "1 / -1" }}>
          <div className="card__header">
            <h2 className="card__title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Bell size={20} color="var(--primary)" /> Notification Preferences
            </h2>
          </div>
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={notifs.email_funding}
                onChange={(e) => setNotifs({ ...notifs, email_funding: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: "var(--step-0)" }}>Funding Alert Emails</div>
                <div style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)" }}>Receive email notifications whenever a donor contributes to your tuition goal.</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={notifs.email_verification}
                onChange={(e) => setNotifs({ ...notifs, email_verification: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: "var(--step-0)" }}>Admin Review & Verification Updates</div>
                <div style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)" }}>Get instant updates when admins review your documents or approve your profile.</div>
              </div>
            </label>
          </div>
        </motion.div>
      </div>
    </StudentLayout>
  );
}
