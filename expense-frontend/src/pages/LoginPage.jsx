// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function LoginPage() {
    const [email, setEmail] = useState("jun@example.com");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { loginWithEmail } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/reports";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await loginWithEmail(email);
            navigate(from, { replace: true });
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white shadow-lg rounded-xl p-6">
            <h1 className="text-xl font-semibold mb-4">Login</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jun@example.com"
                    />
                </div>

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            <div className="mt-4 text-xs text-slate-500">
                Demo users:
                <ul className="list-disc ml-5">
                    <li>jun@example.com (EMPLOYEE)</li>
                    <li>manager@example.com (MANAGER)</li>
                    <li>finance@example.com (FINANCE)</li>
                </ul>
            </div>
        </div>
    );
}
