export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-foreground/10 ${className}`} />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  const widthPattern = ["w-20", "w-24", "w-28", "w-32", "w-16", "w-36", "w-24"];
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border-light overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted border-b border-border">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="text-start px-4 py-3">
                <Skeleton className="h-3.5 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border-light">
              {Array.from({ length: cols }).map((_, j) => {
                const widthClass = widthPattern[(i + j) % widthPattern.length];
                return (
                  <td key={j} className="px-4 py-4">
                    <Skeleton className={`h-3.5 ${widthClass}`} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DocumentsSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border-light">
      <Skeleton className="h-5 w-36 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="border border-border rounded-lg p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="border border-border rounded-lg p-4">
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      <div className="border border-border rounded-lg p-4">
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
