// src/components/WelcomePage.jsx
import { Link, useNavigate } from "react-router-dom";

function Section({ kicker, title, desc, children, tone = "white" }) {
  const tones = {
    white: "bg-white border-slate-200",
    slate: "bg-slate-50 border-slate-200",
    dark: "bg-slate-900 border-slate-900 text-white",
  };

  return (
    <section className={`rounded-3xl border shadow-sm ${tones[tone] || tones.white} p-6 md:p-10`}>
      <div className={tone === "dark" ? "text-slate-300" : "text-slate-500"}>{kicker}</div>
      <h2 className={`mt-2 text-2xl md:text-3xl font-semibold ${tone === "dark" ? "text-white" : "text-slate-900"}`}>{title}</h2>
      {desc && (
        <p className={`mt-3 text-sm md:text-base leading-relaxed ${tone === "dark" ? "text-slate-200" : "text-slate-600"}`}>
          {desc}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
      {children}
    </span>
  );
}

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
    <div className="space-y-6">
      {/* HERO */}
      <Section
        kicker="Public portfolio demo"
        title="Company Ops Demo"
        desc={
          "A solo-friendly expense workflow tool with role switching (Employee → Manager → CFO → CEO). " +
          "Policy warnings route reports into Policy exceptions (exception review) before entering the normal approval queue."
        }
        tone="dark"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Pill>Reset demo (seeded data)</Pill>
          <Pill>Role switcher</Pill>
          <Pill>Exception review gate</Pill>
          <Pill>CI (API smoke + Playwright)</Pill>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={startGuided}
            className="px-4 py-2 rounded-xl bg-white text-slate-900 text-sm font-medium hover:bg-slate-100"
          >
            Start guided demo
          </button>
          <Link
            to="/create"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500"
          >
            Create a report
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-xl border border-slate-700 text-white text-sm font-medium hover:bg-slate-800"
          >
            Go to dashboard
          </Link>
        </div>

        <div className="mt-6 text-xs text-slate-300">
          Data resets regularly. Don’t enter sensitive information.
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section
        kicker="How to try it"
        title="A realistic workflow — without multiple accounts"
        desc="Use the Role Switcher in the header to experience the approval chain as a single visitor."
        tone="white"
      >
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="font-medium text-slate-900">1) Reset demo</div>
            <div className="mt-1 text-slate-600">Start from a clean dataset.</div>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="font-medium text-slate-900">2) Create as Employee</div>
            <div className="mt-1 text-slate-600">Add expenses, mileage, or meals.</div>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="font-medium text-slate-900">3) Submit</div>
            <div className="mt-1 text-slate-600">Policy warnings route to exception review.</div>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="font-medium text-slate-900">4) Review exceptions as CFO</div>
            <div className="mt-1 text-slate-600">Approve or reject policy exceptions.</div>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="font-medium text-slate-900">5) Approve in the queue</div>
            <div className="mt-1 text-slate-600">Manager/CFO/CEO approval chain.</div>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="font-medium text-slate-900">6) Iterate</div>
            <div className="mt-1 text-slate-600">Drafts + edits + resubmissions.</div>
          </li>
        </ol>
      </Section>

      {/* POLICY */}
      <Section
        kicker="Demo policy"
        title="Simplified corporate rules"
        desc="These are intentionally simplified but realistic."
        tone="slate"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="font-medium text-slate-900">Caps</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Entertainment: $100</li>
              <li>Hotel: $250/night</li>
              <li>Airfare: US $500 / Intl $1000</li>
              <li>Meals: $75/day (per diem supported)</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="font-medium text-slate-900">Notes</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Item dates should be within trip dates.</li>
              <li>No receipt upload feature in this demo.</li>
              <li>Exception review is required when policy warnings apply.</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* TECH */}
      <Section
        kicker="Under the hood"
        title="Built like a real product"
        desc="A clean UI, role-based access, and guardrails that keep the demo deterministic in CI."
        tone="white"
      >
        <div className="flex flex-wrap gap-2">
          <Pill>Vite + React</Pill>
          <Pill>Spring Boot API</Pill>
          <Pill>Postgres (Render)</Pill>
          <Pill>Vercel FE</Pill>
          <Pill>Playwright E2E</Pill>
          <Pill>API smoke</Pill>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/search"
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50"
          >
            Search reports
          </Link>
          <Link
            to="/approvals"
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50"
          >
            Approval queue
          </Link>
          <Link
            to="/policy-exceptions"
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50"
          >
            Policy exceptions
          </Link>
        </div>
      </Section>

      <div className="text-xs text-slate-500 text-center pb-2">
        © Company Ops Demo — portfolio project
      </div>
    </div>
  );
}
