import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  GraduationCap,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  LogOut,
  X,
  Send,
  FileText,
  Search,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { api, Profile } from "../../lib/api";
import { stagger, fadeUp } from "../../lib/motion";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";

export function AmbassadorDashboard() {
  const { user, logout } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [institutions, setInstitutions] = useState<Array<{ id: number; name: string; location: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    on_behalf_of_name: "",
    on_behalf_of_email: "",
    on_behalf_of_password: "TempPassword123!",
    date_of_birth: "",
    phone: "",
    institution_id: "",
    academic_level: "S6",
    field_of_study: "",
    funding_goal: "500000",
    bio: "",
    guardian_name: "",
    guardian_phone: "",
    guardian_consent: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, instRes] = await Promise.all([
        api("/profiles/"),
        api("/profiles/institutions").catch(() => ({ institutions: [] })),
      ]);
      setProfiles(pRes.profiles ?? []);
      setInstitutions(instRes.institutions ?? []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  function update(key: string, val: any) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        institution_id: form.institution_id ? parseInt(form.institution_id, 10) : undefined,
        funding_goal: parseFloat(form.funding_goal) || 0,
      };

      await api("/profiles/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess(`Student ${form.on_behalf_of_name} successfully enrolled!`);
      setForm({
        on_behalf_of_name: "",
        on_behalf_of_email: "",
        on_behalf_of_password: "TempPassword123!",
        date_of_birth: "",
        phone: "",
        institution_id: "",
        academic_level: "S6",
        field_of_study: "",
        funding_goal: "500000",
        bio: "",
        guardian_name: "",
        guardian_phone: "",
        guardian_consent: true,
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell" style={{ minHeight: "100vh", background: "var(--surface-sunk)" }}>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "var(--space-6) var(--space-4) var(--space-10)", width: "100%" }}>
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--space-4)" }}>
          <div className="sidebar__brand" style={{ padding: 0, border: 0 }}>
            iga<span>Fund</span> <span style={{ fontSize: "var(--step--1)", color: "var(--amber)", fontWeight: 600, marginLeft: "var(--space-2)" }}>| Ambassador Console</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <span style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)" }}>
              Ambassador: <b>{user?.full_name}</b>
            </span>
            <Button variant="ghost" onClick={logout} className="btn--sm">
              <LogOut size={14} /> Sign out
            </Button>
          </div>
        </header>

        {/* Hero banner */}
        <div className="card" style={{ marginBottom: "var(--space-6)", background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(16,185,129,0.08) 100%)", borderColor: "rgba(245,158,11,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
            <div>
              <h1 style={{ fontSize: "var(--step-2)", marginBottom: "var(--space-2)" }}>Community Student Enrollment</h1>
              <p style={{ color: "var(--on-surface-muted)", maxWidth: "55ch" }}>
                As a verified Ambassador, you can enroll underprivileged students in your local community who lack direct internet access and submit their applications for verification.
              </p>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <UserPlus size={16} /> Enroll New Student
            </Button>
          </div>
        </div>

        {/* Enrollee roster */}
        <h2 style={{ fontSize: "var(--step-1)", marginBottom: "var(--space-4)" }}>Enrolled Students Roster ({profiles.length})</h2>

        {loading ? (
          <div className="empty-state">
            <div className="btn__spinner" style={{ width: 32, height: 32, margin: "0 auto" }} />
          </div>
        ) : profiles.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state__icon">
              <Users size={28} />
            </div>
            <h3>No enrolled students yet</h3>
            <p>Click "Enroll New Student" to assist a student in your community.</p>
          </div>
        ) : (
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
            {profiles.map((p) => (
              <div key={p.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
                  <div>
                    <h3 style={{ fontSize: "var(--step-1)" }}>{p.full_name}</h3>
                    <div style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)" }}>{p.academic_level} • {p.institution?.name ?? "Unassigned"}</div>
                  </div>
                  <span className={`badge badge--${p.status}`}>{p.status}</span>
                </div>
                <p style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", marginBottom: "var(--space-3)", lineClamp: 2, WebkitLineClamp: 2, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>
                  {p.bio || "No bio entered."}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--step--1)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border)" }}>
                  <span>Goal: <b>{p.funding_goal.toLocaleString()} RWF</b></span>
                  <span style={{ color: "var(--emerald)" }}>Raised: <b>{(p.funded_amount ?? 0).toLocaleString()} RWF</b></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enroll Student Modal */}
        <AnimatePresence>
          {showForm && (
            <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "grid", placeItems: "center", padding: "var(--space-4)", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
              <motion.div
                className="card"
                style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", position: "relative" }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <button
                  onClick={() => setShowForm(false)}
                  style={{ position: "absolute", right: 16, top: 16, border: 0, background: "transparent", color: "var(--on-surface-muted)", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>

                <h2 style={{ fontSize: "var(--step-2)", marginBottom: "var(--space-4)" }}>Enroll Student (Ambassador Assisted)</h2>

                {error && (
                  <div className="alert" style={{ marginBottom: "var(--space-4)" }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <form onSubmit={handleEnroll}>
                  <div className="form-row form-row--2">
                    <TextField
                      label="Student Full Name"
                      name="on_behalf_of_name"
                      placeholder="e.g. Jean Damascene"
                      value={form.on_behalf_of_name}
                      onChange={(v) => update("on_behalf_of_name", v)}
                      required
                    />
                    <TextField
                      label="Student Email Address"
                      name="on_behalf_of_email"
                      type="email"
                      placeholder="student@example.com"
                      value={form.on_behalf_of_email}
                      onChange={(v) => update("on_behalf_of_email", v)}
                      required
                    />
                  </div>

                  <div className="form-row form-row--2">
                    <TextField
                      label="Date of Birth"
                      name="date_of_birth"
                      type="date"
                      value={form.date_of_birth}
                      onChange={(v) => update("date_of_birth", v)}
                      required
                    />
                    <TextField
                      label="Student Phone"
                      name="phone"
                      type="tel"
                      placeholder="+250 7XX XXX XXX"
                      value={form.phone}
                      onChange={(v) => update("phone", v)}
                    />
                  </div>

                  <div className="form-row form-row--2">
                    <div className="field">
                      <label className="field__label" htmlFor="institution_id">Educational Institution</label>
                      <select
                        id="institution_id"
                        className="field__select"
                        value={form.institution_id}
                        onChange={(e) => update("institution_id", e.target.value)}
                      >
                        <option value="">Select Institution</option>
                        {institutions.map((i) => (
                          <option key={i.id} value={i.id}>{i.name} ({i.location})</option>
                        ))}
                      </select>
                    </div>
                    <TextField
                      label="Funding Goal (RWF)"
                      name="funding_goal"
                      type="number"
                      value={form.funding_goal}
                      onChange={(v) => update("funding_goal", v)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="field__label" htmlFor="bio">Student Bio & Story</label>
                    <textarea
                      id="bio"
                      className="field__textarea"
                      placeholder="Share details about the student's background and educational aspirations..."
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div style={{ padding: "var(--space-4)", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius)", marginBottom: "var(--space-5)" }}>
                    <h4 style={{ fontSize: "var(--step-0)", marginBottom: "var(--space-3)" }}>Guardian Details</h4>
                    <div className="form-row form-row--2">
                      <TextField
                        label="Guardian Name"
                        name="guardian_name"
                        value={form.guardian_name}
                        onChange={(v) => update("guardian_name", v)}
                      />
                      <TextField
                        label="Guardian Phone"
                        name="guardian_phone"
                        value={form.guardian_phone}
                        onChange={(v) => update("guardian_phone", v)}
                      />
                    </div>
                  </div>

                  <Button type="submit" block loading={submitting}>
                    <UserPlus size={16} /> Enroll & Create Student Profile
                  </Button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
