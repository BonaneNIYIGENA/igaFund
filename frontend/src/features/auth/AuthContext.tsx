import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api, type Role, type User } from "@/lib/api";

type RegisterPayload = { email: string; full_name: string; password: string; role: Role };

type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  requestReset: (email: string) => Promise<void>;
  confirmReset: (token: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

/** Where each role lands after signing in. */
export const HOME_FOR_ROLE: Record<Role, string> = {
  student: "/student",
  donor: "/donor",
  admin: "/admin",
  ambassador: "/ambassador",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    if (localStorage.getItem("access")) {
      try {
        const d = await api("/auth/me");
        setUser(d.user);
      } catch {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
      }
    }
  }

  // restore session from a stored token on first load — the no-token branch
  // resolves synchronously so an anonymous visit never shows a loading frame.
  useEffect(() => {
    if (localStorage.getItem("access")) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // The API client fires this when a revoked/idle-timed-out session is
  // detected server-side, so the UI drops out of the authenticated state
  // even though nothing here made the request that discovered it.
  useEffect(() => {
    function onSessionExpired() {
      setUser((prev) => {
        if (prev) toast.error("Your session has ended. Sign in again to continue.");
        return null;
      });
    }
    window.addEventListener("iga:session-expired", onSessionExpired);
    return () => window.removeEventListener("iga:session-expired", onSessionExpired);
  }, []);

  function persist(data: { access: string; refresh: string; user: User }) {
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setUser(data.user);
    return data.user;
  }

  function updateUser(updatedUser: User) {
    setUser(updatedUser);
  }

  async function login(email: string, password: string) {
    return persist(await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }));
  }

  async function register(payload: RegisterPayload) {
    return persist(await api("/auth/register", { method: "POST", body: JSON.stringify(payload) }));
  }

  async function requestReset(email: string) {
    await api("/auth/password-reset/request", { method: "POST", body: JSON.stringify({ email }) });
  }

  async function confirmReset(token: string, password: string) {
    await api("/auth/password-reset/confirm", { method: "POST", body: JSON.stringify({ token, password }) });
  }

  function logout() {
    // Best-effort: revoke the session server-side so the token can't be replayed.
    // Local sign-out proceeds regardless of whether this call succeeds.
    api("/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  }

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas" role="status" aria-label="Loading igaFund">
        <div className="flex flex-col items-center gap-4">
          <span className="size-9 animate-spin rounded-full border-[3px] border-forest-200 border-t-forest-700" />
          <span className="font-display text-lg text-accent-ink">igaFund</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, requestReset, confirmReset, refreshUser, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
