import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap,
  FileText,
  Target,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { api, Profile, ContributionItem } from "../../lib/api";
import { stagger, fadeUp } from "../../lib/motion";
import { StudentLayout } from "./StudentLayout";
import { Heart, MessageSquare, ShieldCheck, Sparkles, User as UserIcon, Activity } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { TicketsView } from "../../components/TicketsView";

export function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  useEffect(() => {
    api("/profiles/")
      .then(async (d) => {
        const p = d.profiles?.[0] ?? null;
        setProfile(p);
        if (p) {
          try {
            const cRes = await api(`/contributions/profile/${p.id}`);
            setContributions(cRes.contributions ?? []);
          } catch (e) {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusIcon = {
    draft: <FileText size={16} />,
    pending: <Clock size={16} />,
    approved: <CheckCircle2 size={16} />,
    rejected: <AlertCircle size={16} />,
  };

  return (
    <StudentLayout>
      <motion.div variants={stagger} initial="hidden" animate="show">
        {/* Header */}
        <motion.div className="page-header" variants={fadeUp}>
          <p className="page-header__eyebrow">
            <GraduationCap size={14} /> Student Dashboard
          </p>
          <h1>Hello, {firstName}.</h1>
          <p>
            {profile
              ? "Here's an overview of your application progress."
              : "Get started by creating your student profile."}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div className="stats-grid" variants={fadeUp}>
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--green">
              <GraduationCap size={20} />
            </div>
            <div className="stat-card__value">
              {profile ? 1 : 0}
            </div>
            <div className="stat-card__label">Profile</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--amber">
              <FileText size={20} />
            </div>
            <div className="stat-card__value">
              {profile?.document_count ?? 0}
            </div>
            <div className="stat-card__label">Documents</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--clay">
              <Target size={20} />
            </div>
            <div className="stat-card__value tabular">
              {profile ? `${Math.round(((profile.funded_amount ?? 0) / Math.max(profile.funding_goal, 1)) * 100)}%` : "—"}
            </div>
            <div className="stat-card__label">Funded</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--sage">
              <TrendingUp size={20} />
            </div>
            <div className="stat-card__value tabular">
              {profile?.funding_goal ? `${(profile.funding_goal / 1000).toFixed(0)}K` : "—"}
            </div>
            <div className="stat-card__label">Goal (RWF)</div>
          </div>
        </motion.div>

        {/* Quick actions */}
        {!loading && !profile && (
          <motion.div className="card" variants={fadeUp}>
            <div className="empty-state">
              <div className="empty-state__icon">
                <GraduationCap size={28} />
              </div>
              <h3>Create your profile</h3>
              <p>
                Tell us about yourself, your school, and your funding needs.
                Once verified, donors can find and fund your education.
              </p>
              <Link to="/student/profile" className="btn btn--primary">
                Get started <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}

        {profile && (
          <motion.div variants={fadeUp}>
            <div className="card">
              <div className="card__header">
                <h2 className="card__title">Application Progress</h2>
                <span className={`badge badge--${profile.status}`}>
                  {statusIcon[profile.status]} {profile.status}
                </span>
              </div>

              {profile.status === "draft" && (
                <div className="notice notice--warn">
                  <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                    <AlertCircle size={16} />
                    Your profile is still a draft. Complete it and upload your documents, then submit for review.
                  </p>
                </div>
              )}

              {profile.status === "pending" && (
                <div className="notice">
                  <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                    <Clock size={16} />
                    Your application is under review. We'll notify you once an admin has reviewed it.
                  </p>
                </div>
              )}

              {profile.status === "approved" && (
                <div className="notice">
                  <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                    <CheckCircle2 size={16} />
                    Congratulations! Your profile is verified. Donors can now find and fund your education.
                  </p>
                </div>
              )}

              {profile.status === "rejected" && profile.review_note && (
                <div className="alert">
                  <AlertCircle size={16} /> {profile.review_note}
                </div>
              )}

              {/* Funding progress */}
              {profile.funding_goal > 0 && (
                <div style={{ marginTop: "var(--space-4)", padding: "var(--space-4)", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                    <span style={{ color: "var(--on-surface-muted)", fontSize: "var(--step--1)" }}>Funding Progress Goal</span>
                    <span className="badge badge--approved" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {Math.round(((profile.funded_amount ?? 0) / Math.max(profile.funding_goal, 1)) * 100)}% Completed
                    </span>
                  </div>
                  <div className="progress" style={{ height: 10 }}>
                    <div
                      className="progress__bar"
                      style={{ width: `${Math.min(100, ((profile.funded_amount ?? 0) / profile.funding_goal) * 100)}%` }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-3)", fontSize: "var(--step--1)" }}>
                    <span style={{ color: "var(--emerald)", fontWeight: 600 }} className="tabular">
                      {(profile.funded_amount ?? 0).toLocaleString()} RWF Raised
                    </span>
                    <span style={{ color: "var(--on-surface-muted)" }} className="tabular">
                      {Math.max(0, profile.funding_goal - (profile.funded_amount ?? 0)).toLocaleString()} RWF Remaining
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
                <Link to="/student/profile" className="btn btn--secondary btn--sm">
                  <UserIcon size={14} /> Edit Profile
                </Link>
                <Link to="/student/documents" className="btn btn--secondary btn--sm">
                  <FileText size={14} /> Documents
                </Link>
                <Link to="/student/status" className="btn btn--secondary btn--sm">
                  <Activity size={14} /> Status
                </Link>
              </div>
            </div>

            {/* Donor Encouraging Messages Board */}
            <div className="card" style={{ marginTop: "var(--space-5)" }}>
              <div className="card__header">
                <h2 className="card__title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Heart size={18} style={{ color: "var(--amber)" }} /> Donor Support & Encouragement
                </h2>
                <span className="badge badge--approved">
                  {contributions.length} Contribution{contributions.length !== 1 ? "s" : ""}
                </span>
              </div>

              {contributions.length === 0 ? (
                <div className="empty-state" style={{ padding: "var(--space-6) var(--space-4)" }}>
                  <div className="empty-state__icon" style={{ background: "var(--accent-soft)", color: "var(--amber)" }}>
                    <MessageSquare size={24} />
                  </div>
                  <h3 style={{ fontSize: "var(--step-1)" }}>No donor messages yet</h3>
                  <p style={{ fontSize: "var(--step--1)" }}>
                    Once your profile is verified and approved, donors can fund your tuition and leave encouraging messages here.
                  </p>
                </div>
              ) : (
                <div className="doc-list">
                  {contributions.map((c) => (
                    <div key={c.id} className="doc-item" style={{ padding: "var(--space-4)" }}>
                      <div className="doc-item__icon" style={{ background: c.is_anonymous ? "rgba(255,255,255,0.06)" : "var(--primary-soft)", color: c.is_anonymous ? "var(--on-surface-muted)" : "var(--emerald)" }}>
                        <Heart size={18} />
                      </div>
                      <div className="doc-item__info">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <div style={{ fontWeight: 600, fontSize: "var(--step-0)", color: "var(--on-surface)" }}>
                            {c.donor_name}
                            {c.is_anonymous && <span className="badge badge--draft" style={{ marginLeft: "var(--space-2)", fontSize: "10px" }}>Anonymous</span>}
                          </div>
                          <div style={{ color: "var(--emerald)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                            +{c.amount.toLocaleString()} {c.currency}
                          </div>
                        </div>
                        {c.message && (
                          <div style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", marginTop: "var(--space-2)", fontStyle: "italic" }}>
                            "{c.message}"
                          </div>
                        )}
                        <div style={{ fontSize: "var(--step--2)", color: "var(--on-surface-faint)", marginTop: "var(--space-1)", fontFamily: "var(--font-mono)" }}>
                          Ref: {c.receipt_ref} • {c.created_at ? new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Official Process Tickets Section */}
            <div style={{ marginTop: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--step-1)", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShieldCheck size={20} style={{ color: "var(--primary)" }} /> Official Process Tickets & Verification Proofs
              </h3>
              <TicketsView />
            </div>
          </motion.div>
        )}
      </motion.div>
    </StudentLayout>
  );
}
