import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { apiFetch } from "../lib/api";

const LS_KEY = "expense-demo-guided-v1";

export default function GuidedDemoModal() {
  const navigate = useNavigate();
  const { user, switchDemoRole } = useAuth();

  const shouldShow = useMemo(() => {
    const v = localStorage.getItem(LS_KEY);
    return !v;
  }, []);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (shouldShow) setOpen(true);
  }, [shouldShow]);

  const close = () => {
    localStorage.setItem(LS_KEY, "seen");
    setOpen(false);
  };

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      // Ensure demo data exists
      await apiFetch("/api/demo/reset", { method: "POST" });
      await switchDemoRole("EMPLOYEE");
      close();
      navigate("/reports");
    } catch (e) {
      setError(e.message || "Failed to start demo");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Guided Demo</h2>
            <p className="text-sm text-slate-600 mt-1">
              This is a public demo. Data resets daily. Don&apos;t enter sensitive
              information.
            </p>
          </div>
          <button
            onClick={close}
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            Skip
          </button>
        </div>

        <ol className="mt-4 space-y-2 text-sm text-slate-700 list-decimal pl-5">
          <li>Create or open an expense report as an Employee</li>
          <li>Submit it (status becomes SUBMITTED)</li>
          <li>Switch role to Manager to approve or reject</li>
          <li>Review the report details and approval timeline</li>
        </ol>

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Current: {user ? `${user.name} (${user.role})` : "Not logged in"}
          </div>
          <button
            onClick={start}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-60"
          >
            {busy ? "Preparing..." : "Start demo"}
          </button>
        </div>
      </div>
    </div>
  );
}
