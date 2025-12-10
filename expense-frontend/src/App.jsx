// src/App.jsx
import { Routes, Route, Link, Navigate } from "react-router-dom";
import CreateExpenseReportForm from "./components/CreateExpenseReportForm";
import ExpenseReportList from "./components/ExpenseReportList";
import ExpenseReportDetail from "./components/ExpenseReportDetail";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./AuthContext";

function App() {
  const { user, logout } = useAuth();

  return (
      <div className="min-h-screen bg-slate-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/" className="font-semibold text-slate-800">
                Expense Report Demo
              </Link>
              <nav className="flex gap-3 text-sm">
                <Link to="/create" className="text-slate-600 hover:text-slate-900">
                  Create
                </Link>
                <Link to="/reports" className="text-slate-600 hover:text-slate-900">
                  My Reports
                </Link>
              </nav>
            </div>

            <div className="text-sm flex items-center gap-3">
              {user ? (
                  <>
                <span className="text-slate-700">
                  {user.name} <span className="text-xs text-slate-500">({user.role})</span>
                </span>
                    <button
                        onClick={logout}
                        className="text-xs text-red-600 hover:underline"
                    >
                      Logout
                    </button>
                  </>
              ) : (
                  <Link
                      to="/login"
                      className="text-xs text-blue-600 hover:underline"
                  >
                    Login
                  </Link>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/reports" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/create" element={<CreateExpenseReportForm />} />
            <Route path="/reports" element={<ExpenseReportList />} />
            <Route path="/reports/:id" element={<ExpenseReportDetail />} />
          </Routes>
        </main>
      </div>
  );
}

export default App;
