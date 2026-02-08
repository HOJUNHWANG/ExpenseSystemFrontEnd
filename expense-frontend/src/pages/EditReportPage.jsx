import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { apiFetch } from "../lib/api";

export default function EditReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [items, setItems] = useState([]);

  const canEdit = useMemo(() => {
    return user && (title !== null) && true;
  }, [user, title]);

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
          (r.items || []).map((it) => ({
            date: it.date || "",
            description: it.description || "",
            amount: String(it.amount ?? ""),
            category: it.category || "",
          }))
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

  const addItem = () => {
    setItems((prev) => [...prev, { date: "", description: "", amount: "", category: "" }]);
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const save = async (e) => {
    e?.preventDefault?.();
    if (!user) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        submitterId: user.id,
        title,
        destination,
        departureDate: departureDate || null,
        returnDate: returnDate || null,
        items: items.map((it) => ({
          date: it.date || null,
          description: it.description,
          amount: Number(it.amount || 0),
          category: it.category,
        })),
      };

      await apiFetch(`/api/expense-reports/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      navigate(`/reports/${id}`);
    } catch (e2) {
      setError(e2.message || "Save failed");
    } finally {
      setSaving(false);
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
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Items</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                >
                  Add item
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {items.map((it, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                        <input
                          value={it.category}
                          onChange={(e) => updateItem(idx, { category: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-end justify-end">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-xs px-3 py-2 rounded-xl border border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-sm text-slate-600">No items.</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              {(() => {
                const { Button, ButtonLink } = require("../ui/Button.jsx");
                return (
                  <>
                    <ButtonLink to={`/reports/${id}`} variant="secondary" size="sm">
                      Cancel
                    </ButtonLink>
                    <Button type="submit" disabled={saving || !canEdit} variant="primary" size="sm">
                      {saving ? "Saving…" : "Save changes"}
                    </Button>
                  </>
                );
              })()}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
