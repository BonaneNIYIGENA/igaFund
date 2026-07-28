import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster, toast } from "sonner";
import { api } from "@/lib/api";
import { syncOfflineDrafts } from "@/lib/offline";
import { AuthProvider, useAuth, HOME_FOR_ROLE } from "@/features/auth/AuthContext";
import { Protected } from "@/features/auth/guard";

import { Landing } from "@/features/landing/Landing";
import { Help } from "@/features/help/Help";
import { BrowseStudents } from "@/features/browse/BrowseStudents";
import { StudentDetail } from "@/features/browse/StudentDetail";

import { Login } from "@/features/auth/Login";
import { Register } from "@/features/auth/Register";
import { ForgotPassword } from "@/features/auth/ForgotPassword";
import { ResetPassword } from "@/features/auth/ResetPassword";

import { StudentDashboard } from "@/features/student/StudentDashboard";
import { StudentProfile } from "@/features/student/StudentProfile";
import { StudentDocuments } from "@/features/student/StudentDocuments";
import { StudentStatus } from "@/features/student/StudentStatus";
import { StudentSettings } from "@/features/student/StudentSettings";

import { AmbassadorDashboard } from "@/features/ambassador/AmbassadorDashboard";
import { AmbassadorStudents } from "@/features/ambassador/AmbassadorStudents";
import { AmbassadorEnroll } from "@/features/ambassador/AmbassadorEnroll";
import { AmbassadorTickets } from "@/features/ambassador/AmbassadorTickets";

import { DonorDashboard } from "@/features/donor/DonorDashboard";
import { DonorBrowse } from "@/features/donor/DonorBrowse";
import { DonorGiving } from "@/features/donor/DonorGiving";
import { DonorReceipts } from "@/features/donor/DonorReceipts";

import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { AdminQueue } from "@/features/admin/AdminQueue";
import { AdminInstitutions } from "@/features/admin/AdminInstitutions";
import { AdminAudit } from "@/features/admin/AdminAudit";

// Charts pull in a large plotting library that only administrators ever load.
// Keeping it out of the entry bundle matters on the low-end Android phones
// most students and ambassadors are using.
const AdminAnalytics = lazy(() =>
  import("@/features/admin/AdminAnalytics").then((m) => ({ default: m.AdminAnalytics })),
);

function RouteFallback() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas" role="status" aria-label="Loading">
      <span className="size-8 animate-spin rounded-full border-[3px] border-forest-200 border-t-forest-700" />
    </div>
  );
}

/** Sends a signed-in user to their own home. */
function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_FOR_ROLE[user.role]} replace />;
}

function OfflineSync() {
  useEffect(() => {
    async function handleOnline() {
      const synced = await syncOfflineDrafts(api).catch(() => 0);
      if (synced > 0) {
        toast.success(
          synced === 1 ? "Your saved work has been submitted" : `${synced} saved items submitted`,
          { description: "You're back online and everything queued has gone through." },
        );
      }
    }

    window.addEventListener("online", handleOnline);
    // Also drain anything left over from a previous session.
    if (navigator.onLine) handleOnline();

    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <OfflineSync />
          <Toaster
            position="bottom-center"
            closeButton
            toastOptions={{
              classNames: {
                toast:
                  "!rounded-md !border !border-line !bg-white !text-body !shadow-lg !font-sans",
                title: "!text-forest-900 !font-semibold",
                description: "!text-muted",
              },
            }}
          />

          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/students" element={<BrowseStudents />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/help" element={<Help />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Student */}
            <Route path="/student" element={<Protected roles={["student"]}><StudentDashboard /></Protected>} />
            <Route path="/student/profile" element={<Protected roles={["student"]}><StudentProfile /></Protected>} />
            <Route path="/student/documents" element={<Protected roles={["student"]}><StudentDocuments /></Protected>} />
            <Route path="/student/status" element={<Protected roles={["student"]}><StudentStatus /></Protected>} />
            <Route path="/student/settings" element={<Protected roles={["student"]}><StudentSettings /></Protected>} />

            {/* Ambassador */}
            <Route path="/ambassador" element={<Protected roles={["ambassador"]}><AmbassadorDashboard /></Protected>} />
            <Route path="/ambassador/students" element={<Protected roles={["ambassador"]}><AmbassadorStudents /></Protected>} />
            <Route path="/ambassador/enroll" element={<Protected roles={["ambassador"]}><AmbassadorEnroll /></Protected>} />
            <Route path="/ambassador/tickets" element={<Protected roles={["ambassador"]}><AmbassadorTickets /></Protected>} />

            {/* Donor */}
            <Route path="/donor" element={<Protected roles={["donor"]}><DonorDashboard /></Protected>} />
            <Route path="/donor/browse" element={<Protected roles={["donor"]}><DonorBrowse /></Protected>} />
            <Route path="/donor/giving" element={<Protected roles={["donor"]}><DonorGiving /></Protected>} />
            <Route path="/donor/receipts" element={<Protected roles={["donor"]}><DonorReceipts /></Protected>} />

            {/* Admin */}
            <Route path="/admin" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} />
            <Route path="/admin/queue" element={<Protected roles={["admin"]}><AdminQueue /></Protected>} />
            <Route
              path="/admin/analytics"
              element={
                <Protected roles={["admin"]}>
                  <Suspense fallback={<RouteFallback />}>
                    <AdminAnalytics />
                  </Suspense>
                </Protected>
              }
            />
            <Route path="/admin/institutions" element={<Protected roles={["admin"]}><AdminInstitutions /></Protected>} />
            <Route path="/admin/audit" element={<Protected roles={["admin"]}><AdminAudit /></Protected>} />

            {/* Deep links from notifications land on the reviewer's queue. */}
            <Route path="/admin/profiles/:id" element={<Protected roles={["admin"]}><AdminQueue /></Protected>} />

            <Route path="/dashboard" element={<Protected><RoleHome /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
