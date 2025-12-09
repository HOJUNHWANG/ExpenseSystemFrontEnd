// src/components/ExpenseReportDetail.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ExpenseReportDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [processing, setProcessing] = useState(false);
    const [comment, setComment] = useState("");

    // TODO: later this should come from logged-in user
    const approverId = 2;

    const fetchReport = async () => {
        setLoading(true);
        setError("");
        setActionMessage("");

        try {
            const res = await fetch(
                `http://localhost:8080/api/expense-reports/${id}`
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to load report");
            }

            const data = await res.json();
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
        if (!window.confirm(`Are you sure you want to ${action} this report?`)) {
            return;
        }

        setProcessing(true);
        setActionMessage("");
        setError("");

        try {
            const res = await fetch(
                `http://localhost:8080/api/expense-reports/${id}/${action}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        approverId,
                        comment: comment || `${action} by approver ${approverId}`,
                    }),
                }
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Failed to ${action} report`);
            }

            setActionMessage(`Report successfully ${action}d.`);
            // reload report to see updated status
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

    return (
        <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    Expense Report #{report.id} – {report.title}
                </h2>
                <button
                    onClick={() => navigate("/reports")}
                    className="text-sm text-blue-600 hover:underline"
                >
                    ← Back to list
                </button>
            </div>

            {actionMessage && (
                <div className="rounded-lg bg-green-50 text-green-700 text-sm px-3 py-2">
                    {actionMessage}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <div className="font-medium text-slate-500">Status</div>
                    <div>
            <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs mt-1 ${
                    report.status === "APPROVED"
                        ? "bg-green-50 text-green-700"
                        : report.status === "REJECTED"
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-50 text-slate-700"
                }`}
            >
              {report.status}
            </span>
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

                <div className="flex gap-3">
                    <button
                        type="button"
                        disabled={processing || report.status === "APPROVED"}
                        onClick={() => handleApproveOrReject("approve")}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white disabled:opacity-60"
                    >
                        Approve
                    </button>
                    <button
                        type="button"
                        disabled={processing || report.status === "REJECTED"}
                        onClick={() => handleApproveOrReject("reject")}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white disabled:opacity-60"
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
}
