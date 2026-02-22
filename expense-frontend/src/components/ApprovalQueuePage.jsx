import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import StatusBadge from "../ui/StatusBadge.jsx";
import { toast } from "sonner";
import TableSkeleton from "./TableSkeleton.jsx";
import PageTransition from "@/components/PageTransition";
import Pagination from "@/components/Pagination";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, fetchPendingApprovals } from "@/lib/queries";

export default function ApprovalQueuePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: queryKeys.pendingApprovals(user?.role, page),
    queryFn: () => fetchPendingApprovals(user.role, page, 10),
    enabled: !!user,
    keepPreviousData: true,
  });

  const error = queryError?.message || "";
  const reports = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  // toast query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const msg = params.get("toast");
    if (msg) {
      toast.success(`Successfully ${msg}.`);
      navigate("/approvals", { replace: true });
    }
  }, [location.search, navigate]);

  if (!user) {
    return (
      <div className="bg-card rounded-xl shadow p-6">
        <p className="text-sm text-muted-foreground">
          Please login to see approval queue.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card shadow-sm rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-semibold">Approval Queue</h1>
          <p className="text-xs text-muted-foreground">
            Expense reports that are waiting for your approval.
          </p>
        </div>
      </div>

      {loading && <TableSkeleton rows={4} cols={5} />}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
          {error}
        </p>
      )}

      {!loading && !error && reports.length === 0 && (
        <p className="text-sm text-muted-foreground">
          There are no reports pending approval.
        </p>
      )}

      {!loading && !error && reports.length > 0 && (
        <>
          <div className="mt-2 border rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[640px] table-fixed">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 w-[260px]">Title</th>
                  <th className="text-left px-3 py-2 hidden md:table-cell">Destination</th>
                  <th className="text-left px-3 py-2 hidden lg:table-cell">Departure</th>
                  <th className="text-left px-3 py-2 hidden lg:table-cell">Return</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/50">
                    <td className="px-3 py-2 w-[260px]">
                      <div className="font-medium text-foreground truncate" title={r.title}>
                        {r.title}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground md:hidden">
                        {(r.destination || "-")}
                        {r.departureDate ? ` \u2022 ${r.departureDate}` : ""}
                        {r.returnDate ? ` \u2192 ${r.returnDate}` : ""}
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
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                      >
                        View / Approve
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
