import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { apiFetch } from "../lib/api";
import StatusBadge from "../ui/StatusBadge.jsx";
import { Button } from "../ui/Button.jsx";

function Pill({ children, tone = "slate" }) {
  const tones = {
    slate: "border bg-muted/50 text-muted-foreground",
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

function baseCode(code) {
  return String(code || "").split("#")[0];
}

function suffixFromCode(code) {
  const parts = String(code || "").split("#");
  if (parts.length < 2) return null;
  return parts.slice(1).join("#");
}

function itemIdFromCode(code) {
  const suffix = suffixFromCode(code);
  if (!suffix) return null;
  const id = Number(suffix);
  return Number.isFinite(id) ? id : null;
}

function dateFromCode(code) {
  const suffix = suffixFromCode(code);
  if (!suffix) return null;
  // expected: YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(suffix) ? suffix : null;
}

export default function PolicyExceptionReviewPage() {
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

  const isCfo = user && user.role === "CFO";

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
      setError(e.message || "Failed to load exception review");
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
  const missingRejectReasons = useMemo(() => {
    return items
      .filter((it) => decisions[it.code]?.decision === "REJECT")
      .filter((it) => !(decisions[it.code]?.financeReason || "").trim())
      .map((it) => it.code);
  }, [items, decisions]);

  const canReject =
    allDecided && anyReject && reviewerComment.trim().length > 0 && missingRejectReasons.length === 0;

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
      <div className="rounded-2xl bg-white border shadow-sm p-6">
        <h1 className="text-xl font-semibold text-foreground">Policy exceptions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please login as CFO to review policy exceptions.</p>
      </div>
    );
  }

  if (!isCfo) {
    return (
      <div className="rounded-2xl bg-white border shadow-sm p-6">
        <h1 className="text-xl font-semibold text-foreground">Policy exceptions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Only CFO can access this page.</p>
        <div className="mt-4">
          <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Exception review</h1>
            <p className="mt-1 text-sm text-muted-foreground">
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

        {loading && <div className="mt-4 text-sm text-muted-foreground">Loading…</div>}

        {!loading && report && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border bg-muted/50 px-4 py-3">
              <div className="text-xs text-muted-foreground">Report</div>
              <div className="mt-1 font-medium text-foreground">#{report.id} — {report.title}</div>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={report.status} />
                <Pill tone="orange">Policy exceptions</Pill>
              </div>
            </div>
            <div className="rounded-xl border border bg-muted/50 px-4 py-3">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="mt-1 text-lg font-semibold text-foreground">
                ${Number(report.totalAmount || 0).toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Destination: {report.destination || "-"}</div>
            </div>
          </div>
        )}
      </div>

      {!loading && review && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: contextual highlights */}
          <div className="rounded-2xl bg-white border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Highlighted sections</h2>
              <Pill tone="orange">Exception areas</Pill>
            </div>

            <div className="mt-4 space-y-3">
              {/* Trip section */}
              <div className={
                "rounded-2xl border p-4 " +
                (items.some((x) => baseCode(x.code) === "TRIP_DATES_INVALID")
                  ? "border-orange-100 bg-orange-50/40"
                  : "border bg-white")
              }>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">Trip</div>
                  {items.some((x) => baseCode(x.code) === "TRIP_DATES_INVALID") && <Pill tone="orange">TRIP_DATES_INVALID</Pill>}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Departure: {report?.departureDate || "-"} • Return: {report?.returnDate || "-"}
                </div>
              </div>

              {/* Items section */}
              <div className={
                "rounded-2xl border p-4 " +
                (items.some((x) => baseCode(x.code) !== "TRIP_DATES_INVALID")
                  ? "border-orange-100 bg-orange-50/40"
                  : "border bg-white")
              }>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">Items</div>
                  {items.some((x) => x.code !== "TRIP_DATES_INVALID") && <Pill tone="orange">Policy exceptions</Pill>}
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium py-2">Date</th>
                        <th className="text-left font-medium py-2">Description</th>
                        <th className="text-left font-medium py-2">Category</th>
                        <th className="text-right font-medium py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report?.items || []).map((it, idx) => {
                        const itId = it?.id ?? null;
                        const itemWarnings = items.filter((x) => itemIdFromCode(x.code) && String(itemIdFromCode(x.code)) === String(itId));
                        const has = (base) => itemWarnings.some((x) => baseCode(x.code) === base);

                        // Meals daily cap is scoped by date (MEALS_ABOVE_DAILY_CAP#YYYY-MM-DD)
                        const mealDates = items
                          .filter((x) => baseCode(x.code) === "MEALS_ABOVE_DAILY_CAP")
                          .map((x) => dateFromCode(x.code))
                          .filter(Boolean);
                        const hasMealsDailyForThisRow = mealDates.includes(it.date);

                        const isHotelCap = has("HOTEL_ABOVE_CAP")
                          && String(it.category || "").toLowerCase().includes("hotel")
                          && Number(it.amount) > 250;
                        const isMealCap = hasMealsDailyForThisRow
                          && (String(it.category || "").toLowerCase().includes("meal") || String(it.description || "").toLowerCase().includes("per diem"));
                        const isEntertainmentCap = has("ENTERTAINMENT_ABOVE_CAP")
                          && String(it.category || "").toLowerCase().includes("entertain")
                          && Number(it.amount) > 100;
                        const isAirfareCap = has("AIRFARE_ABOVE_CAP")
                          && String(it.category || "").toLowerCase().includes("airfare");
                        const isTransportationCap = has("TRANSPORTATION_ABOVE_CAP")
                          && String(it.category || "").toLowerCase().includes("transport")
                          && Number(it.amount) > 150;
                        const isOfficeCap = has("OFFICE_ABOVE_CAP")
                          && String(it.category || "").toLowerCase().includes("office")
                          && Number(it.amount) > 200;

                        const highlight = isHotelCap || isMealCap || isEntertainmentCap || isAirfareCap || isTransportationCap || isOfficeCap;
                        return (
                          <tr key={idx} className={"border-t border " + (highlight ? "bg-orange-50/40" : "")}
                          >
                            <td className="py-2">{it.date || "-"}</td>
                            <td className="py-2">{it.description}</td>
                            <td className="py-2">{it.category}</td>
                            <td className="py-2 text-right">${Number(it.amount || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {items.some((x) => baseCode(x.code) === "HOTEL_ABOVE_CAP") && <Pill tone="orange">HOTEL_ABOVE_CAP</Pill>}
                  {items.some((x) => baseCode(x.code) === "MEALS_ABOVE_DAILY_CAP") && <Pill tone="orange">MEALS_ABOVE_DAILY_CAP</Pill>}
                  {items.some((x) => baseCode(x.code) === "ENTERTAINMENT_ABOVE_CAP") && <Pill tone="orange">ENTERTAINMENT_ABOVE_CAP</Pill>}
                  {items.some((x) => baseCode(x.code) === "AIRFARE_ABOVE_CAP") && <Pill tone="orange">AIRFARE_ABOVE_CAP</Pill>}
                  {items.some((x) => baseCode(x.code) === "TRANSPORTATION_ABOVE_CAP") && <Pill tone="orange">TRANSPORTATION_ABOVE_CAP</Pill>}
                  {items.some((x) => baseCode(x.code) === "OFFICE_ABOVE_CAP") && <Pill tone="orange">OFFICE_ABOVE_CAP</Pill>}
                  {items.some((x) => baseCode(x.code) === "ITEM_DATE_OUTSIDE_TRIP") && <Pill tone="orange">ITEM_DATE_OUTSIDE_TRIP</Pill>}
                </div>
              </div>
            </div>
          </div>

          {/* Right: decisions checklist */}
          <div className="rounded-2xl bg-white border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Exception checklist</h2>
              <Pill tone={anyReject ? "red" : "green"}>{anyReject ? "Reject path" : "Approve path"}</Pill>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((it) => {
                const d = decisions[it.code]?.decision || "";
                const reason = decisions[it.code]?.financeReason || "";

                return (
                  <div
                    key={it.code}
                    data-testid={`exception-item-${it.code}`}
                    className={"rounded-2xl border p-4 border-orange-100 bg-orange-50/40"}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Pill tone="orange">{baseCode(it.code)}</Pill>
                          <div className="text-sm font-medium text-foreground">{it.message}</div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium">Employee reason:</span> {it.employeeReason}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <>
                          <Button
                            data-testid={`exception-approve-${it.code}`}
                            type="button"
                            variant={d === "APPROVE" ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => setDecision(it.code, { decision: "APPROVE" })}
                            className={d === "APPROVE" ? "bg-green-600 border-green-600 hover:bg-green-700" : ""}
                          >
                            ✓ Approve
                          </Button>
                          <Button
                            data-testid={`exception-reject-${it.code}`}
                            type="button"
                            variant={d === "REJECT" ? "danger" : "secondary"}
                            size="sm"
                            onClick={() => setDecision(it.code, { decision: "REJECT" })}
                          >
                            ✕ Reject
                          </Button>
                        </>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Finance note {d === "REJECT" ? "(required)" : "(optional)"}
                      </label>
                      <input
                        data-testid={`exception-note-${it.code}`}
                        value={reason}
                        onChange={(e) => setDecision(it.code, { financeReason: e.target.value })}
                        className={
                          "w-full border rounded-xl px-3 py-2 text-sm " +
                          (d === "REJECT" && !reason.trim()
                            ? "border-red-200 bg-red-50"
                            : "border")
                        }
                        placeholder={d === "REJECT" ? "Required for rejection" : "Optional note for this exception"}
                      />
                      {d === "REJECT" && !reason.trim() && (
                        <div className="mt-1 text-xs text-red-600">Required when rejecting this item.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Finance decision comment {anyReject ? "(required for reject)" : "(optional)"}
              </label>
              <textarea
                data-testid="exception-reviewer-comment"
                value={reviewerComment}
                onChange={(e) => setReviewerComment(e.target.value)}
                rows={3}
                className="w-full border border rounded-xl px-3 py-2 text-sm"
                placeholder={anyReject ? "Please explain why this is rejected." : "Optional overall comment."}
              />
              {anyReject && !reviewerComment.trim() && (
                <div className="mt-1 text-xs text-red-600">Required when any item is rejected.</div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {!allDecided
                  ? "Please decide approve/reject for all items."
                  : anyReject && reviewerComment.trim().length === 0
                  ? "Add a rejection comment to continue."
                  : anyReject && missingRejectReasons.length > 0
                  ? `Add finance notes for rejected items: ${missingRejectReasons.join(", ")}`
                  : "All items decided."}
              </div>

              <Button
                data-testid="exception-submit"
                type="button"
                disabled={saving || !(canApprove || canReject)}
                onClick={submitDecision}
                variant={anyReject ? "danger" : "primary"}
                size="md"
              >
                {saving
                  ? "Submitting…"
                  : anyReject
                  ? "Reject exceptions"
                  : "Approve exceptions"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
