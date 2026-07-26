import { useState, useEffect, FormEvent } from "react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { Building2, Save, AlertCircle, CheckCircle2 } from "lucide-react";

export function InstitutionsView() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("secondary");
  const [bankRef, setBankRef] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadInst();
  }, []);

  async function loadInst() {
    try {
      const res = await api("/institutions/");
      setInstitutions(res.institutions || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api("/institutions/", {
        method: "POST",
        body: JSON.stringify({ name, location, type, bank_reference: bankRef })
      });
      setSuccess("Institution added successfully.");
      setName("");
      setLocation("");
      setBankRef("");
      loadInst();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading institutions...</div>;

  return (
    <div className="card" style={{ padding: "var(--space-6)" }}>
      <h2><Building2 size={24} style={{ marginRight: 8, verticalAlign: "middle" }}/>Manage Institutions</h2>
      <p style={{ color: "var(--on-surface-muted)", marginBottom: "var(--space-6)" }}>
        Add official institutions to ensure donor funds are routed safely according to BR2.
      </p>

      {error && <div className="alert"><AlertCircle size={16}/> {error}</div>}
      {success && <div className="notice"><CheckCircle2 size={16}/> {success}</div>}

      <form onSubmit={handleSubmit} style={{ marginBottom: "var(--space-6)", display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 200px" }}>
          <TextField label="Institution Name" value={name} onChange={setName} required />
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <TextField label="Location" value={location} onChange={setLocation} required />
        </div>
        <div className="field" style={{ flex: "1 1 150px" }}>
          <label className="field__label">Type</label>
          <select className="field__select" value={type} onChange={e => setType(e.target.value)}>
            <option value="secondary">Secondary</option>
            <option value="university">University</option>
            <option value="tvet">TVET</option>
          </select>
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <TextField label="Bank Reference" value={bankRef} onChange={setBankRef} required />
        </div>
        <Button type="submit" loading={saving}><Save size={16}/> Add</Button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "var(--space-2)" }}>ID</th>
            <th style={{ padding: "var(--space-2)" }}>Name</th>
            <th style={{ padding: "var(--space-2)" }}>Location</th>
            <th style={{ padding: "var(--space-2)" }}>Type</th>
            <th style={{ padding: "var(--space-2)" }}>Bank Ref</th>
          </tr>
        </thead>
        <tbody>
          {institutions.map(inst => (
            <tr key={inst.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "var(--space-2)" }}>{inst.id}</td>
              <td style={{ padding: "var(--space-2)", fontWeight: 600 }}>{inst.name}</td>
              <td style={{ padding: "var(--space-2)" }}>{inst.location}</td>
              <td style={{ padding: "var(--space-2)", textTransform: "capitalize" }}>{inst.type}</td>
              <td style={{ padding: "var(--space-2)" }}>{inst.bank_reference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
