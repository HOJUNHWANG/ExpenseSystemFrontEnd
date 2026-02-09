import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { apiFetch } from "../lib/api";
import StatusBadge from "../ui/StatusBadge.jsx";

export default function SpecialApprovalsInboxPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  const isFinance = user && user.role === "CFO";

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("requesterId", String(user.id));
        params.set("requesterRole", String(user.role));
        params.set("status", "CFO_SPECIAL_REVIEW");
        params.set("sort", "activity_desc");

        const data = await apiFetch(`/api/expense-reports/search?${params.toString()}`);
        setResults(data || []);
      } catch (e) {
        setError(e.message || "Failed to load policy exceptions");
      } finally {
        setLoading(false);
      }
    };

    // eslint-disable-next-line no-void
    void run();
  }, [user]);

  const subtitle = useMemo(() => {
    if (!user) return "Please login.";
    if (!isFinance) return "Only CFO can access this inbox.";
    return "Reports with policy exceptions waiting for exception review.";
  }, [user, isFinance]);

  if (!user) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-slate-900">Policy exceptions</h1>
        <p className="mt-2 text-sm text-slate-600">Please login to view this page.</p>
      </div>
    );
  }

  if (!isFinance) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-slate-900">Policy exceptions</h1>
        <p className="mt-2 text-sm text-slate-600">Only CFO can access this page.</p>
        <div className="mt-4">
          <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Policy exceptions</h1>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
          <Link to="/dashboard" className="text-xs text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Inbox</h2>
          <div className="text-xs text-slate-500">{results.length} item(s)</div>
        </div>

        {loading && <div className="mt-3 text-sm text-slate-600">Loading…</div>}

        {!loading && results.length === 0 && (
          <div className="mt-3 text-sm text-slate-600">No reports waiting for exception review.</div>
        )}

        {!loading && results.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="text-left font-medium py-2">Title</th>
                  <th className="text-left font-medium py-2 hidden md:table-cell">Destination</th>
                  <th className="text-right font-medium py-2 pr-4">Total</th>
                  <th className="text-left font-medium py-2 pl-4">Status</th>
                  <th className="text-right font-medium py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2">
                      <div className="font-medium text-slate-900">{r.title}</div>
                      <div className="mt-0.5 text-xs text-slate-500 md:hidden">{r.destination || "-"}</div>
                    </td>
                    <td className="py-2 hidden md:table-cell">{r.destination || "-"}</td>
                    <td className="py-2 text-right pr-4">${Number(r.totalAmount || 0).toLocaleString()}</td>
                    <td className="py-2 pl-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2 text-right">
                      <Link
                        to={`/special-approval/${r.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
