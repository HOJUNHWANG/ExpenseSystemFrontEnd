// Phase 8: Command Palette (Ctrl+K / Cmd+K)
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  FileText,
  Clock,
  Shield,
  CheckSquare,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { USER_ROLES } from "../lib/constants";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  roles?: string[];
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Toggle on Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const run = useCallback(
    (action: () => void) => {
      setOpen(false);
      setSearch("");
      action();
    },
    []
  );

  const commands: CommandItem[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: LayoutDashboard,
      action: () => navigate("/dashboard"),
    },
    {
      id: "create",
      label: "Create New Report",
      icon: PlusCircle,
      action: () => navigate("/create"),
    },
    {
      id: "search",
      label: "Search Reports",
      icon: Search,
      action: () => navigate("/search"),
    },
    {
      id: "reports",
      label: "My Reports",
      icon: FileText,
      action: () => navigate("/reports"),
    },
    {
      id: "in-progress",
      label: "In-Progress Reports",
      icon: Clock,
      action: () => navigate("/reports/in-progress"),
    },
    {
      id: "approvals",
      label: "Approval Queue",
      icon: CheckSquare,
      action: () => navigate("/approvals"),
      roles: [USER_ROLES.MANAGER, USER_ROLES.CFO, USER_ROLES.CEO],
    },
    {
      id: "policy-exceptions",
      label: "Policy Exceptions",
      icon: Shield,
      action: () => navigate("/policy-exceptions"),
      roles: [USER_ROLES.CFO],
    },
    {
      id: "logout",
      label: "Logout",
      icon: LogOut,
      action: logout,
    },
  ];

  // Filter commands by user role
  const visibleCommands = commands.filter((cmd) => {
    if (!cmd.roles) return true;
    if (!user) return false;
    return cmd.roles.includes(user.role);
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/40"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-card border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <div className="flex items-center border-b px-4 py-3 gap-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Command palette search"
              autoFocus
            />
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close command palette"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Command.List className="max-h-64 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No commands found.
            </Command.Empty>

            <Command.Group heading="Navigation">
              {visibleCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <Command.Item
                    key={cmd.id}
                    value={cmd.label}
                    onSelect={() => run(cmd.action)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{cmd.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>

          <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <kbd className="rounded border px-1 py-0.5 font-mono bg-muted">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="rounded border px-1 py-0.5 font-mono bg-muted">↵</kbd> select
            </span>
            <span>
              <kbd className="rounded border px-1 py-0.5 font-mono bg-muted">Esc</kbd> close
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
