import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartHandshake,
  Search,
  Filter,
  GraduationCap,
  Building2,
  Heart,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Video,
  ShieldCheck,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { api, Profile, ContributionItem } from "../../lib/api";
import { stagger, fadeUp } from "../../lib/motion";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { TicketsView } from "../../components/TicketsView";

export function DonorDashboard() {
  const { user, logout } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [myContributions, setMyContributions] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"browse" | "my" | "tickets">("browse");

  // modal state
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [profileContributions, setProfileContributions] = useState<ContributionItem[]>([]);
  const [contributeAmount, setContributeAmount] = useState("25000");
  const [contributeMessage, setContributeMessage] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfiles();
    loadMyContributions();
  }, []);

  async function loadMyContributions() {
    try {
      const res = await api("/contributions/my");
      setMyContributions(res.contributions ?? []);
    } catch (e) {}
  }

  async function loadProfiles() {
    setLoading(true);
    try {
      const res = await api("/profiles/public");
      setProfiles(res.profiles ?? []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  async function openProfile(p: Profile) {
    setSelectedProfile(p);
    setError("");
    setSuccess("");
    try {
      const cRes = await api(`/contributions/profile/${p.id}`);
      setProfileContributions(cRes.contributions ?? []);
    } catch (e) {
      setProfileContributions([]);
    }
  }

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProfile) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount < 1000) {
      setError("Minimum contribution is 1,000 RWF.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await api("/contributions/", {
        method: "POST",
        body: JSON.stringify({
          profile_id: selectedProfile.id,
          amount,
          message: contributeMessage,
          is_anonymous: isAnonymous,
          proof_image_url: proofImageUrl,
        }),
      });

      setSuccess(`Thank you! Your contribution of ${amount.toLocaleString()} RWF has been routed directly to ${selectedProfile.institution?.name ?? "the school"}. Process Ticket #${res.contribution?.ticket_number ?? "issued"}`);
      setContributeMessage("");
      setProofImageUrl("");
      loadMyContributions();
      
      // Refresh selected profile funded amount locally
      setSelectedProfile((prev) => prev ? { ...prev, funded_amount: res.funded_amount } : null);
      
      // Refresh list of contributions
      const cRes = await api(`/contributions/profile/${selectedProfile.id}`);
      setProfileContributions(cRes.contributions ?? []);

      // Refresh public directory
      loadProfiles();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredProfiles = profiles.filter((p) => {
    const matchSearch =
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.field_of_study?.toLowerCase().includes(search.toLowerCase()) ||
      p.institution?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.bio?.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === "all" || p.academic_level === levelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <div className="shell" style={{ minHeight: "100vh", background: "var(--surface-sunk)" }}>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "var(--space-6) var(--space-4) var(--space-10)", width: "100%" }}>
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--space-4)" }}>
          <div className="sidebar__brand" style={{ padding: 0, border: 0 }}>
            iga<span>Fund</span> <span style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", fontWeight: 400, marginLeft: "var(--space-2)" }}>| Donor Portal</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <span style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)" }}>
              Welcome, <b>{user?.full_name}</b>
            </span>
            <Button variant="ghost" onClick={logout} className="btn--sm">
              <LogOut size={14} /> Sign out
            </Button>
          </div>
        </header>

        {/* Hero banner */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: "var(--space-6)", background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.08) 100%)", borderColor: "rgba(16,185,129,0.2)" }}>
          <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--grad-primary)", color: "#fff", display: "grid", placeItems: "center", flex: "none" }}>
              <HeartHandshake size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: "var(--step-2)", marginBottom: "var(--space-2)" }}>Verified Student Funding Directory</h1>
              <p style={{ color: "var(--on-surface-muted)", maxWidth: "60ch" }}>
                Browse verified underprivileged students in Rwanda. <b>100% of your contribution</b> is transferred directly to the student's verified institution — never a personal wallet.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-5)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--space-2)" }}>
          <button
            className={`btn btn--sm ${activeTab === "browse" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setActiveTab("browse")}
          >
            <Search size={14} /> Browse Verified Students ({filteredProfiles.length})
          </button>
          <button
            className={`btn btn--sm ${activeTab === "my" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setActiveTab("my")}
          >
            <Heart size={14} /> My Contributions & Proofs ({myContributions.length})
          </button>
          <button
            className={`btn btn--sm ${activeTab === "tickets" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setActiveTab("tickets")}
          >
            <ShieldCheck size={14} /> Process Tickets & Receipts
          </button>
        </div>

        {activeTab === "tickets" && <TicketsView />}

        {activeTab === "my" && (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {myContributions.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "var(--space-6)" }}>
                <Heart size={32} style={{ color: "var(--text-subtle)", marginBottom: "var(--space-2)" }} />
                <h3>No Contributions Made Yet</h3>
                <p style={{ color: "var(--text-subtle)" }}>Browse verified students to contribute directly to their educational institutions.</p>
              </div>
            ) : (
              myContributions.map((c) => (
                <div key={c.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "var(--step-0)" }}>Funded {c.student_name ?? "Student"}</h4>
                      <div style={{ fontSize: "var(--step--1)", color: "var(--text-subtle)", marginTop: 2 }}>
                        Routed to: <strong>{c.institution?.name ?? "Partner School"}</strong> ({c.institution?.location ?? "Rwanda"})
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)", marginTop: 2 }}>
                        Receipt Ref: <span style={{ fontFamily: "monospace" }}>{c.receipt_ref}</span> | Ticket #: <span style={{ fontFamily: "monospace" }}>{c.ticket_number ?? "TICK-DON"}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "var(--step-1)", fontWeight: 700, color: "var(--pine)" }}>
                        +{c.amount.toLocaleString()} RWF
                      </span>
                      <div style={{ fontSize: "var(--step--2)", color: "var(--text-subtle)", marginTop: 2 }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}
                      </div>
                    </div>
                  </div>

                  {c.proof_image_url && (
                    <div style={{ marginTop: "var(--space-3)", padding: "var(--space-3)", background: "var(--surface-sunken)", borderRadius: 6, display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <span style={{ fontSize: "var(--step--1)", color: "var(--text-subtle)" }}>Uploaded Proof of Payment:</span>
                      <a href={c.proof_image_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--step--1)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        View Slip Evidence Image ↗
                      </a>
                    </div>
                  )}

                  {c.message && (
                    <div style={{ marginTop: "var(--space-2)", fontSize: "var(--step--1)", fontStyle: "italic", color: "var(--text-main)" }}>
                      "{c.message}"
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "browse" && (
          <>
            {/* Filter bar */}
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-6)" }}>
          <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 14, top: 15, color: "var(--on-surface-faint)" }} />
            <input
              className="field__input"
              style={{ paddingLeft: 42 }}
              placeholder="Search by student, field of study, school..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="field__select"
            style={{ width: "auto", minWidth: 180 }}
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="all">All Academic Levels</option>
            <option value="S1">Senior 1</option>
            <option value="S2">Senior 2</option>
            <option value="S3">Senior 3</option>
            <option value="S4">Senior 4</option>
            <option value="S5">Senior 5</option>
            <option value="S6">Senior 6</option>
            <option value="Year 1">University Year 1</option>
            <option value="Year 2">University Year 2</option>
            <option value="Year 3">University Year 3</option>
            <option value="Year 4">University Year 4</option>
            <option value="TVET">TVET</option>
          </select>
        </div>

        {/* Student profiles grid */}
        {loading ? (
          <div className="empty-state">
            <div className="btn__spinner" style={{ width: 32, height: 32, margin: "0 auto" }} />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state__icon">
              <GraduationCap size={28} />
            </div>
            <h3>No verified profiles found</h3>
            <p>No student profiles match your search criteria. Check back soon!</p>
          </div>
        ) : (
          <motion.div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-5)" }} variants={stagger} initial="hidden" animate="show">
            {filteredProfiles.map((p) => {
              const percent = Math.round(((p.funded_amount ?? 0) / Math.max(p.funding_goal, 1)) * 100);
              return (
                <motion.div key={p.id} className="card" variants={fadeUp} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
                      <div>
                        <span className="badge badge--approved" style={{ marginBottom: "var(--space-1)" }}>
                          <ShieldCheck size={12} /> Verified
                        </span>
                        <h3 style={{ fontSize: "var(--step-1)", marginTop: 4 }}>{p.full_name}</h3>
                      </div>
                      <span className="badge badge--draft" style={{ fontFamily: "var(--font-mono)" }}>
                        {p.academic_level ?? "Student"}
                      </span>
                    </div>

                    <div style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Building2 size={14} style={{ color: "var(--emerald)" }} />
                      <span>{p.institution ? `${p.institution.name} (${p.institution.location})` : "Verified Institution"}</span>
                    </div>

                    <p style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", lineHeight: 1.5, marginBottom: "var(--space-4)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.bio || "No biography provided."}
                    </p>

                    {/* Intro video badge if adult & consented */}
                    {p.video_url && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "var(--step--2)", color: "var(--teal)", background: "rgba(6,182,212,0.1)", padding: "2px 8px", borderRadius: 4, marginBottom: "var(--space-3)" }}>
                        <Video size={12} /> Intro video available
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Funding progress */}
                    <div style={{ marginBottom: "var(--space-3)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--step--1)", marginBottom: 4 }}>
                        <span style={{ color: "var(--on-surface-muted)" }}>Progress</span>
                        <span style={{ fontWeight: 700 }} className="tabular">{percent}% ({ (p.funded_amount ?? 0).toLocaleString() } RWF)</span>
                      </div>
                      <div className="progress">
                        <div className="progress__bar" style={{ width: `${Math.min(100, percent)}%` }} />
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
        </>
        )}
      </main>

      {/* Profile Detail & Contribution Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "grid", placeItems: "center", padding: "var(--space-4)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
            <motion.div
              className="card"
              style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", position: "relative", border: "1px solid var(--border-strong)" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <button
                onClick={() => setSelectedProfile(null)}
                style={{ position: "absolute", right: 16, top: 16, border: 0, background: "transparent", color: "var(--on-surface-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--grad-primary)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>
                  {selectedProfile.full_name?.[0] ?? "S"}
                </div>
                <div>
                  <h2 style={{ fontSize: "var(--step-2)" }}>{selectedProfile.full_name}</h2>
                  <div style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                    <span>{selectedProfile.academic_level} {selectedProfile.field_of_study ? `• ${selectedProfile.field_of_study}` : ""}</span>
                    <span>• {selectedProfile.institution?.name}</span>
                  </div>
                </div>
              </div>

              {/* Video introduction if available */}
              {selectedProfile.video_url && (
                <div style={{ marginBottom: "var(--space-5)", padding: "var(--space-4)", background: "rgba(6,182,212,0.08)", borderRadius: "var(--radius)", border: "1px solid rgba(6,182,212,0.2)" }}>
                  <h4 style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--teal)", marginBottom: "var(--space-2)" }}>
                    <Video size={16} /> Student Video Introduction
                  </h4>
                  <a href={selectedProfile.video_url} target="_blank" rel="noopener noreferrer" style={{ wordBreak: "break-all", fontSize: "var(--step--1)" }}>
                    {selectedProfile.video_url}
                  </a>
                </div>
              )}

              <div style={{ marginBottom: "var(--space-5)" }}>
                <h4 style={{ color: "var(--on-surface-muted)", marginBottom: "var(--space-2)" }}>About {selectedProfile.full_name}</h4>
                <p style={{ lineHeight: 1.6, color: "var(--on-surface)" }}>{selectedProfile.bio || "No biography provided."}</p>
              </div>

              {/* Direct Institution Routing Notice */}
              <div className="notice" style={{ marginBottom: "var(--space-5)" }}>
                <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, fontSize: "var(--step--1)" }}>
                  <Building2 size={16} /> <b>100% Direct Routing:</b> Your contribution will be paid straight to <b>{selectedProfile.institution?.name ?? "the school"}</b> with reference receipt generated.
                </p>
              </div>

              {/* Contribution Form */}
              <form onSubmit={handleDonate} style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-5)" }}>
                <h3 style={{ fontSize: "var(--step-1)", marginBottom: "var(--space-3)" }}>Make a Direct Contribution</h3>

                {error && (
                  <div className="alert" style={{ marginBottom: "var(--space-4)" }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                {success && (
                  <div className="notice" style={{ marginBottom: "var(--space-4)" }}>
                    <CheckCircle2 size={16} /> {success}
                  </div>
                )}

                <div style={{ marginBottom: "var(--space-4)" }}>
                  <label className="field__label">Preset Amounts (RWF)</label>
                  <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
                    {["10000", "25000", "50000", "100000", "250000"].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className={`btn btn--sm ${contributeAmount === amt ? "btn--primary" : "btn--secondary"}`}
                        onClick={() => setContributeAmount(amt)}
                      >
                        {parseInt(amt, 10).toLocaleString()} RWF
                      </button>
                    ))}
                  </div>
                  <TextField
                    label="Custom Amount (RWF)"
                    name="amount"
                    type="number"
                    value={contributeAmount}
                    onChange={setContributeAmount}
                    required
                  />
                </div>

                <div style={{ marginBottom: "var(--space-4)" }}>
                  <TextField
                    label="Proof of Funds / Bank Slip Image URL (Optional)"
                    name="proof_image_url"
                    placeholder="https://... deposit_slip.jpg"
                    value={proofImageUrl}
                    onChange={setProofImageUrl}
                  />
                  <span style={{ fontSize: "var(--step--2)", color: "var(--text-subtle)", marginTop: 2, display: "block" }}>
                    Attach deposit slip or bank transfer screenshot so the school & admin can verify evidence of funds.
                  </span>
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="msg">
                    Encouragement Message for Student (Optional)
                  </label>
                  <textarea
                    id="msg"
                    className="field__textarea"
                    placeholder="Leave a message of encouragement..."
                    value={contributeMessage}
                    onChange={(e) => setContributeMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer", marginBottom: "var(--space-5)" }}>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
                  />
                  <span style={{ fontSize: "var(--step--1)" }}>
                    <b>Donate Anonymously</b> (Conceal your full name on public wall & student dashboard)
                  </span>
                </label>

                <Button type="submit" block loading={submitting}>
                  <Send size={16} /> Submit Contribution & Generate Receipt
                </Button>
              </form>

              {/* Public Donor Messages Board */}
              <div style={{ borderTop: "1px solid var(--border)", marginTop: "var(--space-6)", paddingTop: "var(--space-5)" }}>
                <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "var(--space-3)" }}>
                  <MessageSquare size={16} style={{ color: "var(--amber)" }} /> Donor Message Wall ({profileContributions.length})
                </h4>
                {profileContributions.length === 0 ? (
                  <p style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)" }}>Be the first donor to leave an encouraging message for this student!</p>
                ) : (
                  <div className="doc-list" style={{ maxHeight: 200, overflowY: "auto" }}>
                    {profileContributions.map((c) => (
                      <div key={c.id} className="doc-item" style={{ padding: "var(--space-3)" }}>
                        <div className="doc-item__info">
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 600, fontSize: "var(--step--1)" }}>{c.donor_name}</span>
                            <span style={{ color: "var(--emerald)", fontWeight: 700 }} className="tabular">+{c.amount.toLocaleString()} RWF</span>
                          </div>
                          {c.message && <div style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", marginTop: 2 }}>"{c.message}"</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
