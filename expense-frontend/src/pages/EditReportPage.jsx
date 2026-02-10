import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { apiFetch } from "../lib/api";
import { Button, ButtonLink } from "../ui/Button.jsx";
import { evaluateDraftWarnings } from "../lib/policy";
import {
  ITEM_TYPES,
  ItemsEditor,
  buildPayloadItems,
  ConfirmSubmitModal,
  PolicyWarningsPanel,
  FooterActionBar,
} from "../components/ExpenseReportForm.jsx";

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

  const payloadItems = useMemo(() => {
    return buildPayloadItems(items, departureDate);
  }, [items, departureDate]);

  const buildPayload = () => {
    return {
      submitterId: user.id,
      title,
      destination,
      departureDate: departureDate || null,
      returnDate: returnDate || null,
      items: payloadItems.map((it) => ({
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
            <ConfirmSubmitModal
              open={confirmOpen}
              warnings={policyWarnings}
              busy={submitting}
              onCancel={() => setConfirmOpen(false)}
              onConfirm={confirmSubmit}
            />

            <PolicyWarningsPanel warnings={policyWarnings} compact />
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

            <ItemsEditor items={items} setItems={setItems} departureDate={departureDate} />

            <FooterActionBar
              onCancel={() => navigate(`/reports/${id}`)}
              onDelete={deleteDraft}
              showDelete={true}
              onSaveDraft={() => save()}
              onSubmit={submit}
              busy={saving || submitting || deleting}
              saving={saving}
              submitting={submitting}
              deleting={deleting}
              canSaveDraft={canEdit}
              canSubmit={canEdit && !saving}
              submitLabel="Submit"
              saveDraftLabel="Save draft"
            />
          </form>
        )}
      </div>
    </div>
  );
}
