import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, HOME_FOR_ROLE } from "./AuthContext";
import type { Role } from "@/lib/api";

/** Route guard. */
export function Protected({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={HOME_FOR_ROLE[user.role]} replace />;

  return <>{children}</>;
}
