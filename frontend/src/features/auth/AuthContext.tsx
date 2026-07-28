import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type Role, type User } from "@/lib/api";

type RegisterPayload = { email: string; full_name: string; password: string; role: Role };

type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  requestReset: (email: string) => Promise<void>;
  confirmReset: (token: string, password: string) => Promise<void>;
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

  // restore session from a stored token on first load
  useEffect(() => {
    if (localStorage.getItem("access")) {
      api("/auth/me")
        .then((d) => setUser(d.user))
        .catch(() => {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function persist(data: { access: string; refresh: string; user: User }) {
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setUser(data.user);
    return data.user;
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
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  }

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas" role="status" aria-label="Loading igaFund">
        <div className="flex flex-col items-center gap-4">
          <span className="size-9 animate-spin rounded-full border-[3px] border-forest-200 border-t-forest-700" />
          <span className="font-display text-lg text-forest-800">igaFund</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, requestReset, confirmReset, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
