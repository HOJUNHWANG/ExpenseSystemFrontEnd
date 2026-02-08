// src/App.jsx
import { Routes, Route, Link, Navigate } from "react-router-dom";
import CreateExpenseReportForm from "./components/CreateExpenseReportForm";
import ExpenseReportList from "./components/ExpenseReportList";
import ExpenseReportDetail from "./components/ExpenseReportDetail";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import SpecialApprovalPage from "./pages/SpecialApprovalPage.jsx";
import { useAuth } from "./AuthContext";
import RequireAuth from "./RequireAuth.jsx";
import WelcomePage from "./components/WelcomePage.jsx";
import InProgressReportsPage from "./components/InProgressReportsPage.jsx";
import ApprovalQueuePage from "./components/ApprovalQueuePage.jsx";
import RoleSwitcher from "./components/RoleSwitcher.jsx";
import DemoControls from "./components/DemoControls.jsx";
import GuidedDemoModal from "./components/GuidedDemoModal.jsx";

function App() {
  const { user, logout } = useAuth();

  const isApprover = user && (user.role === "MANAGER" || user.role === "FINANCE");

  return (
    <div className="min-h-screen bg-slate-100">
      <GuidedDemoModal />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap md:flex-nowrap justify-between items-center gap-2">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" className="font-semibold text-slate-800 whitespace-nowrap">
              Company Ops Demo
            </Link>
            <nav className="hidden sm:flex gap-3 text-sm whitespace-nowrap">
              <Link to="/dashboard" className="text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link to="/create" className="text-slate-600 hover:text-slate-900">
                Create
              </Link>
              <Link to="/search" className="text-slate-600 hover:text-slate-900">
                Search
              </Link>
              <Link to="/reports" className="text-slate-600 hover:text-slate-900">
                My Reports
              </Link>
              <Link
                to="/reports/in-progress"
                className="text-slate-600 hover:text-slate-900"
              >
                In progress
              </Link>
              {isApprover && (
                <Link to="/approvals" className="text-slate-600 hover:text-slate-900">
                  Approval Queue
                </Link>
              )}
            </nav>
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center justify-end gap-2 min-w-0">
            <div className="flex items-center gap-2">
              <DemoControls />
              <RoleSwitcher />
            </div>

            <div className="text-sm flex items-center gap-3 pl-2 border-l border-slate-200 whitespace-nowrap">
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/special-approval/:id" element={<RequireAuth><SpecialApprovalPage /></RequireAuth>} />
          <Route path="/welcome" element={<WelcomePage />} />
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
              <RequireAuth>
                <ApprovalQueuePage />
              </RequireAuth>
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
