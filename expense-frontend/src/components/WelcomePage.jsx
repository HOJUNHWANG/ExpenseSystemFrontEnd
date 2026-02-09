// src/components/WelcomePage.jsx
import { Link, useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  const startGuided = () => {
    // remove the "seen" flag so it shows again
    localStorage.removeItem("expense-demo-guided-v1");
    navigate("/");
    // next render will show the modal from App
    window.location.reload();
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-6">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Welcome to Company Ops Demo</h2>
            <p className="text-sm text-slate-600">
              This is a public portfolio demo of an internal expense workflow.
              It includes a <span className="font-medium">policy exception review</span> step (when warnings apply),
              so a solo visitor can experience a realistic corporate approval process.
            </p>
          </div>
          <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            Data resets daily. Don&apos;t enter sensitive info.
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">How to try it (solo-friendly)</h3>
        <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
          <li>Click <span className="font-semibold">Start guided demo</span> (optional)</li>
          <li>Create a report as <span className="font-semibold">Employee</span></li>
          <li>Click <span className="font-semibold">Submit</span>. If there are policy warnings, the report will be routed to <span className="font-semibold">Policy exceptions</span>.</li>
          <li>Switch role to <span className="font-semibold">CFO</span> to review policy exceptions</li>
          <li>After CFO approval, switch to <span className="font-semibold">Manager</span> to approve/reject in the normal queue</li>
        </ol>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Demo policy (simplified)</h3>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <ul className="list-disc pl-5 space-y-1">
            <li>Entertainment cap: <span className="font-medium">$100</span>.</li>
            <li>Hotel nightly cap: <span className="font-medium">$250/night</span>.</li>
            <li>Airfare cap: <span className="font-medium">US $500</span> / <span className="font-medium">Intl $1000</span>.</li>
            <li>Meals daily cap: <span className="font-medium">$75/day</span>.</li>
            <li>Item dates should fall within the trip date range.</li>
            <li>No receipt attachment feature in this demo.</li>
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Start</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={startGuided}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium"
          >
            Start guided demo
          </button>
          <Link
            to="/create"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
          >
            Create a report
          </Link>
          <Link to="/reports" className="px-4 py-2 rounded-lg border text-sm font-medium">
            View reports
          </Link>
        </div>
      </div>
    </div>
  );
}
