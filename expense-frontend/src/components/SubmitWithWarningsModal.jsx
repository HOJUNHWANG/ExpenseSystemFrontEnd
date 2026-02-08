import { useMemo, useState } from "react";

export default function SubmitWithWarningsModal({
  open,
  warnings,
  onClose,
  onSubmit,
}) {
  const [reasons, setReasons] = useState({}); // code -> reason
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requiredCodes = useMemo(() => (warnings || []).map((w) => w.code), [warnings]);

  const canSubmit = useMemo(() => {
    if (!warnings || warnings.length === 0) return true;
    return warnings.every((w) => {
      const r = (reasons[w.code] || "").trim();
      return r.length > 0;
    });
  }, [warnings, reasons]);

  const close = () => {
    setError("");
    setReasons({});
    setSubmitting(false);
    onClose?.();
  };

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await onSubmit?.(
        requiredCodes.map((code) => ({ code, reason: (reasons[code] || "").trim() }))
      );
      close();
    } catch (e) {
      setError(e.message || "Submit failed");
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Policy warnings</h2>
            <p className="mt-1 text-sm text-slate-600">
              This report violates one or more policies. To continue, provide a reason for each exception.
              The report will be routed to Finance for special approval.
            </p>
          </div>
          <button onClick={close} className="text-xs text-slate-500 hover:text-slate-900">
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {(warnings || []).map((w) => (
            <div key={w.code} className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
              <div className="text-sm font-medium text-slate-900">{w.message}</div>
              <div className="mt-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Reason (required)
                </label>
                <textarea
                  value={reasons[w.code] || ""}
                  onChange={(e) => setReasons((p) => ({ ...p, [w.code]: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="Explain why you are submitting an exception…"
                />
                {!(reasons[w.code] || "").trim() && (
                  <div className="mt-1 text-xs text-red-600">Required</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {canSubmit ? "" : "Fill in all required reasons to continue."}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={close}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              disabled={submitting || !canSubmit}
              onClick={submit}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit with exceptions"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
