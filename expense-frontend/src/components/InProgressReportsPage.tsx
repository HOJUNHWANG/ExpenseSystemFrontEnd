import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { apiFetch } from '../lib/api';
import { REPORT_STATUS } from '../lib/constants';
import TableSkeleton from './TableSkeleton';
import StatusBadge from '../ui/StatusBadge';
import type { ExpenseReport } from '../types';

export default function InProgressReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ExpenseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchInProgress = async () => {
      setLoading(true);
      setError('');

      try {
        const statuses = [
          REPORT_STATUS.MANAGER_REVIEW,
          REPORT_STATUS.CFO_REVIEW,
          REPORT_STATUS.CEO_REVIEW,
          REPORT_STATUS.CFO_SPECIAL_REVIEW,
          REPORT_STATUS.CEO_SPECIAL_REVIEW,
          REPORT_STATUS.CHANGES_REQUESTED,
        ];

        const all: ExpenseReport[] = [];
        for (const st of statuses) {
          try {
            const data = await apiFetch(
              `/api/expense-reports?submitterId=${user.id}&status=${encodeURIComponent(st)}`
            );
            (data as ExpenseReport[] ?? []).forEach((r) => all.push(r));
          } catch {
            // ignore per-status errors
          }
        }

        all.sort((a, b) => Number(b.id) - Number(a.id));
        setReports(all);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    void fetchInProgress();
  }, [user]);

  if (!user) {
    return (
      <div className="bg-card rounded-xl shadow p-6">
        <p className="text-sm text-muted-foreground">Please login to see your in-progress reports.</p>
      </div>
    );
  }

  return (
    <div className="bg-card shadow-sm rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-semibold">In-progress Reports</h1>
          <p className="text-xs text-muted-foreground">
            Submitted reports that are not yet approved or rejected.
          </p>
        </div>
        <Link to="/create" className="text-xs rounded-lg px-3 py-1 bg-blue-600 text-white hover:bg-blue-700">
          New report
        </Link>
      </div>

      {loading && <TableSkeleton rows={4} cols={5} />}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No in-progress reports.</p>
          <p className="mt-1 text-xs text-muted-foreground">Reports submitted for approval will appear here.</p>
          <Link
            to="/create"
            className="mt-3 inline-flex items-center gap-1 text-xs rounded-lg px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create a report
          </Link>
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="mt-2 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Title</th>
                <th className="text-left px-3 py-2">Destination</th>
                <th className="text-left px-3 py-2">Departure</th>
                <th className="text-left px-3 py-2">Return</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/50">
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2">{r.destination}</td>
                  <td className="px-3 py-2">{r.departureDate}</td>
                  <td className="px-3 py-2">{r.returnDate}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
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
  );
}
