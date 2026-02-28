import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { apiFetch } from '../lib/api';
import StatusBadge from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import SubmitWithWarningsModal from './SubmitWithWarningsModal';
import { REPORT_STATUS, USER_ROLES } from '../lib/constants';
import { toast } from 'sonner';
import { Download, FileSpreadsheet } from 'lucide-react';
import AuditTimeline from './AuditTimeline';
import type { ExpenseReport } from '../types';

interface SubmitterFeedbackItem {
  id?: string;
  code?: string;
  message: string;
  financeDecision: string;
  financeReason?: string;
}

interface SubmitterFeedbackData {
  reviewerComment?: string;
  items?: SubmitterFeedbackItem[];
}

function ChangesRequestedFeedback({
  reportId,
  requesterId,
}: {
  reportId: string | number;
  requesterId?: string | number;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<SubmitterFeedbackData | null>(null);

  useEffect(() => {
    if (!reportId || !requesterId) return;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const d = await apiFetch(
          `/api/expense-reports/${reportId}/submitter-feedback?requesterId=${requesterId}`,
        );
        setData(d as SubmitterFeedbackData);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load finance feedback');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [reportId, requesterId]);

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
      <div className="font-medium">Exception review rejected</div>
      {loading && <div className="mt-1 text-xs text-red-700">Loading feedback…</div>}
      {error && <div className="mt-1 text-xs text-red-700">{error}</div>}

      {!loading && !error && data && (data.items || []).filter((it) => it.financeDecision === 'REJECT').length === 0 && (
        <div className="mt-2 text-xs text-red-700">No rejected items were found.</div>
      )}

      {!loading && !error && data && (
        <>
          <div className="mt-2 text-xs text-red-700">Your exception review request was rejected.</div>
          <div className="mt-2 text-xs text-red-700">
            <span className="font-medium">Reviewer comment:</span> {data.reviewerComment || '-'}
          </div>
          <div className="mt-3">
            <div className="text-xs font-medium text-red-700">Rejected items</div>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-xs text-red-700">
              {(data.items || [])
                .filter((it) => it.financeDecision === 'REJECT')
                .map((it, i) => (
                  <li key={it.id ?? it.code ?? i}>
                    <span className="font-medium">{it.code}</span>: {it.message}
                    {it.financeReason ? ` — Reason: ${it.financeReason}` : ''}
                  </li>
                ))}
            </ul>
          </div>
        </>
      )}

      <div className="mt-3 text-xs text-red-700">
        Update the report to comply with policy, then resubmit. Or delete the report if you no longer want to proceed.
      </div>
    </div>
  );
}

export default function ExpenseReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [report, setReport] = useState<ExpenseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [comment, setComment] = useState('');
  const [actionMode, setActionMode] = useState<'approve' | 'reject' | null>(null);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    setActionMessage('');
    try {
      const data = await apiFetch(`/api/expense-reports/${id}`);
      setReport(data as ExpenseReport);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleApproveOrReject = async (action: 'approve' | 'reject') => {
    if (!user) {
      setError('You must be logged in to approve or reject.');
      return;
    }
    setProcessing(true);
    setActionMessage('');
    setError('');
    setActionMode(null);
    setComment('');

    try {
      await apiFetch(`/api/expense-reports/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({
          approverId: user.id,
          comment: comment || `${action} by ${user.name}`,
        }),
      });

      setActionMessage(`Report successfully ${action}d.`);
      toast.success(`Report ${action}d.`);

      if (from === '/approvals') {
        navigate(`/approvals?toast=${action}d`, { replace: true });
        return;
      }

      await fetchReport();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card shadow-sm rounded-xl p-6">
        <p className="text-sm text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="bg-card shadow-sm rounded-xl p-6">
        <p className="text-sm text-red-600 mb-4" role="alert">Error: {error}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">Back</button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-card shadow-sm rounded-xl p-6">
        <p className="text-sm text-muted-foreground">Report not found.</p>
      </div>
    );
  }

  const total = report.totalAmount ?? 0;
  const isOwner = user && Number(report.submitterId) === Number(user.id);
  const canApproveByRole =
    user &&
    (user.role === USER_ROLES.MANAGER || user.role === USER_ROLES.CFO || user.role === USER_ROLES.CEO);
  const canTakeAction =
    canApproveByRole &&
    !isOwner &&
    (report.status === REPORT_STATUS.MANAGER_REVIEW ||
      report.status === REPORT_STATUS.CFO_REVIEW ||
      report.status === REPORT_STATUS.CEO_REVIEW);
  const canSubmit = isOwner && report.status === REPORT_STATUS.CHANGES_REQUESTED;
  const isDraft = isOwner && report.status === REPORT_STATUS.DRAFT;

  return (
    <div className="bg-card shadow-sm rounded-xl p-6 space-y-4">
      {deleteConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-card border shadow-xl p-6">
            <div id="detail-delete-dialog-title" className="text-lg font-semibold text-foreground">
              Delete this report?
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This action cannot be undone. The report will be permanently removed.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-3 py-2 rounded-xl border bg-card text-sm hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setDeleteConfirmOpen(false);
                  try {
                    await apiFetch(`/api/expense-reports/${id}?requesterId=${user!.id}`, { method: 'DELETE' });
                    toast.success('Report deleted.');
                    navigate('/reports');
                  } catch (e: unknown) {
                    setSubmitError(e instanceof Error ? e.message : 'Delete failed');
                  }
                }}
                className="px-3 py-2 rounded-xl border border-destructive bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <SubmitWithWarningsModal
        open={showSubmitModal}
        warnings={report.policyWarnings ?? []}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={async (reasons) => {
          setSubmitError('');
          setSubmitting(true);
          try {
            await apiFetch(`/api/expense-reports/${id}/submit`, {
              method: 'POST',
              body: JSON.stringify({ submitterId: user!.id, reasons }),
            });
            setSubmitting(false);
            setShowSubmitModal(false);
            await fetchReport();
            navigate('/reports/in-progress');
          } catch (e: unknown) {
            setSubmitting(false);
            throw e;
          }
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">
          Expense Report #{report.id} – {report.title}
        </h2>
        <div className="flex items-center gap-2">
          {(canSubmit || isDraft) && (
            <>
              <Button onClick={() => navigate(`/reports/${id}/edit`)} variant="secondary" size="sm">
                Edit
              </Button>
              {(isDraft || canSubmit) && (
                <Button
                  onClick={() => setDeleteConfirmOpen(true)}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              )}
              {canSubmit && (
                <Button
                  onClick={() => {
                    setSubmitError('');
                    if (report.policyWarnings && report.policyWarnings.length > 0) {
                      setShowSubmitModal(true);
                    } else {
                      void (async () => {
                        try {
                          setSubmitting(true);
                          await apiFetch(`/api/expense-reports/${id}/submit`, {
                            method: 'POST',
                            body: JSON.stringify({ submitterId: user!.id, reasons: [] }),
                          });
                          setSubmitting(false);
                          await fetchReport();
                          navigate('/reports/in-progress');
                        } catch (e: unknown) {
                          setSubmitting(false);
                          setSubmitError(e instanceof Error ? e.message : 'Submit failed');
                        }
                      })();
                    }
                  }}
                  disabled={submitting}
                  variant="default"
                  size="sm"
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </Button>
              )}
            </>
          )}

          {report.status !== REPORT_STATUS.DRAFT && (
            <>
              <Button
                variant="outline"
                size="sm"
                aria-label="Export as PDF"
                onClick={async () => {
                  const { exportReportPdf } = await import('../lib/exportReport');
                  exportReportPdf(report);
                }}
              >
                <Download className="h-4 w-4 mr-1" aria-hidden="true" /> PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-label="Export as Excel"
                onClick={async () => {
                  const { exportReportExcel } = await import('../lib/exportReport');
                  exportReportExcel(report);
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" aria-hidden="true" /> Excel
              </Button>
            </>
          )}

          <button onClick={() => navigate('/reports')} className="text-sm text-blue-600 hover:underline">
            ← Back
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-lg bg-green-50 text-green-700 text-sm px-3 py-2">{actionMessage}</div>
      )}

      {submitError && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2" role="alert">
          {submitError}
        </div>
      )}

      {report.status === REPORT_STATUS.CHANGES_REQUESTED && (
        <ChangesRequestedFeedback reportId={report.id} requesterId={user?.id} />
      )}

      {report.flagged && report.policyFlags && report.policyFlags.length > 0 && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <div className="font-medium">Policy warnings</div>
          <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
            {report.policyFlags.map((f, idx) => (
              <li key={idx}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div><div className="font-medium text-muted-foreground">Status</div><div><StatusBadge status={report.status} className="mt-1" /></div></div>
        <div><div className="font-medium text-muted-foreground">Destination</div><div className="mt-1">{report.destination || '-'}</div></div>
        <div><div className="font-medium text-muted-foreground">Departure Date</div><div className="mt-1">{report.departureDate || '-'}</div></div>
        <div><div className="font-medium text-muted-foreground">Return Date</div><div className="mt-1">{report.returnDate || '-'}</div></div>
        <div>
          <div className="font-medium text-muted-foreground">Submitter</div>
          <div className="mt-1">{report.submitterName ? `${report.submitterName} (ID: ${report.submitterId})` : '-'}</div>
        </div>
        <div>
          <div className="font-medium text-muted-foreground">Approver</div>
          <div className="mt-1">{report.approverName ? `${report.approverName} (ID: ${report.approverId})` : '-'}</div>
        </div>
        <div>
          <div className="font-medium text-muted-foreground">Created At</div>
          <div className="mt-1">{report.createdAt ? report.createdAt.replace('T', ' ') : '-'}</div>
        </div>
        <div>
          <div className="font-medium text-muted-foreground">Approved / Rejected At</div>
          <div className="mt-1">{report.approvedAt ? report.approvedAt.replace('T', ' ') : '-'}</div>
        </div>
        <div><div className="font-medium text-muted-foreground">Approval Comment</div><div className="mt-1">{report.approvalComment || '-'}</div></div>
        <div>
          <div className="font-medium text-muted-foreground">Total Amount</div>
          <div className="mt-1 font-semibold">{total.toLocaleString()} (base currency)</div>
        </div>
      </div>

      {(report.perDiemDays ?? 0) > 0 && (
        <div className="rounded-xl border bg-muted/30 px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground mb-1">Per-Diem Allowance</h3>
          <div className="text-sm text-muted-foreground">
            Rate: <span className="font-medium text-foreground">${report.perDiemRate}/day</span>
            {' '}({report.perDiemRate === 25 ? 'Domestic' : 'International'})
            {' | '}Days: <span className="font-medium text-foreground">{report.perDiemDays}</span>
            {' | '}Total: <span className="font-medium text-foreground">${Number(report.perDiemAmount).toFixed(2)}</span>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">Items</h3>
        {(!report.items || report.items.length === 0) && (
          <p className="text-sm text-muted-foreground">This report has no expense items.</p>
        )}
        {report.items && report.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-left font-medium">Description</th>
                  <th className="px-3 py-2 text-left font-medium">Category</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-3 py-2">{item.date || '-'}</td>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2">{item.category}</td>
                    <td className="px-3 py-2 text-right">{item.amount?.toLocaleString() ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {report.id && <AuditTimeline reportId={report.id} />}

      <div className="border-t pt-4 space-y-3">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2" role="alert">{error}</div>
        )}

        {canApproveByRole && (
          <div className="mt-4 border-t pt-4">
            {isOwner && (
              <div className="text-sm bg-yellow-50 text-yellow-800 rounded-lg px-3 py-2 mb-3">
                You cannot approve or reject your own report.
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                disabled={!canTakeAction || processing}
                onClick={() => { setActionMode('approve'); setComment(''); }}
                className="px-4 py-2 rounded-lg text-sm bg-green-600 text-white disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={!canTakeAction || processing}
                onClick={() => { setActionMode('reject'); setComment(''); }}
                className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white disabled:opacity-50"
              >
                Reject
              </button>
            </div>

            {actionMode && (
              <div className="mt-4 border rounded-lg p-4 bg-muted/50">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {actionMode === 'approve' ? 'Approve comment (optional)' : 'Reject comment (required)'}
                  </p>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => { setActionMode(null); setComment(''); }}
                    disabled={processing}
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder={actionMode === 'approve' ? 'Add a comment (optional)' : 'Please provide a reason for rejection'}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={processing}
                />
                {actionMode === 'reject' && !comment.trim() && (
                  <p className="text-xs text-red-600 mt-1">Comment is required for rejection.</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    disabled={processing || !canTakeAction || (actionMode === 'reject' && !comment.trim())}
                    onClick={() => void handleApproveOrReject(actionMode)}
                    className={`px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50 ${actionMode === 'approve' ? 'bg-green-600' : 'bg-red-600'}`}
                  >
                    {processing ? 'Processing...' : actionMode === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg text-sm border"
                    onClick={() => { setActionMode(null); setComment(''); }}
                    disabled={processing}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {!(report.status === REPORT_STATUS.MANAGER_REVIEW || report.status === REPORT_STATUS.CFO_REVIEW || report.status === REPORT_STATUS.CEO_REVIEW) && (
              <p className="text-xs text-muted-foreground mt-2">
                This report is already {report.status.toLowerCase()}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
