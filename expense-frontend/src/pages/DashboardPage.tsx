import { useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import StatusBadge from '../ui/StatusBadge';
import { REPORT_STATUS, USER_ROLES } from '../lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import PageTransition from '@/components/PageTransition';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, fetchReports, fetchPendingApprovals, fetchActivity, fetchStats } from '@/lib/queries';
import type { ExpenseReportListItem, StatsResponse } from '../types';

const DashboardCharts = lazy(() => import('@/components/DashboardCharts'));

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card border shadow-sm p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-12" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border px-3 py-3">
          <Skeleton className="h-4 w-48" />
          <div className="mt-2 flex gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-card border shadow-sm p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[200px] w-full rounded-xl" />
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  action,
  accent,
}: {
  title: string;
  value: number | string;
  hint?: string;
  action?: React.ReactNode;
  accent?: 'neutral' | 'blue' | 'green' | 'red' | 'amber';
}) {
  const accentClasses: Record<string, string> = {
    neutral: '',
    blue: 'border-l-2 border-l-blue-400',
    green: 'border-l-2 border-l-emerald-500',
    red: 'border-l-2 border-l-red-400',
    amber: 'border-l-2 border-l-amber-400',
  };
  const valueClasses: Record<string, string> = {
    neutral: 'text-foreground',
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  const ac = accent ?? 'neutral';

  return (
    <div className={`rounded-2xl bg-card border shadow-sm p-5 ${accentClasses[ac]}`}>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</div>
      <div className={`mt-2 text-3xl font-bold tabular-nums ${valueClasses[ac]}`}>{value}</div>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isApprover =
    user &&
    (user.role === USER_ROLES.MANAGER || user.role === USER_ROLES.CFO || user.role === USER_ROLES.CEO);

  const { data: myReportsData, isLoading: reportsLoading, error: reportsError } = useQuery({
    queryKey: queryKeys.reports(user?.id),
    queryFn: () => fetchReports({ submitterId: user?.id ?? 0 }),
    enabled: !!user,
  });

  const myReports: ExpenseReportListItem[] = (myReportsData?.content ?? []) as ExpenseReportListItem[];

  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: queryKeys.activity(user?.id, user?.role),
    queryFn: () => fetchActivity(user?.id ?? 0, user?.role ?? ''),
    enabled: !!user,
  });

  const { data: pendingApprovalsData, isLoading: pendingLoading } = useQuery({
    queryKey: queryKeys.pendingApprovals(user?.role),
    queryFn: () => fetchPendingApprovals(user?.role ?? ''),
    enabled: !!user && !!isApprover,
  });

  const pendingApprovals: ExpenseReportListItem[] =
    (pendingApprovalsData?.content ?? []) as ExpenseReportListItem[];

  const { data: stats, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: queryKeys.stats(),
    queryFn: fetchStats,
    enabled: !!user,
  });

  const loading = reportsLoading || activityLoading || (!!isApprover && pendingLoading);
  const error = (reportsError as Error)?.message ?? '';

  const myCounts = useMemo(() => {
    const submitted = myReports.filter(
      (r) =>
        r.status === REPORT_STATUS.MANAGER_REVIEW ||
        r.status === REPORT_STATUS.CFO_REVIEW ||
        r.status === REPORT_STATUS.CEO_REVIEW ||
        r.status === REPORT_STATUS.CFO_SPECIAL_REVIEW,
    ).length;
    const approved = myReports.filter((r) => r.status === REPORT_STATUS.APPROVED).length;
    const rejected = myReports.filter((r) => r.status === REPORT_STATUS.REJECTED).length;
    return { total: myReports.length, submitted, approved, rejected };
  }, [myReports]);

  const pendingCount = pendingApprovals.length;

  if (!user) {
    return (
      <div className="bg-card rounded-2xl border shadow-sm p-6">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please login to view your dashboard.</p>
        <div className="mt-4">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-b from-muted/50 to-card border p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Welcome back, <span className="font-medium">{user.name}</span>
                {' '}
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {user.role}
                </span>
                {' '}— This is a public demo, data resets daily.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/create"
                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                New report
              </Link>
              <Link
                to="/reports"
                className="px-3 py-2 rounded-xl border bg-card text-sm font-medium hover:bg-accent"
              >
                View reports
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3" role="alert">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="My reports"
                value={myCounts.total}
                hint="All reports you've created"
                accent="blue"
                action={<Link to="/reports" className="text-xs text-blue-600 hover:underline">Open My Reports →</Link>}
              />
              <StatCard title="In review" value={myCounts.submitted} hint="Awaiting approvals" accent="amber" />
              <StatCard title="Approved" value={myCounts.approved} hint="Fully processed" accent="green" />
              <StatCard title="Rejected" value={myCounts.rejected} hint="Needs revision" accent="red" />
            </>
          )}
        </div>

        <Section title="Analytics overview">
          {statsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartSkeleton /><ChartSkeleton />
            </div>
          ) : stats ? (
            <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><ChartSkeleton /><ChartSkeleton /></div>}>
              <DashboardCharts stats={stats} />
            </Suspense>
          ) : null}
        </Section>

        {isApprover && (
          <Section
            title="Approval Inbox"
            right={<Link to="/approvals" className="text-xs text-blue-600 hover:underline">Open queue</Link>}
          >
            <div className="rounded-2xl bg-card border shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Pending approvals</div>
                  <div className="mt-1 text-xs text-muted-foreground">Reports currently waiting for approval.</div>
                </div>
                <div className="text-2xl font-semibold text-foreground">{loading ? '...' : pendingCount}</div>
              </div>

              {!loading && pendingCount === 0 && (
                <div className="mt-3 text-sm text-muted-foreground">Nothing to approve right now.</div>
              )}

              {!loading && pendingCount > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium py-2">Title</th>
                        <th className="text-left font-medium py-2">Destination</th>
                        <th className="text-left font-medium py-2">Status</th>
                        <th className="text-right font-medium py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingApprovals.slice(0, 5).map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="py-2">{r.title}</td>
                          <td className="py-2">{r.destination || '-'}</td>
                          <td className="py-2"><StatusBadge status={r.status} /></td>
                          <td className="py-2 text-right">
                            <Link
                              to={`/reports/${r.id}`}
                              state={{ from: '/approvals' }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Review
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pendingCount > 5 && (
                    <div className="mt-3 text-xs text-muted-foreground">Showing 5 of {pendingCount}.</div>
                  )}
                </div>
              )}
            </div>
          </Section>
        )}

        <Section
          title="Recent activity"
          right={<Link to="/search" className="text-xs text-blue-600 hover:underline">Search reports</Link>}
        >
          <div className="rounded-2xl bg-card border shadow-sm p-5">
            {activityLoading && <ActivitySkeleton />}
            {!activityLoading && (activity as ExpenseReportListItem[]).length === 0 && (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                <Link to="/create" className="mt-3 text-xs text-blue-600 hover:underline">Create your first report →</Link>
              </div>
            )}
            {!activityLoading && (activity as ExpenseReportListItem[]).length > 0 && (
              <div className="space-y-2">
                {(activity as ExpenseReportListItem[]).map((a) => (
                  <Link
                    key={a.id}
                    to={
                      a.status === REPORT_STATUS.CFO_SPECIAL_REVIEW
                        ? `/policy-exceptions/${a.id}`
                        : `/reports/${a.id}`
                    }
                    className="block rounded-xl border hover:bg-accent px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{a.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                          <StatusBadge status={a.status} />
                          {a.flagged && (
                            <span className="inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                              Flagged
                            </span>
                          )}
                          <span>${Number(a.totalAmount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">#{a.id}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Section>

        <Section
          title="Demo tips"
          right={<Link to="/welcome" className="text-xs text-blue-600 hover:underline">About this demo</Link>}
        >
          <div className="rounded-2xl bg-card border shadow-sm p-5 text-sm text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1">
              <li>Use <span className="font-medium">View as</span> in the sidebar to switch roles.</li>
              <li>Click <span className="font-medium">Reset demo</span> any time to restore sample data.</li>
              <li>This is a portfolio demo — please don&apos;t enter sensitive information.</li>
            </ul>
          </div>
        </Section>
      </div>
    </PageTransition>
  );
}
