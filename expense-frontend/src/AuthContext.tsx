/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { apiFetch } from "./lib/api";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  loginWithEmail: (email: string) => Promise<User>;
  switchDemoRole: (role: string) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const DEMO_USERS: Record<string, { email: string; label: string }> = {
  EMPLOYEE: { email: "jun@example.com", label: "Employee" },
  MANAGER: { email: "manager@example.com", label: "Manager" },
  CFO: { email: "finance@example.com", label: "CFO" },
  CEO: { email: "ceo@example.com", label: "CEO" },
};

// Phase 3: sessionStorage helper — exported so api.ts can inject headers
export function getSessionUser(): User | null {
  const saved = sessionStorage.getItem("expense-user");
  if (!saved) return null;
  try {
    return JSON.parse(saved) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Phase 3: Use sessionStorage instead of localStorage (closes on tab close)
  const [user, setUser] = useState<User | null>(() => getSessionUser());

  const login = useCallback((userData: User) => {
    setUser(userData);
    sessionStorage.setItem("expense-user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("expense-user");
  }, []);

  const loginWithEmail = useCallback(
    async (email: string): Promise<User> => {
      const data = (await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email }),
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
