// src/components/CreateExpenseReportForm.jsx

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import { evaluateDraftWarnings } from "../lib/policy";
import { UNSAFE_NavigationContext, useBeforeUnload, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageTransition from "@/components/PageTransition";

import {
  CATEGORY_OPTIONS,
  ITEM_TYPES,
  ItemsEditor,
  buildPayloadItems,
  makeNormalItem,
  ConfirmSubmitModal,
  PolicyWarningsPanel,
  FooterActionBar,
  ReportHeaderFields,
} from "./ExpenseReportForm.jsx";

import { MAJOR_COUNTRY_OPTIONS, OTHER_COUNTRY_VALUE } from "../lib/countries";


// (Policy knobs removed here; policy is evaluated via lib/policy.js + backend PolicyEngine)

function useNavigationBlocker(when, onBlocked) {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const onBlockedRef = useRef(onBlocked);
  onBlockedRef.current = onBlocked;

  useEffect(() => {
    if (!when) return;
    if (!navigator?.block) return;

    const unblock = navigator.block((tx) => {
      const autoUnblockingTx = {
        ...tx,
        retry() {
          unblock();
          tx.retry();
        },
      };
      onBlockedRef.current?.(autoUnblockingTx);
    });

    return unblock;
  }, [navigator, when]);
}

export default function CreateExpenseReportForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    city: "",
    countrySelect: "",
    countryOther: "",
    departureDate: "",
    returnDate: "",
  });
  const [items, setItems] = useState([makeNormalItem()]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const pendingTxRef = useRef(null);

  if (!user) {
    return (
        <div className="bg-card shadow-sm rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-2">
            Please login to create an expense report.
          </p>
        </div>
    );
  }

  const countryValue = useMemo(() => {
    const select = form.countrySelect;
    if (select === OTHER_COUNTRY_VALUE) return form.countryOther.trim();
    return select.trim();
  }, [form.countrySelect, form.countryOther]);

  const policyWarnings = useMemo(() => {
    return evaluateDraftWarnings({
      country: countryValue,
      departureDate: form.departureDate,
      returnDate: form.returnDate,
      items: (items || []).map((it) => ({
        date: it.date,
        description: it.description,
        amount: it.amount,
        category: it.category,
      })),
    });
  }, [countryValue, form.departureDate, form.returnDate, items]);

  const isDirty = useMemo(() => {
    if (form.title.trim()) return true;
    if (form.city.trim()) return true;
    if (countryValue.trim()) return true;
    if (form.departureDate) return true;
    if (form.returnDate) return true;

    const meaningfulItems = (items || []).filter((it) => {
      if (!it) return false;
      if (it.type === ITEM_TYPES.NORMAL) {
        return Boolean(it.date || it.description?.trim() || it.amount || it.category);
      }
      if (it.type === ITEM_TYPES.MILEAGE) {
        return Boolean(it.miles || it.date);
      }
      if (it.type === ITEM_TYPES.MEAL) {
        return Boolean(it.date || it.lunch || it.dinner);
      }
      return true;
    });

    // initial state has exactly 1 empty NORMAL row
    if (meaningfulItems.length === 0) return false;
    if (meaningfulItems.length === 1) {
      const it = meaningfulItems[0];
      if (it.type === ITEM_TYPES.NORMAL) {
        const emptyNormal = !it.date && !it.description?.trim() && !it.amount && !it.category;
        return !emptyNormal;
      }
    }
    return true;
  }, [form.title, form.city, countryValue, form.departureDate, form.returnDate, items]);

  useBeforeUnload(
    useMemo(() => {
      if (!isDirty) return undefined;
      return (e) => {
        e.preventDefault();
        // Chrome requires returnValue to be set.
        e.returnValue = "";
      };
    }, [isDirty])
  );

  useNavigationBlocker(isDirty && !loading && !draftSaving, (tx) => {
    pendingTxRef.current = tx;
    setLeaveOpen(true);
  });


  const validate = () => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = "Title is required.";
    }
    if (!form.city.trim()) {
      newErrors.city = "City is required.";
    }
    if (!countryValue.trim()) {
      newErrors.country = "Country is required.";
    }
    if (!form.departureDate) {
      newErrors.departureDate = "Departure date is required.";
    }
    if (!form.returnDate) {
      newErrors.returnDate = "Return date is required.";
    }
    if (form.departureDate && form.returnDate && form.departureDate > form.returnDate) {
      newErrors.returnDate = "Return date must be after departure date.";
    }

    if (!items.length) {
      newErrors.items = "At least one expense item is required.";
    } else {
      // Demo rule: only one Meal entry per date.
      const mealDateCounts = new Map();
      items.forEach((item) => {
        if (!item || item.type !== ITEM_TYPES.MEAL) return;
        if (!item.date) return;
        mealDateCounts.set(item.date, (mealDateCounts.get(item.date) || 0) + 1);
      });

      items.forEach((item, index) => {
        // 날짜 범위는 NORMAL/MILEAGE/MEAL 모두 공통으로 “입력되어 있다면 범위 체크”
        const hasTripRange = form.departureDate && form.returnDate;

        // 1) NORMAL
        if (item.type === ITEM_TYPES.NORMAL) {
          if (!item.date) newErrors[`items.${index}.date`] = "Date is required.";
          if (!item.description?.trim()) newErrors[`items.${index}.description`] = "Description is required.";
          if (!item.category) newErrors[`items.${index}.category`] = "Category is required.";
          if (!item.amount || isNaN(Number(item.amount)) || Number(item.amount) <= 0) {
            newErrors[`items.${index}.amount`] = "Amount must be a positive number.";
          }
        }

        // 2) MILEAGE (추가했으면 miles는 필수)
        if (item.type === ITEM_TYPES.MILEAGE) {
          if (!item.miles || isNaN(Number(item.miles)) || Number(item.miles) <= 0) {
            newErrors[`items.${index}.miles`] = "Miles must be a positive number.";
          }
          // 지금은 “선택사항”
          // if (!item.date) newErrors[`items.${index}.date`] = "Date is required.";
        }

        // 3) MEAL (추가했으면 date는 필수, 그리고 lunch/dinner 최소 1개는 체크)
        if (item.type === ITEM_TYPES.MEAL) {
          if (!item.date) newErrors[`items.${index}.date`] = "Meal date is required.";
          const count = (item.lunch ? 1 : 0) + (item.dinner ? 1 : 0);
          if (count === 0) newErrors[`items.${index}.meal`] = "Select lunch and/or dinner.";

          if (item.date && (mealDateCounts.get(item.date) || 0) > 1) {
            newErrors[`items.${index}.date`] = "Only one meal entry per date is allowed.";
          }
        }

        // 날짜 범위 제한: date가 있는 아이템은 범위 안인지 확인
        if (hasTripRange && item.date) {
          if (item.date < form.departureDate || item.date > form.returnDate) {
            newErrors[`items.${index}.date`] = "Date must be within the trip dates.";
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Items UI/logic is shared via <ItemsEditor />

  const [confirmOpen, setConfirmOpen] = useState(false);

  const payloadItems = useMemo(() => {
    return buildPayloadItems(items, form.departureDate);
  }, [items, form.departureDate]);

  const saveDraft = async () => {
    setMessage("");
    setDraftSaving(true);

    const destination = form.city.trim() || countryValue.trim() ? `${form.city}, ${countryValue}` : "";

    // Create uses a limited DTO in backend; create+update keeps this demo flexible.
    const filteredDraftItems = payloadItems
      .filter((it) => it.amount !== undefined && it.amount !== null)
      .filter((it) => !isNaN(Number(it.amount)))
      .map((it) => ({
        date: it.date || form.departureDate || null,
        description: it.description || "(draft)",
        amount: Number(it.amount || 0),
        category: it.category || "Other",
      }));

    const createPayload = {
      submitterId: user.id,
      title: form.title?.trim() ? form.title : "Draft — Untitled",
      // Demo rule: every report must have at least one item (even a draft).
      items: filteredDraftItems.length > 0 ? filteredDraftItems : [{
        date: form.departureDate || null,
        description: "(draft)",
        amount: 0,
        category: "Other",
      }],
    };

    try {
      const { apiFetch } = await import("../lib/api");
      const id = await apiFetch("/api/expense-reports", {
        method: "POST",
        body: JSON.stringify(createPayload),
      });

      await apiFetch(`/api/expense-reports/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          submitterId: user.id,
          title: form.title?.trim() ? form.title : "Draft — Untitled",
          destination,
          departureDate: form.departureDate || null,
          returnDate: form.returnDate || null,
          items: payloadItems.map((it) => ({
            date: it.date || form.departureDate || null,
            description: it.description || "(draft)",
            amount: Number(it.amount || 0),
            category: it.category || "Other",
          })),
        }),
      });

      toast.success("Draft saved.");
      return { ok: true };
    } catch (e) {
      setMessage(`❌ Error: ${e.message || "Failed to save draft"}`);
      return { ok: false };
    } finally {
      setDraftSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validate()) {
      return;
    }

    // If warnings exist, confirm first.
    if (policyWarnings.length > 0) {
      setConfirmOpen(true);
      return;
    }

    setLoading(true);

    const destination = `${form.city}, ${countryValue}`;

    const payload = {
      submitterId: user.id,
      title: form.title,
      destination,
      departureDate: form.departureDate,
      returnDate: form.returnDate,
      items: payloadItems.map((it) => ({
        date: it.date,
        description: it.description,
        amount: Number(it.amount),
        category: it.category,
      })),
    };

    try {
      const { apiFetch } = await import("../lib/api");

      // Backend create DTO is intentionally minimal in this demo.
      // To ensure destination/dates/etc are persisted, we do: POST(minimal) -> PUT(full) -> SUBMIT.
      const id = await apiFetch("/api/expense-reports", {
        method: "POST",
        body: JSON.stringify({
          submitterId: user.id,
          title: form.title,
          items: payload.items,
        }),
      });

      await apiFetch(`/api/expense-reports/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      // Auto-submit after create (non-draft flow)
      await apiFetch(`/api/expense-reports/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ submitterId: user.id, reasons: [] }),
      });

      // Go to In progress
      navigate("/reports/in-progress");
    } catch (err) {
      console.error(err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmSubmit = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const destination = `${form.city}, ${countryValue}`;

      const payload = {
        submitterId: user.id,
        title: form.title,
        destination,
        departureDate: form.departureDate,
        returnDate: form.returnDate,
        items: payloadItems.map((it) => ({
          date: it.date,
          description: it.description,
          amount: Number(it.amount),
          category: it.category,
        })),
      };

      const { apiFetch } = await import("../lib/api");

      const id = await apiFetch("/api/expense-reports", {
        method: "POST",
        body: JSON.stringify({
          submitterId: user.id,
          title: form.title,
          items: payload.items,
        }),
      });

      await apiFetch(`/api/expense-reports/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await apiFetch(`/api/expense-reports/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ submitterId: user.id, reasons: [] }),
      });

      navigate("/reports/in-progress");
    } catch (err) {
      console.error(err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card shadow-sm rounded-xl p-6 max-w-4xl mx-auto"
    >
      <h2 className="text-xl font-semibold mb-4">Create Expense Report</h2>

      {message && (
        <div className="mb-4 text-sm rounded-lg p-3 bg-muted">
          {message}
        </div>
      )}

      {leaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border shadow-xl p-6">
            <div className="text-lg font-semibold text-foreground">Leave this page?</div>
            <div className="mt-2 text-sm text-muted-foreground">
              You have unsaved changes. Save as a draft before leaving?
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLeaveOpen(false);
                  pendingTxRef.current = null;
                }}
                className="px-3 py-2 rounded-xl border border bg-white text-sm hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const tx = pendingTxRef.current;
                  pendingTxRef.current = null;
                  setLeaveOpen(false);
                  tx?.retry();
                }}
                className="px-3 py-2 rounded-xl border border bg-white text-sm hover:bg-muted/50"
              >
                Leave without saving
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await saveDraft();
                  if (!res.ok) return;
                  const tx = pendingTxRef.current;
                  pendingTxRef.current = null;
                  setLeaveOpen(false);
                  tx?.retry();
                }}
                disabled={draftSaving}
                className="px-3 py-2 rounded-xl border border-slate-900 bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-60"
              >
                {draftSaving ? "Saving…" : "Save draft & leave"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmSubmitModal
        open={confirmOpen}
        warnings={policyWarnings}
        busy={loading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmSubmit}
      />

      <div className="mb-4">
        <PolicyWarningsPanel warnings={policyWarnings} compact={false} />
      </div>

      <ReportHeaderFields
        mode="create"
        values={form}
        setValues={setForm}
        errors={errors}
        countryOptions={MAJOR_COUNTRY_OPTIONS}
      />

      {/* Spacer + subtle section divider to keep the header/date inputs from feeling glued to the Items action buttons. */}
      <div className="mt-6 pt-6 border-t border" />

      <ItemsEditor
        items={items}
        setItems={setItems}
        departureDate={form.departureDate}
        returnDate={form.returnDate}
        errors={errors}
      />

      <FooterActionBar
        onCancel={() => navigate("/dashboard")}
        onDelete={null}
        showDelete={false}
        onSaveDraft={async () => {
          // If user clicks save draft explicitly, save and go to My Reports.
          const res = await saveDraft();
          if (res.ok) navigate("/reports");
        }}
        onSubmit={() => {
          // trigger the same submit flow as form submit
          // eslint-disable-next-line no-void
          void handleSubmit({ preventDefault: () => {} });
        }}
        busy={loading || draftSaving}
        saving={draftSaving}
        submitting={loading}
        canSubmit={!loading}
        submitLabel="Submit"
        saveDraftLabel="Save draft"
      />
    </form>
  );
}
