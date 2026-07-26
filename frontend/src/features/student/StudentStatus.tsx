import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  FileText,
  Send,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { api, Profile, NotificationItem } from "../../lib/api";
import { stagger, fadeUp } from "../../lib/motion";
import { StudentLayout } from "./StudentLayout";

type Step = {
  title: string;
  desc: string;
  state: "done" | "active" | "pending";
  date?: string;
};

function buildTimeline(profile: Profile | null): Step[] {
  if (!profile) {
    return [
      { title: "Create Profile", desc: "Fill in your personal and academic information.", state: "active" },
      { title: "Upload Documents", desc: "Provide your ID, transcript, and other verification documents.", state: "pending" },
      { title: "Submit for Review", desc: "Send your completed application to our team.", state: "pending" },
      { title: "Admin Review", desc: "An admin will verify your identity and documents.", state: "pending" },
      { title: "Published", desc: "Your verified profile becomes visible to donors.", state: "pending" },
    ];
  }

  const s = profile.status;
  return [
    {
      title: "Profile Created",
      desc: "Your personal and academic details are saved.",
      state: "done",
      date: profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : undefined,
    },
    {
      title: "Documents Uploaded",
      desc: `${profile.document_count} document${profile.document_count !== 1 ? "s" : ""} on file.`,
      state: profile.document_count > 0 ? "done" : (s === "draft" ? "active" : "done"),
    },
    {
      title: "Submitted for Review",
      desc: s === "draft" ? "Complete your profile and documents, then submit." : "Your application has been sent to our team.",
      state: s === "draft" ? (profile.document_count > 0 ? "active" : "pending") : "done",
      date: profile.submitted_at ? new Date(profile.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : undefined,
    },
    {
      title: "Admin Review",
      desc: s === "pending"
        ? "An admin is currently reviewing your application."
        : s === "approved"
        ? "Your application was approved."
        : s === "rejected"
        ? profile.review_note ?? "Your application was not approved."
        : "Waiting for submission.",
      state: s === "pending" ? "active" : (s === "approved" || s === "rejected") ? "done" : "pending",
      date: profile.reviewed_at ? new Date(profile.reviewed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : undefined,
    },
    {
      title: s === "rejected" ? "Action Required" : "Published to Donors",
      desc: s === "approved"
        ? "Congratulations! Donors can now find and fund your education."
        : s === "rejected"
        ? "Please update your profile and resubmit."
        : "Once approved, your profile will be visible to donors.",
      state: s === "approved" ? "done" : s === "rejected" ? "active" : "pending",
    },
  ];
}

export function StudentStatus() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/profiles/").then((d) => d.profiles?.[0] ?? null),
      api("/notifications/").then((d) => d.notifications ?? []).catch(() => []),
    ])
      .then(([p, n]) => {
        setProfile(p);
        setNotifications(n);
      })
      .finally(() => setLoading(false));
  }, []);

  const timeline = buildTimeline(profile);

  const statusConfig = {
    draft: { icon: <FileText size={18} />, label: "Draft", color: "var(--on-surface-muted)" },
    pending: { icon: <Clock size={18} />, label: "Under Review", color: "var(--warning)" },
    approved: { icon: <CheckCircle2 size={18} />, label: "Approved", color: "var(--success)" },
    rejected: { icon: <XCircle size={18} />, label: "Rejected", color: "var(--danger)" },
  };

  const currentStatus = profile ? statusConfig[profile.status] : null;

  if (loading) {
    return (
      <StudentLayout>
        <div className="empty-state">
          <div className="btn__spinner" style={{ width: 24, height: 24, borderColor: "var(--primary)", borderTopColor: "transparent", margin: "0 auto" }} />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div className="page-header" variants={fadeUp}>
          <p className="page-header__eyebrow">
            <Activity size={14} /> Application Status
          </p>
          <h1>Track your progress</h1>
          <p>See exactly where your application stands in the verification process.</p>
        </motion.div>

        {/* Current status badge */}
        {currentStatus && (
          <motion.div className="card" variants={fadeUp} style={{ marginBottom: "var(--space-5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: `${currentStatus.color}15`,
                color: currentStatus.color,
              }}>
                {currentStatus.icon}
              </div>
              <div>
                <div style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", marginBottom: 2 }}>
                  Current Status
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-2)", color: currentStatus.color }}>
                  {currentStatus.label}
                </div>
              </div>
              {profile && profile.funding_goal > 0 && (
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", marginBottom: 2 }}>
                    Funding
                  </div>
                  <div className="tabular" style={{ fontWeight: 700, fontSize: "var(--step-1)" }}>
                    {(profile.funded_amount ?? 0).toLocaleString()} / {profile.funding_goal.toLocaleString()} RWF
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div className="card" variants={fadeUp} style={{ marginBottom: "var(--space-5)" }}>
          <div className="card__header">
            <h2 className="card__title">Application Timeline</h2>
          </div>
          <div className="timeline">
            {timeline.map((step, i) => (
              <div key={i} className={`timeline__step timeline__step--${step.state}`}>
                <div className="timeline__dot" />
                <div className="timeline__title">{step.title}</div>
                <div className="timeline__desc">{step.desc}</div>
                {step.date && <div className="timeline__date">{step.date}</div>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent notifications */}
        {notifications.length > 0 && (
          <motion.div className="card" variants={fadeUp}>
            <div className="card__header">
              <h2 className="card__title">Recent Notifications</h2>
            </div>
            <div className="doc-list">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="doc-item" style={{ opacity: n.read ? 0.6 : 1 }}>
                  <div className="doc-item__icon" style={{
                    background: n.type === "success" ? "var(--success-soft)" : n.type === "warning" ? "var(--warning-soft)" : "var(--primary-soft)",
                    color: n.type === "success" ? "var(--success)" : n.type === "warning" ? "var(--warning)" : "var(--primary)",
                  }}>
                    {n.type === "success" ? <CheckCircle2 size={16} /> : n.type === "warning" ? <XCircle size={16} /> : <Activity size={16} />}
                  </div>
                  <div className="doc-item__info">
                    <div className="doc-item__name">{n.message}</div>
                    <div className="doc-item__type">
                      {n.created_at ? new Date(n.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </StudentLayout>
  );
}
