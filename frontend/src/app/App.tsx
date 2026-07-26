import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { api } from "../lib/api";
import { syncOfflineDrafts } from "../lib/offline";
import { AuthProvider, useAuth } from "../features/auth/AuthContext";
import { Login } from "../features/auth/Login";
import { Register } from "../features/auth/Register";
import { ForgotPassword } from "../features/auth/ForgotPassword";
import { ResetPassword } from "../features/auth/ResetPassword";
import { Protected } from "../features/auth/guard";
import { StudentDashboard } from "../features/student/StudentDashboard";
import { StudentProfile } from "../features/student/StudentProfile";
import { StudentDocuments } from "../features/student/StudentDocuments";
import { StudentStatus } from "../features/student/StudentStatus";
import { StudentSettings } from "../features/student/StudentSettings";
import { DonorDashboard } from "../features/donor/DonorDashboard";
import { AdminDashboard } from "../features/admin/AdminDashboard";
import { AmbassadorDashboard } from "../features/ambassador/AmbassadorDashboard";
import { Dashboard } from "./Dashboard";
import { Landing } from "../features/landing/Landing";

function RoleRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "student":
      return <Navigate to="/student" replace />;
    case "donor":
      return <Navigate to="/donor" replace />;
    case "admin":
      return <Navigate to="/admin" replace />;
    case "ambassador":
      return <Navigate to="/ambassador" replace />;
    default:
      return <Dashboard />;
  }
}

export function App() {
  useEffect(() => {
    function handleOnline() {
      syncOfflineDrafts(api).catch(console.error);
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Role Dashboards */}
            <Route path="/student" element={<Protected roles={["student"]}><StudentDashboard /></Protected>} />
            <Route path="/student/profile" element={<Protected roles={["student"]}><StudentProfile /></Protected>} />
            <Route path="/student/documents" element={<Protected roles={["student"]}><StudentDocuments /></Protected>} />
            <Route path="/student/status" element={<Protected roles={["student"]}><StudentStatus /></Protected>} />
            <Route path="/student/settings" element={<Protected roles={["student"]}><StudentSettings /></Protected>} />

            <Route path="/donor" element={<Protected roles={["donor"]}><DonorDashboard /></Protected>} />
            <Route path="/admin" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} />
            <Route path="/ambassador" element={<Protected roles={["ambassador"]}><AmbassadorDashboard /></Protected>} />

            {/* Root — role-based redirect */}
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Protected><RoleRouter /></Protected>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MotionConfig>
  );
}
