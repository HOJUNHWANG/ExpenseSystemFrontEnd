import { apiFetch } from "./api";

// --- Query Keys ---
export const queryKeys = {
  reports: (submitterId, status, page) => ["reports", { submitterId, status, page }],
  report: (id) => ["report", id],
  pendingApprovals: (role, page) => ["pendingApprovals", role, page],
  activity: (userId, role) => ["activity", userId, role],
  search: (params) => ["search", params],
  specialReview: (id) => ["specialReview", id],
  submitterFeedback: (reportId, requesterId) => ["submitterFeedback", reportId, requesterId],
  stats: () => ["stats"],
  auditLog: (reportId) => ["auditLog", reportId],
};

// --- Fetchers ---
export const fetchReports = async ({ submitterId, status, page, size = 10 }) => {
  const qs = new URLSearchParams({ submitterId: String(submitterId) });
  if (status) qs.set("status", status);
  if (page !== undefined && page !== null) {
    qs.set("page", String(page));
    qs.set("size", String(size));
  }
  return apiFetch(`/api/expense-reports?${qs.toString()}`);
};

export const fetchReport = async (id) => {
  return apiFetch(`/api/expense-reports/${id}`);
};

export const fetchPendingApprovals = async (role, page, size = 10) => {
  const qs = new URLSearchParams({ requesterRole: role });
  if (page !== undefined && page !== null) {
    qs.set("page", String(page));
    qs.set("size", String(size));
  }
  return apiFetch(`/api/expense-reports/pending-approval?${qs.toString()}`);
};

export const fetchActivity = async (userId, role, limit = 8) => {
  return apiFetch(`/api/expense-reports/activity?requesterId=${userId}&requesterRole=${role}&limit=${limit}`);
};

export const fetchSearch = async (params) => {
  const qs = new URLSearchParams();
  qs.set("requesterId", String(params.requesterId));
  qs.set("requesterRole", String(params.requesterRole));
  if (params.q?.trim()) qs.set("q", params.q.trim());
  if (params.status) qs.set("status", params.status);
  if (params.minTotal !== "" && params.minTotal !== undefined) qs.set("minTotal", String(Number(params.minTotal)));
  if (params.maxTotal !== "" && params.maxTotal !== undefined) qs.set("maxTotal", String(Number(params.maxTotal)));
  if (params.sort) qs.set("sort", params.sort);
  if (params.page !== undefined && params.page !== null) {
    qs.set("page", String(params.page));
    qs.set("size", String(params.size || 10));
  }
  return apiFetch(`/api/expense-reports/search?${qs.toString()}`);
};

export const fetchStats = async () => {
  return apiFetch("/api/expense-reports/stats");
};

export const fetchAuditLog = async (reportId) => {
  return apiFetch(`/api/expense-reports/${reportId}/audit-log`);
};
