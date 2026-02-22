// src/App.jsx
import React, { Suspense, useMemo } from "react";
import { Routes, Route, Link, Navigate, useLocation, useParams } from "react-router-dom";
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import E2ELoginPage from "./pages/E2ELoginPage.jsx";
import { useAuth } from "./AuthContext";
import RequireAuth from "./RequireAuth.jsx";
import RequireRole from "./RequireRole.jsx";
import WelcomePage from "./components/WelcomePage.jsx";
import RoleSwitcher from "./components/RoleSwitcher.jsx";
import DemoControls from "./components/DemoControls.jsx";
import GuidedDemoModal from "./components/GuidedDemoModal.jsx";
import { USER_ROLES } from "./lib/constants";
import { cn } from "./lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./components/ui/sheet";
import { Separator } from "./components/ui/separator";
import { Button } from "./components/ui/button";
import { useTheme } from "./components/ThemeProvider.jsx";
import {
  Home,
  LayoutDashboard,
  PlusCircle,
  Search,
  FileText,
  Clock,
  Shield,
  CheckSquare,
  Menu,
  LogOut,
  LogIn,
  Sun,
  Moon,
} from "lucide-react";

const DashboardPage = React.lazy(() => import("./pages/DashboardPage.jsx"));
const CreateExpenseReportForm = React.lazy(() => import("./components/CreateExpenseReportForm"));
const ExpenseReportList = React.lazy(() => import("./components/ExpenseReportList"));
const ExpenseReportDetail = React.lazy(() => import("./components/ExpenseReportDetail"));
const SearchPage = React.lazy(() => import("./pages/SearchPage.jsx"));
const EditReportPage = React.lazy(() => import("./pages/EditReportPage.jsx"));
const PolicyExceptionReviewPage = React.lazy(() => import("./pages/PolicyExceptionReviewPage.jsx"));
const PolicyExceptionsInboxPage = React.lazy(() => import("./pages/PolicyExceptionsInboxPage.jsx"));
const InProgressReportsPage = React.lazy(() => import("./components/InProgressReportsPage.jsx"));
const ApprovalQueuePage = React.lazy(() => import("./components/ApprovalQueuePage.jsx"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-sm text-muted-foreground">Loading...</div>
    </div>
  );
}

function LegacySpecialApprovalRedirect() {
  const { id } = useParams();
  return <Navigate to={`/policy-exceptions/${id}`} replace />;
}

function SidebarNav({ items, currentPath, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const isActive = currentPath === item.to || (item.to !== "/" && currentPath.startsWith(item.to + "/"));
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors relative",
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
            )}
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function SidebarContent({ navItems, currentPath, user, logout, onNavigate }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-foreground">Company Ops</h1>
            <p className="text-[10px] text-muted-foreground">Expense System</p>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      <Separator />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav items={navItems} currentPath={currentPath} onNavigate={onNavigate} />
      </div>

      <Separator />

      {/* Bottom section */}
      <div className="p-4 space-y-3 overflow-hidden">
        <div className="rounded-lg border bg-card p-3 space-y-2">
          <DemoControls />
          <RoleSwitcher />
        </div>

        {user ? (
          <div className="flex items-center gap-2 px-1" data-testid="current-user">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">({user.role})</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogIn className="h-4 w-4" />
            <span>Login</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function App() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isApprover = user && (user.role === USER_ROLES.MANAGER || user.role === USER_ROLES.CFO || user.role === USER_ROLES.CEO);
  const isFinance = user && user.role === USER_ROLES.CFO;

  const navItems = useMemo(() => {
    const base = [
      { to: "/", label: "Welcome", icon: Home },
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/create", label: "Create Report", icon: PlusCircle },
      { to: "/search", label: "Search", icon: Search },
      { to: "/reports", label: "My Reports", icon: FileText },
      { to: "/reports/in-progress", label: "In Progress", icon: Clock },
    ];
    if (isFinance) base.push({ to: "/policy-exceptions", label: "Policy Exceptions", icon: Shield });
    if (isApprover) base.push({ to: "/approvals", label: "Approval Queue", icon: CheckSquare });
    return base;
  }, [isApprover, isFinance]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-background">
      <GuidedDemoModal />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col border-r bg-card">
        <SidebarContent
          navItems={navItems}
          currentPath={location.pathname}
          user={user}
          logout={logout}
          onNavigate={() => {}}
        />
      </aside>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent
            navItems={navItems}
            currentPath={location.pathname}
            user={user}
            logout={logout}
            onNavigate={closeMobile}
          />
        </SheetContent>
      </Sheet>

      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Company Ops</span>
        </div>
        {user && (
          <div className="text-xs text-muted-foreground" data-testid="current-user-mobile">
            {user.name} <span className="text-[10px]">({user.role})</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="lg:pl-60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/e2e/login" element={<E2ELoginPage />} />
              <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
              <Route
                path="/policy-exceptions"
                element={
                  <RequireRole roles={[USER_ROLES.CFO]} title="Policy exceptions">
                    <PolicyExceptionsInboxPage />
                  </RequireRole>
                }
              />
              <Route
                path="/policy-exceptions/:id"
                element={
                  <RequireRole roles={[USER_ROLES.CFO]} title="Policy exceptions">
                    <PolicyExceptionReviewPage />
                  </RequireRole>
                }
              />
              <Route path="/special-approvals" element={<Navigate to="/policy-exceptions" replace />} />
              <Route path="/special-approval/:id" element={<LegacySpecialApprovalRedirect />} />
              <Route path="/reports/:id/edit" element={<RequireAuth><EditReportPage /></RequireAuth>} />
              <Route path="/welcome" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/create"
                element={<RequireAuth><CreateExpenseReportForm /></RequireAuth>}
              />
              <Route
                path="/reports"
                element={<RequireAuth><ExpenseReportList /></RequireAuth>}
              />
              <Route
                path="/reports/in-progress"
                element={<RequireAuth><InProgressReportsPage /></RequireAuth>}
              />
              <Route
                path="/approvals"
                element={
                  <RequireRole roles={[USER_ROLES.MANAGER, USER_ROLES.CFO, USER_ROLES.CEO]} title="Approval queue">
                    <ApprovalQueuePage />
                  </RequireRole>
                }
              />
              <Route
                path="/reports/:id"
                element={<RequireAuth><ExpenseReportDetail /></RequireAuth>}
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default App;
