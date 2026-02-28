import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

type Tone = 'white' | 'slate' | 'dark';

function Section({
  kicker,
  title,
  desc,
  children,
  tone = 'white',
}: {
  kicker: string;
  title: string;
  desc?: string;
  children?: React.ReactNode;
  tone?: Tone;
}) {
  const tones: Record<Tone, string> = {
    white: 'bg-card border',
    slate: 'bg-muted/50 border',
    dark: 'bg-primary border-primary text-primary-foreground',
  };

  return (
    <section className={`rounded-3xl border shadow-sm ${tones[tone]} p-6 md:p-10`}>
      <div className="text-muted-foreground">{kicker}</div>
      <h2
        className={`mt-2 text-2xl md:text-3xl font-semibold ${
          tone === 'dark' ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {title}
      </h2>
      {desc && (
        <p
          className={`mt-3 text-sm md:text-base leading-relaxed ${
            tone === 'dark' ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {desc}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

export default function WelcomePage() {
  const { user } = useAuth();
  const isApprover = user && (user.role === 'MANAGER' || user.role === 'CFO' || user.role === 'CEO');
  const isCfo = user && user.role === 'CFO';

  return (
    <div className="space-y-6">
      <Section
        kicker="Public portfolio demo"
        title="Company Ops Demo"
        desc={
          'A solo-friendly expense workflow tool with role switching (Employee → Manager → CFO → CEO). ' +
          'Policy warnings route reports into Policy exceptions (exception review) before entering the normal approval queue.'
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
            className="px-4 py-2 rounded-xl border border-primary-foreground/30 text-primary-foreground text-sm font-medium hover:bg-primary-foreground/10"
          >
            Go to dashboard
          </Link>
        </div>
        <div className="mt-6 text-xs text-muted-foreground">
          Data resets regularly. Don&apos;t enter sensitive information.
        </div>
      </Section>

      <Section
        kicker="How to try it"
        title="A realistic workflow — without multiple accounts"
        desc="Use the Role Switcher in the header to experience the approval chain as a single visitor."
        tone="white"
      >
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {[
            { n: 1, t: 'Reset demo', d: 'Start from a clean dataset.' },
            { n: 2, t: 'Create as Employee', d: 'Add expenses, mileage, or meals.' },
            { n: 3, t: 'Submit', d: 'Policy warnings route to exception review.' },
            { n: 4, t: 'Review exceptions as CFO', d: 'Approve or reject policy exceptions.' },
            { n: 5, t: 'Approve in the queue', d: 'Manager/CFO/CEO approval chain.' },
            { n: 6, t: 'Iterate', d: 'Drafts + edits + resubmissions.' },
          ].map((item) => (
            <li key={item.n} className="rounded-2xl border bg-card p-4">
              <div className="font-medium text-foreground">{item.n}) {item.t}</div>
              <div className="mt-1 text-muted-foreground">{item.d}</div>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        kicker="Demo policy"
        title="Simplified corporate rules"
        desc="These are intentionally simplified but realistic."
        tone="slate"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="rounded-2xl bg-card border p-4">
            <div className="font-medium text-foreground">Caps</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Entertainment: $100</li>
              <li>Hotel: $250/night</li>
              <li>Airfare: US $500 / Intl $1000</li>
              <li>Meals: $75/day (per diem supported)</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-card border p-4">
            <div className="font-medium text-foreground">Notes</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Item dates should be within trip dates.</li>
              <li>No receipt upload feature in this demo.</li>
              <li>Exception review is required when policy warnings apply.</li>
            </ul>
          </div>
        </div>
      </Section>

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
              className="px-4 py-2 rounded-xl border bg-card text-sm font-medium hover:bg-muted/50"
            >
              Search reports
            </Link>
            {isCfo ? (
              <Link
                to="/policy-exceptions"
                className="px-4 py-2 rounded-xl border bg-card text-sm font-medium hover:bg-muted/50"
              >
                Policy exceptions
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl border bg-card text-sm font-medium text-muted-foreground opacity-60 cursor-not-allowed"
              >
                Policy exceptions
              </button>
            )}
            {isApprover ? (
              <Link
                to="/approvals"
                className="px-4 py-2 rounded-xl border bg-card text-sm font-medium hover:bg-muted/50 text-center"
              >
                Approval queue
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl border bg-card text-sm font-medium text-muted-foreground opacity-60 cursor-not-allowed"
              >
                Approval queue
              </button>
            )}
          </div>
          {(!isApprover || !isCfo) && (
            <div className="mt-2 text-[11px] text-muted-foreground">
              {!isApprover ? 'Approval queue is available for Manager/CFO/CEO roles.' : ''}
              {!isCfo ? ' Policy exceptions are available for the CFO role.' : ''}
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
