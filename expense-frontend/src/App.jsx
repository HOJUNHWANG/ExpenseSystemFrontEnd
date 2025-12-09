// src/App.jsx
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import CreateExpenseReportForm from "./components/CreateExpenseReportForm";
import ExpenseReportList from "./components/ExpenseReportList";
import ExpenseReportDetail from "./components/ExpenseReportDetail";
import WelcomePage from "./components/WelcomePage";

function App() {
  return (
      <div className="min-h-screen bg-slate-100">
        <div className="max-w-6xl mx-auto py-8 px-4">
          {/* Header */}
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Expense Report Demo</h1>
            <span className="text-xs text-slate-400">
            Personal portfolio project
          </span>
          </header>

          {/* Navigation */}
          <nav className="mb-6 border-b border-slate-200">
            <ul className="flex gap-4 text-sm">
              <li>
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        `pb-2 border-b-2 ${
                            isActive
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`
                    }
                >
                  Welcome
                </NavLink>
              </li>
              <li>
                <NavLink
                    to="/create"
                    className={({ isActive }) =>
                        `pb-2 border-b-2 ${
                            isActive
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`
                    }
                >
                  Create Report
                </NavLink>
              </li>
              <li>
                <NavLink
                    to="/reports"
                    className={({ isActive }) =>
                        `pb-2 border-b-2 ${
                            isActive
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                        }`
                    }
                >
                  My Reports
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Pages */}
          <main>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/create" element={<CreateExpenseReportForm />} />
              <Route path="/reports" element={<ExpenseReportList />} />
              <Route path="/reports/:id" element={<ExpenseReportDetail />} />
              {/* 잘못된 경로는 Welcome으로 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
  );
}

export default App;
