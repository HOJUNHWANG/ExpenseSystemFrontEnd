// src/components/ExpenseReportList.jsx
import { useEffect, useState } from "react";

export default function ExpenseReportList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 일단 submitterId 고정 1로 사용 (나중에 로그인 붙이면 변경)
  const submitterId = 1;

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `http://localhost:8080/api/expense-reports?submitterId=${submitterId}`
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch reports");
        }

        const data = await res.json();
        setReports(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [submitterId]);

  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">My Expense Reports</h2>

      {loading && <p className="text-sm text-slate-600">Loading...</p>}

      {error && (
        <div className="mb-4 text-sm rounded-lg p-3 bg-red-50 text-red-700">
          ❌ Error: {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <p className="text-sm text-slate-500">
          아직 생성한 Expense Report가 없습니다.
        </p>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-3 py-2 text-left font-medium">ID</th>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Destination</th>
                <th className="px-3 py-2 text-left font-medium">Departure</th>
                <th className="px-3 py-2 text-left font-medium">Return</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr
                  key={r.id}
                  className="border-b hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    // 일단은 상세 페이지 아직 없으니 콘솔/alert만
                    console.log("Clicked report", r.id);
                    alert(`(다음 단계) 상세로 이동: report id = ${r.id}`);
                  }}
                >
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2">
                    {r.destination || <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-3 py-2">{r.departureDate || "-"}</td>
                  <td className="px-3 py-2">{r.returnDate || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {r.totalAmount?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                        r.status === "APPROVED"
                          ? "bg-green-50 text-green-700"
                          : r.status === "REJECTED"
                          ? "bg-red-50 text-red-700"
                          : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
