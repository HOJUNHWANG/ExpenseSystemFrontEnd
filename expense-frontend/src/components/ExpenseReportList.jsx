// src/components/ExpenseReportList.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import {Link, useNavigate} from "react-router-dom";
import StatusBadge from "../ui/StatusBadge.jsx";

export default function ExpenseReportList() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchReports = async () => {
      setLoading(true);
      setError("");

      try {
        const { apiFetch } = await import("../lib/api");
        const qs = new URLSearchParams({ submitterId: String(user.id) });
        if (status) qs.set("status", status);
        const data = await apiFetch(`/api/expense-reports?${qs.toString()}`);
        setReports(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, status]);

  if (!user) {
    return (
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-slate-700">
            Please login to see your expense reports.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Go to the Login page and use one of the demo emails.
          </p>
        </div>
    );
  }

  const filters = [
    { label: "All", value: "" },
    { label: "Draft", value: "DRAFT" },
    { label: "Manager review", value: "MANAGER_REVIEW" },
    { label: "CFO review", value: "CFO_REVIEW" },
    { label: "CEO review", value: "CEO_REVIEW" },
    { label: "CFO special", value: "CFO_SPECIAL_REVIEW" },
    { label: "Changes requested", value: "CHANGES_REQUESTED" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">My Expense Reports</h1>
        <Link
          to="/create"
          className="text-xs rounded-lg px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          New report
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = status === f.value;
          return (
            <button
              key={f.label}
              type="button"
              onClick={() => setStatus(f.value)}
              className={
                "text-[11px] px-3 py-1.5 rounded-full border " +
                (active
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>
      {loading && <p className="text-sm text-slate-600">Loading...</p>}

      {error && (
        <div className="mb-4 text-sm rounded-lg p-3 bg-red-50 text-red-700">
          ❌ Error: {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <p className="text-sm text-slate-500">
          No report has been created yet
        </p>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-3 py-2 text-left font-medium hidden md:table-cell">ID</th>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Destination</th>
                <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Departure</th>
                <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Return</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                  <tr
                      key={r.id}
                      className="border-b hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/reports/${r.id}`)}
                  >
                  <td className="px-3 py-2 hidden md:table-cell">{r.id}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900">{r.title}</div>
                    <div className="mt-0.5 text-xs text-slate-500 md:hidden">
                      {(r.destination || "-")}
                      {r.departureDate ? ` • ${r.departureDate}` : ""}
                      {r.returnDate ? ` → ${r.returnDate}` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    {r.destination || <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-3 py-2 hidden lg:table-cell">{r.departureDate || "-"}</td>
                  <td className="px-3 py-2 hidden lg:table-cell">{r.returnDate || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {r.totalAmount?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                          to={`/reports/${r.id}`}
                          className="text-xs text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
