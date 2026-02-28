import { useMemo, useState } from 'react';
import type { FormExpenseItem, PolicyWarning } from '../types';
import { MILEAGE_RATE as _MILEAGE_RATE, MEAL_LUNCH_AMOUNT } from '../lib/constants';

export const CATEGORY_OPTIONS = [
  'Airfare',
  'Hotel',
  'Transportation',
  'Mileage',
  'Office',
  'Entertainment',
];

export const ITEM_TYPES = {
  NORMAL: 'Normal',
  MILEAGE: 'MILEAGE',
  MEAL: 'Meal',
} as const;

export type ItemType = (typeof ITEM_TYPES)[keyof typeof ITEM_TYPES];

export const MILEAGE_RATE = _MILEAGE_RATE;   // sourced from lib/constants
export const MEAL_RATE = MEAL_LUNCH_AMOUNT;  // sourced from lib/constants

export function makeNormalItem(): FormExpenseItem {
  return { type: ITEM_TYPES.NORMAL, date: '', description: '', amount: '', category: '' };
}

export function makeMileageItem(): FormExpenseItem {
  return {
    type: ITEM_TYPES.MILEAGE,
    date: '',
    miles: '',
    rate: MILEAGE_RATE,
    amount: 0,
    category: 'Mileage',
    description: 'Mileage reimbursement',
  };
}

export function recomputeMealAmount(lunch: boolean, dinner: boolean): number {
  const count = (lunch ? 1 : 0) + (dinner ? 1 : 0);
  return count * MEAL_RATE;
}

export function makeMealItem(): FormExpenseItem {
  return {
    type: ITEM_TYPES.MEAL,
    date: '',
    lunch: true,
    dinner: true,
    amount: 50,
    category: 'Meal',
    description: 'Per diem (Lunch/Dinner)',
  };
}

export function computeMileageAmount(miles: string | number): number {
  const milesNum = Number(miles);
  return !miles || isNaN(milesNum) ? 0 : Number((milesNum * MILEAGE_RATE).toFixed(2));
}

interface PayloadItem {
  date: string | null;
  description: string;
  amount: number;
  category: string;
}

export function buildPayloadItems(items: FormExpenseItem[], departureDate: string): PayloadItem[] {
  return (items || []).map((it) => {
    if (it.type === ITEM_TYPES.NORMAL) {
      return {
        date: it.date,
        description: it.description,
        amount: Number(it.amount || 0),
        category: it.category,
      };
    }
    if (it.type === ITEM_TYPES.MILEAGE) {
      return {
        date: it.date || departureDate,
        description: `Mileage: ${it.miles || 0} miles x ${MILEAGE_RATE}`,
        amount: Number(it.amount || 0),
        category: 'Mileage',
      };
    }
    const mealDesc = `Meal: ${it.lunch ? 'Lunch' : ''}${it.lunch && it.dinner ? ' + ' : ''}${it.dinner ? 'Dinner' : ''}`;
    return {
      date: it.date,
      description: mealDesc,
      amount: Number(it.amount || 0),
      category: 'Meal',
    };
  });
}

export function PolicyWarningsPanel({ warnings, compact = false }: { warnings?: PolicyWarning[]; compact?: boolean }) {
  if (!warnings || warnings.length === 0) return null;
  return (
    <div
      className={
        compact
          ? 'rounded-xl border border-orange-200 bg-orange-50 px-4 py-3'
          : 'mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3'
      }
    >
      <div className="text-sm font-medium text-orange-900">Policy warnings</div>
      <div className="mt-1 text-xs text-orange-800">
        Submitting this report will route it to an exception review step.
      </div>
      <ul className="mt-2 list-disc pl-5 text-sm text-orange-900 space-y-1">
        {warnings.map((w) => (
          <li key={w.code}>
            <span className="font-medium">{w.code}</span> — {w.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ConfirmSubmitModalProps {
  open: boolean;
  warnings?: PolicyWarning[];
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmSubmitModal({ open, warnings, busy, onCancel, onConfirm }: ConfirmSubmitModalProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-submit-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-card border shadow-xl p-6">
        <div id="confirm-submit-title" className="text-lg font-semibold text-foreground">Policy warnings</div>
        <div className="mt-2 text-sm text-muted-foreground">
          This report has policy warnings. Submitting will route it to{' '}
          <span className="font-medium">exception review</span>. Do you want to continue?
        </div>
        <ul className="mt-3 list-disc pl-5 text-sm text-foreground space-y-1">
          {(warnings || []).map((w) => (
            <li key={w.code}>
              <span className="font-medium">{w.code}</span> — {w.message}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 rounded-xl border bg-card text-sm hover:bg-muted/50"
          >
            No, keep editing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="px-3 py-2 rounded-xl border border-primary bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-60"
          >
            Yes, submit
          </button>
        </div>
      </div>
    </div>
  );
}

interface FooterActionBarProps {
  onCancel: () => void;
  onDelete?: (() => void) | null;
  onSaveDraft: () => void;
  onSubmit: () => void;
  showDelete?: boolean;
  busy?: boolean;
  saving?: boolean;
  submitting?: boolean;
  deleting?: boolean;
  canSubmit?: boolean;
  canSaveDraft?: boolean;
  submitLabel?: string;
  saveDraftLabel?: string;
}

export function FooterActionBar({
  onCancel,
  onDelete,
  onSaveDraft,
  onSubmit,
  showDelete = false,
  busy = false,
  saving = false,
  submitting = false,
  deleting = false,
  canSubmit = true,
  canSaveDraft = true,
  submitLabel = 'Submit',
  saveDraftLabel = 'Save draft',
}: FooterActionBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-2 rounded-xl border bg-card text-sm hover:bg-muted/50"
      >
        Cancel
      </button>
      {showDelete && (
        <button
          type="button"
          onClick={onDelete ?? undefined}
          disabled={busy || deleting}
          className="px-3 py-2 rounded-xl border border-red-100 bg-red-50 text-red-700 text-sm hover:bg-red-100 disabled:opacity-60"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      )}
      <button
        type="button"
        onClick={onSaveDraft}
        disabled={busy || saving || !canSaveDraft}
        className="px-3 py-2 rounded-xl border bg-card text-sm hover:bg-muted/50 disabled:opacity-60"
      >
        {saving ? 'Saving…' : saveDraftLabel}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={busy || submitting || !canSubmit}
        className="px-3 py-2 rounded-xl border border-primary bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : submitLabel}
      </button>
    </div>
  );
}

interface ItemsEditorProps {
  items: FormExpenseItem[];
  setItems: React.Dispatch<React.SetStateAction<FormExpenseItem[]>>;
  departureDate: string;
  returnDate: string;
  errors: Record<string, string>;
}

export function ItemsEditor({ items, setItems, departureDate, returnDate, errors }: ItemsEditorProps) {
  const addNormalItem = () => setItems((prev) => [...prev, makeNormalItem()]);
  const addMileageItem = () =>
    setItems((prev) => {
      if (prev.some((it) => it.type === ITEM_TYPES.MILEAGE)) return prev;
      return [...prev, makeMileageItem()];
    });
  const addMealItem = () => setItems((prev) => [...prev, makeMealItem()]);

  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  const updateItem = (index: number, patch: Partial<FormExpenseItem>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? ({ ...it, ...patch } as FormExpenseItem) : it)));

  const errFor = (index: number, field: string): string => {
    const key = `items.${index}.${field}`;
    return errors?.[key] ?? '';
  };

  const tripMin = departureDate || undefined;
  const tripMax = returnDate || undefined;

  const onMealToggle = (index: number, field: 'lunch' | 'dinner', checked: boolean) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index || it.type !== ITEM_TYPES.MEAL) return it;
        const next = { ...it, [field]: checked };
        next.amount = recomputeMealAmount(
          field === 'lunch' ? checked : !!it.lunch,
          field === 'dinner' ? checked : !!it.dinner,
        );
        return next as FormExpenseItem;
      }),
    );
  };

  const onMileageChange = (index: number, value: string) => {
    updateItem(index, { miles: value, amount: computeMileageAmount(value) });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Items</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={addNormalItem} className="text-xs px-3 py-2 rounded-xl border bg-card hover:bg-muted/50">
            Add expense
          </button>
          <button type="button" onClick={addMileageItem} className="text-xs px-3 py-2 rounded-xl border bg-card hover:bg-muted/50">
            Add mileage
          </button>
          <button type="button" onClick={addMealItem} className="text-xs px-3 py-2 rounded-xl border bg-card hover:bg-muted/50">
            Add meal
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {(items || []).map((it, idx) => (
          <div key={idx} className="rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                Type: <span className="font-medium text-foreground">{it.type}</span>
              </div>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="text-xs px-3 py-2 rounded-xl border border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
              >
                Remove
              </button>
            </div>

            {it.type === ITEM_TYPES.NORMAL && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                    <input
                      type="date"
                      value={it.date}
                      min={tripMin}
                      max={tripMax}
                      onChange={(e) => updateItem(idx, { date: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-sm ${errFor(idx, 'date') ? 'border-red-200 bg-red-50' : 'border'}`}
                    />
                    {errFor(idx, 'date') && <p className="mt-1 text-xs text-red-600">{errFor(idx, 'date')}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                    <input
                      value={it.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-sm ${errFor(idx, 'description') ? 'border-red-200 bg-red-50' : 'border'}`}
                      placeholder="e.g. Client dinner"
                    />
                    {errFor(idx, 'description') && <p className="mt-1 text-xs text-red-600">{errFor(idx, 'description')}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Amount</label>
                    <input
                      value={it.amount}
                      onChange={(e) => updateItem(idx, { amount: e.target.value })}
                      inputMode="decimal"
                      className={`w-full border rounded-xl px-3 py-2 text-sm ${errFor(idx, 'amount') ? 'border-red-200 bg-red-50' : 'border'}`}
                      placeholder="0"
                    />
                    {errFor(idx, 'amount') && <p className="mt-1 text-xs text-red-600">{errFor(idx, 'amount')}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                  <select
                    className={`w-full border rounded-xl px-3 py-2 text-sm bg-card ${errFor(idx, 'category') ? 'border-red-200 bg-red-50' : 'border'}`}
                    value={it.category}
                    onChange={(e) => updateItem(idx, { category: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errFor(idx, 'category') && <p className="mt-1 text-xs text-red-600">{errFor(idx, 'category')}</p>}
                </div>
              </div>
            )}

            {it.type === ITEM_TYPES.MILEAGE && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                  <input
                    type="date"
                    value={it.date}
                    min={tripMin}
                    max={tripMax}
                    onChange={(e) => updateItem(idx, { date: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-sm ${errFor(idx, 'date') ? 'border-red-200 bg-red-50' : 'border'}`}
                  />
                  {errFor(idx, 'date') && <p className="mt-1 text-xs text-red-600">{errFor(idx, 'date')}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Miles</label>
                  <input
                    value={it.miles ?? ''}
                    onChange={(e) => onMileageChange(idx, e.target.value)}
                    inputMode="decimal"
                    className={`w-full border rounded-xl px-3 py-2 text-sm ${errFor(idx, 'miles') ? 'border-red-200 bg-red-50' : 'border'}`}
                  />
                  {errFor(idx, 'miles') && <p className="mt-1 text-xs text-red-600">{errFor(idx, 'miles')}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Rate</label>
                  <input value={MILEAGE_RATE} readOnly className="w-full border rounded-xl px-3 py-2 text-sm bg-muted/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Amount</label>
                  <input value={Number(it.amount || 0).toFixed(2)} readOnly className="w-full border rounded-xl px-3 py-2 text-sm bg-muted/50" />
                </div>
              </div>
            )}

            {it.type === ITEM_TYPES.MEAL && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                  <input
                    type="date"
                    value={it.date}
                    min={tripMin}
                    max={tripMax}
                    onChange={(e) => updateItem(idx, { date: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-sm ${errFor(idx, 'date') ? 'border-red-200 bg-red-50' : 'border'}`}
                  />
                  {errFor(idx, 'date') && <p className="mt-1 text-xs text-red-600">{errFor(idx, 'date')}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Meals</label>
                  <div className={`flex items-center gap-4 rounded-xl border px-3 py-2 ${errFor(idx, 'meal') ? 'border-red-200 bg-red-50' : 'border'}`}>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!it.lunch}
                        onChange={(e) => onMealToggle(idx, 'lunch', e.target.checked)}
                      />
                      Lunch
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!it.dinner}
                        onChange={(e) => onMealToggle(idx, 'dinner', e.target.checked)}
                      />
                      Dinner
                    </label>
                    <span className="ml-auto text-xs text-muted-foreground">${MEAL_RATE}/meal</span>
                  </div>
                  {errFor(idx, 'meal') && <p className="mt-2 text-xs text-red-600">{errFor(idx, 'meal')}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Amount</label>
                  <input value={Number(it.amount || 0).toFixed(2)} readOnly className="w-full border rounded-xl px-3 py-2 text-sm bg-muted/50" />
                </div>
              </div>
            )}
          </div>
        ))}
        {(items || []).length === 0 && <div className="text-sm text-muted-foreground">No items.</div>}
      </div>
    </div>
  );
}

export function computePerDiemPreview(
  departureDate: string,
  returnDate: string,
  destination: string,
): { days: number; rate: number; amount: number; label: string } | null {
  if (!departureDate || !returnDate) return null;
  const dep = new Date(departureDate);
  const ret = new Date(returnDate);
  const diffMs = ret.getTime() - dep.getTime();
  if (diffMs <= 0) return { days: 0, rate: 0, amount: 0, label: 'Same-day trip — no per-diem' };
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const lower = (destination || '').toLowerCase();
  const domestic = lower.includes('united states') || lower.endsWith(', us') || !lower.includes(',');
  const rate = domestic ? 25 : 50;
  return { days, rate, amount: days * rate, label: domestic ? 'Domestic' : 'International' };
}

interface PerDiemPreviewProps {
  departureDate: string;
  returnDate: string;
  destination: string;
}

export function PerDiemPreview({ departureDate, returnDate, destination }: PerDiemPreviewProps) {
  const preview = useMemo(
    () => computePerDiemPreview(departureDate, returnDate, destination),
    [departureDate, returnDate, destination],
  );
  if (!preview) return null;
  if (preview.days === 0) {
    return (
      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Per-Diem:</span> {preview.label}
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Per-Diem:</span>{' '}
      ${preview.rate}/day ({preview.label}) &times; {preview.days} days ={' '}
      <span className="font-medium text-foreground">${preview.amount.toFixed(2)}</span>
    </div>
  );
}

export interface ReportHeaderValues {
  title: string;
  city?: string;
  countrySelect?: string;
  countryOther?: string;
  destination?: string;
  departureDate: string;
  returnDate: string;
}

interface ReportHeaderFieldsProps {
  values: ReportHeaderValues;
  setValues: React.Dispatch<React.SetStateAction<ReportHeaderValues>>;
  mode: 'create' | 'edit';
  errors: Record<string, string>;
  countryOptions?: string[];
  onCountryInteract?: () => void;
}

export function ReportHeaderFields({
  values,
  setValues,
  mode,
  errors,
  countryOptions,
  onCountryInteract,
}: ReportHeaderFieldsProps) {
  const isCreate = mode === 'create';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          className="w-full border rounded-xl px-3 py-2 text-sm"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
        />
        {errors?.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
      </div>

      {isCreate ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              type="text"
              className="w-full border rounded-xl px-3 py-2 text-sm"
              value={values.city ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
              placeholder="e.g. Atlanta"
            />
            {errors?.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <select
              className="w-full border rounded-xl px-3 py-2 text-sm bg-card"
              value={values.countrySelect ?? ''}
              onChange={(e) =>
                setValues((v) => {
                  const next = { ...v, countrySelect: e.target.value };
                  if (e.target.value !== '__OTHER__') next.countryOther = '';
                  return next;
                })
              }
              onFocus={onCountryInteract}
              onMouseDown={onCountryInteract}
            >
              <option value="">Select a country…</option>
              {(countryOptions || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__OTHER__">Other…</option>
            </select>
            {values.countrySelect === '__OTHER__' && (
              <div className="mt-2">
                <input
                  type="text"
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  value={values.countryOther ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, countryOther: e.target.value }))}
                  placeholder="Type your country (e.g., Argentina)"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Used only to build the destination label (City, Country).
                </p>
              </div>
            )}
            {errors?.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1">Destination</label>
          <input
            className={`w-full border rounded-xl px-3 py-2 text-sm ${errors?.destination ? 'border-red-200 bg-red-50' : 'border'}`}
            value={values.destination ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, destination: e.target.value }))}
            placeholder="e.g. New York, United States"
          />
          {errors?.destination && <p className="text-xs text-red-600 mt-1">{errors.destination}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
        <div>
          <label className="block text-sm font-medium mb-1 whitespace-nowrap">Departure date</label>
          <input
            type="date"
            className={`w-full border rounded-xl px-3 py-2 text-sm ${errors?.departureDate ? 'border-red-200 bg-red-50' : 'border'}`}
            value={values.departureDate}
            onChange={(e) => setValues((v) => ({ ...v, departureDate: e.target.value }))}
          />
          {errors?.departureDate && <p className="text-xs text-red-600 mt-1">{errors.departureDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 whitespace-nowrap">Return date</label>
          <input
            type="date"
            className={`w-full border rounded-xl px-3 py-2 text-sm ${errors?.returnDate ? 'border-red-200 bg-red-50' : 'border'}`}
            value={values.returnDate}
            onChange={(e) => setValues((v) => ({ ...v, returnDate: e.target.value }))}
          />
          {errors?.returnDate && <p className="text-xs text-red-600 mt-1">{errors.returnDate}</p>}
        </div>
      </div>
    </div>
  );
}

interface ExpenseReportFormShellProps {
  title: string;
  subtitle?: string;
  message?: string;
  error?: string;
  busy?: boolean;
  warnings?: PolicyWarning[];
  confirmOpen?: boolean;
  setConfirmOpen?: (v: boolean) => void;
  onConfirmSubmit?: () => void;
  children: React.ReactNode;
}

export default function ExpenseReportFormShell({
  title,
  subtitle,
  message,
  error,
  busy,
  warnings,
  confirmOpen,
  setConfirmOpen,
  onConfirmSubmit,
  children,
}: ExpenseReportFormShellProps) {
  const [localConfirmOpen, setLocalConfirmOpen] = useState(false);
  const open = confirmOpen ?? localConfirmOpen;
  const setOpen = setConfirmOpen ?? setLocalConfirmOpen;

  return (
    <div className="rounded-2xl bg-card border shadow-sm p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {message && <div className="text-sm rounded-lg p-3 bg-muted">{message}</div>}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <ConfirmSubmitModal
        open={open}
        warnings={warnings}
        busy={busy}
        onCancel={() => setOpen(false)}
        onConfirm={onConfirmSubmit ?? (() => setOpen(false))}
      />

      <PolicyWarningsPanel warnings={warnings} compact />

      {children}
    </div>
  );
}
