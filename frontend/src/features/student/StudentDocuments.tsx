import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  Trash2,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  File,
} from "lucide-react";
import { api, Profile, Doc } from "../../lib/api";
import { stagger, fadeUp } from "../../lib/motion";
import { StudentLayout } from "./StudentLayout";
import { Button } from "../../components/ui/Button";

const DOC_TYPES = [
  { value: "id_card", label: "ID Card / Passport" },
  { value: "transcript", label: "Academic Transcript" },
  { value: "recommendation", label: "Recommendation Letter" },
  { value: "guardian_consent", label: "Guardian Consent Letter" },
];

export function StudentDocuments() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("id_card");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const pRes = await api("/profiles/");
      const p = pRes.profiles?.[0];
      if (p) {
        setProfile(p);
        const dRes = await api(`/profiles/${p.id}/documents`);
        setDocs(dRes.documents ?? []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function upload(file: File) {
    if (!profile) return;
    setError("");
    setSuccess("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", docType);

    try {
      await api(`/profiles/${profile.id}/documents`, {
        method: "POST",
        body: fd,
      });
      setSuccess(`${file.name} uploaded successfully!`);
      setTimeout(() => setSuccess(""), 3000);
      const dRes = await api(`/profiles/${profile.id}/documents`);
      setDocs(dRes.documents ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteDoc(docId: number) {
    if (!profile) return;
    setError("");
    try {
      await api(`/profiles/${profile.id}/documents/${docId}`, { method: "DELETE" });
      setDocs((d) => d.filter((x) => x.id !== docId));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  const isDraft = profile?.status === "draft";
  const docTypeLabel = (t: string) =>
    DOC_TYPES.find((d) => d.value === t)?.label ?? t;

  if (loading) {
    return (
      <StudentLayout>
        <div className="empty-state">
          <div className="btn__spinner" style={{ width: 24, height: 24, borderColor: "var(--primary)", borderTopColor: "transparent", margin: "0 auto" }} />
        </div>
      </StudentLayout>
    );
  }

  if (!profile) {
    return (
      <StudentLayout>
        <div className="empty-state">
          <div className="empty-state__icon">
            <FileText size={28} />
          </div>
          <h3>No profile yet</h3>
          <p>Create your student profile first, then you can upload documents.</p>
          <a href="/student/profile" className="btn btn--primary">
            Create Profile
          </a>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div className="page-header" variants={fadeUp}>
          <p className="page-header__eyebrow">
            <FileText size={14} /> Documents
          </p>
          <h1>Verification Documents</h1>
          <p>
            Upload your documents to verify your identity and academic standing.
            Accepted formats: PDF, PNG, JPG (max 10 MB).
          </p>
        </motion.div>

        {error && (
          <motion.div className="alert" variants={fadeUp} style={{ marginBottom: "var(--space-4)" }}>
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}

        {success && (
          <motion.div className="notice" variants={fadeUp} style={{ marginBottom: "var(--space-4)" }}>
            <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <CheckCircle2 size={16} /> {success}
            </p>
          </motion.div>
        )}

        {/* Upload area */}
        {isDraft && (
          <motion.div className="card" variants={fadeUp} style={{ marginBottom: "var(--space-5)" }}>
            <div className="card__header">
              <h2 className="card__title">Upload a document</h2>
            </div>

            <div style={{ marginBottom: "var(--space-4)" }}>
              <label className="field__label" htmlFor="doc_type_select">Document type</label>
              <select
                id="doc_type_select"
                className="field__select"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                {DOC_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={`upload-zone${dragActive ? " upload-zone--active" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <div className="upload-zone__icon">
                <Upload size={22} />
              </div>
              <div className="upload-zone__title">
                {uploading ? "Uploading..." : "Click or drag a file here"}
              </div>
              <div className="upload-zone__hint">PDF, PNG, or JPG up to 10 MB</div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          </motion.div>
        )}

        {/* Documents list */}
        <motion.div className="card" variants={fadeUp}>
          <div className="card__header">
            <h2 className="card__title">Uploaded Documents</h2>
            <span className="badge badge--draft">{docs.length} file{docs.length !== 1 ? "s" : ""}</span>
          </div>

          {docs.length === 0 ? (
            <div className="empty-state" style={{ padding: "var(--space-6) var(--space-4)" }}>
              <div className="empty-state__icon">
                <File size={24} />
              </div>
              <h3 style={{ fontSize: "var(--step-1)" }}>No documents yet</h3>
              <p style={{ fontSize: "var(--step--1)" }}>Upload your first document to start the verification process.</p>
            </div>
          ) : (
            <div className="doc-list">
              {docs.map((doc) => (
                <div key={doc.id} className="doc-item">
                  <div className="doc-item__icon">
                    {doc.verified ? <FileCheck size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="doc-item__info">
                    <div className="doc-item__name">{doc.original_filename}</div>
                    <div className="doc-item__type">
                      {docTypeLabel(doc.doc_type)}
                      {doc.verified && (
                        <span style={{ color: "var(--success)", marginLeft: "var(--space-2)" }}>
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                  {isDraft && (
                    <div className="doc-item__actions">
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => deleteDoc(doc.id)}
                        aria-label={`Delete ${doc.original_filename}`}
                        style={{ color: "var(--danger)", borderColor: "var(--danger-soft)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </StudentLayout>
  );
}
