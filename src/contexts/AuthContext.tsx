import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import func2url from "../../backend/func2url.json";

type User = {
  id: number;
  email: string;
  name: string;
  provider: string;
  is_premium: boolean;
  premium_until: string | null;
};

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  sendCode: (email: string) => Promise<{ success?: boolean; error?: string }>;
  verifyCode: (email: string, code: string, name?: string) => Promise<{ success?: boolean; error?: string }>;
  oauthLogin: (provider: "google" | "apple" | "yandex", email: string, name: string) => Promise<{ success?: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

const TOKEN_KEY = "bo_auth_token";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const fetchMe = async (t: string) => {
    try {
      const r = await fetch(func2url.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": t },
        body: JSON.stringify({ action: "me" }),
      });
      const data = await r.json();
      if (data.user) setUser(data.user);
      else { localStorage.removeItem(TOKEN_KEY); setToken(null); }
    } catch { /* noop */ }
  };

  useEffect(() => {
    if (token) fetchMe(token).finally(() => setLoading(false));
    else setLoading(false);
  }, []);

  const sendCode = async (email: string) => {
    const r = await fetch(func2url.auth, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_code", email }),
    });
    return r.json();
  };

  const verifyCode = async (email: string, code: string, name?: string) => {
    const r = await fetch(func2url.auth, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_code", email, code, name }),
    });
    const data = await r.json();
    if (data.success && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const oauthLogin = async (provider: "google" | "apple" | "yandex", email: string, name: string) => {
    const r = await fetch(func2url.auth, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "oauth", provider, email, name }),
    });
    const data = await r.json();
    if (data.success && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    if (token) {
      await fetch(func2url.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ action: "logout" }),
      }).catch(() => { /* noop */ });
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const refresh = async () => { if (token) await fetchMe(token); };

  return (
    <AuthCtx.Provider value={{ user, token, loading, sendCode, verifyCode, oauthLogin, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
