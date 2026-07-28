import {
  LayoutDashboard,
  UserRound,
  FileText,
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
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export type NavItem = {
  to: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  /** Shown in the mobile bar. Max 5 per role, so only the essentials. */
  primary?: boolean;
};

/** One navigation map for the whole product. Settings sits last for every role. */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  student: [
    { to: "/student", labelKey: "nav.overview", icon: LayoutDashboard, primary: true },
    { to: "/student/profile", labelKey: "nav.myProfile", icon: UserRound, primary: true },
    { to: "/student/documents", labelKey: "nav.documents", icon: FileText, primary: true },
    { to: "/student/settings", labelKey: "nav.settings", icon: Settings, primary: true },
  ],
  ambassador: [
    { to: "/ambassador", labelKey: "nav.overview", icon: LayoutDashboard, primary: true },
    { to: "/ambassador/students", labelKey: "nav.myStudents", icon: Users, primary: true },
    { to: "/ambassador/enroll", labelKey: "nav.enroll", icon: UserRound, primary: true },
    { to: "/ambassador/settings", labelKey: "nav.settings", icon: Settings, primary: true },
  ],
  donor: [
    { to: "/donor", labelKey: "nav.overview", icon: LayoutDashboard, primary: true },
    { to: "/donor/browse", labelKey: "nav.findStudents", icon: Search, primary: true },
    { to: "/donor/giving", labelKey: "nav.myGiving", icon: HeartHandshake, primary: true },
    { to: "/donor/settings", labelKey: "nav.settings", icon: Settings, primary: true },
  ],
  admin: [
    { to: "/admin", labelKey: "nav.overview", icon: LayoutDashboard, primary: true },
    { to: "/admin/queue", labelKey: "nav.reviewQueue", icon: ShieldCheck, primary: true },
    { to: "/admin/users", labelKey: "nav.userAccounts", icon: Users, primary: true },
    { to: "/admin/analytics", labelKey: "nav.analytics", icon: BarChart3 },
    { to: "/admin/institutions", labelKey: "nav.institutions", icon: Building2 },
    { to: "/admin/tickets", labelKey: "nav.tickets", icon: Receipt },
    { to: "/admin/audit", labelKey: "nav.auditTrail", icon: ScrollText },
    { to: "/admin/settings", labelKey: "nav.settings", icon: Settings, primary: true },
  ],
};

export const ROLE_LABEL_KEY: Record<Role, TranslationKey> = {
  student: "role.student",
  ambassador: "role.ambassador",
  donor: "role.donor",
  admin: "role.admin",
};

/** English fallback for non-translated call sites (e.g. plain-text toasts). */
export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  ambassador: "Community ambassador",
  donor: "Donor",
  admin: "Administrator",
};
