import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../AuthContext";
import { toast } from "sonner";

export default function DemoControls() {
  const { user, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const resetDemo = async () => {
    setBusy(true);
    try {
      await apiFetch("/api/demo/reset", { method: "POST" });
      const role = user?.role || "EMPLOYEE";
      await switchDemoRole(role);
      toast.success("Demo data reset.");
      navigate("/dashboard");
    } catch (e) {
      toast.error(e.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <button
        data-testid="demo-reset"
        onClick={resetDemo}
        disabled={busy}
        className="text-[11px] px-2 py-1 rounded-full border bg-background hover:bg-accent disabled:opacity-60"
        title="Reset demo workspace and reload sample data"
      >
        {busy ? "Resetting..." : "Reset demo"}
      </button>
    </div>
  );
}
