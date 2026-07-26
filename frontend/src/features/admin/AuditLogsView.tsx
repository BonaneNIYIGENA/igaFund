import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { FileText } from "lucide-react";
import { Button } from "../../components/ui/Button";

export function AuditLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    loadLogs(page);
  }, [page]);

  async function loadLogs(p: number) {
    setLoading(true);
    try {
      const res = await api(`/audit/?page=${p}&per_page=20`);
      setLogs(res.audit_logs || []);
      setPages(res.pages || 1);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  if (loading && logs.length === 0) return <div>Loading audit logs...</div>;

  return (
    <div className="card" style={{ padding: "var(--space-6)" }}>
      <h2><FileText size={24} style={{ marginRight: 8, verticalAlign: "middle" }}/>System Audit Logs</h2>
      <p style={{ color: "var(--on-surface-muted)", marginBottom: "var(--space-6)" }}>
        Immutable record of critical administrative actions (BR7).
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--step--1)" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "var(--space-2)" }}>Timestamp (UTC)</th>
            <th style={{ padding: "var(--space-2)" }}>Actor ID</th>
            <th style={{ padding: "var(--space-2)" }}>Action</th>
            <th style={{ padding: "var(--space-2)" }}>Target</th>
            <th style={{ padding: "var(--space-2)" }}>Note</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "var(--space-2)", whiteSpace: "nowrap" }}>{new Date(log.created_at).toLocaleString()}</td>
              <td style={{ padding: "var(--space-2)" }}>{log.actor_id}</td>
              <td style={{ padding: "var(--space-2)", fontWeight: 600 }}>{log.action}</td>
              <td style={{ padding: "var(--space-2)" }}>{log.target_type} #{log.target_id}</td>
              <td style={{ padding: "var(--space-2)" }}>{log.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)", justifyContent: "center" }}>
        <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span style={{ padding: "8px 16px" }}>Page {page} of {pages}</span>
        <Button variant="ghost" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
