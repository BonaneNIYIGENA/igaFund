import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { MotionConfig } from "framer-motion";
import { Toaster, toast } from "sonner";
import { api } from "@/lib/api";
import { syncOfflineDrafts } from "@/lib/offline";
import { ThemeProvider } from "@/lib/theme";
import { LocaleProvider } from "@/lib/i18n";
import { AuthProvider, useAuth, HOME_FOR_ROLE } from "@/features/auth/AuthContext";
import { Protected } from "@/features/auth/guard";
import { WatchlistProvider } from "@/features/donor/WatchlistContext";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

import { Landing } from "@/features/landing/Landing";
import { Help } from "@/features/help/Help";
import { BrowseStudents } from "@/features/browse/BrowseStudents";

import { Login } from "@/features/auth/Login";
import { Register } from "@/features/auth/Register";
import { ForgotPassword } from "@/features/auth/ForgotPassword";
import { ResetPassword } from "@/features/auth/ResetPassword";

import { StudentDashboard } from "@/features/student/StudentDashboard";
import { StudentProfile } from "@/features/student/StudentProfile";
import { StudentDocuments } from "@/features/student/StudentDocuments";

import { AmbassadorDashboard } from "@/features/ambassador/AmbassadorDashboard";
import { AmbassadorStudents } from "@/features/ambassador/AmbassadorStudents";
import { AmbassadorEnroll } from "@/features/ambassador/AmbassadorEnroll";

import { DonorDashboard } from "@/features/donor/DonorDashboard";
import { DonorBrowse } from "@/features/donor/DonorBrowse";
import { DonorGiving } from "@/features/donor/DonorGiving";

import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { AdminQueue } from "@/features/admin/AdminQueue";
import { AdminInstitutions } from "@/features/admin/AdminInstitutions";
import { AdminAudit } from "@/features/admin/AdminAudit";
import { AdminUsers } from "@/features/admin/AdminUsers";
import { AdminTickets } from "@/features/admin/AdminTickets";

import { AccountSettings } from "@/features/settings/AccountSettings";

// Charts pull in a large plotting library that only administrators ever load.
// Keeping it out of the entry bundle matters on the low-end Android phones
// most students and ambassadors are using.
const AdminAnalytics = lazy(() =>
  import("@/features/admin/AdminAnalytics").then((m) => ({ default: m.AdminAnalytics })),
);

import { LoadingScreen } from "@/components/ui/LoadingScreen";

function RouteFallback() {
  return <LoadingScreen />;
}

/** Sends a signed-in user to their own home. */
function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_FOR_ROLE[user.role]} replace />;
}

// The marketing/landing page is for web visitors only. Inside the Android
// app (student/ambassador only), there is nothing to market to — go
// straight to sign-in.
const isNativeApp = Capacitor.isNativePlatform();

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
      <ThemeProvider>
        <LocaleProvider>
          <BrowserRouter>
            <AuthProvider>
              <WatchlistProvider>
                <OfflineSync />
                <OfflineBanner />
                <Toaster
                  position="bottom-center"
                  closeButton
                  toastOptions={{
                    classNames: {
                      toast:
                        "!rounded-md !border !border-line !bg-surface !text-body !shadow-lg !font-sans",
                      title: "!text-ink !font-semibold",
                      description: "!text-muted",
                    },
                  }}
                />

                <Routes>
                  {/* Public */}
                  <Route path="/" element={isNativeApp ? <Navigate to="/login" replace /> : <Landing />} />
                  {/* :id opens this same directory with the profile panel over it —
                      there is no separate full-page detail view to keep in sync. */}
                  <Route path="/students" element={<BrowseStudents />} />
                  <Route path="/students/:id" element={<BrowseStudents />} />
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
                  {/* Progress is now a tab on the profile page, not its own route. */}
                  <Route path="/student/status" element={<Navigate to="/student/profile?tab=progress" replace />} />
                  <Route path="/student/settings" element={<Protected roles={["student"]}><AccountSettings /></Protected>} />

                  {/* Ambassador */}
                  <Route path="/ambassador" element={<Protected roles={["ambassador"]}><AmbassadorDashboard /></Protected>} />
                  <Route path="/ambassador/students" element={<Protected roles={["ambassador"]}><AmbassadorStudents /></Protected>} />
                  <Route path="/ambassador/enroll" element={<Protected roles={["ambassador"]}><AmbassadorEnroll /></Protected>} />
                  <Route path="/ambassador/settings" element={<Protected roles={["ambassador"]}><AccountSettings /></Protected>} />

                  {/* Donor */}
                  <Route path="/donor" element={<Protected roles={["donor"]}><DonorDashboard /></Protected>} />
                  <Route path="/donor/browse" element={<Protected roles={["donor"]}><DonorBrowse /></Protected>} />
                  <Route path="/donor/giving" element={<Protected roles={["donor"]}><DonorGiving /></Protected>} />
                  {/* Old link kept alive: receipts now live inside the merged giving page. */}
                  <Route path="/donor/receipts" element={<Navigate to="/donor/giving" replace />} />
                  <Route path="/donor/settings" element={<Protected roles={["donor"]}><AccountSettings /></Protected>} />

                  {/* Admin */}
                  <Route path="/admin" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} />
                  <Route path="/admin/queue" element={<Protected roles={["admin"]}><AdminQueue /></Protected>} />
                  <Route path="/admin/users" element={<Protected roles={["admin"]}><AdminUsers /></Protected>} />
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
                  <Route path="/admin/tickets" element={<Protected roles={["admin"]}><AdminTickets /></Protected>} />
                  <Route path="/admin/audit" element={<Protected roles={["admin"]}><AdminAudit /></Protected>} />
                  <Route path="/admin/settings" element={<Protected roles={["admin"]}><AccountSettings /></Protected>} />

                  {/* Deep links from notifications land on the reviewer's queue. */}
                  <Route path="/admin/profiles/:id" element={<Protected roles={["admin"]}><AdminQueue /></Protected>} />

                  <Route path="/dashboard" element={<Protected><RoleHome /></Protected>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </WatchlistProvider>
            </AuthProvider>
          </BrowserRouter>
        </LocaleProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
