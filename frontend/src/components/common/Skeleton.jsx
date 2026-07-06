import { classNames } from '../../utils/helpers';

export function Skeleton({ className, lines = 1 }) {
  if (lines > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={classNames(
              'skeleton-pulse rounded-lg',
              i === lines - 1 ? 'w-3/4' : 'w-full',
              'h-4'
            )}
          />
        ))}
      </div>
    );
  }

  return <div className={classNames('skeleton-pulse rounded-lg', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <Skeleton className="h-8 w-24 rounded" />
      <Skeleton className="h-4 w-32 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-6 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}
