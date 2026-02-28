import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { evaluateDraftWarnings } from '../lib/policy';
import { REPORT_STATUS } from '../lib/constants';
import {
  ITEM_TYPES,
  MILEAGE_RATE,
  ItemsEditor,
  buildPayloadItems,
  ConfirmSubmitModal,
  PolicyWarningsPanel,
  FooterActionBar,
  ReportHeaderFields,
  PerDiemPreview,
  type ItemType,
  type ReportHeaderValues,
} from '../components/ExpenseReportForm';
import type { FormExpenseItem } from '../types';

function parseCountryFromDestination(destination: string): string {
  if (!destination) return '';
  const parts = String(destination).split(',');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].trim();
}

export default function EditReportPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<ReportHeaderValues>({
    title: '',
    destination: '',
    departureDate: '',
    returnDate: '',
  });
  const [items, setItems] = useState<FormExpenseItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canEdit = useMemo(() => Boolean(user && form.title !== null), [user, form.title]);
  const country = useMemo(() => parseCountryFromDestination(form.destination ?? ''), [form.destination]);

  const policyWarnings = useMemo(() => {
    return evaluateDraftWarnings({
      country,
      departureDate: form.departureDate,
      returnDate: form.returnDate,
      items: (items || []).map((it) => ({
        date: it.date,
        description: 'description' in it ? (it.description as string) : '',
        amount: it.amount,
        category: it.category,
      })),
    });
  }, [country, form.departureDate, form.returnDate, items]);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const r = await apiFetch(`/api/expense-reports/${id}`) as {
          submitterId: number;
          status: string;
          title: string;
          destination?: string;
          departureDate?: string;
          returnDate?: string;
          items?: Array<{ date?: string; description?: string; amount?: number; category?: string; id?: number }>;
        };

        if (Number(r.submitterId) !== Number(user.id)) {
          throw new Error('Only the submitter can edit this report.');
        }
        if (r.status !== REPORT_STATUS.DRAFT && r.status !== REPORT_STATUS.CHANGES_REQUESTED) {
          throw new Error('Only DRAFT/CHANGES_REQUESTED reports can be edited.');
        }

        setForm({
          title: r.title || '',
          destination: r.destination || '',
          departureDate: r.departureDate || '',
          returnDate: r.returnDate || '',
        });

        setItems(
          (r.items || []).map((it) => {
            const cat = it.category || '';
            const desc = it.description || '';
            let type: ItemType = ITEM_TYPES.NORMAL;
            if (String(cat).toLowerCase().includes('mileage')) type = ITEM_TYPES.MILEAGE;
            else if (String(cat).toLowerCase().includes('meal')) type = ITEM_TYPES.MEAL;

            if (type === ITEM_TYPES.MILEAGE) {
              return { type, date: it.date || '', description: desc, amount: Number(it.amount ?? 0), category: cat, miles: '', rate: MILEAGE_RATE } as FormExpenseItem;
            }
            if (type === ITEM_TYPES.MEAL) {
              return { type, date: it.date || '', description: desc, amount: Number(it.amount ?? 0), category: cat, lunch: true, dinner: true } as FormExpenseItem;
            }
            return { type, date: it.date || '', description: desc, amount: String(it.amount ?? ''), category: cat } as FormExpenseItem;
          }),
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [id, user]);

  const payloadItems = useMemo(() => buildPayloadItems(items, form.departureDate), [items, form.departureDate]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!form.title?.trim()) next.title = 'Title is required.';
    if (!form.destination?.trim()) next.destination = 'Destination is required.';
    if (!form.departureDate) next.departureDate = 'Departure date is required.';
    if (!form.returnDate) next.returnDate = 'Return date is required.';
    if (form.departureDate && form.returnDate && form.departureDate > form.returnDate) {
      next.returnDate = 'Return date must be after departure date.';
    }

    if (!items.length) {
      next.items = 'At least one expense item is required.';
    } else {
      const hasTripRange = form.departureDate && form.returnDate;
      const mealDateCounts = new Map<string, number>();
      items.forEach((item) => {
        if (!item || item.type !== ITEM_TYPES.MEAL || !item.date) return;
        mealDateCounts.set(item.date, (mealDateCounts.get(item.date) || 0) + 1);
      });

      items.forEach((item, index) => {
        if (item.type === ITEM_TYPES.NORMAL) {
          if (!item.date) next[`items.${index}.date`] = 'Date is required.';
          if (!('description' in item && (item.description as string)?.trim()))
            next[`items.${index}.description`] = 'Description is required.';
          if (!item.category) next[`items.${index}.category`] = 'Category is required.';
          if (!item.amount || isNaN(Number(item.amount)) || Number(item.amount) <= 0)
            next[`items.${index}.amount`] = 'Amount must be a positive number.';
        }
        if (item.type === ITEM_TYPES.MILEAGE) {
          const miles = 'miles' in item ? item.miles : undefined;
          if (!miles || isNaN(Number(miles)) || Number(miles) <= 0)
            next[`items.${index}.miles`] = 'Miles must be a positive number.';
        }
        if (item.type === ITEM_TYPES.MEAL) {
          if (!item.date) next[`items.${index}.date`] = 'Meal date is required.';
          const lunch = 'lunch' in item && item.lunch;
          const dinner = 'dinner' in item && item.dinner;
          if (!lunch && !dinner) next[`items.${index}.meal`] = 'Select lunch and/or dinner.';
          if (item.date && (mealDateCounts.get(item.date) || 0) > 1)
            next[`items.${index}.date`] = 'Only one meal entry per date is allowed.';
        }
        if (hasTripRange && item.date) {
          if (item.date < form.departureDate || item.date > form.returnDate)
            next[`items.${index}.date`] = 'Date must be within the trip dates.';
        }
      });
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => ({
    submitterId: user!.id,
    title: form.title,
    destination: form.destination,
    departureDate: form.departureDate || null,
    returnDate: form.returnDate || null,
    items: payloadItems.map((it) => ({
      date: it.date || null,
      description: it.description || '(draft)',
      amount: Number(it.amount || 0),
      category: it.category || 'Other',
    })),
  });

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/api/expense-reports/${id}`, { method: 'PUT', body: JSON.stringify(buildPayload()) });
      navigate(`/reports/${id}`);
    } catch (e2: unknown) {
      setError(e2 instanceof Error ? e2.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const doSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/expense-reports/${id}`, { method: 'PUT', body: JSON.stringify(buildPayload()) });
      await apiFetch(`/api/expense-reports/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ submitterId: user.id, reasons: [] }),
      });
      navigate('/reports/in-progress');
    } catch (e2: unknown) {
      setError(e2 instanceof Error ? e2.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (!validate()) { setError('Please fill the required fields.'); return; }
    if (policyWarnings.length > 0) { setConfirmOpen(true); return; }
    await doSubmit();
  };

  const deleteDraft = async () => {
    if (!user) return;
    setDeleting(true);
    setError('');
    try {
      await apiFetch(`/api/expense-reports/${id}?requesterId=${user.id}`, { method: 'DELETE' });
      toast.success('Report deleted.');
      navigate('/reports');
    } catch (e2: unknown) {
      setError(e2 instanceof Error ? e2.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl bg-card border shadow-sm p-6">
        <h1 className="text-xl font-semibold text-foreground">Edit report</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please login to edit reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Edit report</h1>
            <p className="mt-1 text-sm text-muted-foreground">Update details and items, then resubmit.</p>
          </div>
          <Link to={`/reports/${id}`} className="text-xs text-blue-600 hover:underline">Back</Link>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2" role="alert">
            {error}
          </div>
        )}

        {loading && <div className="mt-4 text-sm text-muted-foreground">Loading…</div>}

        {!loading && !error && (
          <form onSubmit={save} className="mt-4 space-y-4">
            {deleteConfirmOpen && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-dialog-title"
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              >
                <div className="w-full max-w-sm rounded-2xl bg-card border shadow-xl p-6">
                  <div id="delete-dialog-title" className="text-lg font-semibold text-foreground">
                    Delete this draft?
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This action cannot be undone. The report will be permanently removed.
                  </p>
                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(false)}
                      disabled={deleting}
                      className="px-3 py-2 rounded-xl border bg-card text-sm hover:bg-muted/50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => { setDeleteConfirmOpen(false); await deleteDraft(); }}
                      disabled={deleting}
                      className="px-3 py-2 rounded-xl border border-destructive bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90 disabled:opacity-60"
                    >
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <ConfirmSubmitModal
              open={confirmOpen}
              warnings={policyWarnings}
              busy={submitting}
              onCancel={() => setConfirmOpen(false)}
              onConfirm={async () => { setConfirmOpen(false); await doSubmit(); }}
            />
            <PolicyWarningsPanel warnings={policyWarnings} compact />
            <ReportHeaderFields
              mode="edit"
              values={form}
              setValues={setForm as React.Dispatch<React.SetStateAction<ReportHeaderValues>>}
              errors={errors}
            />
            <PerDiemPreview
              departureDate={form.departureDate}
              returnDate={form.returnDate}
              destination={form.destination ?? ''}
            />
            <ItemsEditor
              items={items}
              setItems={setItems}
              departureDate={form.departureDate}
              returnDate={form.returnDate}
              errors={errors}
            />
            <FooterActionBar
              onCancel={() => navigate(`/reports/${id}`)}
              onDelete={() => setDeleteConfirmOpen(true)}
              showDelete
              onSaveDraft={() => void save()}
              onSubmit={() => void submit()}
              busy={saving || submitting || deleting}
              saving={saving}
              submitting={submitting}
              deleting={deleting}
              canSaveDraft={canEdit}
              canSubmit={canEdit && !saving}
              submitLabel="Submit"
              saveDraftLabel="Save draft"
            />
          </form>
        )}
      </div>
    </div>
  );
}
