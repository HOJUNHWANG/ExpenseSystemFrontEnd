// src/RequireRole.jsx
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireRole({ roles, title = "Access restricted", children }) {
  const { user } = useAuth();
  const location = useLocation();

  const allow = (roles || []).map((r) => String(r).toUpperCase());

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = String(user.role || "").toUpperCase();
  const ok = allow.length === 0 || allow.includes(role);

  if (!ok) {
    return (
      <div className="rounded-2xl bg-card border shadow-sm p-6">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don’t have permission to view this page.
          {allow.length > 0 ? ` Allowed roles: ${allow.join(", ")}.` : ""}
        </p>
        <div className="mt-4">
          <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
