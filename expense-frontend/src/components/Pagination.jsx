import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(0, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible);
  if (end - start < maxVisible) start = Math.max(0, end - maxVisible);

  for (let i = start; i < end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="p-1.5 rounded-lg border bg-card text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {start > 0 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(0)}
            className="min-w-[2rem] px-2 py-1 text-xs rounded-lg border bg-card text-muted-foreground hover:bg-accent"
          >
            1
          </button>
          {start > 1 && <span className="text-xs text-muted-foreground px-1">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={
            "min-w-[2rem] px-2 py-1 text-xs rounded-lg border " +
            (p === page
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground hover:bg-accent")
          }
        >
          {p + 1}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-xs text-muted-foreground px-1">...</span>}
          <button
            type="button"
            onClick={() => onPageChange(totalPages - 1)}
            className="min-w-[2rem] px-2 py-1 text-xs rounded-lg border bg-card text-muted-foreground hover:bg-accent"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="p-1.5 rounded-lg border bg-card text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
