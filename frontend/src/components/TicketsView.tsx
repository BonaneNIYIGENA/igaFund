import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Ticket, CheckCircle2, Award, DollarSign, Clock, FileText } from "lucide-react";
import { api, TicketItem } from "../lib/api";
import { fadeUp, stagger } from "../lib/motion";

export function TicketsView() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/tickets/")
      .then((d) => setTickets(d.tickets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="btn__spinner" style={{ width: 24, height: 24, borderColor: "var(--primary)", borderTopColor: "transparent", margin: "0 auto" }} />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "var(--space-6)" }}>
        <Ticket size={32} style={{ color: "var(--text-subtle)", marginBottom: "var(--space-2)" }} />
        <h3>No Process Tickets Issued Yet</h3>
        <p style={{ color: "var(--text-subtle)" }}>
          Official tickets are generated automatically when a profile is submitted, approved, promoted, or funded.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {tickets.map((t) => {
        let Icon = Ticket;
        let badgeColor = "var(--primary)";
        if (t.process_type === "profile_approved") {
          Icon = CheckCircle2;
          badgeColor = "var(--primary)";
        } else if (t.process_type === "ambassador_promoted") {
          Icon = Award;
          badgeColor = "var(--amber)";
        } else if (t.process_type === "contribution_funded" || t.process_type === "funding_received") {
          Icon = DollarSign;
          badgeColor = "var(--pine)";
        }

        return (
          <motion.div key={t.id} className="card" variants={fadeUp} style={{ borderLeft: `4px solid ${badgeColor}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center", color: badgeColor }}>
                  <Icon size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "var(--step-0)", fontWeight: 600 }}>{t.title}</h4>
                  <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-subtle)", background: "var(--surface-sunken)", padding: "2px 6px", borderRadius: 4 }}>
                    {t.ticket_number}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "var(--step--2)", color: "var(--text-subtle)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Clock size={12} /> {t.created_at ? new Date(t.created_at).toLocaleString() : ""}
              </span>
            </div>

            <p style={{ margin: "var(--space-2) 0", color: "var(--text-main)", fontSize: "var(--step--1)" }}>
              {t.summary}
            </p>

            {t.details && Object.keys(t.details).length > 0 && (
              <div style={{ background: "var(--surface-sunken)", padding: "var(--space-3)", borderRadius: 6, fontSize: "var(--step--1)", marginTop: "var(--space-3)" }}>
                <div style={{ fontWeight: 600, marginBottom: "var(--space-1)", fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-subtle)" }}>
                  Official Ticket Verification Details:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-2)" }}>
                  {Object.entries(t.details).map(([k, v]) => {
                    if (!v) return null;
                    return (
                      <div key={k}>
                        <span style={{ color: "var(--text-subtle)", textTransform: "capitalize" }}>{k.replace(/_/g, " ")}: </span>
                        <strong style={{ color: "var(--text-main)" }}>{String(v)}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
