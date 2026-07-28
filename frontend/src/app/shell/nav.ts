import {
  LayoutDashboard,
  UserRound,
  FileText,
  Route,
  Settings,
  Users,
  ShieldCheck,
  HeartHandshake,
  Receipt,
  Building2,
  ScrollText,
  BarChart3,
  Search,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/api";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bar. Max 5 per role, so only the essentials. */
  primary?: boolean;
};

/** One navigation map for the whole product. */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  student: [
    { to: "/student", label: "Overview", icon: LayoutDashboard, primary: true },
    { to: "/student/profile", label: "My profile", icon: UserRound, primary: true },
    { to: "/student/documents", label: "Documents", icon: FileText, primary: true },
    { to: "/student/status", label: "Progress", icon: Route, primary: true },
    { to: "/student/settings", label: "Settings", icon: Settings },
  ],
  ambassador: [
    { to: "/ambassador", label: "Overview", icon: LayoutDashboard, primary: true },
    { to: "/ambassador/students", label: "My students", icon: Users, primary: true },
    { to: "/ambassador/enroll", label: "Enroll", icon: UserRound, primary: true },
    { to: "/ambassador/tickets", label: "Tickets", icon: Receipt, primary: true },
  ],
  donor: [
    { to: "/donor", label: "Overview", icon: LayoutDashboard, primary: true },
    { to: "/donor/browse", label: "Find students", icon: Search, primary: true },
    { to: "/donor/giving", label: "My giving", icon: HeartHandshake, primary: true },
    { to: "/donor/receipts", label: "Receipts", icon: Receipt, primary: true },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, primary: true },
    { to: "/admin/queue", label: "Review queue", icon: ShieldCheck, primary: true },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3, primary: true },
    { to: "/admin/institutions", label: "Institutions", icon: Building2, primary: true },
    { to: "/admin/audit", label: "Audit trail", icon: ScrollText },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  ambassador: "Community ambassador",
  donor: "Donor",
  admin: "Administrator",
};
