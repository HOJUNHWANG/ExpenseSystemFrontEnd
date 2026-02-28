import { REPORT_STATUS } from '../lib/constants';
import { cn } from '@/lib/utils';
import type { ReportStatus } from '../types';

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  [REPORT_STATUS.DRAFT]: {
    label: 'Draft',
    className: 'bg-secondary/80 text-secondary-foreground border border-border',
  },
  [REPORT_STATUS.MANAGER_REVIEW]: {
    label: 'Manager Review',
    className: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  [REPORT_STATUS.CFO_REVIEW]: {
    label: 'CFO Review',
    className: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  [REPORT_STATUS.CEO_REVIEW]: {
    label: 'CEO Review',
    className: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  [REPORT_STATUS.CFO_SPECIAL_REVIEW]: {
    label: 'CFO Special',
    className: 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  },
  [REPORT_STATUS.CEO_SPECIAL_REVIEW]: {
    label: 'CEO Special',
    className: 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  },
  [REPORT_STATUS.CHANGES_REQUESTED]: {
    label: 'Changes Requested',
    className: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
  [REPORT_STATUS.APPROVED]: {
    label: 'Approved',
    className: 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]',
  },
  [REPORT_STATUS.REJECTED]: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/25 dark:text-red-400 dark:border-red-900',
  },
};

interface StatusBadgeProps {
  status: ReportStatus | string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const key = String(status ?? '').toUpperCase();
  const config = STATUS_CONFIG[key];
  const label = config?.label ?? key;
  const badgeClass = config?.className ?? 'bg-secondary text-secondary-foreground border border-border';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        badgeClass,
        className
      )}
      aria-label={`Status: ${label}`}
    >
      {label || '-'}
    </span>
  );
}
