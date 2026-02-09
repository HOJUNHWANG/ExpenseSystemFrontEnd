/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";
import { apiFetch } from "./lib/api";

const AuthContext = createContext(null);

export const DEMO_USERS = {
    EMPLOYEE: { email: "jun@example.com", label: "Employee" },
    MANAGER: { email: "manager@example.com", label: "Manager" },
    CFO: { email: "finance@example.com", label: "CFO" },
  CEO: { email: "ceo@example.com", label: "CEO" },
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("expense-user");
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch {
            return null;
        }
    });

    const login = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem("expense-user", JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem("expense-user");
    }, []);

    // Demo-friendly login: fetch user by email (backend demo endpoint)
    const loginWithEmail = useCallback(async (email) => {
        const data = await apiFetch("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
        login(data);
        return data;
    }, [login]);

    const switchDemoRole = useCallback(async (role) => {
        const entry = DEMO_USERS[role];
        if (!entry) throw new Error(`Unknown role: ${role}`);
        return loginWithEmail(entry.email);
    }, [loginWithEmail]);

    return (
        <AuthContext.Provider value={{ user, login, logout, loginWithEmail, switchDemoRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
