// src/components/CreateExpenseReportForm.jsx
import { useState } from "react";
import { useAuth } from "../AuthContext";

export default function CreateExpenseReportForm() {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [items, setItems] = useState([
    { date: "", description: "", amount: "", category: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!user) {
    return (
        <div className="bg-white shadow-lg rounded-xl p-6">
          <p className="text-sm text-slate-700 mb-2">
            Please login to create an expense report.
          </p>
        </div>
    );
  }

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
    setLoading(true);

    const payload = {
      submitterId: user.id,         // 🔹 로그인 유저 id 사용
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="EX: December Atlanta Business Trip"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Destination</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="EX: Atlanta, GA"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Departure Date
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Return Date
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
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
                value={item.date}
                onChange={(e) =>
                  handleItemChange(idx, "date", e.target.value)
                }
                className="w-full border rounded-lg px-2 py-1 text-xs"
              />
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
              <input
                value={item.category}
                onChange={(e) =>
                  handleItemChange(idx, "category", e.target.value)
                }
                className="w-full border rounded-lg px-2 py-1 text-xs"
                placeholder="Transport / Meal / Hotel ..."
              />
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
