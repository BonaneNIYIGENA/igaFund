import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Users,
  Search,
  Filter,
  Eye,
  LogOut,
  X,
  Send,
  Video,
  Building2,
  FileCheck,
  Award,
  Ticket,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { api, Profile, Doc } from "../../lib/api";
import { stagger, fadeUp } from "../../lib/motion";
import { Button } from "../../components/ui/Button";
import { TicketsView } from "../../components/TicketsView";
import { InstitutionsView } from "./InstitutionsView";
import { AuditLogsView } from "./AuditLogsView";

type AdminStats = {
  total_profiles: number;
  pending: number;
  approved: number;
  rejected: number;
  total_users: number;
};

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [activeTab, setActiveTab] = useState<"profiles" | "tickets" | "institutions" | "audit">("profiles");
  const [search, setSearch] = useState("");

  // detail modal state
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handlePromoteAmbassador(userId: number) {
    setError("");
    setSuccess("");
    try {
      const res = await api(`/admin/users/${userId}/promote-ambassador`, { method: "POST" });
      setSuccess(`Successfully promoted ${res.user?.full_name ?? "student"} to Community Ambassador!`);
      loadData();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([
        api("/admin/stats"),
        api(`/admin/profiles?status=${statusFilter}`),
      ]);
      setStats(sRes);
      setProfiles(pRes.profiles ?? []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(p: Profile) {
    setSelectedProfile(p);
    setReviewNote("");
    setReviewAction(null);
    setError("");
    setSuccess("");
    try {
      const dRes = await api(`/admin/profiles/${p.id}`);
      setDocs(dRes.documents ?? []);
    } catch (e) {
      setDocs([]);
    }
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProfile || !reviewAction) return;
    setError("");
    setSuccess("");

    if (reviewNote.trim().length < 5) {
      setError("Mandatory review note must be at least 5 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = `/admin/profiles/${selectedProfile.id}/${reviewAction}`;
      const res = await api(endpoint, {
        method: "POST",
        body: JSON.stringify({ note: reviewNote }),
      });

      setSuccess(`Profile successfully ${reviewAction === "approve" ? "approved" : "rejected"}.`);
      setSelectedProfile(res.profile);
      loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredProfiles = profiles.filter((p) => {
    return (
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.field_of_study?.toLowerCase().includes(search.toLowerCase()) ||
      p.institution?.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="shell" style={{ minHeight: "100vh", background: "var(--surface-sunk)" }}>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "var(--space-6) var(--space-4) var(--space-10)", width: "100%" }}>
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--space-4)" }}>
          <div className="sidebar__brand" style={{ padding: 0, border: 0 }}>
            iga<span>Fund</span> <span style={{ fontSize: "var(--step--1)", color: "var(--amber)", fontWeight: 600, marginLeft: "var(--space-2)" }}>| Administrator Console</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <span style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)" }}>
              Admin: <b>{user?.full_name}</b>
            </span>
            <Button variant="ghost" onClick={logout} className="btn--sm">
              <LogOut size={14} /> Sign out
            </Button>
          </div>
        </header>

        {/* Top Tab Navigation */}
        <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-5)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--space-2)" }}>
          <button
            className={`btn btn--sm ${activeTab === "profiles" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setActiveTab("profiles")}
          >
            <ShieldCheck size={14} /> Verification Queue
          </button>
          <button
            className={`btn btn--sm ${activeTab === "institutions" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setActiveTab("institutions")}
          >
            <Building2 size={14} /> Institutions
          </button>
          <button
            className={`btn btn--sm ${activeTab === "tickets" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setActiveTab("tickets")}
          >
            <Ticket size={14} /> Process Tickets
          </button>
          <button
            className={`btn btn--sm ${activeTab === "audit" ? "btn--primary" : "btn--ghost"}`}
            onClick={() => setActiveTab("audit")}
          >
            <FileText size={14} /> Audit Logs
          </button>
        </div>

        {activeTab === "tickets" && <TicketsView />}
        {activeTab === "institutions" && <InstitutionsView />}
        {activeTab === "audit" && <AuditLogsView />}

        {activeTab === "profiles" && (
          <>
            {/* Stats Overview */}
            {stats && (
          <motion.div className="stats-grid" variants={stagger} initial="hidden" animate="show">
            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--amber">
                <Clock size={20} />
              </div>
              <div className="stat-card__value tabular">{stats.pending}</div>
              <div className="stat-card__label">Pending Review</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--green">
                <CheckCircle2 size={20} />
              </div>
              <div className="stat-card__value tabular">{stats.approved}</div>
              <div className="stat-card__label">Approved Profiles</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--clay">
                <XCircle size={20} />
              </div>
              <div className="stat-card__value tabular">{stats.rejected}</div>
              <div className="stat-card__label">Rejected</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__icon stat-card__icon--sage">
                <Users size={20} />
              </div>
              <div className="stat-card__value tabular">{stats.total_users}</div>
              <div className="stat-card__label">Total Registered Users</div>
            </div>
          </motion.div>
        )}
        
        <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => window.open(`${import.meta.env.VITE_API_URL ?? '/api'}/admin/export-pdf`, '_blank')}>
              <FileText size={16} /> Download Analytics Report (PDF)
            </Button>
        </div>

        {/* Filter controls */}
        <div className="card" style={{ marginBottom: "var(--space-5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
            {/* Status tabs */}
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              {[
                { id: "pending", label: "Pending Queue", icon: Clock },
                { id: "approved", label: "Approved", icon: CheckCircle2 },
                { id: "rejected", label: "Rejected", icon: XCircle },
                { id: "all", label: "All Profiles", icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    className={`btn btn--sm ${active ? "btn--primary" : "btn--secondary"}`}
                    onClick={() => setStatusFilter(tab.id)}
                  >
                    <Icon size={14} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div style={{ position: "relative", minWidth: 220 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: 11, color: "var(--on-surface-faint)" }} />
              <input
                className="field__input"
                style={{ paddingLeft: 36, minHeight: 38, fontSize: "var(--step--1)" }}
                placeholder="Filter by student or school..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Verification Queue Table */}
        {loading ? (
          <div className="empty-state">
            <div className="btn__spinner" style={{ width: 32, height: 32, margin: "0 auto" }} />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state__icon">
              <ShieldCheck size={28} />
            </div>
            <h3>No profiles in this queue</h3>
            <p>There are no student profiles matching status "{statusFilter}".</p>
          </div>
        ) : (
          <div className="card card--flush" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--step--1)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Student Name</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Age Status</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Institution</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Funding Goal</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Status</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 600 }}>{p.full_name}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      {p.is_minor ? (
                        <span className="badge badge--pending">Minor (&lt;18)</span>
                      ) : (
                        <span className="badge badge--approved">Adult (18+)</span>
                      )}
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--on-surface-muted)" }}>
                      {p.institution?.name ?? "Unassigned"}
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 600 }} className="tabular">
                      {p.funding_goal.toLocaleString()} RWF
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <span className={`badge badge--${p.status}`}>{p.status}</span>
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right" }}>
                      <Button variant="secondary" className="btn--sm" onClick={() => openDetail(p)}>
                        <Eye size={14} /> Review & Verify
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>
        )}
      </main>

      {/* Review Drawer / Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "grid", placeItems: "center", padding: "var(--space-4)", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
            <motion.div
              className="card"
              style={{ width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", position: "relative" }}
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
                  <div style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)" }}>
                    User ID: {selectedProfile.user_id} • Status: <span className={`badge badge--${selectedProfile.status}`}>{selectedProfile.status}</span>
                  </div>
                </div>
              </div>

              {/* Age Verification Banner */}
              <div className={`notice ${selectedProfile.is_minor ? "notice--warn" : ""}`} style={{ marginBottom: "var(--space-4)" }}>
                <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, fontSize: "var(--step--1)" }}>
                  <ShieldCheck size={16} />
                  <b>Age Status:</b> {selectedProfile.is_minor ? "MINOR (<18 years). Guardian verification required. Visual media is restricted." : "ADULT (18+ years). Eligible for video introduction & visual sharing."}
                </p>
              </div>

              {/* Bio & Academic details */}
              <div style={{ marginBottom: "var(--space-4)" }}>
                <h4 style={{ color: "var(--on-surface-muted)", marginBottom: 4 }}>Student Biography</h4>
                <p style={{ lineHeight: 1.5 }}>{selectedProfile.bio || "No biography provided."}</p>
              </div>

              <div className="form-row form-row--2" style={{ marginBottom: "var(--space-4)" }}>
                <div>
                  <h4 style={{ color: "var(--on-surface-muted)", marginBottom: 4 }}>Academic Level & Study</h4>
                  <div>{selectedProfile.academic_level ?? "N/A"} — {selectedProfile.field_of_study ?? "General"}</div>
                </div>
                <div>
                  <h4 style={{ color: "var(--on-surface-muted)", marginBottom: 4 }}>Institution & Target Goal</h4>
                  <div style={{ fontWeight: 600 }}>{selectedProfile.institution?.name ?? "Unassigned"}</div>
                  <div style={{ color: "var(--emerald)", fontWeight: 700 }} className="tabular">{selectedProfile.funding_goal.toLocaleString()} RWF</div>
                </div>
              </div>

              {/* Minor Guardian details if minor */}
              {selectedProfile.is_minor && (
                <div style={{ padding: "var(--space-4)", background: "rgba(245,158,11,0.08)", borderRadius: "var(--radius)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: "var(--space-4)" }}>
                  <h4 style={{ color: "var(--amber)", marginBottom: 4 }}>Guardian Verification (BR3)</h4>
                  <div style={{ fontSize: "var(--step--1)" }}>Guardian Name: <b>{selectedProfile.guardian_name || "Not provided"}</b></div>
                  <div style={{ fontSize: "var(--step--1)" }}>Guardian Phone: <b>{selectedProfile.guardian_phone || "Not provided"}</b></div>
                  <div style={{ fontSize: "var(--step--1)", marginTop: 4 }}>
                    Consent Granted: {selectedProfile.guardian_consent ? <span style={{ color: "var(--emerald)" }}>✓ Yes</span> : <span style={{ color: "var(--red)" }}>✗ Missing</span>}
                  </div>
                </div>
              )}

              {/* Adult Intro video if adult */}
              {!selectedProfile.is_minor && selectedProfile.video_url && (
                <div style={{ padding: "var(--space-4)", background: "rgba(6,182,212,0.08)", borderRadius: "var(--radius)", border: "1px solid rgba(6,182,212,0.2)", marginBottom: "var(--space-4)" }}>
                  <h4 style={{ color: "var(--teal)", marginBottom: 4 }}>Intro Video URL</h4>
                  <a href={selectedProfile.video_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--step--1)" }}>{selectedProfile.video_url}</a>
                </div>
              )}

              {/* Uploaded Documents Inspection */}
              <div style={{ marginBottom: "var(--space-5)" }}>
                <h4 style={{ color: "var(--on-surface-muted)", marginBottom: "var(--space-2)" }}>Uploaded Verification Documents ({docs.length})</h4>
                {docs.length === 0 ? (
                  <p style={{ fontSize: "var(--step--1)", color: "var(--on-surface-faint)" }}>No documents attached yet.</p>
                ) : (
                  <div className="doc-list">
                    {docs.map((d) => (
                      <div key={d.id} className="doc-item">
                        <div className="doc-item__icon"><FileCheck size={16} /></div>
                        <div className="doc-item__info">
                          <div className="doc-item__name">{d.original_filename}</div>
                          <div className="doc-item__type">{d.doc_type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Verification Action Form (Approve / Reject) */}
              <form onSubmit={handleReview} style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-4)" }}>
                <h3 style={{ fontSize: "var(--step-1)", marginBottom: "var(--space-3)" }}>Verification Action</h3>

                {error && (
                  <div className="alert" style={{ marginBottom: "var(--space-3)" }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                {success && (
                  <div className="notice" style={{ marginBottom: "var(--space-3)" }}>
                    <CheckCircle2 size={16} /> {success}
                  </div>
                )}

                <div className="field">
                  <label className="field__label" htmlFor="note">
                    Mandatory Review Note / Justification (Min 5 chars)
                  </label>
                  <textarea
                    id="note"
                    className="field__textarea"
                    placeholder="Enter review notes, verification confirmation, or reason for rejection..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  <Button
                    type="submit"
                    loading={submitting && reviewAction === "approve"}
                    onClick={() => setReviewAction("approve")}
                    style={{ flex: 1 }}
                  >
                    <CheckCircle2 size={16} /> Approve & Publish Profile
                  </Button>

                  <Button
                    type="submit"
                    variant="ghost"
                    loading={submitting && reviewAction === "reject"}
                    onClick={() => setReviewAction("reject")}
                    style={{ flex: 1, borderColor: "var(--danger)", color: "var(--red)" }}
                  >
                    <XCircle size={16} /> Reject Profile
                  </Button>
                </div>
              </form>

              {selectedProfile.status === "approved" && (
                <div style={{ borderTop: "1px solid var(--border)", marginTop: "var(--space-4)", paddingTop: "var(--space-4)" }}>
                  <Button
                    type="button"
                    variant="secondary"
                    block
                    onClick={() => handlePromoteAmbassador(selectedProfile.user_id)}
                  >
                    <Award size={16} /> Promote Student to Community Ambassador
                  </Button>
                  <span style={{ fontSize: "var(--step--2)", color: "var(--text-subtle)", marginTop: 4, display: "block", textAlign: "center" }}>
                    Promoting this verified student allows them to onboard & assist other students in rural areas.
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
