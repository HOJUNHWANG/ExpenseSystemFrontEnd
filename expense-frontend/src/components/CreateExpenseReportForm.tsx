import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../AuthContext';
import { evaluateDraftWarnings } from '../lib/policy';
import { UNSAFE_NavigationContext, useBeforeUnload, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { FormExpenseItem } from '../types';
import { expenseReportHeaderSchema, type ExpenseReportHeaderValues } from '../lib/schemas';
import { toUserMessage } from '../lib/errorMessages';

import {
  ITEM_TYPES,
  ItemsEditor,
  buildPayloadItems,
  makeNormalItem,
  ConfirmSubmitModal,
  PolicyWarningsPanel,
  FooterActionBar,
  ReportHeaderFields,
  PerDiemPreview,
  type ReportHeaderValues,
} from './ExpenseReportForm';

import { MAJOR_COUNTRY_OPTIONS, OTHER_COUNTRY_VALUE } from '../lib/countries';

interface PendingTx {
  retry: () => void;
}

type NavigatorWithBlock = {
  block?: (fn: (tx: PendingTx) => void) => () => void;
};

function useNavigationBlocker(when: boolean, onBlocked: (tx: PendingTx) => void) {
  const { navigator } = useContext(UNSAFE_NavigationContext) as { navigator: NavigatorWithBlock };
  const onBlockedRef = useRef(onBlocked);
  onBlockedRef.current = onBlocked;

  useEffect(() => {
    if (!when) return;
    if (!navigator?.block) return;

    const unblock = navigator.block((tx) => {
      const autoUnblockingTx: PendingTx = {
        ...tx,
        retry() {
          unblock();
          tx.retry();
        },
      };
      onBlockedRef.current?.(autoUnblockingTx);
    });

    return unblock;
  }, [navigator, when]);
}

export default function CreateExpenseReportForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Phase 4: React Hook Form + Zod for header fields
  const {
    handleSubmit: rhfHandleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors: rhfErrors, isDirty: headerDirty },
  } = useForm<ExpenseReportHeaderValues>({
    resolver: zodResolver(expenseReportHeaderSchema),
    defaultValues: {
      title: '',
      city: '',
      countrySelect: '',
      countryOther: '',
      departureDate: '',
      returnDate: '',
    },
  });

  const form = watch();

  // Bridge setForm for ReportHeaderFields (which uses legacy controlled-state API)
  const setForm: React.Dispatch<React.SetStateAction<ReportHeaderValues>> = (valueOrUpdater) => {
    const current = getValues();
    const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(current) : valueOrUpdater;
    (Object.keys(next) as (keyof ExpenseReportHeaderValues)[]).forEach((k) => {
      if (k in current) {
        setValue(k, (next[k] ?? '') as string, { shouldDirty: true });
      }
    });
  };

  const [items, setItems] = useState<FormExpenseItem[]>([makeNormalItem()]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  // Merge RHF header errors + item errors into one Record for child components
  const errors: Record<string, string> = useMemo(() => {
    const headerErrs: Record<string, string> = {};
    for (const [key, err] of Object.entries(rhfErrors)) {
      // Map countrySelect → country for ReportHeaderFields compatibility
      const mappedKey = key === 'countrySelect' ? 'country' : key;
      const msg = (err as { message?: string })?.message;
      if (msg) headerErrs[mappedKey] = msg;
    }
    return { ...headerErrs, ...itemErrors };
  }, [rhfErrors, itemErrors]);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const pendingTxRef = useRef<PendingTx | null>(null);

  const countryValue = useMemo(() => {
    const select = form.countrySelect ?? '';
    if (select === OTHER_COUNTRY_VALUE) return (form.countryOther ?? '').trim();
    return select.trim();
  }, [form.countrySelect, form.countryOther]);

  const policyWarnings = useMemo(() => {
    return evaluateDraftWarnings({
      country: countryValue,
      departureDate: form.departureDate,
      returnDate: form.returnDate,
      items: (items || []).map((it) => ({
        date: it.date,
        description: 'description' in it ? it.description : '',
        amount: it.amount,
        category: it.category,
      })),
    });
  }, [countryValue, form.departureDate, form.returnDate, items]);

  const itemsDirty = useMemo(() => {
    const meaningfulItems = (items || []).filter((it) => {
      if (!it) return false;
      if (it.type === ITEM_TYPES.NORMAL) {
        return Boolean(it.date || ('description' in it && it.description?.trim()) || it.amount || it.category);
      }
      if (it.type === ITEM_TYPES.MILEAGE) {
        return Boolean(('miles' in it && it.miles) || it.date);
      }
      if (it.type === ITEM_TYPES.MEAL) {
        return Boolean(it.date || ('lunch' in it && it.lunch) || ('dinner' in it && it.dinner));
      }
      return true;
    });

    if (meaningfulItems.length === 0) return false;
    if (meaningfulItems.length === 1) {
      const it = meaningfulItems[0];
      if (it.type === ITEM_TYPES.NORMAL) {
        const emptyNormal =
          !it.date &&
          !('description' in it && it.description?.trim()) &&
          !it.amount &&
          !it.category;
        return !emptyNormal;
      }
    }
    return true;
  }, [items]);

  const isDirty = headerDirty || itemsDirty;

  useBeforeUnload(
    useMemo(
      () => (e: BeforeUnloadEvent) => {
        if (!isDirty) return;
        e.preventDefault();
        e.returnValue = '';
      },
      [isDirty]
    )
  );

  useNavigationBlocker(isDirty && !loading && !draftSaving, (tx) => {
    pendingTxRef.current = tx;
    setLeaveOpen(true);
  });

  // Phase 4: Items-only validation (header validation delegated to RHF/Zod)
  const validateItems = (): boolean => {
    const newErrors: Record<string, string> = {};
    const currentForm = getValues();

    if (!items.length) {
      newErrors.items = 'At least one expense item is required.';
    } else {
      const mealDateCounts = new Map<string, number>();
      items.forEach((item) => {
        if (!item || item.type !== ITEM_TYPES.MEAL) return;
        if (!item.date) return;
        mealDateCounts.set(item.date, (mealDateCounts.get(item.date) || 0) + 1);
      });

      items.forEach((item, index) => {
        const hasTripRange = currentForm.departureDate && currentForm.returnDate;

        if (item.type === ITEM_TYPES.NORMAL) {
          if (!item.date) newErrors[`items.${index}.date`] = 'Date is required.';
          if (!('description' in item && item.description?.trim()))
            newErrors[`items.${index}.description`] = 'Description is required.';
          if (!item.category) newErrors[`items.${index}.category`] = 'Category is required.';
          if (!item.amount || isNaN(Number(item.amount)) || Number(item.amount) <= 0) {
            newErrors[`items.${index}.amount`] = 'Amount must be a positive number.';
          }
        }

        if (item.type === ITEM_TYPES.MILEAGE) {
          const miles = 'miles' in item ? item.miles : undefined;
          if (!miles || isNaN(Number(miles)) || Number(miles) <= 0) {
            newErrors[`items.${index}.miles`] = 'Miles must be a positive number.';
          }
        }

        if (item.type === ITEM_TYPES.MEAL) {
          if (!item.date) newErrors[`items.${index}.date`] = 'Meal date is required.';
          const lunch = 'lunch' in item && item.lunch;
          const dinner = 'dinner' in item && item.dinner;
          if (!lunch && !dinner) newErrors[`items.${index}.meal`] = 'Select lunch and/or dinner.';
          if (item.date && (mealDateCounts.get(item.date) || 0) > 1) {
            newErrors[`items.${index}.date`] = 'Only one meal entry per date is allowed.';
          }
        }

        if (hasTripRange && item.date) {
          if (item.date < currentForm.departureDate || item.date > currentForm.returnDate) {
            newErrors[`items.${index}.date`] = 'Date must be within the trip dates.';
          }
        }
      });
    }

    setItemErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [confirmOpen, setConfirmOpen] = useState(false);

  const payloadItems = useMemo(() => {
    return buildPayloadItems(items, form.departureDate);
  }, [items, form.departureDate]);

  const saveDraft = async (): Promise<{ ok: boolean }> => {
    setMessage('');
    setDraftSaving(true);
    const currentForm = getValues();

    const destination =
      (currentForm.city ?? '').trim() || countryValue.trim()
        ? `${currentForm.city}, ${countryValue}`
        : '';

    const filteredDraftItems = payloadItems
      .filter((it) => it.amount !== undefined && it.amount !== null)
      .filter((it) => !isNaN(Number(it.amount)))
      .map((it) => ({
        date: it.date || currentForm.departureDate || null,
        description: it.description || '(draft)',
        amount: Number(it.amount || 0),
        category: it.category || 'Other',
      }));

    const createPayload = {
      submitterId: user!.id,
      title: currentForm.title?.trim() ? currentForm.title : 'Draft — Untitled',
      items:
        filteredDraftItems.length > 0
          ? filteredDraftItems
          : [{ date: currentForm.departureDate || null, description: '(draft)', amount: 0, category: 'Other' }],
    };

    try {
      const { apiFetch } = await import('../lib/api');
      const id = await apiFetch('/api/expense-reports', {
        method: 'POST',
        body: JSON.stringify(createPayload),
      });

      await apiFetch(`/api/expense-reports/${id as string}`, {
        method: 'PUT',
        body: JSON.stringify({
          submitterId: user!.id,
          title: currentForm.title?.trim() ? currentForm.title : 'Draft — Untitled',
          destination,
          departureDate: currentForm.departureDate || null,
          returnDate: currentForm.returnDate || null,
          items: payloadItems.map((it) => ({
            date: it.date || currentForm.departureDate || null,
            description: it.description || '(draft)',
            amount: Number(it.amount || 0),
            category: it.category || 'Other',
          })),
        }),
      });

      toast.success('Draft saved.');
      return { ok: true };
    } catch (e: unknown) {
      setMessage(toUserMessage(e));
      return { ok: false };
    } finally {
      setDraftSaving(false);
    }
  };

  const doSubmit = async (): Promise<void> => {
    setLoading(true);
    const currentForm = getValues();
    try {
      const destination = `${currentForm.city}, ${countryValue}`;
      const payload = {
        submitterId: user!.id,
        title: currentForm.title,
        destination,
        departureDate: currentForm.departureDate,
        returnDate: currentForm.returnDate,
        items: payloadItems.map((it) => ({
          date: it.date,
          description: it.description,
          amount: Number(it.amount),
          category: it.category,
        })),
      };

      const { apiFetch } = await import('../lib/api');
      const id = await apiFetch('/api/expense-reports', {
        method: 'POST',
        body: JSON.stringify({ submitterId: user!.id, title: currentForm.title, items: payload.items }),
      });
      await apiFetch(`/api/expense-reports/${id as string}`, { method: 'PUT', body: JSON.stringify(payload) });
      await apiFetch(`/api/expense-reports/${id as string}/submit`, {
        method: 'POST',
        body: JSON.stringify({ submitterId: user!.id, reasons: [] }),
      });
      navigate('/reports/in-progress');
    } catch (err: unknown) {
      setMessage(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Phase 4: RHF handleSubmit — Zod validates header, then items validated manually
  const onFormSubmit = rhfHandleSubmit(async () => {
    setMessage('');
    if (!validateItems()) return;
    if (policyWarnings.length > 0) {
      setConfirmOpen(true);
      return;
    }
    await doSubmit();
  });

  if (!user) {
    return (
      <div className="bg-card shadow-sm rounded-xl p-6">
        <p className="text-sm text-muted-foreground mb-2">Please login to create an expense report.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onFormSubmit} className="bg-card shadow-sm rounded-xl p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Create Expense Report</h2>

      {message && <div className="mb-4 text-sm rounded-lg p-3 bg-muted">{message}</div>}

      {leaveOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-card border shadow-xl p-6">
            <div id="leave-dialog-title" className="text-lg font-semibold text-foreground">
              Leave this page?
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              You have unsaved changes. Save as a draft before leaving?
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLeaveOpen(false);
                  pendingTxRef.current = null;
                }}
                className="px-3 py-2 rounded-xl border bg-card text-sm hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const tx = pendingTxRef.current;
                  pendingTxRef.current = null;
                  setLeaveOpen(false);
                  tx?.retry();
                }}
                className="px-3 py-2 rounded-xl border bg-card text-sm hover:bg-muted/50"
              >
                Leave without saving
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await saveDraft();
                  if (!res.ok) return;
                  const tx = pendingTxRef.current;
                  pendingTxRef.current = null;
                  setLeaveOpen(false);
                  tx?.retry();
                }}
                disabled={draftSaving}
                className="px-3 py-2 rounded-xl border border-primary bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-60"
              >
                {draftSaving ? 'Saving…' : 'Save draft & leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmSubmitModal
        open={confirmOpen}
        warnings={policyWarnings}
        busy={loading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await doSubmit();
        }}
      />

      <div className="mb-4">
        <PolicyWarningsPanel warnings={policyWarnings} compact={false} />
      </div>

      <ReportHeaderFields
        mode="create"
        values={form}
        setValues={setForm as React.Dispatch<React.SetStateAction<ReportHeaderValues>>}
        errors={errors}
        countryOptions={MAJOR_COUNTRY_OPTIONS}
      />

      <PerDiemPreview
        departureDate={form.departureDate}
        returnDate={form.returnDate}
        destination={`${form.city}, ${countryValue}`}
      />

      <div className="mt-6 pt-6 border-t" />

      <ItemsEditor
        items={items}
        setItems={setItems}
        departureDate={form.departureDate}
        returnDate={form.returnDate}
        errors={errors}
      />

      <FooterActionBar
        onCancel={() => navigate('/dashboard')}
        onDelete={null}
        showDelete={false}
        onSaveDraft={async () => {
          const res = await saveDraft();
          if (res.ok) navigate('/reports');
        }}
        onSubmit={() => void onFormSubmit()}
        busy={loading || draftSaving}
        saving={draftSaving}
        submitting={loading}
        canSubmit={!loading}
        submitLabel="Submit"
        saveDraftLabel="Save draft"
      />
    </form>
  );
}
