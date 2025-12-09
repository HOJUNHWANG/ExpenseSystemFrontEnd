// src/App.jsx
import { Link, NavLink, Route, Routes, Navigate } from "react-router-dom";
import CreateExpenseReportForm from "./components/CreateExpenseReportForm";
import ExpenseReportList from "./components/ExpenseReportList";
import ExpenseReportDetail from "./components/ExpenseReportDetail.jsx";

function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* 헤더 */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Expense Report Demo</h1>
          <a
            href="#"
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            (Personal Portfolio Project)
          </a>
        </header>

        {/* 탭 네비게이션 */}
        <nav className="mb-6 border-b border-slate-200">
          <ul className="flex gap-4 text-sm">
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

        {/* 페이지 컨텐츠 */}
        <main>
          <Routes>
            <Route path="/create" element={<CreateExpenseReportForm />} />
            <Route path="/reports" element={<ExpenseReportList />} />
            <Route path="/reports/:id" element={<ExpenseReportDetail />} />
            {/* 루트 접속 시 /create로 보내기 */}
            <Route path="/" element={<Navigate to="/create" replace />} />
            {/* 잘못된 경로는 /create로 */}
            <Route path="*" element={<Navigate to="/create" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
