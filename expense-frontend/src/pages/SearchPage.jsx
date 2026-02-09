import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { apiFetch } from "../lib/api";
import StatusBadge from "../ui/StatusBadge.jsx";
import { Button } from "../ui/Button.jsx";

export default function SearchPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("activity_desc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  const canSearchAll = user && (user.role === "MANAGER" || user.role === "CFO" || user.role === "CEO");

  const runSearch = async (e) => {
    e?.preventDefault?.();
    if (!user) return;

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("requesterId", String(user.id));
      params.set("requesterRole", String(user.role));
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      if (minTotal !== "") params.set("minTotal", String(Number(minTotal)));
      if (maxTotal !== "") params.set("maxTotal", String(Number(maxTotal)));
      if (sort) params.set("sort", sort);

      const data = await apiFetch(`/api/expense-reports/search?${params.toString()}`);
      setResults(data || []);
    } catch (e2) {
      setError(e2.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Default: show all reports within the user's scope when the page opens.
  useEffect(() => {
    if (!user) return;
    // Only auto-run when no results yet and filters are in default state.
    if (results.length > 0) return;
    // eslint-disable-next-line no-void
    void runSearch();
    // We intentionally do not include `runSearch` in deps to avoid loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const subtitle = useMemo(() => {
    if (!user) return "Please login to search.";
    if (canSearchAll) return "As an approver, you can search across all reports.";
    return "As an employee, search is limited to your own reports.";
  }, [user, canSearchAll]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Search reports</h1>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
          <Link to="/dashboard" className="text-xs text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>

        {!user && (
          <div className="mt-4 text-sm text-slate-600">Use the demo Role Switcher to login.</div>
        )}

        {user && (
          <form onSubmit={runSearch} className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Title contains</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                placeholder="e.g. NYC Trip"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
              >
                <option value="">Any</option>
                <option value="MANAGER_REVIEW">MANAGER_REVIEW</option>
                <option value="CFO_REVIEW">CFO_REVIEW</option>
                <option value="CEO_REVIEW">CEO_REVIEW</option>
                <option value="CFO_SPECIAL_REVIEW">CFO_SPECIAL_REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 pr-8 text-sm bg-white truncate"
              >
                <option value="activity_desc">Recent activity</option>
                <option value="total_desc">Total (high → low)</option>
                <option value="total_asc">Total (low → high)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Min total ($)</label>
              <input
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                placeholder="0"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max total ($)</label>
              <input
                value={maxTotal}
                onChange={(e) => setMaxTotal(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                placeholder="1000"
                inputMode="decimal"
              />
            </div>

            <div className="md:col-span-6 flex items-center gap-2">
              <>
                <Button type="submit" variant="primary" size="sm" disabled={loading}>
                  {loading ? "Searching…" : "Search"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQ("");
                    setStatus("");
                    setSort("activity_desc");
                    setMinTotal("");
                    setMaxTotal("");
                    setResults([]);
                    setError("");
                  }}
                >
                  Clear
                </Button>
              </>
            </div>
          </form>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Results</h2>
          <div className="text-xs text-slate-500">{results.length} item(s)</div>
        </div>

        {loading && <div className="mt-3 text-sm text-slate-600">Loading…</div>}

        {!loading && results.length === 0 && (
          <div className="mt-3 text-sm text-slate-600">No results.</div>
        )}

        {!loading && results.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="text-left font-medium py-2">Title</th>
                  <th className="text-left font-medium py-2 hidden md:table-cell">Destination</th>
                  <th className="text-right font-medium py-2">Total</th>
                  <th className="text-left font-medium py-2">Status</th>
                  <th className="text-left font-medium py-2 hidden sm:table-cell">Flags</th>
                  <th className="text-right font-medium py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2">
                      <div className="font-medium text-slate-900">{r.title}</div>
                      <div className="mt-0.5 text-xs text-slate-500 md:hidden">
                        {(r.destination || "-")}
                      </div>
                    </td>
                    <td className="py-2 hidden md:table-cell">{r.destination || "-"}</td>
                    <td className="py-2 text-right">${Number(r.totalAmount || 0).toLocaleString()}</td>
                    <td className="py-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2 hidden sm:table-cell">
                      {r.flagged ? (
                        <span className="inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                          Flagged
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <Link
                        to={r.status === "CFO_SPECIAL_REVIEW" ? `/special-approval/${r.id}` : `/reports/${r.id}`}
                        className="text-xs text-blue-600 hover:underline"
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
    </div>
  );
}
