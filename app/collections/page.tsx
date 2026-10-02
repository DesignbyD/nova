import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/States";
import { categories } from "@/lib/catalog";
import { getCategoryCounts, listProducts } from "@/lib/services/products";

export const metadata: Metadata = {
  title: "Collections",
  description: "Four collections of everyday objects: lighting, tableware, desk and carry.",
  alternates: { canonical: "/collections" },
};
export const revalidate = 300;

export default async function CollectionsPage() {
  let counts: Record<string, number> = {};
  let covers: Record<string, { src: string; alt: string } | undefined> = {};
  try {
    counts = await getCategoryCounts();
    const all = await listProducts({});
    covers = Object.fromEntries(categories.map((c) => [c.slug, all.find((p) => p.category === c.slug)?.images[0]]));
  } catch {
    return (
      <Container className="py-16">
        <ErrorState title="Collections are unavailable" description="Please try again in a moment." />
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <header className="max-w-3xl">
        <h1 className="text-display-lg font-semibold">Collections</h1>
        <p className="mt-4 font-serif text-lead text-ink-soft">Four ways into the same idea: objects that earn their place.</p>
      </header>
      <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2">
        {categories.map((c, i) => (
          <li key={c.slug} className={i % 2 === 1 ? "sm:mt-16" : undefined}>
            <Link href={`/collections/${c.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-panel bg-paper-deep">
                {covers[c.slug] ? (
                  <Image src={covers[c.slug]!.src} alt={covers[c.slug]!.alt} fill sizes="(min-width: 640px) 50vw, 100vw" priority={i < 2} className="object-cover transition-transform duration-700 ease-nova group-hover:scale-[1.03]" />
                ) : null}
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <h2 className="text-display-md font-semibold">{c.name}</h2>
                <span className="text-sm text-muted tabular-nums">{counts[c.slug] ?? 0} pieces</span>
              </div>
              <p className="mt-2 max-w-md font-serif text-lg text-ink-soft">{c.tagline}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
