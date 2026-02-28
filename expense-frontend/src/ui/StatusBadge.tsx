import { REPORT_STATUS } from '../lib/constants';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReportStatus } from '../types';

type BadgeVariant = 'secondary' | 'warning' | 'destructive' | 'success';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  [REPORT_STATUS.DRAFT]: 'secondary',
  [REPORT_STATUS.MANAGER_REVIEW]: 'warning',
  [REPORT_STATUS.CFO_REVIEW]: 'warning',
  [REPORT_STATUS.CEO_REVIEW]: 'warning',
  [REPORT_STATUS.CFO_SPECIAL_REVIEW]: 'warning',
  [REPORT_STATUS.CHANGES_REQUESTED]: 'destructive',
  [REPORT_STATUS.APPROVED]: 'success',
  [REPORT_STATUS.REJECTED]: 'destructive',
};

// Status labels for screen readers (color-agnostic)
const STATUS_LABELS: Record<string, string> = {
  [REPORT_STATUS.DRAFT]: 'Draft',
  [REPORT_STATUS.MANAGER_REVIEW]: 'Manager Review',
  [REPORT_STATUS.CFO_REVIEW]: 'CFO Review',
  [REPORT_STATUS.CEO_REVIEW]: 'CEO Review',
  [REPORT_STATUS.CFO_SPECIAL_REVIEW]: 'CFO Special Review',
  [REPORT_STATUS.CEO_SPECIAL_REVIEW]: 'CEO Special Review',
  [REPORT_STATUS.CHANGES_REQUESTED]: 'Changes Requested',
  [REPORT_STATUS.APPROVED]: 'Approved',
  [REPORT_STATUS.REJECTED]: 'Rejected',
};

interface StatusBadgeProps {
  status: ReportStatus | string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const s = String(status ?? '').toUpperCase();
  const variant = STATUS_VARIANT[s] ?? 'secondary';
  const label = STATUS_LABELS[s] ?? s;

  return (
    <Badge
      variant={variant}
      className={cn('text-[11px]', className)}
      aria-label={`Status: ${label}`}
    >
      {s || '-'}
    </Badge>
  );
}
