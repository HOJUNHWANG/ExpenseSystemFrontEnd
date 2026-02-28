import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(0, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible);
  if (end - start < maxVisible) start = Math.max(0, end - maxVisible);

  for (let i = start; i < end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4" role="navigation" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        aria-label="Previous page"
        className="p-1.5 rounded-lg border bg-card text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {start > 0 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(0)}
            aria-label="Page 1"
            className="min-w-[2rem] px-2 py-1 text-xs rounded-lg border bg-card text-muted-foreground hover:bg-accent"
          >
            1
          </button>
          {start > 1 && <span className="text-xs text-muted-foreground px-1" aria-hidden>...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-label={`Page ${p + 1}`}
          aria-current={p === page ? 'page' : undefined}
          className={
            'min-w-[2rem] px-2 py-1 text-xs rounded-lg border ' +
            (p === page
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground hover:bg-accent')
          }
        >
          {p + 1}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-xs text-muted-foreground px-1" aria-hidden>...</span>}
          <button
            type="button"
            onClick={() => onPageChange(totalPages - 1)}
            aria-label={`Page ${totalPages}`}
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
        aria-label="Next page"
        className="p-1.5 rounded-lg border bg-card text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
