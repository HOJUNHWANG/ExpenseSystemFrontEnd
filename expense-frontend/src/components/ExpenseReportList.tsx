import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';
import { REPORT_STATUS } from '../lib/constants';
import TableSkeleton from './TableSkeleton';
import Pagination from '@/components/Pagination';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, fetchReports } from '@/lib/queries';
import type { PageResponse, ExpenseReportListItem } from '../types';

export default function ExpenseReportList() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const { data, isLoading: loading, error: queryError } = useQuery<PageResponse<ExpenseReportListItem>>({
    queryKey: queryKeys.reports(user?.id, status || undefined, page),
    queryFn: () => fetchReports({ submitterId: user!.id, status: status || undefined, page, size: 10 }),
    enabled: !!user,
  });

  const error = (queryError as Error)?.message ?? '';
  const reports = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  if (!user) {
    return (
      <div className="bg-card rounded-xl shadow p-6">
        <p className="text-sm text-muted-foreground">Please login to see your expense reports.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Go to the Login page and use one of the demo emails.
        </p>
      </div>
    );
  }

  const filters = [
    { label: 'All', value: '' },
    { label: 'Draft', value: REPORT_STATUS.DRAFT },
    { label: 'Manager review', value: REPORT_STATUS.MANAGER_REVIEW },
    { label: 'CFO review', value: REPORT_STATUS.CFO_REVIEW },
    { label: 'CEO review', value: REPORT_STATUS.CEO_REVIEW },
    { label: 'CFO special', value: REPORT_STATUS.CFO_SPECIAL_REVIEW },
    { label: 'Changes requested', value: REPORT_STATUS.CHANGES_REQUESTED },
    { label: 'Approved', value: REPORT_STATUS.APPROVED },
    { label: 'Rejected', value: REPORT_STATUS.REJECTED },
  ];

  return (
    <div className="bg-card shadow-sm rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold">My Expense Reports</h1>
          {totalElements > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{totalElements} report(s) total</p>
          )}
        </div>
        <Link
          to="/create"
          className="text-xs rounded-lg px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          New report
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {filters.map((f) => {
          const active = status === f.value;
          return (
            <button
              key={f.label}
              type="button"
              onClick={() => { setStatus(f.value); setPage(0); }}
              aria-pressed={active}
              className={
                'text-[11px] px-3 py-1.5 rounded-full border ' +
                (active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border hover:bg-accent')
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading && <TableSkeleton rows={5} cols={5} />}

      {error && (
        <div className="mb-4 text-sm rounded-lg p-3 bg-red-50 text-red-700" role="alert">
          Error: {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {status ? `No reports with status "${status}".` : 'No reports yet.'}
          </p>
          {!status && (
            <Link
              to="/create"
              className="mt-3 inline-flex items-center gap-1 text-xs rounded-lg px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Create your first report
            </Link>
          )}
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
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
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/reports/${r.id}`)}
                  >
                    <td className="px-3 py-2 hidden md:table-cell">{r.id}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-foreground">{r.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground md:hidden">
                        {r.destination ?? '-'}
                        {r.departureDate ? ` • ${r.departureDate}` : ''}
                        {r.returnDate ? ` → ${r.returnDate}` : ''}
                      </div>
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell">
                      {r.destination ?? <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-3 py-2 hidden lg:table-cell">{r.departureDate ?? '-'}</td>
                    <td className="px-3 py-2 hidden lg:table-cell">{r.returnDate ?? '-'}</td>
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
