// src/components/ExpenseReportDetail.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLocation } from "react-router-dom";
import StatusBadge from "../ui/StatusBadge.jsx";
import SubmitWithWarningsModal from "./SubmitWithWarningsModal.jsx";


export default function ExpenseReportDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();
    const from = location.state?.from; // "/approvals" 같은 값

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [processing, setProcessing] = useState(false);
    const [comment, setComment] = useState("");
    const [actionMode, setActionMode] = useState(null); // "approve" | "reject" | null

    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        setError("");
        setActionMessage("");

        try {
            const { apiFetch } = await import("../lib/api");
            const data = await apiFetch(`/api/expense-reports/${id}`);
            setReport(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [id]);

    const handleApproveOrReject = async (action) => {
        if (!user) {
            setError("You must be logged in to approve or reject.");
            return;
        }
        setProcessing(true);
        setActionMessage("");
        setError("");
        setActionMode(null);
        setComment("");

        try {
            const { apiFetch } = await import("../lib/api");
            await apiFetch(`/api/expense-reports/${id}/${action}`, {
                method: "POST",
                body: JSON.stringify({
                    approverId: user.id,
                    comment: comment || `${action} by ${user.name}`,
                }),
            });

            setActionMessage(`Report successfully ${action}d.`);

            if (from === "/approvals") {
              navigate(`/approvals?toast=${action}d`, { replace: true });
              return;
            }

            await fetchReport();

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white shadow-md rounded-xl p-6">
                <p className="text-sm text-slate-600">Loading report...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white shadow-md rounded-xl p-6">
                <p className="text-sm text-red-600 mb-4">Error: {error}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Back
                </button>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="bg-white shadow-md rounded-xl p-6">
                <p className="text-sm text-slate-600">Report not found.</p>
            </div>
        );
    }

    const total = report.totalAmount ?? 0;

    const isOwner = user && report && Number(report.submitterId) === Number(user.id);
    const canApproveByRole = user && (user.role === "MANAGER" || user.role === "FINANCE");
    const canTakeAction = canApproveByRole && !isOwner && report?.status === "SUBMITTED";

    const canSubmit = isOwner && (report?.status === "DRAFT" || report?.status === "CHANGES_REQUESTED");

    return (
        <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
            <SubmitWithWarningsModal
              open={showSubmitModal}
              warnings={report?.policyWarnings || []}
              onClose={() => setShowSubmitModal(false)}
              onSubmit={async (reasons) => {
                setSubmitError("");
                setSubmitting(true);
                const { apiFetch } = await import("../lib/api");
                const st = await apiFetch(`/api/expense-reports/${id}/submit`, {
                  method: "POST",
                  body: JSON.stringify({ submitterId: user.id, reasons }),
                });
                setSubmitting(false);
                setShowSubmitModal(false);

                // For submitter: just refresh the report status.
                await fetchReport();

                if (st === "FINANCE_SPECIAL_REVIEW") {
                  // optional: show a toast; for now just keep on detail page
                  setActionMessage("Submitted for Finance special approval.");
                } else if (st === "SUBMITTED") {
                  setActionMessage("Submitted to approval queue.");
                }
              }}
            />

            <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">
                    Expense Report #{report.id} – {report.title}
                </h2>
                <div className="flex items-center gap-2">
                  {canSubmit && (
                    <button
                      onClick={() => {
                        setSubmitError("");
                        // If there are warnings, show modal to collect reasons.
                        if (report?.policyWarnings && report.policyWarnings.length > 0) {
                          setShowSubmitModal(true);
                        } else {
                          // submit directly
                          // eslint-disable-next-line no-void
                          void (async () => {
                            try {
                              setSubmitting(true);
                              const { apiFetch } = await import("../lib/api");
                              const st = await apiFetch(`/api/expense-reports/${id}/submit`, {
                                method: "POST",
                                body: JSON.stringify({ submitterId: user.id, reasons: [] }),
                              });
                              setSubmitting(false);
                              if (st === "FINANCE_SPECIAL_REVIEW") {
                                // submitter can view status; finance will review
                                navigate(`/reports/${id}`);
                              } else {
                                navigate(`/reports/${id}`);
                              }
                              await fetchReport();
                            } catch (e) {
                              setSubmitting(false);
                              setSubmitError(e.message || "Submit failed");
                            }
                          })();
                        }
                      }}
                      disabled={submitting}
                      className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-60"
                    >
                      {submitting ? "Submitting…" : "Submit"}
                    </button>
                  )}
                  <button
                      onClick={() => navigate("/reports")}
                      className="text-sm text-blue-600 hover:underline"
                  >
                      ← Back
                  </button>
                </div>
            </div>

            {actionMessage && (
                <div className="rounded-lg bg-green-50 text-green-700 text-sm px-3 py-2">
                    {actionMessage}
                </div>
            )}

            {submitError && (
              <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">
                {submitError}
              </div>
            )}

            {report.flagged && report.policyFlags && report.policyFlags.length > 0 && (
              <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                <div className="font-medium">Policy flags</div>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                  {report.policyFlags.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <div className="font-medium text-slate-500">Status</div>
                    <div>
            <StatusBadge status={report.status} className="mt-1" />
                    </div>
                </div>

                <div>
                    <div className="font-medium text-slate-500">Destination</div>
                    <div className="mt-1">{report.destination || "-"}</div>
                </div>

                <div>
                    <div className="font-medium text-slate-500">Departure Date</div>
                    <div className="mt-1">{report.departureDate || "-"}</div>
                </div>

                <div>
                    <div className="font-medium text-slate-500">Return Date</div>
                    <div className="mt-1">{report.returnDate || "-"}</div>
                </div>

                <div>
                    <div className="font-medium text-slate-500">Submitter</div>
                    <div className="mt-1">
                        {report.submitterName
                            ? `${report.submitterName} (ID: ${report.submitterId})`
                            : "-"}
                    </div>
                </div>

                <div>
                    <div className="font-medium text-slate-500">Approver</div>
                    <div className="mt-1">
                        {report.approverName
                            ? `${report.approverName} (ID: ${report.approverId})`
                            : "-"}
                    </div>
                </div>

                <div>
                    <div className="font-medium text-slate-500">Created At</div>
                    <div className="mt-1">
                        {report.createdAt ? report.createdAt.replace("T", " ") : "-"}
                    </div>
                </div>

                <div>
                    <div className="font-medium text-slate-500">Approved / Rejected At</div>
                    <div className="mt-1">
                        {report.approvedAt ? report.approvedAt.replace("T", " ") : "-"}
                    </div>
                </div>

                <div>
                    <div className="font-medium text-slate-500">Approval Comment</div>
                    <div className="mt-1">{report.approvalComment || "-"}</div>
                </div>

                <div>
                    <div className="font-medium text-slate-500">Total Amount</div>
                    <div className="mt-1 font-semibold">
                        {total.toLocaleString()} (base currency)
                    </div>
                </div>
            </div>

            {/* Items */}
            <div>
                <h3 className="text-lg font-semibold mb-2">Items</h3>
                {(!report.items || report.items.length === 0) && (
                    <p className="text-sm text-slate-500">
                        This report has no expense items.
                    </p>
                )}
                {report.items && report.items.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                            <tr className="border-b bg-slate-50">
                                <th className="px-3 py-2 text-left font-medium">Date</th>
                                <th className="px-3 py-2 text-left font-medium">
                                    Description
                                </th>
                                <th className="px-3 py-2 text-left font-medium">Category</th>
                                <th className="px-3 py-2 text-right font-medium">Amount</th>
                            </tr>
                            </thead>
                            <tbody>
                            {report.items.map((item) => (
                                <tr key={item.id} className="border-b">
                                    <td className="px-3 py-2">{item.date || "-"}</td>
                                    <td className="px-3 py-2">{item.description}</td>
                                    <td className="px-3 py-2">{item.category}</td>
                                    <td className="px-3 py-2 text-right">
                                        {item.amount?.toLocaleString() ?? 0}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Approve / Reject section */}
            <div className="border-t pt-4 space-y-3">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Approval / Rejection Comment
                    </label>
                    <textarea
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Optional comment for approval or rejection."
                    />
                </div>

                {error && (
                    <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">
                        {error}
                    </div>
                )}

                {canApproveByRole && (
                    <div className="mt-4 border-t pt-4">
                        {isOwner && (
                            <div className="text-sm bg-yellow-50 text-yellow-800 rounded-lg px-3 py-2 mb-3">
                                You cannot approve or reject your own report.
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={!canTakeAction || processing}
                              onClick={() => {
                                setActionMode("approve");
                                setComment("");
                              }}
                              className="px-4 py-2 rounded-lg text-sm bg-green-600 text-white disabled:opacity-50"
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              disabled={!canTakeAction || processing}
                              onClick={() => {
                                setActionMode("reject");
                                setComment("");
                              }}
                              className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white disabled:opacity-50"
                            >
                              Reject
                            </button>

                            {actionMode && (
                              <div className="mt-4 border rounded-lg p-4 bg-slate-50">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-sm font-medium text-slate-700">
                                    {actionMode === "approve" ? "Approve comment (optional)" : "Reject comment (required)"}
                                  </p>
                                  <button
                                    type="button"
                                    className="text-xs text-slate-600 hover:underline"
                                    onClick={() => {
                                      setActionMode(null);
                                      setComment("");
                                    }}
                                    disabled={processing}
                                  >
                                    Cancel
                                  </button>
                                </div>

                                <textarea
                                  className="w-full border rounded-lg px-3 py-2 text-sm"
                                  rows={3}
                                  placeholder={
                                    actionMode === "approve"
                                      ? "Add a comment (optional)"
                                      : "Please provide a reason for rejection"
                                  }
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  disabled={processing}
                                />

                                {actionMode === "reject" && !comment.trim() && (
                                  <p className="text-xs text-red-600 mt-1">
                                    Comment is required for rejection.
                                  </p>
                                )}

                                <div className="flex gap-2 mt-3">
                                  <button
                                    type="button"
                                    disabled={
                                      processing ||
                                      !canTakeAction ||
                                      (actionMode === "reject" && !comment.trim())
                                    }
                                    onClick={() => handleApproveOrReject(actionMode)}
                                    className={`px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50 ${
                                      actionMode === "approve" ? "bg-green-600" : "bg-red-600"
                                    }`}
                                  >
                                    {processing
                                      ? "Processing..."
                                      : actionMode === "approve"
                                      ? "Confirm Approve"
                                      : "Confirm Reject"}
                                  </button>

                                  <button
                                    type="button"
                                    className="px-4 py-2 rounded-lg text-sm border"
                                    onClick={() => {
                                      setActionMode(null);
                                      setComment("");
                                    }}
                                    disabled={processing}
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            )}
                        </div>

                        {report?.status !== "SUBMITTED" && (
                            <p className="text-xs text-slate-500 mt-2">
                                This report is already {report.status.toLowerCase()}.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
