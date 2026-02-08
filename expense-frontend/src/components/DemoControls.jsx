import { useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../AuthContext";

export default function DemoControls() {
  const { user, switchDemoRole } = useAuth();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const resetDemo = async () => {
    setBusy(true);
    setToast("");
    try {
      await apiFetch("/api/demo/reset", { method: "POST" });
      // Re-login current role (so IDs are always valid after reset)
      const role = user?.role || "EMPLOYEE";
      await switchDemoRole(role);
      setToast("Demo data reset.");
      setTimeout(() => setToast(""), 2200);
    } catch (e) {
      setToast(e.message || "Reset failed");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {toast && (
        <span className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">
          {toast}
        </span>
      )}
      <button
        onClick={resetDemo}
        disabled={busy}
        className="text-[11px] px-2 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60"
        title="Reset demo workspace and reload sample data"
      >
        {busy ? "Resetting..." : "Reset demo"}
      </button>
    </div>
  );
}
