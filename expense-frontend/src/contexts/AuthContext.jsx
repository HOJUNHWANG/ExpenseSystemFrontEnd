// src/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { getInitialUserState } from "../utils/InitialUserState";
// NOTE: useContext is now imported only in useAuth.js

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // 1. STATE INITIALIZATION: Runs only once on mount. Solves the useEffect warning.
    const [user, setUser] = useState(getInitialUserState);

    // 2. SIDE EFFECT: Handles persistence only when 'user' state changes.
    useEffect(() => {
        if (user) {
            localStorage.setItem("expense-user", JSON.stringify(user));
        } else {
            // User is null (logged out), so we clean up localStorage.
            localStorage.removeItem("expense-user");
        }
    }, [user]); // Reruns whenever 'user' changes.

    const login = (userData) => {
        // ONLY update the state. The useEffect hook handles persistence.
        setUser(userData);
    };

    const logout = () => {
        // ONLY update the state. The useEffect hook handles persistence.
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
// DO NOT export useAuth from this file!