import raw from "@/data/catalog.json";
import type { Category, Product, SortKey } from "@/types/catalog";

/** Collections. Each collection is a product category with its own editorial copy. */
export const categories: Category[] = raw.categories;

export const categorySlugs = new Set(categories.map((c) => c.slug));

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name" },
];

export const isSortKey = (value: unknown): value is SortKey => sortOptions.some((o) => o.value === value);

/** The bundled catalog, shaped like database products. Used for local development and tests. */
export const localProducts: Product[] = raw.products.map((p, index) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description,
  price: p.price,
  category: p.category,
  stock: p.stock,
  featured: p.featured,
  badge: p.badge,
  images: p.images,
  createdAt: new Date(Date.UTC(2026, 8, 1) - index * 86_400_000).toISOString(),
}));

export type Availability = { state: "in-stock" | "low" | "sold-out"; label: string };

export function availability(product: Pick<Product, "stock">): Availability {
  if (product.stock <= 0) return { state: "sold-out", label: "Sold out" };
  if (product.stock <= 5) return { state: "low", label: `Only ${product.stock} left` };
  return { state: "in-stock", label: "In stock" };
}
