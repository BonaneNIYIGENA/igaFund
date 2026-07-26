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
  Heart,
  MessageSquare,
  ShieldCheck,
  User as UserIcon,
  Activity,
  Award,
  Download,
  Building,
  Check
} from "lucide-react";
import { api, Profile, ContributionItem } from "../../lib/api";
import { stagger, fadeUp } from "../../lib/motion";
import { StudentLayout } from "./StudentLayout";
import { useAuth } from "../auth/AuthContext";
import { TicketsView } from "../../components/TicketsView";

type Phase = "incomplete" | "pending" | "active" | "completed";

export function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatedPhase, setSimulatedPhase] = useState<Phase | null>(null);

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

  // Determine current active phase
  const activePhase: Phase = simulatedPhase ?? (
    !profile ? "incomplete" :
    profile.status === "draft" ? "incomplete" :
    profile.status === "pending" ? "pending" :
    (profile.funded_amount ?? 0) >= profile.funding_goal ? "completed" : "active"
  );

  return (
    <StudentLayout>
      <motion.div variants={stagger} initial="hidden" animate="show">
        {/* State Switcher Bar for Demo */}
        <div style={{
          background: "var(--glass-bg-strong)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius)",
          padding: "var(--space-3) var(--space-4)",
          marginBottom: "var(--space-6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-2)"
        }}>
          <span style={{ fontSize: "var(--step--1)", fontWeight: 600, color: "var(--primary)" }}>
            💡 Demo Presentation Mode (Simulate Lifecycle Phase):
          </span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {(["incomplete", "pending", "active", "completed"] as Phase[]).map((phase) => (
              <button
                key={phase}
                onClick={() => setSimulatedPhase(phase)}
                className={`btn btn--xs ${activePhase === phase ? "btn--primary" : "btn--secondary"}`}
                style={{ textTransform: "capitalize" }}
              >
                {phase === "incomplete" && "1. Incomplete"}
                {phase === "pending" && "2. Pending Admin Review"}
                {phase === "active" && "3. Funding Active (45%)"}
                {phase === "completed" && "4. Goal Reached (100%)"}
              </button>
            ))}
          </div>
        </div>

        {/* Page Header */}
        <motion.div className="page-header" variants={fadeUp}>
          <p className="page-header__eyebrow">
            <GraduationCap size={14} /> Student Dashboard
          </p>
          <h1>Hello, {firstName}.</h1>
          <p>
            {activePhase === "incomplete" && "Complete your profile information and upload required documents to apply."}
            {activePhase === "pending" && "Your application has been submitted and is currently being verified by administrators."}
            {activePhase === "active" && "Your profile is verified! Track your live tuition funding progress below."}
            {activePhase === "completed" && "Congratulations! Your tuition goal is 100% funded and sent directly to your school."}
          </p>
        </motion.div>

        {/* Phase 4: Goal Reached Banner */}
        {activePhase === "completed" && (
          <motion.div
            className="card"
            variants={fadeUp}
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 100%)",
              borderColor: "var(--emerald)",
              marginBottom: "var(--space-6)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--grad-primary)", display: "grid", placeItems: "center", color: "#fff", flexShrink: 0 }}>
                <Award size={28} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: "var(--step-2)", color: "var(--emerald)", marginBottom: "var(--space-1)" }}>
                  🎉 100% Tuition Goal Reached!
                </h2>
                <p style={{ color: "var(--on-surface-muted)", margin: 0 }}>
                  Your funding target of <strong>800 USD (1,000,000 RWF)</strong> has been fully secured. The payment has been direct-routed to your institution (Bank Ref: BK-UR-88392).
                </p>
              </div>
              <button className="btn btn--primary btn--sm" onClick={() => alert("Downloading Official Direct Transfer Certificate (PDF)...")}>
                <Download size={16} /> Download Certificate
              </button>
            </div>
          </motion.div>
        )}

        {/* KPI Stats Grid */}
        <motion.div className="stats-grid" variants={fadeUp}>
          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--green">
              <GraduationCap size={20} />
            </div>
            <div className="stat-card__value">
              {activePhase === "incomplete" ? "Incomplete" : "Verified"}
            </div>
            <div className="stat-card__label">Profile Status</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--amber">
              <FileText size={20} />
            </div>
            <div className="stat-card__value">
              {activePhase === "incomplete" ? "2 / 4" : "4 / 4"}
            </div>
            <div className="stat-card__label">Documents Vault</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--clay">
              <Target size={20} />
            </div>
            <div className="stat-card__value tabular">
              {activePhase === "incomplete" && "0%"}
              {activePhase === "pending" && "0%"}
              {activePhase === "active" && "45%"}
              {activePhase === "completed" && "100%"}
            </div>
            <div className="stat-card__label">Tuition Funded</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__icon stat-card__icon--sage">
              <TrendingUp size={20} />
            </div>
            <div className="stat-card__value tabular">
              800 USD
            </div>
            <div className="stat-card__label">Target Goal</div>
          </div>
        </motion.div>

        {/* Dynamic Card Content per Phase */}
        {activePhase === "incomplete" && (
          <motion.div className="card" variants={fadeUp}>
            <div className="empty-state">
              <div className="empty-state__icon">
                <GraduationCap size={28} />
              </div>
              <h3>Action Required: Complete Application</h3>
              <p>
                Fill in your academic information and upload your required documents (National ID, Transcript, and Guardian Consent form if under 18) to submit for verification.
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
                <Link to="/student/profile" className="btn btn--primary">
                  Fill Profile Info <ArrowRight size={16} />
                </Link>
                <Link to="/student/documents" className="btn btn--secondary">
                  Upload Documents
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {activePhase === "pending" && (
          <motion.div className="card" variants={fadeUp}>
            <div className="card__header">
              <h2 className="card__title">Verification Queue Status</h2>
              <span className="badge badge--pending"><Clock size={14} /> Pending Verification</span>
            </div>
            <div className="notice notice--warn">
              <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                <Clock size={18} />
                Your profile has been submitted to the Admin Verification Queue. Average review time is 24-48 hours.
              </p>
            </div>

            <div style={{ marginTop: "var(--space-4)" }}>
              <h4 style={{ fontSize: "var(--step-0)", marginBottom: "var(--space-3)" }}>Submitted Documents Checklist:</h4>
              <div className="doc-list">
                <div className="doc-item">
                  <Check size={16} color="var(--emerald)" />
                  <div className="doc-item__info">
                    <div className="doc-item__name">Government ID / Passport</div>
                    <div className="doc-item__type">Verified Upload</div>
                  </div>
                </div>
                <div className="doc-item">
                  <Check size={16} color="var(--emerald)" />
                  <div className="doc-item__info">
                    <div className="doc-item__name">Official Academic Transcript</div>
                    <div className="doc-item__type">Verified Upload</div>
                  </div>
                </div>
                <div className="doc-item">
                  <Check size={16} color="var(--emerald)" />
                  <div className="doc-item__info">
                    <div className="doc-item__name">Guardian Consent Form</div>
                    <div className="doc-item__type">Verified Upload (Minor Applicant)</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {(activePhase === "active" || activePhase === "completed") && (
          <motion.div variants={fadeUp} style={{ display: "grid", gap: "var(--space-6)" }}>
            {/* Active Funding Progress Bar */}
            <div className="card">
              <div className="card__header">
                <h2 className="card__title">Live Funding Progress</h2>
                <span className="badge badge--approved">
                  <Building size={14} /> Direct Transfer Verified
                </span>
              </div>

              <div style={{ padding: "var(--space-4)", background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                  <span style={{ color: "var(--on-surface-muted)", fontSize: "var(--step--1)" }}>Target: University of Rwanda (CST)</span>
                  <span className="badge badge--approved" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    {activePhase === "completed" ? "100%" : "45%"} Funded
                  </span>
                </div>
                <div className="progress" style={{ height: 12 }}>
                  <div
                    className="progress__bar"
                    style={{ width: activePhase === "completed" ? "100%" : "45%" }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-3)", fontSize: "var(--step--1)" }}>
                  <span style={{ color: "var(--emerald)", fontWeight: 700 }} className="tabular">
                    {activePhase === "completed" ? "$800 USD (360,000 RWF)" : "$360 USD (162,000 RWF)"} Raised
                  </span>
                  <span style={{ color: "var(--on-surface-muted)" }} className="tabular">
                    {activePhase === "completed" ? "$0 USD Remaining" : "$440 USD Remaining"}
                  </span>
                </div>
              </div>
            </div>

            {/* Donor Messages & Support */}
            <div className="card">
              <div className="card__header">
                <h2 className="card__title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Heart size={18} style={{ color: "var(--amber)" }} /> Donor Support & Encouragement
                </h2>
                <span className="badge badge--approved">2 Contributions</span>
              </div>

              <div className="doc-list">
                <div className="doc-item" style={{ padding: "var(--space-4)" }}>
                  <div className="doc-item__icon" style={{ background: "var(--primary-soft)", color: "var(--emerald)" }}>
                    <Heart size={18} />
                  </div>
                  <div className="doc-item__info">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--step-0)", color: "var(--on-surface)" }}>
                        Jean-Luc Havugimana
                      </div>
                      <div style={{ color: "var(--emerald)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        +$250 USD
                      </div>
                    </div>
                    <div style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", marginTop: "var(--space-2)", fontStyle: "italic" }}>
                      "Keep up the outstanding work in Computer Science!"
                    </div>
                    <div style={{ fontSize: "var(--step--2)", color: "var(--on-surface-faint)", marginTop: "var(--space-1)", fontFamily: "var(--font-mono)" }}>
                      Ref: REC-8839210A • Routed to University of Rwanda
                    </div>
                  </div>
                </div>

                <div className="doc-item" style={{ padding: "var(--space-4)" }}>
                  <div className="doc-item__icon" style={{ background: "rgba(255,255,255,0.06)", color: "var(--on-surface-muted)" }}>
                    <Heart size={18} />
                  </div>
                  <div className="doc-item__info">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--step-0)", color: "var(--on-surface)" }}>
                        Anonymous Donor <span className="badge badge--draft" style={{ marginLeft: "var(--space-2)", fontSize: "10px" }}>Anonymous</span>
                      </div>
                      <div style={{ color: "var(--emerald)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        +$110 USD
                      </div>
                    </div>
                    <div style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", marginTop: "var(--space-2)", fontStyle: "italic" }}>
                      "Wishing you great success in your exams."
                    </div>
                    <div style={{ fontSize: "var(--step--2)", color: "var(--on-surface-faint)", marginTop: "var(--space-1)", fontFamily: "var(--font-mono)" }}>
                      Ref: REC-9920194B • Routed to University of Rwanda
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Verification Tickets */}
            <div style={{ marginTop: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--step-1)", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShieldCheck size={20} style={{ color: "var(--primary)" }} /> Official Routing Tickets & Direct Transfer Proofs
              </h3>
              <TicketsView />
            </div>
          </motion.div>
        )}
      </motion.div>
    </StudentLayout>
  );
}
