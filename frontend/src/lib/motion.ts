import type { Variants, Transition } from "framer-motion";

/** One motion vocabulary for the whole product. */

export const spring: Transition = { type: "spring", stiffness: 320, damping: 30, mass: 0.8 };
export const springSoft: Transition = { type: "spring", stiffness: 210, damping: 26 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: -8, transition: { duration: 0.14 } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.28 } },
  exit: { opacity: 0, transition: { duration: 0.14 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.12 } },
};

/** Lists and card grids: 40ms between children reads as one wave. */
export const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};

export const staggerSlow: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};

/** Route-level transition for dashboard content panes. */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { ...spring, staggerChildren: 0.04 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
};
