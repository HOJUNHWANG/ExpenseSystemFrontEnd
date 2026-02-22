// src/components/WelcomePage.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

function Section({ kicker, title, desc, children, tone = "white" }) {
  const tones = {
    white: "bg-white border",
    slate: "bg-muted/50 border",
    dark: "bg-slate-900 border-slate-900 text-white",
  };

  return (
    <section className={`rounded-3xl border shadow-sm ${tones[tone] || tones.white} p-6 md:p-10`}>
      <div className={tone === "dark" ? "text-muted-foreground" : "text-muted-foreground"}>{kicker}</div>
      <h2 className={`mt-2 text-2xl md:text-3xl font-semibold ${tone === "dark" ? "text-white" : "text-foreground"}`}>{title}</h2>
      {desc && (
        <p className={`mt-3 text-sm md:text-base leading-relaxed ${tone === "dark" ? "text-slate-200" : "text-muted-foreground"}`}>
          {desc}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border bg-white px-3 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isApprover = user && (user.role === "MANAGER" || user.role === "CFO" || user.role === "CEO");
  const isCfo = user && user.role === "CFO";

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

        <div className="mt-6 text-xs text-muted-foreground">
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
          <li className="rounded-2xl border border bg-white p-4">
            <div className="font-medium text-foreground">1) Reset demo</div>
            <div className="mt-1 text-muted-foreground">Start from a clean dataset.</div>
          </li>
          <li className="rounded-2xl border border bg-white p-4">
            <div className="font-medium text-foreground">2) Create as Employee</div>
            <div className="mt-1 text-muted-foreground">Add expenses, mileage, or meals.</div>
          </li>
          <li className="rounded-2xl border border bg-white p-4">
            <div className="font-medium text-foreground">3) Submit</div>
            <div className="mt-1 text-muted-foreground">Policy warnings route to exception review.</div>
          </li>
          <li className="rounded-2xl border border bg-white p-4">
            <div className="font-medium text-foreground">4) Review exceptions as CFO</div>
            <div className="mt-1 text-muted-foreground">Approve or reject policy exceptions.</div>
          </li>
          <li className="rounded-2xl border border bg-white p-4">
            <div className="font-medium text-foreground">5) Approve in the queue</div>
            <div className="mt-1 text-muted-foreground">Manager/CFO/CEO approval chain.</div>
          </li>
          <li className="rounded-2xl border border bg-white p-4">
            <div className="font-medium text-foreground">6) Iterate</div>
            <div className="mt-1 text-muted-foreground">Drafts + edits + resubmissions.</div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="rounded-2xl bg-white border border p-4">
            <div className="font-medium text-foreground">Caps</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Entertainment: $100</li>
              <li>Hotel: $250/night</li>
              <li>Airfare: US $500 / Intl $1000</li>
              <li>Meals: $75/day (per diem supported)</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white border border p-4">
            <div className="font-medium text-foreground">Notes</div>
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

        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/search"
              className="px-4 py-2 rounded-xl border border bg-white text-sm font-medium hover:bg-muted/50"
            >
              Search reports
            </Link>
            {isCfo ? (
              <Link
                to="/policy-exceptions"
                className="px-4 py-2 rounded-xl border border bg-white text-sm font-medium hover:bg-muted/50"
              >
                Policy exceptions
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl border border bg-white text-sm font-medium text-muted-foreground opacity-60 cursor-not-allowed"
              >
                Policy exceptions
              </button>
            )}

            {/* Keep this CTA last; disable for employees */}
            {isApprover ? (
              <Link
                to="/approvals"
                className="px-4 py-2 rounded-xl border border bg-white text-sm font-medium hover:bg-muted/50 text-center"
              >
                Approval queue
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl border border bg-white text-sm font-medium text-muted-foreground opacity-60 cursor-not-allowed"
              >
                Approval queue
              </button>
            )}
          </div>

          {(!isApprover || !isCfo) && (
            <div className="mt-2 text-[11px] text-muted-foreground">
              {!isApprover ? "Approval queue is available for Manager/CFO/CEO roles." : ""}
              {!isApprover && !isCfo ? " " : ""}
              {!isCfo ? "Policy exceptions are available for the CFO role." : ""}
            </div>
          )}
        </div>
      </Section>

      <div className="text-xs text-muted-foreground text-center pb-2">
        © Company Ops Demo — portfolio project
      </div>
    </div>
  );
}
