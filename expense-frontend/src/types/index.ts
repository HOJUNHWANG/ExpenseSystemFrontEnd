// ─── User ─────────────────────────────────────────────────────────────────────
export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'CFO' | 'CEO';

export interface User {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
}

// ─── Report Status ────────────────────────────────────────────────────────────
export type ReportStatus =
  | 'DRAFT'
  | 'MANAGER_REVIEW'
  | 'CFO_REVIEW'
  | 'CEO_REVIEW'
  | 'CFO_SPECIAL_REVIEW'
  | 'CEO_SPECIAL_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED';

// ─── Expense Items ────────────────────────────────────────────────────────────
export interface ExpenseItem {
  id?: number;
  date: string;
  description: string;
  amount: number;
  category: string;
}

// Form-level item types (before API serialization)
export interface NormalExpenseItem {
  type: 'Normal';
  date: string;
  description: string;
  amount: string | number;
  category: string;
}

export interface MileageExpenseItem {
  type: 'MILEAGE';
  date: string;
  miles: string | number;
  rate: number;
  amount: number;
  category: string;
  description: string;
}

export interface MealExpenseItem {
  type: 'Meal';
  date: string;
  lunch: boolean;
  dinner: boolean;
  amount: number;
  category: string;
  description: string;
}

export type FormExpenseItem = NormalExpenseItem | MileageExpenseItem | MealExpenseItem;

// ─── Expense Reports ──────────────────────────────────────────────────────────
export interface ExpenseReport {
  id: number;
  title: string;
  status: ReportStatus;
  submitterId: number | string;
  submitterName?: string;
  approverName?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  totalAmount?: number;
  items?: ExpenseItem[];
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string;
  approvalComment?: string;
  approverId?: number | string;
  flagged?: boolean;
  policyFlags?: string[];
  policyWarnings?: PolicyWarning[];
  perDiemDays?: number;
  perDiemRate?: number;
  perDiemAmount?: number;
  activityLabel?: string;
}

export interface ExpenseReportListItem {
  id: number;
  title: string;
  status: ReportStatus;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  totalAmount?: number;
  flagged?: boolean;
  activityLabel?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  status?: number;
}

// ─── Policy ───────────────────────────────────────────────────────────────────
export interface PolicyWarning {
  code: string;
  message: string;
}

export interface PolicyEvaluateInput {
  country?: string;
  departureDate?: string;
  returnDate?: string;
  items?: Array<{
    date?: string;
    description?: string;
    amount?: number | string;
    category?: string;
  }>;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export interface CategoryStat {
  category: string;
  amount: number;
}

export interface MonthStat {
  month: string;
  amount: number;
}

export interface StatsResponse {
  byCategory?: CategoryStat[];
  byMonth?: MonthStat[];
  totalReports?: number;
  totalAmount?: number;
  approved?: number;
  rejected?: number;
  pending?: number;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: number;
  action: string;
  actorName: string;
  createdAt: string;
  comment?: string;
}

// ─── Special Review ───────────────────────────────────────────────────────────
export interface SpecialReviewItem {
  id?: number;
  code: string;
  message: string;
  submitterReason?: string;
  financeDecision?: 'APPROVE' | 'REJECT' | null;
  financeReason?: string;
}

export interface SpecialReview {
  reportId: number;
  items: SpecialReviewItem[];
  reviewerComment?: string;
}

// ─── Demo Users ───────────────────────────────────────────────────────────────
export interface DemoUser {
  email: string;
  label: string;
}
