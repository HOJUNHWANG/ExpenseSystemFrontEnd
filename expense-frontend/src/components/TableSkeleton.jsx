import { Skeleton } from "@/components/ui/skeleton";

export default function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              className="h-4"
              style={{ width: `${Math.floor(60 + Math.random() * 80)}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
