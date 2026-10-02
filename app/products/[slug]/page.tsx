import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ProductJsonLd } from "@/components/shop/ProductJsonLd";
import { PurchasePanel } from "@/components/shop/PurchasePanel";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { availability, getCategory } from "@/lib/catalog";
import { getAllSlugs, getProductBySlug, getRelatedProducts } from "@/lib/services/products";
import { formatPrice } from "@/lib/utils/format";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getAllSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await props.params).slug).catch(() => null);
  if (!product) return { title: "Product not found" };
  const image = product.images[0];
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name} | NOVA`,
      description: product.description.slice(0, 160),
      type: "website",
      images: image ? [{ url: image.src, width: 1000, height: 1250, alt: image.alt }] : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug); // a database failure reaches error.tsx; an unknown slug is a 404
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4).catch(() => []);
  const stock = availability(product);
  const category = getCategory(product.category);

  return (
    <Container className="py-8 sm:py-12">
      <ProductJsonLd product={product} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/shop" className="hover:text-ink">
          Shop
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/collections/${product.category}`} className="hover:text-ink">
          {category?.name ?? product.category}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:py-4">
          <p className="text-sm text-muted">{category?.name ?? product.category}</p>
          <h1 className="mt-2 text-display-lg font-semibold">{product.name}</h1>
          <div className="mt-5 flex items-center gap-4">
            <p className="text-title font-semibold tabular-nums">{formatPrice(product.price)}</p>
            <Badge tone={stock.state === "sold-out" ? "outline" : stock.state === "low" ? "warning" : "success"}>{stock.label}</Badge>
          </div>
          <p className="mt-8 max-w-xl font-serif text-lead text-ink-soft">{product.description}</p>
          <div className="mt-10 max-w-md border-t border-line pt-8">
            <PurchasePanel product={product} />
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-24" aria-labelledby="related">
          <h2 id="related" className="text-display-md font-semibold">
            You may also like
          </h2>
          <div className="mt-8">
            <ProductGrid products={related} eagerCount={0} />
          </div>
        </section>
      ) : null}
    </Container>
  );
}
