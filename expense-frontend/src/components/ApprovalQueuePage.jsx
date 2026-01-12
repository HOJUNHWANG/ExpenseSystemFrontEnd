import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLocation } from "react-router-dom";

export default function ApprovalQueuePage() {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const location = useLocation();
    const [toast, setToast] = useState("");

    useEffect(() => {
        if (!user) return;

        const fetchPending = async () => {
            setLoading(true);
            setError("");

            try {
                const res = await fetch(
                    "http://localhost:8080/api/expense-reports/pending-approval"
                );

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Failed to fetch approval queue");
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

        fetchPending();
    }, [user]);

    useEffect(() => {
      const msg = location.state?.toast;
      if (msg) {
        setToast(msg);

        // history state를 비워서 새로고침/뒤로가기 시 중복 토스트 방지
        window.history.replaceState({}, document.title);

        const t = setTimeout(() => setToast(""), 2500);
        return () => clearTimeout(t);
      }
    }, [location.state]);

    useEffect(() => { fetchPending(); }, [user, location.key]);

    {toast && (
      <div className="mb-3 rounded-lg bg-green-50 text-green-700 text-sm px-3 py-2">
        {toast}
      </div>
    )}

    if (!user) {
        return (
            <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-slate-700">
                    Please login to see approval queue.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-semibold">Approval Queue</h1>
                    <p className="text-xs text-slate-500">
                        Expense reports that are currently SUBMITTED and waiting for approval.
                    </p>
                </div>
            </div>

            {loading && <p className="text-sm text-slate-600">Loading...</p>}
            {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
                    {error}
                </p>
            )}

            {!loading && !error && reports.length === 0 && (
                <p className="text-sm text-slate-500">
                    There are no reports pending approval.
                </p>
            )}

            {!loading && !error && reports.length > 0 && (
                <div className="mt-2 border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="text-left px-3 py-2">Title</th>
                            <th className="text-left px-3 py-2">Destination</th>
                            <th className="text-left px-3 py-2">Departure</th>
                            <th className="text-left px-3 py-2">Return</th>
                            <th className="text-left px-3 py-2">Status</th>
                            <th className="text-left px-3 py-2"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {reports.map((r) => (
                            <tr key={r.id} className="border-t hover:bg-slate-50">
                                <td className="px-3 py-2">{r.title}</td>
                                <td className="px-3 py-2">{r.destination}</td>
                                <td className="px-3 py-2">{r.departureDate}</td>
                                <td className="px-3 py-2">{r.returnDate}</td>
                                <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
                      {r.status}
                    </span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                    <Link
                                      to={`/reports/${r.id}`}
                                      state={{ from: "/approvals" }}
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      View / Approve
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </body>
                    </table>
                </div>
            )}
        </div>
    );
}
