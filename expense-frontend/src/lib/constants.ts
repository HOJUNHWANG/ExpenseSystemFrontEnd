import type { ReportStatus, UserRole } from '../types';

export const REPORT_STATUS = {
  DRAFT: 'DRAFT',
  MANAGER_REVIEW: 'MANAGER_REVIEW',
  CFO_REVIEW: 'CFO_REVIEW',
  CEO_REVIEW: 'CEO_REVIEW',
  CFO_SPECIAL_REVIEW: 'CFO_SPECIAL_REVIEW',
  CEO_SPECIAL_REVIEW: 'CEO_SPECIAL_REVIEW',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const satisfies Record<string, ReportStatus>;

export const STATUS_LABELS: Record<ReportStatus, string> = {
  [REPORT_STATUS.DRAFT]: 'Draft',
  [REPORT_STATUS.MANAGER_REVIEW]: 'Manager review',
  [REPORT_STATUS.CFO_REVIEW]: 'CFO review',
  [REPORT_STATUS.CEO_REVIEW]: 'CEO review',
  [REPORT_STATUS.CFO_SPECIAL_REVIEW]: 'CFO special',
  [REPORT_STATUS.CEO_SPECIAL_REVIEW]: 'CEO special',
  [REPORT_STATUS.CHANGES_REQUESTED]: 'Changes requested',
  [REPORT_STATUS.APPROVED]: 'Approved',
  [REPORT_STATUS.REJECTED]: 'Rejected',
};

export const USER_ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER',
  CFO: 'CFO',
  CEO: 'CEO',
} as const satisfies Record<string, UserRole>;

// ─── Policy constants (keep in sync with backend PolicyEngine) ────────────────
export const MILEAGE_RATE = 0.70;           // $ per mile
export const MEAL_LUNCH_AMOUNT = 25;        // $ per lunch
export const MEAL_DINNER_AMOUNT = 25;       // $ per dinner
export const MAX_ITEM_AMOUNT = 999999.99;   // backend DecimalMax cap
