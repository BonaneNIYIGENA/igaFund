import { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";

type Props = {
  children: ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

export function Button({ children, type = "button", variant = "primary", block, loading, disabled, className = "", style, onClick }: Props) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.98 }}
      style={style}
      className={`btn btn--${variant}${block ? " btn--block" : ""}${className ? ` ${className}` : ""}`}
    >
      {loading && <span className="btn__spinner" aria-hidden />}
      {children}
    </motion.button>
  );
}
