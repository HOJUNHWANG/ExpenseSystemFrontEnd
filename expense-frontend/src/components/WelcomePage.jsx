// src/components/WelcomePage.jsx
import { Link } from "react-router-dom";

export default function WelcomePage() {
    return (
        <div className="bg-white shadow-md rounded-xl p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-semibold mb-2">
                    Welcome to the Business Travel Expense Demo
                </h2>
                <p className="text-sm text-slate-600">
                    This application simulates a corporate expense report workflow:
                    employees submit travel expenses, and managers review, approve, or
                    reject them according to company policy.
                </p>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">High-level Travel Policy</h3>
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                    <li>
                        All business travel must be pre-approved by the appropriate manager.
                    </li>
                    <li>
                        Employees should use cost-effective options for flights,
                        accommodation, and ground transportation.
                    </li>
                    <li>
                        Lodging and meal expenses are subject to daily limits defined by the
                        company policy.
                    </li>
                    <li>
                        Receipts are required for all major expenses (e.g. flights, hotels,
                        rental cars, and most meals).
                    </li>
                    <li>
                        Personal expenses are not reimbursable and must be clearly separated
                        from business expenses.
                    </li>
                    <li>
                        Final approval may require additional review by Accounting or a
                        senior manager for exceptional or out-of-policy items.
                    </li>
                </ul>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">How to use this demo</h3>
                <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
                    <li>
                        Go to <span className="font-semibold">“Create Report”</span> and
                        submit a new expense report with one or more items.
                    </li>
                    <li>
                        Open <span className="font-semibold">“My Reports”</span> to see the
                        list of reports you have created.
                    </li>
                    <li>
                        Click a report in the list to open the{" "}
                        <span className="font-semibold">detail view</span>.
                    </li>
                    <li>
                        In the detail view, you can{" "}
                        <span className="font-semibold">approve</span> or{" "}
                        <span className="font-semibold">reject</span> the report and add an
                        optional comment.
                    </li>
                    <li>
                        The approval status and comment are stored in the backend and can be
                        used later for audit or reporting.
                    </li>
                </ol>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Start testing</h3>
                <div className="flex gap-3">
                    <Link
                        to="/create"
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
                    >
                        Create a New Expense Report
                    </Link>
                    <Link
                        to="/reports"
                        className="px-4 py-2 rounded-lg border text-sm font-medium"
                    >
                        View My Reports
                    </Link>
                </div>
            </div>
        </div>
    );
}
