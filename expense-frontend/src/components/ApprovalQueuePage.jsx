import { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import StatusBadge from "../ui/StatusBadge.jsx";

export default function ApprovalQueuePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  //fetchPending을 컴포넌트 스코프로 빼서 어디서든 호출
  const fetchPending = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const data = await (await import("../lib/api")).apiFetch(
        `/api/expense-reports/pending-approval?requesterRole=${encodeURIComponent(user.role)}`
      );
      setReports(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch approval queue");
    } finally {
      setLoading(false);
    }
  }, [user]);

  //페이지 진입/뒤로가기 등 location key 바뀔 때마다 새로 fetch
  useEffect(() => {
    fetchPending();
  }, [fetchPending, location.key]);

  //toast query param 처리 (state/history 안 건드림)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const msg = params.get("toast"); // "approved" / "rejected"

    if (msg) {
      setToast(`Successfully ${msg}.`);
      navigate("/approvals", { replace: true });

      const t = setTimeout(() => setToast(""), 2500);
      return () => clearTimeout(t);
    }
  }, [location.search, navigate]);

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-sm text-slate-700">
          Please login to see approval queue.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      {/* toast는 반드시 return 안에서 렌더 */}
      {toast && (
        <div className="mb-3 rounded-lg bg-green-50 text-green-700 text-sm px-3 py-2">
          {toast}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-semibold">Approval Queue</h1>
          <p className="text-xs text-slate-500">
            Expense reports that are waiting for your approval.
          </p>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-600">Loading...</p>}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
          {error}
        </p>
      )}

      {!loading && !error && reports.length === 0 && (
        <p className="text-sm text-slate-500">
          There are no reports pending approval.
        </p>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="mt-2 border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2">Title</th>
                <th className="text-left px-3 py-2 hidden md:table-cell">Destination</th>
                <th className="text-left px-3 py-2 hidden lg:table-cell">Departure</th>
                <th className="text-left px-3 py-2 hidden lg:table-cell">Return</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 max-w-[280px]">
                    <div className="font-medium text-slate-900 truncate" title={r.title}>
                      {r.title}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 md:hidden">
                      {(r.destination || "-")}
                      {r.departureDate ? ` • ${r.departureDate}` : ""}
                      {r.returnDate ? ` → ${r.returnDate}` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell">{r.destination || "-"}</td>
                  <td className="px-3 py-2 hidden lg:table-cell">{r.departureDate || "-"}</td>
                  <td className="px-3 py-2 hidden lg:table-cell">{r.returnDate || "-"}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      to={`/reports/${r.id}`}
                      state={{ from: "/approvals" }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View / Approve
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
