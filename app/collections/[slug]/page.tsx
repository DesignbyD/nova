import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { Container } from "@/components/ui/Container";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { categories, getCategory } from "@/lib/catalog";
import { listProducts } from "@/lib/services/products";
import type { Product } from "@/types/catalog";

export const revalidate = 300;

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const category = getCategory((await props.params).slug);
  if (!category) return { title: "Collection not found" };
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/collections/${category.slug}` },
    openGraph: { title: `${category.name} | NOVA`, description: category.description },
  };
}

export default async function CollectionPage(props: PageProps<"/collections/[slug]">) {
  const category = getCategory((await props.params).slug);
  if (!category) notFound();

  let products: Product[] = [];
  try {
    products = await listProducts({ category: category.slug });
  } catch {
    return (
      <Container className="py-16">
        <ErrorState title="We couldn't load this collection" description="Please try again in a moment." />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/collections" className="hover:text-ink">
          Collections
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{category.name}</span>
      </nav>
      <header className="mt-6 max-w-3xl">
        <h1 className="text-display-lg font-semibold">{category.name}</h1>
        <p className="mt-4 font-serif text-lead text-ink-soft">{category.description}</p>
      </header>
      <div className="mt-12">
        {products.length ? <ProductGrid products={products} /> : <EmptyState title="Nothing here yet" description="New pieces are on the way." />}
      </div>
    </Container>
  );
}
