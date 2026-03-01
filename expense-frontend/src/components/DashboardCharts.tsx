import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import type { StatsResponse, CategoryStat, MonthStat } from '../types';

const CHART_COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(199, 89%, 48%)',
  'hsl(330, 81%, 60%)',
  'hsl(25, 95%, 53%)',
];

const tooltipStyle = {
  borderRadius: '0.75rem',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
  fontSize: '0.75rem',
};

export function CategoryDonut({ data }: { data: CategoryStat[] }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">No category data yet.</div>;
  }

  const renderLabel = (props: { name?: string; percent?: number }) => {
    const { name = '', percent = 0 } = props;
    if (percent < 0.05) return null;
    return `${name} (${(percent * 100).toFixed(0)}%)`;
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-4">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={2}
            label={renderLabel}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(value: number | string | undefined) => `$${Number(value).toLocaleString()}`}
            contentStyle={tooltipStyle}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 justify-center lg:flex-col lg:gap-1">
        {data.map((d, i) => (
          <div key={d.category} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
              aria-hidden
            />
            <span>{d.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthlyTrend({ data }: { data: MonthStat[] }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">No monthly data yet.</div>;
  }

  const formatted = data.map((d) => ({ ...d, label: d.month.substring(5) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <RechartsTooltip
          formatter={(value: number | string | undefined) => `$${Number(value).toLocaleString()}`}
          labelFormatter={(label: unknown) => `Month: ${label}`}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey="amount" fill="hsl(221, 83%, 53%)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ApprovalProgress({ stats }: { stats: StatsResponse }) {
  if (!stats || stats.totalReports === 0) return null;

  const { approved = 0, rejected = 0, pending = 0, totalReports = 0 } = stats;
  const other = totalReports - approved - rejected - pending;
  const pct = (n: number) => ((n / totalReports) * 100).toFixed(1);

  const segments = [
    { label: 'Approved', value: approved, color: 'hsl(142, 71%, 45%)' },
    { label: 'Pending', value: pending, color: 'hsl(38, 92%, 50%)' },
    { label: 'Rejected', value: rejected, color: 'hsl(0, 84%, 60%)' },
    { label: 'Other', value: other, color: 'hsl(var(--muted))' },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-muted" role="img" aria-label="Approval progress bar">
        {segments.map((s) => (
          <div
            key={s.label}
            className="h-full transition-all"
            style={{ width: `${pct(s.value)}%`, background: s.color }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} aria-hidden />
            <span>
              {s.label} {s.value} ({pct(s.value)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardCharts({ stats }: { stats: StatsResponse }) {
  if (!stats) return null;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border shadow-sm p-5">
        <h3 className="text-sm font-medium text-foreground mb-3">Approval progress</h3>
        <ApprovalProgress stats={stats} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border shadow-sm p-5">
          <h3 className="text-sm font-medium text-foreground mb-3">Spending by category</h3>
          <CategoryDonut data={stats.byCategory ?? []} />
        </div>
        <div className="rounded-2xl bg-card border shadow-sm p-5">
          <h3 className="text-sm font-medium text-foreground mb-3">Monthly trend</h3>
          <MonthlyTrend data={stats.byMonth ?? []} />
        </div>
      </div>
    </div>
  );
}
