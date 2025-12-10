// src/components/ExpenseReportList.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function ExpenseReportList() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchReports = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
            `http://localhost:8080/api/expense-reports?submitterId=${user.id}`
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch reports");
        }

        const data = await res.json();
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
      <h2 className="text-xl font-semibold mb-4">My Expense Reports</h2>

      {loading && <p className="text-sm text-slate-600">Loading...</p>}

      {error && (
        <div className="mb-4 text-sm rounded-lg p-3 bg-red-50 text-red-700">
          ❌ Error: {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <p className="text-sm text-slate-500">
          아직 생성한 Expense Report가 없습니다.
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
