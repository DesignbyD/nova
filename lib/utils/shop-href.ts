import type { SortKey } from "@/types/catalog";

/** Builds /shop URLs that keep the active search, category and sort. */
export function shopHref(params: { q?: string; category?: string; sort?: SortKey }): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.sort && params.sort !== "featured") search.set("sort", params.sort);
  const query = search.toString();
  return query ? `/shop?${query}` : "/shop";
}
