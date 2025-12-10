// src/components/CreateExpenseReportForm.jsx

const CATEGORY_OPTIONS = [
  "Airfare",
  "Hotel",
  "Meal",
  "Transportation",
  "Mileage",
  "Office",
  "Entertainment",
];

const COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Korea",
  "Japan",
  "China",
  "Australia",
  "Singapore",
];

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
    { date: "", description: "", amount: "", category: "" },
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
        if (!item.date) {
          newErrors[`items.${index}.date`] = "Date is required.";
        }
        if (!item.description.trim()) {
          newErrors[`items.${index}.description`] = "Description is required.";
        }
        if (!item.category) {
          newErrors[`items.${index}.category`] = "Category is required.";
        }
        if (!item.amount || isNaN(Number(item.amount)) || Number(item.amount) <= 0) {
          newErrors[`items.${index}.amount`] = "Amount must be a positive number.";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { date: "", description: "", amount: "", category: "" }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validate()) {
      return;  // 🔹 에러 있으면 submit 중단
    }

    setLoading(true);

    const destination = `${city}, ${country}`;

    const payload = {
      submitterId: user.id,
      title,
      destination,
      departureDate,
      returnDate,
      items: items.map((it) => ({
        date: it.date,
        description: it.description,
        amount: Number(it.amount),
        category: it.category,
      })),
    };

    try {
      const res = await fetch("http://localhost:8080/api/expense-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create report");
      }

      const id = await res.json();
      setMessage(`✅ Created report with id = ${id}`);
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
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Select country</option>
              {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
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

      <div className="space-y-3 mb-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="grid grid-cols-1 md:grid-cols-5 gap-2 border rounded-lg p-3"
          >
            <div>
              <label className="block text-xs font-medium mb-1">Date</label>
                <input
                    type="date"
                    className="w-full border rounded-lg px-2 py-1 text-sm"
                    value={item.date}
                    onChange={(e) => handleItemChange(idx, "date", e.target.value)}
                    min={departureDate || undefined}
                    max={returnDate || undefined}
                    disabled={!departureDate || !returnDate}
                />
                {errors[`items.${idx}.date`] && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors[`items.${idx}.date`]}
                    </p>
                )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">
                Description
              </label>
              <input
                value={item.description}
                onChange={(e) =>
                  handleItemChange(idx, "description", e.target.value)
                }
                className="w-full border rounded-lg px-2 py-1 text-xs"
                placeholder="EX: Uber to Airport"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Amount</label>
              <input
                type="number"
                value={item.amount}
                onChange={(e) =>
                  handleItemChange(idx, "amount", e.target.value)
                }
                className="w-full border rounded-lg px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Category
              </label>
              <select
                  className="w-full border rounded-lg px-2 py-1 text-sm"
                  value={item.category}
                  onChange={(e) => handleItemChange(idx, "category", e.target.value)}
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                ))}
              </select>
              {errors[`items.${idx}.category`] && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors[`items.${idx}.category`]}
                  </p>
              )}
            </div>
            <div className="md:col-span-5 flex justify-end">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="text-sm px-3 py-1 rounded-lg border border-dashed"
      >
        + Add Item
      </button>

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
