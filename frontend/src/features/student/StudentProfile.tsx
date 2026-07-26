import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserCircle,
  GraduationCap,
  Shield,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { api, Profile } from "../../lib/api";
import { stagger, fadeUp } from "../../lib/motion";
import { StudentLayout } from "./StudentLayout";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { saveDraftOffline } from "../../lib/offline";

function calculateAge(dobStr: string): number | null {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function StudentProfile() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [institutions, setInstitutions] = useState<Array<{ id: number; name: string; location: string }>>([]);
  const [form, setForm] = useState({
    bio: "",
    date_of_birth: "",
    phone: "",
    institution_id: "",
    academic_level: "",
    field_of_study: "",
    funding_goal: "",
    guardian_name: "",
    guardian_phone: "",
    guardian_consent: false,
    video_url: "",
    media_consent: false,
  });

  useEffect(() => {
    Promise.all([
      api("/profiles/").then((d) => d.profiles?.[0]),
      api("/profiles/institutions").then((d) => d.institutions ?? []).catch(() => []),
    ])
      .then(([p, insts]) => {
        setInstitutions(insts);
        if (p) {
          setProfile(p);
          setForm({
            bio: p.bio ?? "",
            date_of_birth: p.date_of_birth ?? "",
            phone: p.phone ?? "",
            institution_id: p.institution?.id?.toString() ?? "",
            academic_level: p.academic_level ?? "",
            field_of_study: p.field_of_study ?? "",
            funding_goal: p.funding_goal?.toString() ?? "",
            guardian_name: p.guardian_name ?? "",
            guardian_phone: p.guardian_phone ?? "",
            guardian_consent: p.guardian_consent ?? false,
            video_url: p.video_url ?? "",
            media_consent: p.media_consent ?? false,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const payload = {
      ...form,
      funding_goal: parseFloat(form.funding_goal) || 0,
      date_of_birth: form.date_of_birth || undefined,
      institution_id: form.institution_id ? parseInt(form.institution_id, 10) : undefined,
    };

    try {
      if (profile) {
        const res = await api(`/profiles/${profile.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setProfile(res.profile);
      } else {
        const res = await api("/profiles/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setProfile(res.profile);
      }
      setSuccess("Profile saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
        const url = profile ? `/profiles/${profile.id}` : "/profiles/";
        const method = profile ? "PUT" : "POST";
        await saveDraftOffline(url, method, payload).catch(console.error);
        setSuccess("You are offline. Draft saved and will sync automatically when internet is restored.");
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitForReview() {
    if (!profile) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await api(`/profiles/${profile.id}/submit`, { method: "POST" });
      setProfile(res.profile);
      setSuccess("Profile submitted for review!");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isDraft = !profile || profile.status === "draft";
  const isReadOnly = profile && profile.status !== "draft";
  const age = calculateAge(form.date_of_birth);
  const isMinor = age === null || age < 18;

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
            <UserCircle size={14} /> My Profile
          </p>
          <h1>{profile ? "Edit your profile" : "Create your profile"}</h1>
          <p>
            {isDraft
              ? "Fill in your information below. You can save as draft and complete it later."
              : "Your profile has been submitted and cannot be edited."}
          </p>
        </motion.div>

        {/* Status banner */}
        {profile && profile.status !== "draft" && (
          <motion.div variants={fadeUp}>
            <div className={`notice${profile.status === "rejected" ? "" : ""}`} style={{ marginBottom: "var(--space-5)" }}>
              <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                {profile.status === "pending" && <><AlertCircle size={16} /> Your profile is under review.</>}
                {profile.status === "approved" && <><CheckCircle2 size={16} /> Your profile is verified and visible to donors.</>}
                {profile.status === "rejected" && <><AlertCircle size={16} /> {profile.review_note}</>}
              </p>
            </div>
          </motion.div>
        )}

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

        <form onSubmit={save}>
          {/* Section 1: Personal */}
          <motion.div className="card" variants={fadeUp} style={{ marginBottom: "var(--space-5)" }}>
            <div className="form-section">
              <h3 className="form-section__title">
                <span className="form-section__number">1</span>
                Personal Information
              </h3>
              <div className="form-row form-row--2">
                <div>
                  <TextField
                    label="Date of birth"
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={(v) => update("date_of_birth", v)}
                  />
                  {form.date_of_birth && age !== null && (
                    age < 18 ? (
                      <span className="badge badge--pending" style={{ marginTop: "var(--space-1)" }}>
                        <Shield size={12} /> Minor Student ({age} yrs old)
                      </span>
                    ) : (
                      <span className="badge badge--approved" style={{ marginTop: "var(--space-1)" }}>
                        <CheckCircle2 size={12} /> Adult Student ({age} yrs old)
                      </span>
                    )
                  )}
                </div>
                <TextField
                  label="Phone number"
                  name="phone"
                  type="tel"
                  placeholder="+250 7XX XXX XXX"
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                />
              </div>
              <div className="field" style={{ marginTop: "var(--space-4)" }}>
                <label className="field__label" htmlFor="bio">
                  Bio — tell your story
                </label>
                <textarea
                  id="bio"
                  className="field__textarea"
                  placeholder="Share a bit about yourself, your dreams, and why education matters to you..."
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  disabled={!!isReadOnly}
                  rows={4}
                />
              </div>
            </div>
          </motion.div>

          {/* Section 2: Academic */}
          <motion.div className="card" variants={fadeUp} style={{ marginBottom: "var(--space-5)" }}>
            <div className="form-section">
              <h3 className="form-section__title">
                <span className="form-section__number">2</span>
                Academic Details
              </h3>
              <div className="form-row form-row--2">
                <div className="field">
                  <label className="field__label" htmlFor="institution_id">
                    Educational Institution
                  </label>
                  <select
                    id="institution_id"
                    className="field__select"
                    value={form.institution_id}
                    onChange={(e) => update("institution_id", e.target.value)}
                    disabled={!!isReadOnly}
                  >
                    <option value="">Select institution</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.location})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="academic_level">
                    Academic level
                  </label>
                  <select
                    id="academic_level"
                    className="field__select"
                    value={form.academic_level}
                    onChange={(e) => update("academic_level", e.target.value)}
                    disabled={!!isReadOnly}
                  >
                    <option value="">Select level</option>
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
              </div>
              <div className="form-row form-row--2">
                <TextField
                  label="Field of study"
                  name="field_of_study"
                  placeholder="e.g. Computer Science"
                  value={form.field_of_study}
                  onChange={(v) => update("field_of_study", v)}
                />
                <TextField
                  label="Funding goal (RWF)"
                  name="funding_goal"
                  type="number"
                  placeholder="e.g. 500000"
                  value={form.funding_goal}
                  onChange={(v) => update("funding_goal", v)}
                />
              </div>
            </div>
          </motion.div>

          {/* Section 3: Age-Dependent Verification (Guardian for Minors, Video for Adults) */}
          <motion.div className="card" variants={fadeUp} style={{ marginBottom: "var(--space-5)" }}>
            <div className="form-section">
              {isMinor ? (
                <>
                  <h3 className="form-section__title">
                    <span className="form-section__number">3</span>
                    Guardian Verification (Required for Minors under 18)
                  </h3>
                  <div className="notice notice--warn" style={{ marginBottom: "var(--space-4)" }}>
                    <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                      <AlertCircle size={16} /> Under Rwandan protection rules, students under 18 require guardian consent. Personal visual media is restricted for minor privacy.
                    </p>
                  </div>
                  <div className="form-row form-row--2">
                    <TextField
                      label="Guardian name"
                      name="guardian_name"
                      placeholder="Full name of guardian"
                      value={form.guardian_name}
                      onChange={(v) => update("guardian_name", v)}
                    />
                    <TextField
                      label="Guardian phone"
                      name="guardian_phone"
                      type="tel"
                      placeholder="+250 7XX XXX XXX"
                      value={form.guardian_phone}
                      onChange={(v) => update("guardian_phone", v)}
                    />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer", marginTop: "var(--space-3)" }}>
                    <input
                      type="checkbox"
                      checked={form.guardian_consent}
                      onChange={(e) => update("guardian_consent", e.target.checked)}
                      disabled={!!isReadOnly}
                      style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
                    />
                    <span style={{ fontSize: "var(--step--1)" }}>
                      I confirm that my guardian has given consent for my educational funding profile to be verified and listed on igaFund.
                    </span>
                  </label>
                </>
              ) : (
                <>
                  <h3 className="form-section__title">
                    <span className="form-section__number">3</span>
                    Intro Video & Visual Media Consent (Adult Students 18+)
                  </h3>
                  <div className="notice" style={{ marginBottom: "var(--space-4)" }}>
                    <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                      <CheckCircle2 size={16} /> As an adult student (18+), you can share a short video introduction to present your story to potential donors.
                    </p>
                  </div>
                  <TextField
                    label="Intro video URL (YouTube, Vimeo, or video link)"
                    name="video_url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.video_url}
                    onChange={(v) => update("video_url", v)}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer", marginTop: "var(--space-3)" }}>
                    <input
                      type="checkbox"
                      checked={form.media_consent}
                      onChange={(e) => update("media_consent", e.target.checked)}
                      disabled={!!isReadOnly}
                      style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
                    />
                    <span style={{ fontSize: "var(--step--1)" }}>
                      I consent to displaying my introduction video and story on the public igaFund donor portal.
                    </span>
                  </label>
                </>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          {isDraft && (
            <motion.div variants={fadeUp} style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <Button type="submit" loading={saving}>
                <Save size={16} /> {profile ? "Save changes" : "Create profile"}
              </Button>
              {profile && (
                <Button
                  type="button"
                  variant="ghost"
                  loading={submitting}
                  onClick={submitForReview}
                >
                  <Send size={16} /> Submit for review
                </Button>
              )}
            </motion.div>
          )}
        </form>
      </motion.div>
    </StudentLayout>
  );
}
