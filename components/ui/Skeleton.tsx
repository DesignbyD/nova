import { cn } from "@/lib/utils/cn";

/** Placeholder block for loading states. Shape it with className. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-control bg-paper-deep", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div role="status" aria-label="Loading product" className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/5] w-full rounded-panel" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3.5 w-1/3" />
        </div>
        <Skeleton className="h-4 w-14" />
      </div>
    </div>
  );
}
