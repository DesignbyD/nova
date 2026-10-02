import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/States";
import { NewsletterForm } from "./NewsletterForm";
import { categories } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils/format";
import type { Product } from "@/types/catalog";

export function FeaturedCollection({ products, failed }: { products: Product[]; failed: boolean }) {
  return (
    <section aria-labelledby="featured-title" className="section-y border-t border-line">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="featured-title" className="text-display-md font-semibold">
              Featured this season
            </h2>
            <p className="mt-3 max-w-md font-serif text-lg text-ink-soft">The pieces we reach for first.</p>
          </div>
          <ButtonLink href="/shop" variant="link">
            View all products
          </ButtonLink>
        </div>
        <div className="mt-10">
          {failed ? <ErrorState title="We couldn't load products" description="Please refresh the page to try again." /> : <ProductGrid products={products} eagerCount={0} />}
        </div>
      </Container>
    </section>
  );
}

export function ProductShowcase({ product }: { product: Product }) {
  const image = product.images[1] ?? product.images[0];
  return (
    <section aria-labelledby="showcase-title" className="bg-paper-deep">
      <Container className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-20 lg:py-24">
        <Link href={`/products/${product.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-panel bg-ink">
          {image ? (
            <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover transition-transform duration-700 ease-nova group-hover:scale-[1.03]" />
          ) : null}
        </Link>
        <div className="max-w-lg">
          <p className="text-sm font-medium text-accent-deep">In focus</p>
          <h2 id="showcase-title" className="mt-3 text-display-lg font-semibold">
            {product.name}
          </h2>
          <p className="mt-6 font-serif text-lead text-ink-soft">{product.description}</p>
          <p className="mt-8 text-title font-semibold tabular-nums">{formatPrice(product.price)}</p>
          <div className="mt-8">
            <ButtonLink href={`/products/${product.slug}`} variant="primary" size="lg">
              See the {product.name.split(" ")[0]}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function EditorialStory() {
  return (
    <section aria-labelledby="story-title" className="bg-ink text-paper">
      <Container className="grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:py-24">
        <div className="relative aspect-[16/10] overflow-hidden rounded-panel">
          <Image src="/art/editorial.jpg" alt="A slate tray, a notebook, a brass pen and a stone paperweight on a dark desk" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
        </div>
        <div>
          <h2 id="story-title" className="text-display-md font-semibold">
            We make fewer things, and we make them last longer.
          </h2>
          <p className="mt-6 max-w-md font-serif text-lead text-paper/80">
            A good object does its job quietly for years. NOVA starts from that idea: honest materials, a shape you could draw
            from memory, and nothing added for show.
          </p>
          <Link href="/about" className="mt-8 inline-block underline decoration-paper/40 underline-offset-[6px] hover:decoration-paper">
            Read our story
          </Link>
        </div>
      </Container>
    </section>
  );
}

const values = [
  { title: "Fewer, better", text: "A small range, reconsidered each season. If it isn't good enough to keep, we don't make it." },
  { title: "Honest materials", text: "Stoneware, glass, brass, canvas and leather. Materials that age well and say what they are." },
  { title: "Made to be seen", text: "Every piece is designed to sit in plain view, and to look better the longer it's there." },
  { title: "Clear, fixed prices", text: "One price for each thing. No codes, no inflated originals, no countdown clocks." },
];

export function Values() {
  return (
    <section aria-labelledby="values-title" className="section-y">
      <Container>
        <h2 id="values-title" className="max-w-xl text-display-md font-semibold">
          What we hold to
        </h2>
        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <li key={v.title} className="border-t border-ink pt-5">
              <h3 className="text-title font-semibold">{v.title}</h3>
              <p className="mt-3 font-serif text-lg text-ink-soft">{v.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function FeaturedCategories({ covers, counts }: { covers: Record<string, { src: string; alt: string } | undefined>; counts: Record<string, number> }) {
  return (
    <section aria-labelledby="categories-title" className="section-y border-t border-line pt-0 sm:pt-0">
      <Container className="pt-16 sm:pt-24">
        <h2 id="categories-title" className="text-display-md font-semibold">
          Explore the collections
        </h2>
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/collections/${c.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-panel bg-paper-deep">
                  {covers[c.slug] ? (
                    <Image src={covers[c.slug]!.src} alt="" fill sizes="(min-width: 1024px) 22vw, 50vw" className="object-cover transition-transform duration-700 ease-nova group-hover:scale-[1.04]" />
                  ) : null}
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <h3 className="font-medium group-hover:text-accent">{c.name}</h3>
                  {counts[c.slug] ? <span className="text-sm text-muted tabular-nums">{counts[c.slug]}</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function NewsletterSection() {
  return (
    <section aria-labelledby="newsletter-title" className="bg-accent-soft">
      <Container className="grid gap-8 py-14 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-20">
        <div>
          <h2 id="newsletter-title" className="text-display-md font-semibold text-accent-deep">
            New pieces, once in a while.
          </h2>
          <p className="mt-4 max-w-md font-serif text-lead text-ink-soft">A short note when something new arrives. Nothing else, and never more than we have to say.</p>
        </div>
        <NewsletterForm />
      </Container>
    </section>
  );
}
