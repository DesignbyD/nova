import { categorySlugs, localProducts } from "@/lib/catalog";
import { isSupabaseConfigured, shouldUseLocalCatalog } from "@/lib/env";
import { logError } from "@/lib/logger";
import { createPublicClient } from "@/lib/supabase/public";
import type { Product, SortKey } from "@/types/catalog";

export type ProductQuery = {
  q?: string;
  category?: string;
  sort?: SortKey;
  featured?: boolean;
  limit?: number;
  excludeId?: string;
};

export class CatalogUnavailableError extends Error {
  constructor(message = "The catalog is unavailable.") {
    super(message);
    this.name = "CatalogUnavailableError";
  }
}

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number | string;
  category: string;
  stock: number;
  featured: boolean;
  badge: string | null;
  images: unknown;
  created_at: string;
};

function rowToProduct(row: Row): Product {
  const images = Array.isArray(row.images)
    ? (row.images as Array<{ src?: unknown; alt?: unknown }>)
        .filter((i) => typeof i?.src === "string")
        .map((i) => ({ src: String(i.src), alt: typeof i.alt === "string" ? i.alt : row.name }))
    : [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    stock: row.stock,
    featured: row.featured,
    badge: row.badge,
    images,
    createdAt: row.created_at,
  };
}

/** Strips characters that have meaning in PostgREST filters or LIKE patterns, then splits into words. */
export function searchTerms(q: string | undefined): string[] {
  if (!q) return [];
  return q
    .slice(0, 60)
    .replace(/[%_,()*"\\:.]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);
}

/** Pure filter/sort used for the bundled catalog (and as the reference behaviour for the database query). */
export function applyQuery(products: Product[], query: ProductQuery): Product[] {
  const terms = searchTerms(query.q).map((t) => t.toLowerCase());
  let list = products.filter((p) => {
    if (query.category && p.category !== query.category) return false;
    if (query.featured !== undefined && p.featured !== query.featured) return false;
    if (query.excludeId && p.id === query.excludeId) return false;
    const haystack = `${p.name} ${p.category} ${p.description}`.toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
  const sort = query.sort ?? "featured";
  list = [...list].sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      case "newest":
        return b.createdAt.localeCompare(a.createdAt);
      default:
        return Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt);
    }
  });
  return query.limit ? list.slice(0, query.limit) : list;
}

function ensureAvailable() {
  if (shouldUseLocalCatalog()) return "local" as const;
  if (!isSupabaseConfigured()) throw new CatalogUnavailableError("Supabase is not configured.");
  return "supabase" as const;
}

export async function listProducts(query: ProductQuery = {}): Promise<Product[]> {
  if (ensureAvailable() === "local") return applyQuery(localProducts, query);

  const category = query.category && categorySlugs.has(query.category) ? query.category : undefined;
  if (query.category && !category) return [];

  let request = createPublicClient().from("products").select("*");
  if (category) request = request.eq("category", category);
  if (query.featured !== undefined) request = request.eq("featured", query.featured);
  if (query.excludeId) request = request.neq("id", query.excludeId);
  // Each .or() is ANDed, so every word in the search has to match somewhere.
  for (const term of searchTerms(query.q)) {
    request = request.or(`name.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`);
  }
  switch (query.sort ?? "featured") {
    case "price-asc":
      request = request.order("price", { ascending: true });
      break;
    case "price-desc":
      request = request.order("price", { ascending: false });
      break;
    case "name":
      request = request.order("name", { ascending: true });
      break;
    case "newest":
      request = request.order("created_at", { ascending: false });
      break;
    default:
      request = request.order("featured", { ascending: false }).order("created_at", { ascending: false });
  }
  if (query.limit) request = request.limit(query.limit);

  const { data, error } = await request;
  if (error) {
    logError("catalog.list", error);
    throw new CatalogUnavailableError();
  }
  return (data as Row[]).map(rowToProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (ensureAvailable() === "local") return localProducts.find((p) => p.slug === slug) ?? null;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const { data, error } = await createPublicClient().from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) {
    logError("catalog.bySlug", error);
    throw new CatalogUnavailableError();
  }
  return data ? rowToProduct(data as Row) : null;
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const sameCategory = await listProducts({ category: product.category, excludeId: product.id, limit });
  if (sameCategory.length >= limit) return sameCategory;
  const others = await listProducts({ excludeId: product.id, limit: limit * 2 });
  const seen = new Set(sameCategory.map((p) => p.id));
  return [...sameCategory, ...others.filter((p) => p.category !== product.category && !seen.has(p.id))].slice(0, limit);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  if (ensureAvailable() === "local") return localProducts.filter((p) => ids.includes(p.id));
  const { data, error } = await createPublicClient().from("products").select("*").in("id", ids);
  if (error) {
    logError("catalog.byIds", error);
    throw new CatalogUnavailableError();
  }
  return (data as Row[]).map(rowToProduct);
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const all = await listProducts({});
  return all.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + 1 }), {});
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    return (await listProducts({})).map((p) => p.slug);
  } catch {
    return [];
  }
}
