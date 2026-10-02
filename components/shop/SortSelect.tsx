"use client";

import { useRouter } from "next/navigation";
import { sortOptions } from "@/lib/catalog";
import { shopHref } from "@/lib/utils/shop-href";
import type { SortKey } from "@/types/catalog";

export function SortSelect({ q, category, sort }: { q?: string; category?: string; sort: SortKey }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sort" className="text-sm text-muted">
        Sort by
      </label>
      <select
        id="sort"
        value={sort}
        onChange={(e) => router.push(shopHref({ q, category, sort: e.target.value as SortKey }))}
        className="h-11 rounded-control border border-edge bg-surface px-3 text-[0.9375rem] hover:border-ink"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
