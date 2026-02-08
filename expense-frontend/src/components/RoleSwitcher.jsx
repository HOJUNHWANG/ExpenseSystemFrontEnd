import { useState } from "react";
import { useAuth, DEMO_USERS } from "../AuthContext";

export default function RoleSwitcher() {
  const { user, switchDemoRole } = useAuth();
  const [loadingRole, setLoadingRole] = useState(null);

  const currentRole = user?.role || "";

  const onSwitch = async (role) => {
    try {
      setLoadingRole(role);
      await switchDemoRole(role);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">View as</span>
      {Object.keys(DEMO_USERS).map((role) => {
        const active = currentRole === role;
        return (
          <button
            key={role}
            onClick={() => onSwitch(role)}
            disabled={loadingRole !== null}
            className={
              "text-[11px] px-2 py-1 rounded-full border " +
              (active
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50") +
              (loadingRole === role ? " opacity-70" : "")
            }
            title={DEMO_USERS[role].email}
          >
            {DEMO_USERS[role].label}
          </button>
        );
      })}
    </div>
  );
}
