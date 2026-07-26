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
  Shield,
  Download,
  Check
} from "lucide-react";
import { api, Profile, Doc } from "../../lib/api";
import { stagger, fadeUp } from "../../lib/motion";
import { StudentLayout } from "./StudentLayout";

export function StudentDocuments() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeDocType, setActiveDocType] = useState<string>("id_card");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function handleFileUpload(file: File, type: string) {
    if (!profile) return;
    setError("");
    setSuccess("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", type);

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

  function triggerUpload(type: string) {
    setActiveDocType(type);
    fileRef.current?.click();
  }

  const isMinor = profile?.guardian_consent || (profile?.date_of_birth && (new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()) < 18);

  const getDocForType = (t: string) => docs.find((d) => d.doc_type === t);

  return (
    <StudentLayout>
      <motion.div variants={stagger} initial="hidden" animate="show">
        {/* Page Header */}
        <motion.div className="page-header" variants={fadeUp}>
          <p className="page-header__eyebrow">
            <Shield size={14} /> Document Upload Vault
          </p>
          <h1>Application Step 3: Document Vault</h1>
          <p>
            Ensure all documents are clear and legible. Encrypted local storage is active for secure handling.
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

        {/* Hidden File Input */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, activeDocType);
            e.target.value = "";
          }}
          style={{ display: "none" }}
        />

        <div style={{ display: "grid", gap: "var(--space-6)", gridTemplateColumns: "1fr" }}>
          {/* Main Document Vault Cards matching Figma */}
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            {/* 1. Government ID */}
            <motion.div className="card" variants={fadeUp}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "var(--step-0)", margin: 0 }}>1. Government ID / National Passport</h3>
                  <p style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", margin: "var(--space-1) 0 0" }}>
                    National ID, Passport, or Driver's License.
                  </p>
                </div>
                {getDocForType("id_card") ? (
                  <span className="badge badge--approved"><Check size={14} /> Uploaded</span>
                ) : (
                  <span className="badge badge--pending">Required</span>
                )}
              </div>

              {getDocForType("id_card") ? (
                <div className="doc-item" style={{ marginTop: "var(--space-3)" }}>
                  <FileCheck size={20} color="var(--emerald)" />
                  <div className="doc-item__info">
                    <div className="doc-item__name">{getDocForType("id_card")?.original_filename}</div>
                    <div className="doc-item__type">Verified Identification File</div>
                  </div>
                  <button className="btn btn--ghost btn--sm" onClick={() => deleteDoc(getDocForType("id_card")!.id)}>
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                </div>
              ) : (
                <div className="upload-zone" style={{ marginTop: "var(--space-3)", padding: "var(--space-4)" }} onClick={() => triggerUpload("id_card")}>
                  <Upload size={20} className="upload-zone__icon" />
                  <div className="upload-zone__title">Tap to upload or drag National ID photo here</div>
                  <div className="upload-zone__hint">JPG, PNG or PDF (Max 10MB)</div>
                </div>
              )}
            </motion.div>

            {/* 2. Academic Transcripts */}
            <motion.div className="card" variants={fadeUp}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "var(--step-0)", margin: 0 }}>2. Academic Transcripts</h3>
                  <p style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", margin: "var(--space-1) 0 0" }}>
                    Latest semester results or high school graduation certificate.
                  </p>
                </div>
                {getDocForType("transcript") ? (
                  <span className="badge badge--approved"><Check size={14} /> Uploaded</span>
                ) : (
                  <span className="badge badge--pending">Required</span>
                )}
              </div>

              {getDocForType("transcript") ? (
                <div className="doc-item" style={{ marginTop: "var(--space-3)" }}>
                  <FileCheck size={20} color="var(--emerald)" />
                  <div className="doc-item__info">
                    <div className="doc-item__name">{getDocForType("transcript")?.original_filename}</div>
                    <div className="doc-item__type">Academic Transcript File</div>
                  </div>
                  <button className="btn btn--ghost btn--sm" onClick={() => deleteDoc(getDocForType("transcript")!.id)}>
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                </div>
              ) : (
                <div className="upload-zone" style={{ marginTop: "var(--space-3)", padding: "var(--space-4)" }} onClick={() => triggerUpload("transcript")}>
                  <Upload size={20} className="upload-zone__icon" />
                  <div className="upload-zone__title">Tap to upload or drag Academic Transcript PDF</div>
                  <div className="upload-zone__hint">PDF or Image (Max 10MB)</div>
                </div>
              )}
            </motion.div>

            {/* 3. Financial Need Letter */}
            <motion.div className="card" variants={fadeUp}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "var(--step-0)", margin: 0 }}>3. Financial Need Letter</h3>
                  <p style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", margin: "var(--space-1) 0 0" }}>
                    Signed statement from local authority or community leader.
                  </p>
                </div>
                {getDocForType("recommendation") ? (
                  <span className="badge badge--approved"><Check size={14} /> Uploaded</span>
                ) : (
                  <span className="badge badge--pending">Required</span>
                )}
              </div>

              {getDocForType("recommendation") ? (
                <div className="doc-item" style={{ marginTop: "var(--space-3)" }}>
                  <FileCheck size={20} color="var(--emerald)" />
                  <div className="doc-item__info">
                    <div className="doc-item__name">{getDocForType("recommendation")?.original_filename}</div>
                    <div className="doc-item__type">Financial Need Verification</div>
                  </div>
                  <button className="btn btn--ghost btn--sm" onClick={() => deleteDoc(getDocForType("recommendation")!.id)}>
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                </div>
              ) : (
                <div className="upload-zone" style={{ marginTop: "var(--space-3)", padding: "var(--space-4)" }} onClick={() => triggerUpload("recommendation")}>
                  <Upload size={20} className="upload-zone__icon" />
                  <div className="upload-zone__title">Tap to upload Financial Need Statement</div>
                  <div className="upload-zone__hint">PDF or Image (Max 10MB)</div>
                </div>
              )}
            </motion.div>

            {/* 4. Guardian Consent Required Card (Matching Figma Dark Blue Box) */}
            <motion.div
              className="card"
              variants={fadeUp}
              style={{
                background: "linear-gradient(135deg, rgba(30, 89, 69, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)",
                border: "1px solid var(--primary-soft)"
              }}
            >
              <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
                <Shield size={24} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "var(--step-0)", color: "var(--on-surface)", marginBottom: "var(--space-1)" }}>
                    Guardian Consent Signed Document Required
                  </h3>
                  <p style={{ fontSize: "var(--step--1)", color: "var(--on-surface-muted)", marginBottom: "var(--space-4)" }}>
                    This applicant is under 18 years of age. A signed parental or legal guardian consent form must be uploaded to proceed with funding verification.
                  </p>

                  {getDocForType("guardian_consent") ? (
                    <div className="doc-item" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <FileCheck size={20} color="var(--emerald)" />
                      <div className="doc-item__info">
                        <div className="doc-item__name">{getDocForType("guardian_consent")?.original_filename}</div>
                        <div className="doc-item__type">Signed Guardian Form Verified</div>
                      </div>
                      <button className="btn btn--ghost btn--sm" onClick={() => deleteDoc(getDocForType("guardian_consent")!.id)}>
                        <Trash2 size={14} color="var(--danger)" />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => alert("Downloading Official Guardian Consent Template (PDF)...")}
                      >
                        <Download size={14} /> Download Template
                      </button>
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => triggerUpload("guardian_consent")}
                      >
                        <Upload size={14} /> Upload Signed Form
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </StudentLayout>
  );
}
