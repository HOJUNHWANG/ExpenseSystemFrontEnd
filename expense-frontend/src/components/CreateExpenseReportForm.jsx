// src/components/CreateExpenseReportForm.jsx

const CATEGORY_OPTIONS = [
  "Airfare",
  "Hotel",
  "Transportation",
  "Mileage",
  "Office",
  "Entertainment",
];

// Suggested countries for the demo (free-text input via datalist below)
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

// Demo policy knobs (common corporate patterns)
const POLICY = {
  RECEIPT_THRESHOLD: 25, // require receipt above this (UI hint)
  HOTEL_NIGHTLY_LIMIT: 300,
  MEAL_DAILY_LIMIT: 75,
};

const ITEM_TYPES = {
  NORMAL: "Normal",
  MILEAGE: "MILEAGE",
  MEAL: "Meal",
}

const MILEAGE_RATE = 0.7;
const MEAL_RATE = 25;

import { useState } from "react";
import { useAuth } from "../AuthContext";

export default function CreateExpenseReportForm() {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [items, setItems] = useState([
    { type: ITEM_TYPES.NORMAL, date: "", description: "", amount: "", category: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  if (!user) {
    return (
        <div className="bg-white shadow-lg rounded-xl p-6">
          <p className="text-sm text-slate-700 mb-2">
            Please login to create an expense report.
          </p>
        </div>
    );
  }

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

  /*
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { date: "", description: "", amount: "", category: "" }]);
  };
  */
  const addNormalItem = () => {
    setItems((prev) => [
      ...prev,
      { type: ITEM_TYPES.NORMAL, date: "", description: "", amount: "", category: "" },
    ]);
  };

  const addMileageItem = () => {
    setItems((prev) => {
      // 한 번만 허용(원하면 여러 개 가능하게 바꿀 수도 있어)
      if (prev.some((it) => it.type === ITEM_TYPES.MILEAGE)) return prev;
      return [
        ...prev,
        {
          type: ITEM_TYPES.MILEAGE,
          date: "",          // 선택사항으로 둘 수도 있는데 일단 날짜도 받게 해도 OK
          miles: "",
          rate: MILEAGE_RATE,
          amount: 0,
          category: "Mileage",
          description: "Mileage reimbursement",
        },
      ];
    });
  };

  const addMealItem = () => {
    setItems((prev) => [
      ...prev,
      {
        type: ITEM_TYPES.MEAL,
        date: "",
        lunch: true,
        dinner: true,
        amount: 50, // 기본 lunch+dinner 2개 체크로 시작(원하면 0으로 시작해도 됨)
        category: "Meal",
        description: "Per diem (Lunch/Dinner)",
      },
    ]);
  };

  const recomputeMealAmount = (lunch, dinner) => {
    const count = (lunch ? 1 : 0) + (dinner ? 1 : 0);
    return count * MEAL_RATE;
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

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, patch) => {
    setItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, ...patch } : it))
    );
  };

  const onMileageChange = (index, value) => {
    const miles = value;
    const milesNum = Number(miles);
    const amount = !miles || isNaN(milesNum) ? 0 : Number((milesNum * MILEAGE_RATE).toFixed(2));
    updateItem(index, { miles, amount });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validate()) {
      return;  // 🔹 에러 있으면 submit 중단
    }

    setLoading(true);

    const destination = `${city}, ${country}`;

    const payloadItems = items.map((it) => {
      if (it.type === ITEM_TYPES.NORMAL) {
        return {
          date: it.date,
          description: it.description,
          amount: Number(it.amount),
          category: it.category,
        };
      }

      if (it.type === ITEM_TYPES.MILEAGE) {
        return {
          date: it.date || departureDate, // 날짜 필수로 안 받을 거면 이렇게 fallback
          description: `Mileage: ${it.miles} miles x ${MILEAGE_RATE}`,
          amount: Number(it.amount),
          category: "Mileage",
        };
      }

      // MEAL
      const mealDesc = `Meal: ${it.lunch ? "Lunch" : ""}${it.lunch && it.dinner ? " + " : ""}${it.dinner ? "Dinner" : ""}`;
      return {
        date: it.date,
        description: mealDesc,
        amount: Number(it.amount),
        category: "Meal",
      };
    });

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
      setMessage(`✅ Report Successfully Created`);
      // 필요하면 폼 초기화
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

      <h3 className="text-lg font-semibold mb-2">Items</h3>
      <div className="mb-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-600">
        <div className="font-medium text-slate-700">Demo policy hints (typical corporate patterns)</div>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>Receipts are typically required for expenses over ${POLICY.RECEIPT_THRESHOLD}.</li>
          <li>Hotels often have a nightly cap (demo: ${POLICY.HOTEL_NIGHTLY_LIMIT}/night).</li>
          <li>Meals may be reimbursed via per diem (demo: ${MEAL_RATE}/meal, daily cap ${POLICY.MEAL_DAILY_LIMIT}).</li>
        </ul>
      </div>

      <div className="space-y-3 mb-4">
        {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-3 mb-3 bg-white">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-semibold text-slate-600">
                  {item.type === ITEM_TYPES.NORMAL && "Expense Item"}
                  {item.type === ITEM_TYPES.MILEAGE && "Mileage"}
                  {item.type === ITEM_TYPES.MEAL && "Meal"}
                </div>
                <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>

              {/* NORMAL */}
              {item.type === ITEM_TYPES.NORMAL && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* date */}
                    <div>
                      <input
                          type="date"
                          className="w-full border rounded-lg px-2 py-1 text-sm"
                          value={item.date}
                          onChange={(e) => updateItem(index, { date: e.target.value })}
                          min={departureDate || undefined}
                          max={returnDate || undefined}
                          disabled={!departureDate || !returnDate}
                      />
                      {errors[`items.${index}.date`] && <p className="text-xs text-red-600 mt-1">{errors[`items.${index}.date`]}</p>}
                    </div>

                    {/* description */}
                    <div>
                      <input
                          type="text"
                          className="w-full border rounded-lg px-2 py-1 text-sm"
                          value={item.description}
                          onChange={(e) => updateItem(index, { description: e.target.value })}
                          placeholder="Description"
                      />
                      {errors[`items.${index}.description`] && <p className="text-xs text-red-600 mt-1">{errors[`items.${index}.description`]}</p>}
                    </div>

                    {/* category */}
                    <div>
                      <select
                          className="w-full border rounded-lg px-2 py-1 text-sm"
                          value={item.category}
                          onChange={(e) => updateItem(index, { category: e.target.value })}
                      >
                        <option value="">Select category</option>
                        {CATEGORY_OPTIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {errors[`items.${index}.category`] && <p className="text-xs text-red-600 mt-1">{errors[`items.${index}.category`]}</p>}
                    </div>

                    {/* amount */}
                    <div>
                      <input
                          type="number"
                          className="w-full border rounded-lg px-2 py-1 text-sm"
                          value={item.amount}
                          onChange={(e) => updateItem(index, { amount: e.target.value })}
                          placeholder="Amount"
                      />
                      {errors[`items.${index}.amount`] && <p className="text-xs text-red-600 mt-1">{errors[`items.${index}.amount`]}</p>}
                    </div>
                  </div>
              )}

              {/* MILEAGE */}
              {item.type === ITEM_TYPES.MILEAGE && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Miles</label>
                      <input
                          type="number"
                          className="w-full border rounded-lg px-2 py-1 text-sm"
                          value={item.miles}
                          onChange={(e) => onMileageChange(index, e.target.value)}
                          placeholder="e.g. 120"
                      />
                      {errors[`items.${index}.miles`] && <p className="text-xs text-red-600 mt-1">{errors[`items.${index}.miles`]}</p>}
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Rate</label>
                      <input
                          type="text"
                          className="w-full border rounded-lg px-2 py-1 text-sm bg-slate-50"
                          value={item.rate}
                          readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Amount</label>
                      <input
                          type="text"
                          className="w-full border rounded-lg px-2 py-1 text-sm bg-slate-50"
                          value={item.amount}
                          readOnly
                      />
                    </div>
                  </div>
              )}

              {/* MEAL */}
              {item.type === ITEM_TYPES.MEAL && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Date</label>
                      <input
                          type="date"
                          className="w-full border rounded-lg px-2 py-1 text-sm"
                          value={item.date}
                          onChange={(e) => updateItem(index, { date: e.target.value })}
                          min={departureDate || undefined}
                          max={returnDate || undefined}
                          disabled={!departureDate || !returnDate}
                      />
                      {errors[`items.${index}.date`] && <p className="text-xs text-red-600 mt-1">{errors[`items.${index}.date`]}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                          type="checkbox"
                          checked={!!item.lunch}
                          onChange={(e) => onMealToggle(index, "lunch", e.target.checked)}
                      />
                      <span className="text-sm">Lunch</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                          type="checkbox"
                          checked={!!item.dinner}
                          onChange={(e) => onMealToggle(index, "dinner", e.target.checked)}
                      />
                      <span className="text-sm">Dinner</span>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Amount</label>
                      <input
                          type="text"
                          className="w-full border rounded-lg px-2 py-1 text-sm bg-slate-50"
                          value={item.amount}
                          readOnly
                      />
                      {errors[`items.${index}.meal`] && <p className="text-xs text-red-600 mt-1">{errors[`items.${index}.meal`]}</p>}
                    </div>
                  </div>
              )}
            </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button
            type="button"
            onClick={addNormalItem}
            className="px-3 py-2 rounded-lg text-sm border hover:bg-slate-50"
        >
          + Add Item
        </button>

        <button
            type="button"
            onClick={addMileageItem}
            className="px-3 py-2 rounded-lg text-sm border hover:bg-slate-50"
        >
          + Add Mileage
        </button>

        <button
            type="button"
            onClick={addMealItem}
            className="px-3 py-2 rounded-lg text-sm border hover:bg-slate-50"
        >
          + Add Meal
        </button>
      </div>

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
