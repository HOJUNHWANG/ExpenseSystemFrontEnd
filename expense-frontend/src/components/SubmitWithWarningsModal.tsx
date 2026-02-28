import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import type { PolicyWarning } from '../types';

interface SubmitWithWarningsModalProps {
  open: boolean;
  warnings?: PolicyWarning[];
  onClose?: () => void;
  onSubmit?: (reasons: { code: string; reason: string }[]) => Promise<void>;
}

export default function SubmitWithWarningsModal({
  open,
  warnings,
  onClose,
  onSubmit,
}: SubmitWithWarningsModalProps) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requiredCodes = useMemo(() => (warnings ?? []).map((w) => w.code), [warnings]);

  const canSubmit = useMemo(() => {
    if (!warnings || warnings.length === 0) return true;
    return warnings.every((w) => (reasons[w.code] ?? '').trim().length > 0);
  }, [warnings, reasons]);

  const close = () => {
    setError('');
    setReasons({});
    setSubmitting(false);
    onClose?.();
  };

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await onSubmit?.(
        requiredCodes.map((code) => ({ code, reason: (reasons[code] ?? '').trim() }))
      );
      close();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submit failed');
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="swwm-title"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-card shadow-xl border p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="swwm-title" className="text-lg font-semibold text-foreground">
              Policy warnings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This report violates one or more policies. To continue, provide a reason for each
              exception. The report will be routed to CFO for exception review.
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close policy warnings dialog"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {(warnings ?? []).map((w) => (
            <div key={w.code} className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
              <div className="text-sm font-medium text-foreground">{w.message}</div>
              <div className="mt-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Reason (required)
                </label>
                <textarea
                  value={reasons[w.code] ?? ''}
                  onChange={(e) => setReasons((p) => ({ ...p, [w.code]: e.target.value }))}
                  rows={2}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  placeholder="Explain why you are submitting an exception…"
                  aria-required="true"
                />
                {!(reasons[w.code] ?? '').trim() && (
                  <div className="mt-1 text-xs text-red-600" role="alert">
                    Required
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2" role="alert">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {canSubmit ? '' : 'Fill in all required reasons to continue.'}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={close} variant="secondary" size="sm">
              Cancel
            </Button>
            <Button
              disabled={submitting || !canSubmit}
              onClick={submit}
              variant="default"
              size="sm"
            >
              {submitting ? 'Submitting…' : 'Submit with exceptions'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
