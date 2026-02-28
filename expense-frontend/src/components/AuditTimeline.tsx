import { useQuery } from '@tanstack/react-query';
import { queryKeys, fetchAuditLog } from '../lib/queries';
import { motion } from 'framer-motion';
import type { AuditLog } from '../types';
import {
  CheckCircle2,
  Send,
  FileEdit,
  XCircle,
  AlertTriangle,
  FilePlus2,
  ShieldCheck,
  ShieldX,
  type LucideIcon,
} from 'lucide-react';

interface ActionConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  CREATED:                { icon: FilePlus2,    color: 'text-gray-500',  bg: 'bg-gray-100',  label: 'Created' },
  SUBMITTED:              { icon: Send,          color: 'text-blue-600',  bg: 'bg-blue-100',  label: 'Submitted' },
  SUBMITTED_FOR_REVIEW:   { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Submitted for Review' },
  UPDATED:                { icon: FileEdit,      color: 'text-gray-600',  bg: 'bg-gray-100',  label: 'Updated' },
  MANAGER_APPROVED:       { icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-green-100', label: 'Manager Approved' },
  CFO_APPROVED:           { icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-green-100', label: 'CFO Approved' },
  CEO_APPROVED:           { icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-green-100', label: 'CEO Approved' },
  REJECTED:               { icon: XCircle,       color: 'text-red-600',   bg: 'bg-red-100',   label: 'Rejected' },
  EXCEPTION_APPROVED:     { icon: ShieldCheck,   color: 'text-green-600', bg: 'bg-green-100', label: 'Exception Approved' },
  EXCEPTION_REJECTED:     { icon: ShieldX,       color: 'text-red-600',   bg: 'bg-red-100',   label: 'Exception Rejected' },
};

function formatDateTime(dt: string | undefined): string {
  if (!dt) return '';
  return dt.replace('T', ' ').slice(0, 16);
}

export default function AuditTimeline({ reportId }: { reportId: number | string }) {
  const { data: logs, isLoading, isError } = useQuery<AuditLog[]>({
    queryKey: queryKeys.auditLog(reportId),
    queryFn: () => fetchAuditLog(reportId),
    enabled: !!reportId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 py-4" role="status" aria-label="Loading change history">
        <h3 className="text-lg font-semibold">Change History</h3>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !logs) return null;
  if (logs.length === 0) return null;

  const reversed = [...logs].reverse();

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-3">Change History</h3>
      <div className="relative pl-8">
        <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-border" aria-hidden />

        {reversed.map((log, idx) => {
          const config = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.CREATED;
          const Icon = config.icon;
          const isLatest = idx === 0;

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative mb-4 last:mb-0"
            >
              <div
                className={`absolute -left-8 top-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                  isLatest ? 'bg-primary text-primary-foreground' : config.bg
                }`}
                aria-hidden
              >
                <Icon className={`h-3.5 w-3.5 ${isLatest ? '' : config.color}`} />
              </div>

              <div className="min-h-[2rem]">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                </div>
                <div className="text-xs text-muted-foreground">{log.actorName}</div>
                {log.comment && (
                  <div className="text-xs text-muted-foreground mt-0.5 italic">
                    &ldquo;{log.comment}&rdquo;
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
