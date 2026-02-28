import { apiFetch } from './api';
import type { ExpenseReport, ExpenseReportListItem, PageResponse, AuditLog, StatsResponse } from '../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const queryKeys = {
  reports: (submitterId?: number | string, status?: string, page?: number) =>
    ['reports', { submitterId, status, page }] as const,
  report: (id: number | string) => ['report', id] as const,
  pendingApprovals: (role?: string, page?: number) => ['pendingApprovals', role, page] as const,
  activity: (userId?: number | string, role?: string) => ['activity', userId, role] as const,
  search: (params: object) => ['search', params] as const,
  specialReview: (id: number | string) => ['specialReview', id] as const,
  submitterFeedback: (reportId: number | string, requesterId: number | string) =>
    ['submitterFeedback', reportId, requesterId] as const,
  stats: () => ['stats'] as const,
  auditLog: (reportId: number | string) => ['auditLog', reportId] as const,
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────
interface FetchReportsParams {
  submitterId: number | string;
  status?: string;
  page?: number;
  size?: number;
}

export const fetchReports = async ({
  submitterId,
  status,
  page,
  size = 10,
}: FetchReportsParams): Promise<PageResponse<ExpenseReportListItem>> => {
  const qs = new URLSearchParams({ submitterId: String(submitterId) });
  if (status) qs.set('status', status);
  if (page !== undefined && page !== null) {
    qs.set('page', String(page));
    qs.set('size', String(size));
  }
  return apiFetch(`/api/expense-reports?${qs.toString()}`) as Promise<PageResponse<ExpenseReportListItem>>;
};

export const fetchReport = async (id: number | string): Promise<ExpenseReport> => {
  return apiFetch(`/api/expense-reports/${id}`) as Promise<ExpenseReport>;
};

export const fetchPendingApprovals = async (
  role: string,
  page?: number,
  size = 10
): Promise<PageResponse<ExpenseReportListItem>> => {
  const qs = new URLSearchParams({ requesterRole: role });
  if (page !== undefined && page !== null) {
    qs.set('page', String(page));
    qs.set('size', String(size));
  }
  return apiFetch(`/api/expense-reports/pending-approval?${qs.toString()}`) as Promise<
    PageResponse<ExpenseReportListItem>
  >;
};

export const fetchActivity = async (
  userId: number | string,
  role: string,
  limit = 8
): Promise<ExpenseReportListItem[]> => {
  return apiFetch(
    `/api/expense-reports/activity?requesterId=${userId}&requesterRole=${role}&limit=${limit}`
  ) as Promise<ExpenseReportListItem[]>;
};

interface SearchParams {
  requesterId: number | string;
  requesterRole?: string;
  q?: string;
  status?: string;
  minTotal?: number | string;
  maxTotal?: number | string;
  sort?: string;
  page?: number;
  size?: number;
}

export const fetchSearch = async (params: SearchParams): Promise<PageResponse<ExpenseReportListItem>> => {
  const qs = new URLSearchParams();
  qs.set('requesterId', String(params.requesterId));
  qs.set('requesterRole', String(params.requesterRole));
  if (params.q?.trim()) qs.set('q', params.q.trim());
  if (params.status) qs.set('status', params.status);
  if (params.minTotal !== '' && params.minTotal !== undefined) qs.set('minTotal', String(Number(params.minTotal)));
  if (params.maxTotal !== '' && params.maxTotal !== undefined) qs.set('maxTotal', String(Number(params.maxTotal)));
  if (params.sort) qs.set('sort', params.sort);
  if (params.page !== undefined && params.page !== null) {
    qs.set('page', String(params.page));
    qs.set('size', String(params.size ?? 10));
  }
  return apiFetch(`/api/expense-reports/search?${qs.toString()}`) as Promise<PageResponse<ExpenseReportListItem>>;
};

export const fetchStats = async (): Promise<StatsResponse> => {
  return apiFetch('/api/expense-reports/stats') as Promise<StatsResponse>;
};

export const fetchAuditLog = async (reportId: number | string): Promise<AuditLog[]> => {
  return apiFetch(`/api/expense-reports/${reportId}/audit-log`) as Promise<AuditLog[]>;
};
