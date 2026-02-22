import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import StatusBadge from "../ui/StatusBadge.jsx";
import { Button } from "../ui/Button.jsx";
import { REPORT_STATUS, USER_ROLES } from "../lib/constants";
import PageTransition from "@/components/PageTransition";
import Pagination from "@/components/Pagination";
import TableSkeleton from "@/components/TableSkeleton";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, fetchSearch } from "@/lib/queries";

export default function SearchPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("activity_desc");
  const [page, setPage] = useState(0);

  // Submitted filter state (only updates on search/clear click)
  const [submitted, setSubmitted] = useState({
    q: "", status: "", sort: "activity_desc", minTotal: "", maxTotal: "", page: 0,
  });

  const canSearchAll = user && (user.role === USER_ROLES.MANAGER || user.role === USER_ROLES.CFO || user.role === USER_ROLES.CEO);

  const searchParams = useMemo(() => ({
    requesterId: user?.id,
    requesterRole: user?.role,
    q: submitted.q,
    status: submitted.status,
    minTotal: submitted.minTotal,
    maxTotal: submitted.maxTotal,
    sort: submitted.sort,
    page: submitted.page,
    size: 10,
  }), [user, submitted]);

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: queryKeys.search(searchParams),
    queryFn: () => fetchSearch(searchParams),
    enabled: !!user,
    keepPreviousData: true,
  });

  const error = queryError?.message || "";
  const results = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const handleSearch = (e) => {
    e?.preventDefault?.();
    setSubmitted({ q, status, sort, minTotal, maxTotal, page: 0 });
    setPage(0);
  };

  const handleClear = () => {
    setQ("");
    setStatus("");
    setSort("activity_desc");
    setMinTotal("");
    setMaxTotal("");
    setPage(0);
    setSubmitted({ q: "", status: "", sort: "activity_desc", minTotal: "", maxTotal: "", page: 0 });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setSubmitted((prev) => ({ ...prev, page: newPage }));
  };

  const subtitle = useMemo(() => {
    if (!user) return "Please login to search.";
    if (canSearchAll) return "As an approver, you can search across all reports.";
    return "As an employee, search is limited to your own reports.";
  }, [user, canSearchAll]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Search reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Link to="/dashboard" className="text-xs text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>

        {!user && (
          <div className="mt-4 text-sm text-muted-foreground">Use the demo Role Switcher to login.</div>
        )}

        {user && (
          <form onSubmit={handleSearch} className="mt-4 grid grid-cols-1 md:grid-cols-8 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Title contains</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-card"
                placeholder="e.g. NYC Trip"
              />
            </div>

            <div className="md:col-span-5">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {[
                  { label: "Any", value: "" },
                  { label: "Manager", value: REPORT_STATUS.MANAGER_REVIEW },
                  { label: "CFO", value: REPORT_STATUS.CFO_REVIEW },
                  { label: "CEO", value: REPORT_STATUS.CEO_REVIEW },
                  { label: "CFO special", value: REPORT_STATUS.CFO_SPECIAL_REVIEW },
                  { label: "Changes", value: REPORT_STATUS.CHANGES_REQUESTED },
                  { label: "Approved", value: REPORT_STATUS.APPROVED },
                  { label: "Rejected", value: REPORT_STATUS.REJECTED },
                ].map((f) => {
                  const active = status === f.value;
                  return (
                    <button
                      key={f.label}
                      type="button"
                      onClick={() => setStatus(f.value)}
                      className={
                        "w-full text-[11px] px-3 py-2 rounded-full border text-center " +
                        (active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border hover:bg-accent")
                      }
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full min-w-[11rem] border rounded-xl px-3 py-2 pr-10 text-sm bg-card"
              >
                <option value="activity_desc">Recent activity</option>
                <option value="total_desc">Total (high &rarr; low)</option>
                <option value="total_asc">Total (low &rarr; high)</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Min total ($)</label>
              <input
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-card"
                placeholder="0"
                inputMode="decimal"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Max total ($)</label>
              <input
                value={maxTotal}
                onChange={(e) => setMaxTotal(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-card"
                placeholder="1000"
                inputMode="decimal"
              />
            </div>

            <div className="md:col-span-6 flex items-center gap-2">
              <Button type="submit" variant="primary" size="sm" disabled={loading}>
                {loading ? "Searching\u2026" : "Search"}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </form>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-card border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Results</h2>
          <div className="text-xs text-muted-foreground">{totalElements} item(s)</div>
        </div>

        {loading && <TableSkeleton rows={5} cols={5} className="mt-3" />}

        {!loading && results.length === 0 && (
          <div className="mt-3 text-sm text-muted-foreground">No results.</div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium py-2">Title</th>
                    <th className="text-left font-medium py-2 hidden md:table-cell">Destination</th>
                    <th className="text-right font-medium py-2 pr-4">Total</th>
                    <th className="text-left font-medium py-2 pl-4">Status</th>
                    <th className="text-left font-medium py-2 hidden sm:table-cell">Flags</th>
                    <th className="text-right font-medium py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-t border">
                      <td className="py-2">
                        <div className="font-medium text-foreground">{r.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground md:hidden">
                          {(r.destination || "-")}
                        </div>
                      </td>
                      <td className="py-2 hidden md:table-cell">{r.destination || "-"}</td>
                      <td className="py-2 text-right pr-4">${Number(r.totalAmount || 0).toLocaleString()}</td>
                      <td className="py-2 pl-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-2 hidden sm:table-cell">
                        {r.flagged ? (
                          <span className="inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                            Flagged
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <Link
                          to={r.status === REPORT_STATUS.CFO_SPECIAL_REVIEW ? `/policy-exceptions/${r.id}` : `/reports/${r.id}`}
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
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  );
}
