export default function StatusBadge({ status, className = "" }) {
  const s = String(status || "").toUpperCase();

  const styles = {
    DRAFT: "bg-slate-50 text-slate-700 border-slate-100",

    MANAGER_REVIEW: "bg-yellow-50 text-yellow-700 border-yellow-100",
    CFO_REVIEW: "bg-yellow-50 text-yellow-700 border-yellow-100",
    CEO_REVIEW: "bg-yellow-50 text-yellow-700 border-yellow-100",

    CFO_SPECIAL_REVIEW: "bg-orange-50 text-orange-700 border-orange-100",
    CHANGES_REQUESTED: "bg-orange-50 text-orange-700 border-orange-100",

    APPROVED: "bg-green-50 text-green-700 border-green-100",
    REJECTED: "bg-red-50 text-red-700 border-red-100",
  };

  const cls = styles[s] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium " +
        cls +
        (className ? ` ${className}` : "")
      }
    >
      {s || "-"}
    </span>
  );
}
