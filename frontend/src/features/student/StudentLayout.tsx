import { useState, ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  UserCircle,
  FileText,
  Activity,
  LogOut,
  Bell,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { fadeUp } from "../../lib/motion";

const NAV_ITEMS = [
  { to: "/student", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/student/profile", icon: UserCircle, label: "My Profile", end: false },
  { to: "/student/documents", icon: FileText, label: "Documents", end: false },
  { to: "/student/status", icon: Activity, label: "Application Status", end: false },
  { to: "/student/settings", icon: Settings, label: "Settings", end: false },
];

export function StudentLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  function handleLogout() {
    logout();
    nav("/login");
  }

  return (
    <div className="shell">
      {/* Mobile hamburger */}
      <button
        className="sidebar__toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? " sidebar--open" : ""}`}>
        <div className="sidebar__brand">
          iga<span>Fund</span>
        </div>

        <nav className="sidebar__nav">
          <span className="sidebar__section">Student</span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar__link${isActive ? " sidebar__link--active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{initials}</div>
            <div>
              <div className="sidebar__name">{user?.full_name}</div>
              <div className="sidebar__email">{user?.email}</div>
            </div>
          </div>
          <button
            className="btn btn--ghost btn--sm btn--block"
            onClick={handleLogout}
            style={{ marginTop: "var(--space-3)" }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <motion.div
        className="shell__content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
