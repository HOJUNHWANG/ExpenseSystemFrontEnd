import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, DEMO_USERS } from "../AuthContext";

export default function RoleSwitcher() {
  const { user, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState(null);

  const currentRole = user?.role || "";

  const onSwitch = async (role) => {
    try {
      setLoadingRole(role);
      await switchDemoRole(role);
      // Role switching can leave some pages in a half-loaded state (race between auth + data fetch).
      // For demo stability, always return to dashboard after switching roles.
      navigate("/dashboard", { replace: true });
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">View as</span>
      <div className="grid grid-cols-2 gap-1">
        {Object.keys(DEMO_USERS).map((role) => {
          const active = currentRole === role;
          return (
            <button
              key={role}
              onClick={() => onSwitch(role)}
              disabled={loadingRole !== null}
              className={
                "text-[11px] px-2 py-1 rounded-lg border " +
                (active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border hover:bg-muted/50") +
                (loadingRole === role ? " opacity-70" : "")
              }
              title={DEMO_USERS[role].email}
            >
              {DEMO_USERS[role].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
