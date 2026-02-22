import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { apiFetch } from "../lib/api";
import { Button, ButtonLink } from "../ui/Button.jsx";
import { evaluateDraftWarnings } from "../lib/policy";
import { REPORT_STATUS } from "../lib/constants";
import {
  ITEM_TYPES,
  MILEAGE_RATE,
  ItemsEditor,
  buildPayloadItems,
  ConfirmSubmitModal,
  PolicyWarningsPanel,
  FooterActionBar,
  ReportHeaderFields,
  PerDiemPreview,
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

  const [form, setForm] = useState({
    title: "",
    destination: "",
    departureDate: "",
    returnDate: "",
  });
  const [items, setItems] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const canEdit = useMemo(() => {
    return user && form.title !== null;
  }, [user, form.title]);

  const country = useMemo(() => parseCountryFromDestination(form.destination), [form.destination]);

  const policyWarnings = useMemo(() => {
    return evaluateDraftWarnings({
      country,
      departureDate: form.departureDate,
      returnDate: form.returnDate,
      items: (items || []).map((it) => ({
        date: it.date,
        description: it.description,
        amount: it.amount,
        category: it.category,
      })),
    });
  }, [country, form.departureDate, form.returnDate, items]);

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
        if (r.status !== REPORT_STATUS.DRAFT && r.status !== REPORT_STATUS.CHANGES_REQUESTED) {
          throw new Error("Only DRAFT/CHANGES_REQUESTED reports can be edited.");
        }

        setForm({
          title: r.title || "",
          destination: r.destination || "",
          departureDate: r.departureDate || "",
          returnDate: r.returnDate || "",
        });
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
    return buildPayloadItems(items, form.departureDate);
  }, [items, form.departureDate]);

  const validate = () => {
    const next = {};

    if (!form.title?.trim()) next.title = "Title is required.";
    if (!form.destination?.trim()) next.destination = "Destination is required.";
    if (!form.departureDate) next.departureDate = "Departure date is required.";
    if (!form.returnDate) next.returnDate = "Return date is required.";
    if (form.departureDate && form.returnDate && form.departureDate > form.returnDate) {
      next.returnDate = "Return date must be after departure date.";
    }

    if (!items.length) {
      next.items = "At least one expense item is required.";
    } else {
      const hasTripRange = form.departureDate && form.returnDate;

      // Demo rule: only one Meal entry per date.
      const mealDateCounts = new Map();
      items.forEach((item) => {
        if (!item || item.type !== ITEM_TYPES.MEAL) return;
        if (!item.date) return;
        mealDateCounts.set(item.date, (mealDateCounts.get(item.date) || 0) + 1);
      });

      items.forEach((item, index) => {
        if (item.type === ITEM_TYPES.NORMAL) {
          if (!item.date) next[`items.${index}.date`] = "Date is required.";
          if (!item.description?.trim()) next[`items.${index}.description`] = "Description is required.";
          if (!item.category) next[`items.${index}.category`] = "Category is required.";
          if (!item.amount || isNaN(Number(item.amount)) || Number(item.amount) <= 0) {
            next[`items.${index}.amount`] = "Amount must be a positive number.";
          }
        }

        if (item.type === ITEM_TYPES.MILEAGE) {
          if (!item.miles || isNaN(Number(item.miles)) || Number(item.miles) <= 0) {
            next[`items.${index}.miles`] = "Miles must be a positive number.";
          }
        }

        if (item.type === ITEM_TYPES.MEAL) {
          if (!item.date) next[`items.${index}.date`] = "Meal date is required.";
          const count = (item.lunch ? 1 : 0) + (item.dinner ? 1 : 0);
          if (count == 0) next[`items.${index}.meal`] = "Select lunch and/or dinner.";

          if (item.date && (mealDateCounts.get(item.date) || 0) > 1) {
            next[`items.${index}.date`] = "Only one meal entry per date is allowed.";
          }
        }

        if (hasTripRange && item.date) {
          if (item.date < form.departureDate || item.date > form.returnDate) {
            next[`items.${index}.date`] = "Date must be within the trip dates.";
          }
        }
      });
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => {
    return {
      submitterId: user.id,
      title: form.title,
      destination: form.destination,
      departureDate: form.departureDate || null,
      returnDate: form.returnDate || null,
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

    if (!validate()) {
      setError("Please fill the required fields.");
      return;
    }

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

    if (!validate()) {
      setError("Please fill the required fields.");
      return;
    }

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
      <div className="rounded-2xl bg-card border shadow-sm p-6">
        <h1 className="text-xl font-semibold text-foreground">Edit report</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please login to edit reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Edit report</h1>
            <p className="mt-1 text-sm text-muted-foreground">Update details and items, then resubmit.</p>
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

        {loading && <div className="mt-4 text-sm text-muted-foreground">Loading…</div>}

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
            <ReportHeaderFields
              mode="edit"
              values={form}
              setValues={setForm}
              errors={errors}
            />

            <PerDiemPreview
              departureDate={form.departureDate}
              returnDate={form.returnDate}
              destination={form.destination}
            />

            <ItemsEditor
              items={items}
              setItems={setItems}
              departureDate={form.departureDate}
              returnDate={form.returnDate}
              errors={errors}
            />

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
