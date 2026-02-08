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
    <div className="bg-white shadow-md rounded-xl p-6 space-y-6">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Welcome to Company Ops Demo</h2>
            <p className="text-sm text-slate-600">
              Public demo of an internal workflow tool. You can create an expense report as an
              Employee, then switch roles to Manager/Finance to approve or reject.
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
          <li>Create &amp; submit a report as <span className="font-semibold">Employee</span></li>
          <li>Use the <span className="font-semibold">View as</span> buttons to switch to <span className="font-semibold">Manager</span></li>
          <li>Approve or reject from the <span className="font-semibold">Approval Queue</span></li>
        </ol>
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
