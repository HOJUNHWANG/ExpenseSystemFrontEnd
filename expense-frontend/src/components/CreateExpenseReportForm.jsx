// src/components/CreateExpenseReportForm.jsx

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import { evaluateDraftWarnings } from "../lib/policy";
import { UNSAFE_NavigationContext, useBeforeUnload, useNavigate } from "react-router-dom";

import {
  CATEGORY_OPTIONS,
  ITEM_TYPES,
  ItemsEditor,
  buildPayloadItems,
  makeNormalItem,
} from "./ExpenseReportForm.jsx";

// Suggested countries for the demo
const COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "South Korea",
  "Japan",
  "China",
  "Australia",
  "Singapore",
];

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

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [items, setItems] = useState([makeNormalItem()]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [policyToast, setPolicyToast] = useState("");

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const pendingTxRef = useRef(null);

  if (!user) {
    return (
        <div className="bg-white shadow-lg rounded-xl p-6">
          <p className="text-sm text-slate-700 mb-2">
            Please login to create an expense report.
          </p>
        </div>
    );
  }

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

  const isDirty = useMemo(() => {
    if (title.trim()) return true;
    if (city.trim()) return true;
    if (country.trim()) return true;
    if (departureDate) return true;
    if (returnDate) return true;

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
  }, [title, city, country, departureDate, returnDate, items]);

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

  useEffect(() => {
    if (!policyToast) return;
    const t = setTimeout(() => setPolicyToast(""), 3500);
    return () => clearTimeout(t);
  }, [policyToast]);

  const validate = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = "Title is required.";
    }
    if (!city.trim()) {
      newErrors.city = "City is required.";
    }
    if (!country.trim()) {
      newErrors.country = "Country is required.";
    }
    if (!departureDate) {
      newErrors.departureDate = "Departure date is required.";
    }
    if (!returnDate) {
      newErrors.returnDate = "Return date is required.";
    }
    if (departureDate && returnDate && departureDate > returnDate) {
      newErrors.returnDate = "Return date must be after departure date.";
    }

    if (!items.length) {
      newErrors.items = "At least one expense item is required.";
    } else {
      items.forEach((item, index) => {
        // 날짜 범위는 NORMAL/MILEAGE/MEAL 모두 공통으로 “입력되어 있다면 범위 체크”
        const hasTripRange = departureDate && returnDate;

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
        }

        // 날짜 범위 제한: date가 있는 아이템은 범위 안인지 확인
        if (hasTripRange && item.date) {
          if (item.date < departureDate || item.date > returnDate) {
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
    return buildPayloadItems(items, departureDate);
  }, [items, departureDate]);

  const saveDraft = async () => {
    setMessage("");
    setDraftSaving(true);

    const destination = city.trim() || country.trim() ? `${city}, ${country}` : "";

    // Create uses a limited DTO in backend; create+update keeps this demo flexible.
    const createPayload = {
      submitterId: user.id,
      title: title?.trim() ? title : "Draft — Untitled",
      items: payloadItems
        .filter((it) => it.amount && !isNaN(Number(it.amount)) && Number(it.amount) > 0)
        .map((it) => ({
          date: it.date,
          description: it.description || "(draft)",
          amount: Number(it.amount),
          category: it.category || "Other",
        })),
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
          title: title?.trim() ? title : "Draft — Untitled",
          destination,
          departureDate: departureDate || null,
          returnDate: returnDate || null,
          items: payloadItems.map((it) => ({
            date: it.date || departureDate || null,
            description: it.description || "(draft)",
            amount: Number(it.amount || 0),
            category: it.category || "Other",
          })),
        }),
      });

      setPolicyToast("Draft saved.");
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

    const destination = `${city}, ${country}`;

    const payload = {
      submitterId: user.id,
      title,
      destination,
      departureDate,
      returnDate,
      items: payloadItems.map((it) => ({
        date: it.date,
        description: it.description,
        amount: Number(it.amount),
        category: it.category,
      })),
    };

    try {
      const { apiFetch } = await import("../lib/api");
      const id = await apiFetch("/api/expense-reports", {
        method: "POST",
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
      const destination = `${city}, ${country}`;

      const payload = {
        submitterId: user.id,
        title,
        destination,
        departureDate,
        returnDate,
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
      className="bg-white shadow-md rounded-xl p-6 max-w-4xl mx-auto"
    >
      <h2 className="text-xl font-semibold mb-4">Create Expense Report</h2>

      {message && (
        <div className="mb-4 text-sm rounded-lg p-3 bg-slate-100">
          {message}
        </div>
      )}

      {leaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
            <div className="text-lg font-semibold text-slate-900">Leave this page?</div>
            <div className="mt-2 text-sm text-slate-700">
              You have unsaved changes. Save as a draft before leaving?
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLeaveOpen(false);
                  pendingTxRef.current = null;
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm hover:bg-slate-50"
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
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm hover:bg-slate-50"
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

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
            <div className="text-lg font-semibold text-slate-900">Policy warnings</div>
            <div className="mt-2 text-sm text-slate-700">
              This report has policy warnings. Submitting will route it to <span className="font-medium">special review</span>.
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
                disabled={loading}
                className="px-3 py-2 rounded-xl border border-slate-900 bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-60"
              >
                Yes, submit
              </button>
            </div>
          </div>
        </div>
      )}

      {policyWarnings.length > 0 && (
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <div className="text-sm font-medium text-orange-900">Policy warnings</div>
          <div className="mt-1 text-xs text-orange-800">
            Submitting this report will route it to a special review step.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Atlanta"
            />
            {errors.city && (
                <p className="text-xs text-red-600 mt-1">{errors.city}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Select a country…</option>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.country && (
              <p className="text-xs text-red-600 mt-1">{errors.country}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Departure date</label>
            <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
            />
            {errors.departureDate && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.departureDate}
                </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Return date</label>
            <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
            />
            {errors.returnDate && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.returnDate}
                </p>
            )}
          </div>
        </div>
      </div>

      <ItemsEditor items={items} setItems={setItems} departureDate={departureDate} />

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </form>
  );
}
