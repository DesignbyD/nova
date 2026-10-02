import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { SortSelect } from "@/components/shop/SortSelect";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SearchIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/States";
import { categories, categorySlugs, isSortKey } from "@/lib/catalog";
import { listProducts } from "@/lib/services/products";
import { cn } from "@/lib/utils/cn";
import { shopHref } from "@/lib/utils/shop-href";

export const metadata: Metadata = {
  title: "Shop",
  description: "Lighting, tableware, desk objects and bags: everything NOVA makes, in one place.",
  alternates: { canonical: "/shop" },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ShopPage(props: PageProps<"/shop">) {
  const sp = await props.searchParams;
  const q = one(sp.q)?.trim().slice(0, 60) || undefined;
  const rawCategory = one(sp.category);
  const category = rawCategory && categorySlugs.has(rawCategory) ? rawCategory : undefined;
  const sort = isSortKey(one(sp.sort)) ? (one(sp.sort) as never) : "featured";

  // Errors here are caught by app/shop/error.tsx, which offers a retry.
  const products = await listProducts({ q, category, sort });
  const filtered = Boolean(q || category);

  return (
    <Container className="py-10 sm:py-14">
      <header className="max-w-3xl">
        <h1 className="text-display-lg font-semibold">{q ? `Results for “${q}”` : "Shop"}</h1>
        <p className="mt-4 font-serif text-lead text-ink-soft">
          {q ? "Search across everything NOVA makes." : "Fewer, better objects for the quiet parts of the day."}
        </p>
      </header>

      <div className="mt-10 flex flex-col gap-6 border-y border-line py-5 lg:flex-row lg:items-center lg:justify-between">
        <form action="/shop" role="search" className="flex w-full max-w-md gap-2">
          {category ? <input type="hidden" name="category" value={category} /> : null}
          {sort !== "featured" ? <input type="hidden" name="sort" value={sort} /> : null}
          <label htmlFor="shop-q" className="sr-only">
            Search products
          </label>
          <input
            id="shop-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search products"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-control border border-edge bg-surface px-3.5 text-[0.9375rem] placeholder:text-muted/80 hover:border-ink focus-visible:outline-offset-0"
          />
          <button type="submit" aria-label="Search" className="inline-flex size-11 items-center justify-center rounded-control bg-ink text-paper hover:bg-ink-soft">
            <SearchIcon />
          </button>
        </form>
        <SortSelect q={q} category={category} sort={sort} />
      </div>

      <nav aria-label="Filter by category" className="mt-5 flex flex-wrap gap-2">
        {[{ slug: undefined, name: "All" }, ...categories].map((c) => {
          const active = c.slug === category;
          return (
            <Link
              key={c.slug ?? "all"}
              href={shopHref({ q, category: c.slug, sort })}
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex h-11 items-center rounded-full border px-5 text-[0.9375rem] font-medium transition-colors",
                active ? "border-ink bg-ink text-paper" : "border-edge bg-surface hover:border-ink",
              )}
            >
              {c.name}
            </Link>
          );
        })}
      </nav>

      <p className="mt-8 text-sm text-muted" role="status" aria-live="polite">
        {products.length} {products.length === 1 ? "product" : "products"}
      </p>

      <div className="mt-6">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            title={q ? `Nothing matches “${q}”` : "Nothing here yet"}
            description={filtered ? "Try a different word, or browse everything we make." : "New pieces are on the way."}
            action={filtered ? <ButtonLink href="/shop" variant="secondary">Clear search and filters</ButtonLink> : undefined}
          />
        )}
      </div>
    </Container>
  );
}
