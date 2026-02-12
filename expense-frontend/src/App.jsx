// src/App.jsx
import { Routes, Route, Link, Navigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import CreateExpenseReportForm from "./components/CreateExpenseReportForm";
import ExpenseReportList from "./components/ExpenseReportList";
import ExpenseReportDetail from "./components/ExpenseReportDetail";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import PolicyExceptionReviewPage from "./pages/PolicyExceptionReviewPage.jsx";
import PolicyExceptionsInboxPage from "./pages/PolicyExceptionsInboxPage.jsx";
import EditReportPage from "./pages/EditReportPage.jsx";
import E2ELoginPage from "./pages/E2ELoginPage.jsx";
import { useAuth } from "./AuthContext";
import RequireAuth from "./RequireAuth.jsx";
import RequireRole from "./RequireRole.jsx";
import WelcomePage from "./components/WelcomePage.jsx";
import InProgressReportsPage from "./components/InProgressReportsPage.jsx";
import ApprovalQueuePage from "./components/ApprovalQueuePage.jsx";
import RoleSwitcher from "./components/RoleSwitcher.jsx";
import DemoControls from "./components/DemoControls.jsx";
import GuidedDemoModal from "./components/GuidedDemoModal.jsx";

function LegacySpecialApprovalRedirect() {
  const { id } = useParams();
  return <Navigate to={`/policy-exceptions/${id}`} replace />;
}

function App() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isApprover = user && (user.role === "MANAGER" || user.role === "CFO" || user.role === "CEO");
  const isFinance = user && user.role === "CFO";

  const navItems = useMemo(() => {
    const base = [
      { to: "/", label: "Welcome" },
      { to: "/dashboard", label: "Dashboard" },
      { to: "/create", label: "Create" },
      { to: "/search", label: "Search" },
      { to: "/reports", label: "My Reports" },
      { to: "/reports/in-progress", label: "In progress" },
    ];
    // Keep approver-only pages at the end.
    if (isFinance) base.push({ to: "/policy-exceptions", label: "Policy exceptions" });
    if (isApprover) base.push({ to: "/approvals", label: "Approval queue" });
    return base;
  }, [isApprover, isFinance]);

  useEffect(() => {
    // Close menu on route change
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-100">
      <GuidedDemoModal />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-2 items-center">
          {mobileMenuOpen && (
            <div className="w-full md:hidden mt-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-3">
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((it) => (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={
                      "text-sm px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 " +
                      (location.pathname === it.to ? "bg-slate-50" : "bg-white")
                    }
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
            <Link to="/" className="font-semibold text-slate-800 whitespace-nowrap">
              Company Ops Demo
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex gap-3 text-sm whitespace-nowrap overflow-x-auto no-scrollbar">
              {navItems.map((it) => (
                <Link key={it.to} to={it.to} className="text-slate-600 hover:text-slate-900">
                  {it.label}
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? "Close" : "Menu"}
            </button>
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center justify-end gap-2 min-w-0 w-full md:w-auto md:ml-auto">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1">
              <DemoControls />
              <RoleSwitcher />
            </div>

            <div className="text-sm flex items-center gap-3 pl-3 border-l border-slate-200 whitespace-nowrap">
              {user ? (
                <>
                  <span className="text-slate-700">
                    {user.name}{" "}
                    <span className="text-xs text-slate-500">({user.role})</span>
                  </span>
                  <button onClick={logout} className="text-xs text-red-600 hover:underline">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="text-xs text-blue-600 hover:underline">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/e2e/login" element={<E2ELoginPage />} />
          <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
          {/* New naming */}
          <Route
            path="/policy-exceptions"
            element={
              <RequireRole roles={["CFO"]} title="Policy exceptions">
                <PolicyExceptionsInboxPage />
              </RequireRole>
            }
          />
          <Route
            path="/policy-exceptions/:id"
            element={
              <RequireRole roles={["CFO"]} title="Policy exceptions">
                <PolicyExceptionReviewPage />
              </RequireRole>
            }
          />

          {/* Back-compat routes */}
          <Route path="/special-approvals" element={<Navigate to="/policy-exceptions" replace />} />
          <Route path="/special-approval/:id" element={<LegacySpecialApprovalRedirect />} />
          <Route path="/reports/:id/edit" element={<RequireAuth><EditReportPage /></RequireAuth>} />
          <Route path="/welcome" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/create"
            element={
              <RequireAuth>
                <CreateExpenseReportForm />
              </RequireAuth>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireAuth>
                <ExpenseReportList />
              </RequireAuth>
            }
          />
          <Route
            path="/reports/in-progress"
            element={
              <RequireAuth>
                <InProgressReportsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/approvals"
            element={
              <RequireRole roles={["MANAGER", "CFO", "CEO"]} title="Approval queue">
                <ApprovalQueuePage />
              </RequireRole>
            }
          />
          <Route
            path="/reports/:id"
            element={
              <RequireAuth>
                <ExpenseReportDetail />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
