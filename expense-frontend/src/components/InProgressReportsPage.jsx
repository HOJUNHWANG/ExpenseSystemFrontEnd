// src/components/InProgressReportsPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function InProgressReportsPage() {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;

        const fetchInProgress = async () => {
            setLoading(true);
            setError("");

            try {
                const { apiFetch } = await import("../lib/api");

                const statuses = [
                    "MANAGER_REVIEW",
                    "CFO_REVIEW",
                    "CEO_REVIEW",
                    "CFO_SPECIAL_REVIEW",
                    "CEO_SPECIAL_REVIEW",
                    "CHANGES_REQUESTED",
                ];

                const all = [];
                for (const st of statuses) {
                    try {
                        const data = await apiFetch(
                            `/api/expense-reports?submitterId=${user.id}&status=${encodeURIComponent(st)}`
                        );
                        (data || []).forEach((r) => all.push(r));
                    } catch {
                        // ignore
                    }
                }

                all.sort((a, b) => Number(b.id) - Number(a.id));
                setReports(all);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInProgress();
    }, [user]);

    if (!user) {
        return (
            <div className="bg-white rounded-xl shadow p-6">
                <p className="text-sm text-slate-700">
                    Please login to see your in-progress reports.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-semibold">In-progress Reports</h1>
                    <p className="text-xs text-slate-500">
                        Submitted reports that are not yet approved or rejected.
                    </p>
                </div>
                <Link
                    to="/create"
                    className="text-xs rounded-lg px-3 py-1 bg-blue-600 text-white hover:bg-blue-700"
                >
                    New report
                </Link>
            </div>

            {loading && <p className="text-sm text-slate-600">Loading...</p>}
            {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
                    {error}
                </p>
            )}

            {!loading && !error && reports.length === 0 && (
                <p className="text-sm text-slate-500">
                    You have no in-progress reports.
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
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        View
                                    </Link>
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
