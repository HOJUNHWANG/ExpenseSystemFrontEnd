/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { apiFetch } from "./lib/api";
import { getSessionUser, setSessionUser, clearSessionUser } from "./lib/session";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  loginWithEmail: (email: string, password?: string) => Promise<User>;
  switchDemoRole: (role: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const DEMO_USERS: Record<string, { email: string; label: string }> = {
  EMPLOYEE: { email: "jun@example.com", label: "Employee" },
  MANAGER: { email: "manager@example.com", label: "Manager" },
  CFO: { email: "finance@example.com", label: "CFO" },
  CEO: { email: "ceo@example.com", label: "CEO" },
};

// Re-export so other modules can import from AuthContext without knowing about session.ts
export { getSessionUser } from "./lib/session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getSessionUser());

  const login = useCallback((userData: User) => {
    setUser(userData);
    setSessionUser(userData);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearSessionUser();
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password = "demo1234"): Promise<User> => {
      const data = (await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })) as User;
      login(data);
      return data;
    },
    [login]
  );

  const switchDemoRole = useCallback(
    async (role: string): Promise<User> => {
      const entry = DEMO_USERS[role];
      if (!entry) throw new Error(`Unknown role: ${role}`);
      return loginWithEmail(entry.email);
    },
    [loginWithEmail]
  );

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loginWithEmail, switchDemoRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
