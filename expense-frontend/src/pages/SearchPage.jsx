import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { apiFetch } from "../lib/api";

export default function SearchPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  const canSearchAll = user && (user.role === "MANAGER" || user.role === "FINANCE");

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
      if (minTotal !== "") params.set("minTotal", String(Number(minTotal)));
      if (maxTotal !== "") params.set("maxTotal", String(Number(maxTotal)));

      const data = await apiFetch(`/api/expense-reports/search?${params.toString()}`);
      setResults(data || []);
    } catch (e2) {
      setError(e2.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

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
          <form onSubmit={runSearch} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
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

            <div className="md:col-span-4 flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-60"
              >
                {loading ? "Searching…" : "Search"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setMinTotal("");
                  setMaxTotal("");
                  setResults([]);
                  setError("");
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50"
              >
                Clear
              </button>
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
                  <th className="text-left font-medium py-2">Destination</th>
                  <th className="text-right font-medium py-2">Total</th>
                  <th className="text-left font-medium py-2">Status</th>
                  <th className="text-right font-medium py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2">{r.title}</td>
                    <td className="py-2">{r.destination || "-"}</td>
                    <td className="py-2 text-right">${Number(r.totalAmount || 0).toLocaleString()}</td>
                    <td className="py-2">
                      <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-50 text-slate-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <Link to={`/reports/${r.id}`} className="text-xs text-blue-600 hover:underline">
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
