import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../../lib/api";

type User = { id: number; email: string; role: string; full_name: string };
type RegisterPayload = { email: string; full_name: string; password: string; role: string };
type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  requestReset: (email: string) => Promise<void>;
  confirmReset: (token: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // restore session from a stored token on first load
  useEffect(() => {
    if (localStorage.getItem("access")) {
      api("/auth/me")
        .then((d) => setUser(d.user))
        .catch(() => localStorage.removeItem("access"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function persist(data: { access: string; refresh: string; user: User }) {
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setUser(data.user);
  }

  async function login(email: string, password: string) {
    persist(await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }));
  }

  async function register(payload: RegisterPayload) {
    persist(await api("/auth/register", { method: "POST", body: JSON.stringify(payload) }));
  }

  async function requestReset(email: string) {
    await api("/auth/password-reset/request", { method: "POST", body: JSON.stringify({ email }) });
  }

  async function confirmReset(token: string, password: string) {
    await api("/auth/password-reset/confirm", { method: "POST", body: JSON.stringify({ token, password }) });
  }

  function logout() {
    localStorage.clear();
    setUser(null);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--surface-sunk, #0a0c10)", color: "var(--primary, #10b981)" }}>
        <div className="btn__spinner" style={{ width: 32, height: 32 }} />
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
