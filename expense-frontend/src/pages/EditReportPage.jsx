import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { apiFetch } from "../lib/api";
import { Button, ButtonLink } from "../ui/Button.jsx";
import { evaluateDraftWarnings } from "../lib/policy";

const CATEGORY_OPTIONS = [
  "Airfare",
  "Hotel",
  "Transportation",
  "Mileage",
  "Office",
  "Entertainment",
];

const ITEM_TYPES = {
  NORMAL: "Normal",
  MILEAGE: "MILEAGE",
  MEAL: "Meal",
};

const MILEAGE_RATE = 0.7;
const MEAL_RATE = 25;

function parseCountryFromDestination(destination) {
  if (!destination) return "";
  const parts = String(destination).split(",");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].trim();
}

export default function EditReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [items, setItems] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canEdit = useMemo(() => {
    return user && title !== null;
  }, [user, title]);

  const country = useMemo(() => parseCountryFromDestination(destination), [destination]);

  const policyWarnings = useMemo(() => {
    return evaluateDraftWarnings({
      country,
      departureDate,
      returnDate,
      items: (items || []).map((it) => ({
        date: it.date,
        description: it.description,
        amount: it.amount,
        category: it.category,
      })),
    });
  }, [country, departureDate, returnDate, items]);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const r = await apiFetch(`/api/expense-reports/${id}`);

        if (Number(r.submitterId) !== Number(user.id)) {
          throw new Error("Only the submitter can edit this report.");
        }
        if (r.status !== "DRAFT" && r.status !== "CHANGES_REQUESTED") {
          throw new Error("Only DRAFT/CHANGES_REQUESTED reports can be edited.");
        }

        setTitle(r.title || "");
        setDestination(r.destination || "");
        setDepartureDate(r.departureDate || "");
        setReturnDate(r.returnDate || "");
        setItems(
          (r.items || []).map((it) => {
            const cat = it.category || "";
            const desc = it.description || "";
            let type = ITEM_TYPES.NORMAL;
            if (String(cat).toLowerCase().includes("mileage")) type = ITEM_TYPES.MILEAGE;
            else if (String(cat).toLowerCase().includes("meal")) type = ITEM_TYPES.MEAL;
            return {
              type,
              date: it.date || "",
              description: desc,
              amount: String(it.amount ?? ""),
              category: cat,
              // optional fields
              miles: type === ITEM_TYPES.MILEAGE ? "" : undefined,
              rate: type === ITEM_TYPES.MILEAGE ? MILEAGE_RATE : undefined,
              lunch: type === ITEM_TYPES.MEAL ? true : undefined,
              dinner: type === ITEM_TYPES.MEAL ? true : undefined,
            };
          })
        );
      } catch (e) {
        setError(e.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    // eslint-disable-next-line no-void
    void run();
  }, [id, user]);

  const addNormalItem = () => {
    setItems((prev) => [
      ...prev,
      { type: ITEM_TYPES.NORMAL, date: "", description: "", amount: "", category: "" },
    ]);
  };

  const addMileageItem = () => {
    setItems((prev) => {
      if (prev.some((it) => it.type === ITEM_TYPES.MILEAGE)) return prev;
      return [
        ...prev,
        {
          type: ITEM_TYPES.MILEAGE,
          date: "",
          miles: "",
          rate: MILEAGE_RATE,
          amount: 0,
          category: "Mileage",
          description: "Mileage reimbursement",
        },
      ];
    });
  };

  const recomputeMealAmount = (lunch, dinner) => {
    const count = (lunch ? 1 : 0) + (dinner ? 1 : 0);
    return count * MEAL_RATE;
  };

  const addMealItem = () => {
    setItems((prev) => [
      ...prev,
      {
        type: ITEM_TYPES.MEAL,
        date: "",
        lunch: true,
        dinner: true,
        amount: 50,
        category: "Meal",
        description: "Per diem (Lunch/Dinner)",
      },
    ]);
  };

  const onMealToggle = (index, field, checked) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const next = { ...it, [field]: checked };
        next.amount = recomputeMealAmount(next.lunch, next.dinner);
        return next;
      })
    );
  };

  const onMileageChange = (index, value) => {
    const miles = value;
    const milesNum = Number(miles);
    const amount = !miles || isNaN(milesNum) ? 0 : Number((milesNum * MILEAGE_RATE).toFixed(2));
    updateItem(index, { miles, amount });
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const buildPayloadItems = () => {
    return items.map((it) => {
      if (it.type === ITEM_TYPES.NORMAL) {
        return {
          date: it.date,
          description: it.description,
          amount: Number(it.amount || 0),
          category: it.category,
        };
      }

      if (it.type === ITEM_TYPES.MILEAGE) {
        return {
          date: it.date || departureDate,
          description: `Mileage: ${it.miles || 0} miles x ${MILEAGE_RATE}`,
          amount: Number(it.amount || 0),
          category: "Mileage",
        };
      }

      const mealDesc = `Meal: ${it.lunch ? "Lunch" : ""}${it.lunch && it.dinner ? " + " : ""}${it.dinner ? "Dinner" : ""}`;
      return {
        date: it.date,
        description: mealDesc,
        amount: Number(it.amount || 0),
        category: "Meal",
      };
    });
  };

  const buildPayload = () => {
    return {
      submitterId: user.id,
      title,
      destination,
      departureDate: departureDate || null,
      returnDate: returnDate || null,
      items: buildPayloadItems().map((it) => ({
        date: it.date || null,
        description: it.description || "(draft)",
        amount: Number(it.amount || 0),
        category: it.category || "Other",
      })),
    };
  };

  const save = async (e) => {
    e?.preventDefault?.();
    if (!user) return;

    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/expense-reports/${id}`, {
        method: "PUT",
        body: JSON.stringify(buildPayload()),
      });

      navigate(`/reports/${id}`);
    } catch (e2) {
      setError(e2.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!user) return;

    // If warnings exist, confirm first (same UX as Create).
    if (policyWarnings.length > 0) {
      setConfirmOpen(true);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      // Save latest edits first.
      await apiFetch(`/api/expense-reports/${id}`, {
        method: "PUT",
        body: JSON.stringify(buildPayload()),
      });

      await apiFetch(`/api/expense-reports/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ submitterId: user.id, reasons: [] }),
      });

      navigate("/reports/in-progress");
    } catch (e2) {
      setError(e2.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSubmit = async () => {
    setConfirmOpen(false);
    if (!user) return;

    setSubmitting(true);
    setError("");
    try {
      await apiFetch(`/api/expense-reports/${id}`, {
        method: "PUT",
        body: JSON.stringify(buildPayload()),
      });

      await apiFetch(`/api/expense-reports/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ submitterId: user.id, reasons: [] }),
      });

      navigate("/reports/in-progress");
    } catch (e2) {
      setError(e2.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDraft = async () => {
    if (!user) return;
    if (!confirm("Delete this draft? This cannot be undone.")) return;

    setDeleting(true);
    setError("");
    try {
      await apiFetch(`/api/expense-reports/${id}?requesterId=${user.id}`, { method: "DELETE" });
      navigate("/reports");
    } catch (e2) {
      setError(e2.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-slate-900">Edit report</h1>
        <p className="mt-2 text-sm text-slate-600">Please login to edit reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Edit report</h1>
            <p className="mt-1 text-sm text-slate-600">Update details and items, then resubmit.</p>
          </div>
          <Link to={`/reports/${id}`} className="text-xs text-blue-600 hover:underline">
            Back
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {loading && <div className="mt-4 text-sm text-slate-600">Loading…</div>}

        {!loading && !error && (
          <form onSubmit={save} className="mt-4 space-y-4">
            {confirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
                  <div className="text-lg font-semibold text-slate-900">Policy warnings</div>
                  <div className="mt-2 text-sm text-slate-700">
                    This report has policy warnings. Submitting will route it to <span className="font-medium">exception review</span>.
                    Do you want to continue?
                  </div>
                  <ul className="mt-3 list-disc pl-5 text-sm text-slate-800 space-y-1">
                    {policyWarnings.map((w) => (
                      <li key={w.code}>
                        <span className="font-medium">{w.code}</span> — {w.message}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(false)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm hover:bg-slate-50"
                    >
                      No, keep editing
                    </button>
                    <button
                      type="button"
                      onClick={confirmSubmit}
                      disabled={submitting}
                      className="px-3 py-2 rounded-xl border border-slate-900 bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-60"
                    >
                      Yes, submit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {policyWarnings.length > 0 && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                <div className="text-sm font-medium text-orange-900">Policy warnings</div>
                <div className="mt-1 text-xs text-orange-800">
                  Submitting this report will route it to an exception review step.
                </div>
                <ul className="mt-2 list-disc pl-5 text-sm text-orange-900 space-y-1">
                  {policyWarnings.map((w) => (
                    <li key={w.code}>
                      <span className="font-medium">{w.code}</span> — {w.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Destination</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. New York, United States"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Departure date</label>
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Return date</label>
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">Items</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={addNormalItem}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                  >
                    Add expense
                  </button>
                  <button
                    type="button"
                    onClick={addMileageItem}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                  >
                    Add mileage
                  </button>
                  <button
                    type="button"
                    onClick={addMealItem}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                  >
                    Add meal
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {items.map((it, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-500">
                        Type: <span className="font-medium text-slate-900">{it.type}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-xs px-3 py-2 rounded-xl border border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>

                    {it.type === ITEM_TYPES.NORMAL && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                          <input
                            type="date"
                            value={it.date}
                            onChange={(e) => updateItem(idx, { date: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                          <input
                            value={it.description}
                            onChange={(e) => updateItem(idx, { description: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
                          <input
                            value={it.amount}
                            onChange={(e) => updateItem(idx, { amount: e.target.value })}
                            inputMode="decimal"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                          <select
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                            value={it.category}
                            onChange={(e) => updateItem(idx, { category: e.target.value })}
                          >
                            <option value="">Select…</option>
                            {CATEGORY_OPTIONS.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {it.type === ITEM_TYPES.MILEAGE && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                          <input
                            type="date"
                            value={it.date}
                            onChange={(e) => updateItem(idx, { date: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Miles</label>
                          <input
                            value={it.miles || ""}
                            onChange={(e) => onMileageChange(idx, e.target.value)}
                            inputMode="decimal"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Rate</label>
                          <input
                            value={MILEAGE_RATE}
                            readOnly
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
                          <input
                            value={Number(it.amount || 0).toFixed(2)}
                            readOnly
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                          />
                        </div>
                      </div>
                    )}

                    {it.type === ITEM_TYPES.MEAL && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                          <input
                            type="date"
                            value={it.date}
                            onChange={(e) => updateItem(idx, { date: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Meals</label>
                          <div className="flex items-center gap-4 rounded-xl border border-slate-200 px-3 py-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={!!it.lunch} onChange={(e) => onMealToggle(idx, "lunch", e.target.checked)} />
                              Lunch
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={!!it.dinner} onChange={(e) => onMealToggle(idx, "dinner", e.target.checked)} />
                              Dinner
                            </label>
                            <span className="ml-auto text-xs text-slate-500">${MEAL_RATE}/meal</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
                          <input
                            value={Number(it.amount || 0).toFixed(2)}
                            readOnly
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-sm text-slate-600">No items.</div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <ButtonLink to={`/reports/${id}`} variant="secondary" size="sm">
                Cancel
              </ButtonLink>

              <Button
                type="button"
                onClick={deleteDraft}
                disabled={deleting}
                variant="danger"
                size="sm"
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>

              <Button type="submit" disabled={saving || !canEdit} variant="secondary" size="sm">
                {saving ? "Saving…" : "Save draft"}
              </Button>

              <Button
                type="button"
                onClick={submit}
                disabled={submitting || saving || !canEdit}
                variant="primary"
                size="sm"
              >
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
