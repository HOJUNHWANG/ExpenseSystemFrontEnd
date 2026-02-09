import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, DEMO_USERS } from "../AuthContext";

function getEmailFromRole(role) {
  const entry = DEMO_USERS[role];
  return entry?.email || null;
}

export default function E2ELoginPage() {
  const { loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("Logging in…");

  useEffect(() => {
    // Only intended for CI/dev E2E. Keep it available in production builds too,
    // but it's harmless (uses demo login endpoint).
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const email = params.get("email");
      const role = params.get("role");
      const next = params.get("next") || "/dashboard";

      const resolvedEmail = email || (role ? getEmailFromRole(role) : null);
      if (!resolvedEmail) {
        setStatus("Missing email/role query param.");
        return;
      }

      try {
        await loginWithEmail(resolvedEmail);
        setStatus("Logged in. Redirecting…");
        navigate(next, { replace: true });
      } catch (e) {
        setStatus(e?.message || "Login failed");
      }
    };

    // eslint-disable-next-line no-void
    void run();
  }, [location.search, loginWithEmail, navigate]);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
      <h1 className="text-xl font-semibold text-slate-900">E2E Login</h1>
      <p className="mt-2 text-sm text-slate-600">{status}</p>
      <p className="mt-2 text-xs text-slate-400">
        (This page is used by automated Playwright tests to set a deterministic auth state.)
      </p>
    </div>
  );
}
