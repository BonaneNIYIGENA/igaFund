import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, GraduationCap, Building2, Sparkles, CheckCircle2 } from "lucide-react";
import { stagger, fadeUp } from "../../lib/motion";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  foot?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, foot }: Props) {
  return (
    <div className="auth">
      {/* Background glowing ambient light orbs */}
      <div className="auth__orb auth__orb--1" aria-hidden />
      <div className="auth__orb auth__orb--2" aria-hidden />
      <div className="auth__orb auth__orb--3" aria-hidden />

      <div className="auth__container">
        {/* Left hero panel (visible on desktop) */}
        <div className="auth__hero">
          <div className="auth__brand">
            iga<span>Fund</span>
          </div>

          <div className="auth__hero-content">
            <div className="auth__hero-badge">
              <Sparkles size={14} />
              <span>Verified Crowdfunding Platform</span>
            </div>

            <h2 className="auth__hero-title">
              Empowering Education, <span>Direct to School.</span>
            </h2>

            <p className="auth__hero-desc">
              igaFund connects underprivileged students across Rwanda with global donors. Every contribution is verified and transferred straight to the school.
            </p>

            {/* Feature highlights */}
            <div className="auth__hero-features">
              <div className="auth__feature-card">
                <div className="auth__feature-icon">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h4>Verified Student Profiles</h4>
                  <p>Authentic academic transcripts & guardian consent verified by admins.</p>
                </div>
              </div>

              <div className="auth__feature-card">
                <div className="auth__feature-icon auth__feature-icon--amber">
                  <Building2 size={20} />
                </div>
                <div>
                  <h4>Direct Institution Routing</h4>
                  <p>100% of funded tuition goes directly to the school account, never a personal wallet.</p>
                </div>
              </div>

              <div className="auth__feature-card">
                <div className="auth__feature-icon auth__feature-icon--teal">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4>Transparent Audit Log</h4>
                  <p>Complete traceability for students, donors, and educational institutions.</p>
                </div>
              </div>
            </div>

            {/* Trust metrics */}
            <div className="auth__hero-stats">
              <div className="auth__hero-stat">
                <CheckCircle2 size={16} /> <span>100% Direct Transfer</span>
              </div>
              <div className="auth__hero-stat">
                <CheckCircle2 size={16} /> <span>Zero Personal Wallet Routing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right card wrap (form container) */}
        <div className="auth__card-wrap">
          {/* Mobile header brand */}
          <div className="auth__mobile-brand">
            iga<span>Fund</span>
          </div>

          <motion.div
            className="auth__glass"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.h1 variants={fadeUp}>{title}</motion.h1>
              <motion.p className="auth__sub" variants={fadeUp}>
                {subtitle}
              </motion.p>
              {children}
              {foot && (
                <motion.div className="auth__foot" variants={fadeUp}>
                  {foot}
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Footer trust bar for mobile */}
          <motion.div
            className="auth__trust-bar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span className="auth__trust-item">
              <ShieldCheck size={14} /> Admin Verified
            </span>
            <span className="auth__trust-item">
              <Building2 size={14} /> Direct to School
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
