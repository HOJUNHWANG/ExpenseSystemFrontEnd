import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { apiFetch } from "../lib/api";
import StatusBadge from "../ui/StatusBadge.jsx";

function Pill({ children, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    orange: "border-orange-100 bg-orange-50 text-orange-800",
    red: "border-red-100 bg-red-50 text-red-700",
    green: "border-green-100 bg-green-50 text-green-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone] || tones.slate}`}
    >
      {children}
    </span>
  );
}

export default function SpecialApprovalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [review, setReview] = useState(null);
  const [decisions, setDecisions] = useState({}); // code -> {decision, financeReason}
  const [reviewerComment, setReviewerComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isFinance = user && user.role === "FINANCE";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await apiFetch(`/api/expense-reports/${id}`);
      const sr = await apiFetch(`/api/expense-reports/${id}/special-review`);
      setReport(r);
      setReview(sr);

      // initialize decisions if empty
      const init = {};
      (sr.items || []).forEach((it) => {
        init[it.code] = {
          decision: it.financeDecision || "",
          financeReason: it.financeReason || "",
        };
      });
      setDecisions(init);
      setReviewerComment(sr.reviewerComment || "");
    } catch (e) {
      setError(e.message || "Failed to load special approval");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line no-void
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const items = review?.items || [];

  const anyReject = useMemo(() => {
    return items.some((it) => decisions[it.code]?.decision === "REJECT");
  }, [items, decisions]);

  const allDecided = useMemo(() => {
    return items.length > 0 && items.every((it) => {
      const d = decisions[it.code]?.decision;
      return d === "APPROVE" || d === "REJECT";
    });
  }, [items, decisions]);

  const canApprove = allDecided && !anyReject;
  const canReject = allDecided && anyReject && reviewerComment.trim().length > 0;

  const setDecision = (code, patch) => {
    setDecisions((prev) => ({
      ...prev,
      [code]: { ...(prev[code] || {}), ...patch },
    }));
  };

  const submitDecision = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        reviewerId: user.id,
        reviewerRole: user.role,
        reviewerComment,
        decisions: items.map((it) => ({
          code: it.code,
          decision: decisions[it.code]?.decision,
          financeReason: decisions[it.code]?.financeReason || "",
        })),
      };

      await apiFetch(`/api/expense-reports/${id}/special-review/decide`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      navigate(`/reports/${id}`);
    } catch (e) {
      setError(e.message || "Failed to submit decision");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-slate-900">Special approval</h1>
        <p className="mt-2 text-sm text-slate-600">Please login as Finance to review policy exceptions.</p>
      </div>
    );
  }

  if (!isFinance) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-slate-900">Special approval</h1>
        <p className="mt-2 text-sm text-slate-600">Only Finance can access this page.</p>
        <div className="mt-4">
          <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Finance special approval</h1>
            <p className="mt-1 text-sm text-slate-600">
              Review policy exceptions before this report enters the normal approval queue.
            </p>
          </div>
          <Link to={`/reports/${id}`} className="text-xs text-blue-600 hover:underline">
            Back to report
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {loading && <div className="mt-4 text-sm text-slate-600">Loading…</div>}

        {!loading && report && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">Report</div>
              <div className="mt-1 font-medium text-slate-900">#{report.id} — {report.title}</div>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={report.status} />
                <Pill tone="orange">Policy exceptions</Pill>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">Total</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                ${Number(report.totalAmount || 0).toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-slate-500">Destination: {report.destination || "-"}</div>
            </div>
          </div>
        )}
      </div>

      {!loading && review && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Exception checklist</h2>
            <Pill tone={anyReject ? "red" : "green"}>{anyReject ? "Reject path" : "Approve path"}</Pill>
          </div>

          <div className="mt-4 space-y-3">
            {items.map((it) => {
              const d = decisions[it.code]?.decision || "";
              const reason = decisions[it.code]?.financeReason || "";
              const highlight = true;

              return (
                <div
                  key={it.code}
                  className={
                    "rounded-2xl border p-4 " +
                    (highlight ? "border-orange-100 bg-orange-50/40" : "border-slate-200 bg-white")
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Pill tone="orange">{it.code}</Pill>
                        <div className="text-sm font-medium text-slate-900">{it.message}</div>
                      </div>
                      <div className="mt-2 text-xs text-slate-600">
                        <span className="font-medium">Employee reason:</span> {it.employeeReason}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDecision(it.code, { decision: "APPROVE" })}
                        className={
                          "px-3 py-2 rounded-xl text-sm font-medium border " +
                          (d === "APPROVE"
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white border-slate-200 hover:bg-slate-50")
                        }
                      >
                        ✓ Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision(it.code, { decision: "REJECT" })}
                        className={
                          "px-3 py-2 rounded-xl text-sm font-medium border " +
                          (d === "REJECT"
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white border-slate-200 hover:bg-slate-50")
                        }
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Finance note (optional)
                    </label>
                    <input
                      value={reason}
                      onChange={(e) => setDecision(it.code, { financeReason: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                      placeholder="Optional note for this exception"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Finance decision comment {anyReject ? "(required for reject)" : "(optional)"}
            </label>
            <textarea
              value={reviewerComment}
              onChange={(e) => setReviewerComment(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              placeholder={anyReject ? "Please explain why this is rejected." : "Optional overall comment."}
            />
            {anyReject && !reviewerComment.trim() && (
              <div className="mt-1 text-xs text-red-600">Required when any item is rejected.</div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {allDecided ? "All items decided." : "Please decide approve/reject for all items."}
            </div>

            <button
              type="button"
              disabled={saving || !(canApprove || canReject)}
              onClick={submitDecision}
              className={
                "px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60 " +
                (anyReject ? "bg-red-600" : "bg-slate-900")
              }
            >
              {saving
                ? "Submitting…"
                : anyReject
                ? "Reject special approval"
                : "Approve special approval"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
