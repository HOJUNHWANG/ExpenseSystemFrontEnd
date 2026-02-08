// src/components/ExpenseReportList.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import {Link, useNavigate} from "react-router-dom";

export default function ExpenseReportList() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchReports = async () => {
      setLoading(true);
      setError("");

      try {
        const { apiFetch } = await import("../lib/api");
        const data = await apiFetch(
          `/api/expense-reports?submitterId=${user.id}`
        );
        setReports(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

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

  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold mb-4">My Expense Reports</h1>
      </div>
      <div>
        <Link
            to="/create"
            className="text-xs rounded-lg px-3 py-1 bg-blue-600 text-white hover:bg-blue-700"
        >
          New report
        </Link>
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
                <th className="px-3 py-2 text-left font-medium">ID</th>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Destination</th>
                <th className="px-3 py-2 text-left font-medium">Departure</th>
                <th className="px-3 py-2 text-left font-medium">Return</th>
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
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2">
                    {r.destination || <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-3 py-2">{r.departureDate || "-"}</td>
                  <td className="px-3 py-2">{r.returnDate || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {r.totalAmount?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                        r.status === "APPROVED"
                          ? "bg-green-50 text-green-700"
                          : r.status === "REJECTED"
                          ? "bg-red-50 text-red-700"
                          : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {r.status}
                    </span>
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
