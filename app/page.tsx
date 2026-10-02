import { Hero } from "@/components/home/Hero";
import { EditorialStory, FeaturedCategories, FeaturedCollection, NewsletterSection, ProductShowcase, Values } from "@/components/home/Sections";
import { categories } from "@/lib/catalog";
import { getCategoryCounts, getProductBySlug, listProducts } from "@/lib/services/products";
import type { Product } from "@/types/catalog";

export const revalidate = 300;

export default async function Home() {
  let featured: Product[] = [];
  let showcase: Product | null = null;
  let counts: Record<string, number> = {};
  let covers: Record<string, { src: string; alt: string } | undefined> = {};
  let failed = false;

  try {
    const all = await listProducts({});
    featured = all.filter((p) => p.featured).slice(0, 4);
    showcase = await getProductBySlug("halo-table-lamp");
    counts = await getCategoryCounts();
    covers = Object.fromEntries(categories.map((c) => [c.slug, all.find((p) => p.category === c.slug)?.images[0]]));
  } catch {
    // The page still renders its editorial sections; product sections show a retryable state.
    failed = true;
  }

  return (
    <>
      <Hero spotlight={showcase ?? undefined} />
      <FeaturedCollection products={featured} failed={failed} />
      {showcase ? <ProductShowcase product={showcase} /> : null}
      <EditorialStory />
      <Values />
      <FeaturedCategories covers={covers} counts={counts} />
      <NewsletterSection />
    </>
  );
}
