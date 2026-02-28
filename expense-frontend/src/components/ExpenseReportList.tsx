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
import { LayoutList, Table2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ExpenseReportList() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
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
      <div className="bg-card rounded-2xl border shadow-sm p-8 text-center">
        <p className="text-sm font-medium text-foreground">Login required</p>
        <p className="text-xs text-muted-foreground mt-1">Please log in to see your expense reports.</p>
        <Link to="/login" className="mt-4 inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
          Go to Login
        </Link>
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
    <div className="bg-card shadow-sm rounded-2xl border p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">My Expense Reports</h1>
          {totalElements > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{totalElements} report{totalElements !== 1 ? 's' : ''} total</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn('p-1.5 text-xs transition-colors', viewMode === 'table' ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-muted-foreground')}
              aria-label="Table view"
              title="Table view"
            >
              <Table2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn('p-1.5 text-xs transition-colors', viewMode === 'cards' ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-muted-foreground')}
              aria-label="Card view"
              title="Card view"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
          </div>
          <Link
            to="/create"
            className="inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
            New report
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        {filters.map((f) => {
          const active = status === f.value;
          return (
            <button
              key={f.label}
              type="button"
              onClick={() => { setStatus(f.value); setPage(0); }}
              aria-pressed={active}
              className={cn(
                'text-[11px] px-3 py-1.5 rounded-full border transition-colors',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading && <TableSkeleton rows={5} cols={5} />}

      {error && (
        <div className="mb-4 text-sm rounded-xl p-3 bg-red-50 border border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl border-border">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <PlusCircle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {status ? `No reports with status "${status}"` : 'No expense reports yet'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {status ? 'Try a different filter.' : 'Create your first report to get started.'}
          </p>
          {!status && (
            <Link
              to="/create"
              className="mt-4 inline-flex items-center gap-1.5 text-xs rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Create first report
            </Link>
          )}
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <>
          {/* Table View */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto -mx-1">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">ID</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Destination</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Dates</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/reports/${r.id}`)}
                    >
                      <td className="px-3 py-3 text-xs text-muted-foreground hidden md:table-cell">#{r.id}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-foreground">{r.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground md:hidden">
                          {r.destination ?? '-'}
                          {r.departureDate ? ` • ${r.departureDate}` : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground hidden md:table-cell">
                        {r.destination ?? <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {r.departureDate && r.returnDate
                          ? `${r.departureDate} → ${r.returnDate}`
                          : r.departureDate ?? '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums">
                        ${Number(r.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-3 py-3 text-right">
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

          {/* Card View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reports.map((r) => (
                <Link
                  key={r.id}
                  to={`/reports/${r.id}`}
                  className="block rounded-xl border bg-card hover:bg-accent/50 transition-colors p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{r.title}</p>
                      {r.destination && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.destination}</p>
                      )}
                    </div>
                    <StatusBadge status={r.status} className="shrink-0" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {r.departureDate && r.returnDate
                        ? `${r.departureDate} → ${r.returnDate}`
                        : r.departureDate ?? '—'}
                    </div>
                    <div className="text-sm font-semibold tabular-nums">
                      ${Number(r.totalAmount || 0).toLocaleString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
