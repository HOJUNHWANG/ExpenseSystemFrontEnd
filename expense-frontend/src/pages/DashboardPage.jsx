import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { apiFetch } from "../lib/api";
import StatusBadge from "../ui/StatusBadge.jsx";

function StatCard({ title, value, hint, action }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-2 text-xs text-slate-500">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Section({ title, children, right }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [myReports, setMyReports] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isApprover = user && (user.role === "MANAGER" || user.role === "CFO" || user.role === "CEO");

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const reports = await apiFetch(`/api/expense-reports?submitterId=${user.id}`);
        setMyReports(reports || []);

        const act = await apiFetch(
          `/api/expense-reports/activity?requesterId=${user.id}&requesterRole=${user.role}&limit=8`
        );
        setActivity(act || []);

        if (isApprover) {
          const pending = await apiFetch(`/api/expense-reports/pending-approval?requesterRole=${encodeURIComponent(user.role)}`);
          setPendingApprovals(pending || []);
        } else {
          setPendingApprovals([]);
        }
      } catch (e) {
        setError(e.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user, isApprover]);

  const myCounts = useMemo(() => {
    const submitted = myReports.filter((r) => (
      r.status === "MANAGER_REVIEW" || r.status === "CFO_REVIEW" || r.status === "CEO_REVIEW" || r.status === "CFO_SPECIAL_REVIEW"
    )).length;
    const approved = myReports.filter((r) => r.status === "APPROVED").length;
    const rejected = myReports.filter((r) => r.status === "REJECTED").length;
    return { total: myReports.length, submitted, approved, rejected };
  }, [myReports]);

  const pendingCount = pendingApprovals.length;

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Please login to view your dashboard.</p>
        <p className="mt-1 text-xs text-slate-500">
          Tip: Use the demo Role Switcher in the header to try the workflow solo.
        </p>
        <div className="mt-4">
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back, <span className="font-medium">{user.name}</span>. This is a public demo —
              data resets daily.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/create"
              className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
            >
              New report
            </Link>
            <Link
              to="/reports"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50"
            >
              View reports
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My reports"
          value={loading ? "…" : myCounts.total}
          hint="Created by the current demo user"
          action={
            <Link to="/reports" className="text-xs text-blue-600 hover:underline">
              Open My Reports
            </Link>
          }
        />
        <StatCard
          title="In review"
          value={loading ? "…" : myCounts.submitted}
          hint="Waiting for approvals"
        />
        <StatCard
          title="Approved"
          value={loading ? "…" : myCounts.approved}
          hint="Processed successfully"
        />
        <StatCard
          title="Rejected"
          value={loading ? "…" : myCounts.rejected}
          hint="Needs changes / missing info"
        />
      </div>

      {isApprover && (
        <Section
          title="Approval Inbox"
          right={
            <Link to="/approvals" className="text-xs text-blue-600 hover:underline">
              Open queue
            </Link>
          }
        >
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900">Pending approvals</div>
                <div className="mt-1 text-xs text-slate-500">
                  Reports currently waiting for approval.
                </div>
              </div>
              <div className="text-2xl font-semibold text-slate-900">{loading ? "…" : pendingCount}</div>
            </div>

            {!loading && pendingCount === 0 && (
              <div className="mt-3 text-sm text-slate-600">Nothing to approve right now.</div>
            )}

            {!loading && pendingCount > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500">
                    <tr>
                      <th className="text-left font-medium py-2">Title</th>
                      <th className="text-left font-medium py-2">Destination</th>
                      <th className="text-left font-medium py-2">Status</th>
                      <th className="text-right font-medium py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.slice(0, 5).map((r) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="py-2">{r.title}</td>
                        <td className="py-2">{r.destination || "-"}</td>
                        <td className="py-2">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-2 text-right">
                          <Link
                            to={`/reports/${r.id}`}
                            state={{ from: "/approvals" }}
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
                  <div className="mt-3 text-xs text-slate-500">Showing 5 of {pendingCount}.</div>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      <Section
        title="Recent activity"
        right={
          <Link to="/search" className="text-xs text-blue-600 hover:underline">
            Search reports
          </Link>
        }
      >
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          {loading && <div className="text-sm text-slate-600">Loading…</div>}

          {!loading && activity.length === 0 && (
            <div className="text-sm text-slate-600">No recent activity.</div>
          )}

          {!loading && activity.length > 0 && (
            <div className="space-y-2">
              {activity.map((a) => (
                <Link
                  key={a.id}
                  to={a.status === "CFO_SPECIAL_REVIEW" ? `/policy-exceptions/${a.id}` : `/reports/${a.id}`}
                  className="block rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {a.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 flex flex-wrap items-center gap-2">
                        <span>{a.activityLabel}</span>
                        <span className="text-slate-300">•</span>
                        <StatusBadge status={a.status} />
                        {a.flagged && (
                          <span className="inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                            Flagged
                          </span>
                        )}
                        <span className="text-slate-300">•</span>
                        <span>${Number(a.totalAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      #{a.id}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="Demo tips" right={<Link to="/welcome" className="text-xs text-blue-600 hover:underline">About this demo</Link>}>
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 text-sm text-slate-700">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Use <span className="font-medium">View as</span> in the header to switch roles and
              complete the full workflow.
            </li>
            <li>
              Click <span className="font-medium">Reset demo</span> any time to restore sample data.
            </li>
            <li>
              This is a portfolio demo — please don&apos;t enter sensitive information.
            </li>
          </ul>
        </div>
      </Section>
    </div>
  );
}
