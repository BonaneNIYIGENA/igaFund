import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRightLeft, ScrollText, GraduationCap, ArrowRight } from "lucide-react";
import "../../styles/landing.css";
import { Button } from "../../components/ui/Button";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="landing-header__brand">
          iga<span>Fund</span>
        </Link>
        <nav className="landing-header__nav">
          <a href="#mission" className="landing-header__link">Mission</a>
          <a href="#pillars" className="landing-header__link">How it Works</a>
        </nav>
        <div className="landing-header__actions">
          <Button variant="secondary" onClick={() => navigate("/login")}>
            Sign In
          </Button>
          <Button variant="primary" onClick={() => navigate("/register")}>
            Get Started
          </Button>
        </div>
      </header>

      <main>
        <section className="landing-hero" id="mission">
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            <motion.h1 className="landing-hero__title" variants={fadeUp}>
              Empowering Education, <br />
              <span>Direct to School.</span>
            </motion.h1>
            <motion.p className="landing-hero__subtitle" variants={fadeUp}>
              The Mastercard Foundation-inspired approach to educational funding. We connect verified underprivileged youth with global donors, ensuring 100% of contributions are routed directly to educational institutions.
            </motion.p>
            <motion.div className="landing-hero__actions" variants={fadeUp}>
              <Button variant="primary" onClick={() => navigate("/register")}>
                Fund a Student <ArrowRight size={18} style={{ marginLeft: "8px" }} />
              </Button>
              <Button variant="secondary" onClick={() => navigate("/register")}>
                Apply for Funding
              </Button>
            </motion.div>
          </motion.div>
        </section>

        <section className="landing-pillars" id="pillars">
          <div className="landing-pillars__container">
            <motion.div className="pillar-card" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <div className="pillar-card__icon">
                <ShieldCheck size={24} />
              </div>
              <h3 className="pillar-card__title">Verified Students</h3>
              <p className="pillar-card__desc">
                Every student profile is rigorously cross-checked with official academic transcripts and admissions letters by platform administrators to ensure authenticity.
              </p>
            </motion.div>

            <motion.div className="pillar-card" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <div className="pillar-card__icon">
                <ArrowRightLeft size={24} />
              </div>
              <h3 className="pillar-card__title">Direct Routing</h3>
              <p className="pillar-card__desc">
                We eliminate the risk of fund misuse. 100% of donor contributions bypass personal wallets and are transferred directly to the verified institution's bank account.
              </p>
            </motion.div>

            <motion.div className="pillar-card" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <div className="pillar-card__icon">
                <ScrollText size={24} />
              </div>
              <h3 className="pillar-card__title">Immutable Audit</h3>
              <p className="pillar-card__desc">
                Transparency is our core pillar. Every profile approval, verification note, and fund disbursement is recorded in an immutable system audit log accessible to donors.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="landing-impact">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <div className="landing-impact__stat">100%</div>
            <div className="landing-impact__label">
              of your contribution goes directly to the student's verified educational institution.
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} igaFund MVP. Built for radical transparency in educational funding.</p>
      </footer>
    </div>
  );
}
