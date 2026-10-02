import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { NovaStar } from "@/components/ui/NovaStar";
import { formatPrice } from "@/lib/utils/format";
import type { Product } from "@/types/catalog";

export function Hero({ spotlight }: { spotlight?: Product }) {
  return (
    <section aria-labelledby="hero-title" className="overflow-hidden">
      <Container className="grid items-center gap-12 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-accent-deep">
            <NovaStar className="size-3.5 text-accent" />
            Lighting, tableware, desk and carry
          </p>
          <h1 id="hero-title" className="mt-6 text-display-xl font-semibold">
            Objects for the quiet hours.
          </h1>
          <p className="mt-8 max-w-lg font-serif text-lead text-ink-soft">
            NOVA makes a small number of everyday things, in small runs, and makes each one to be looked at and kept. Less to
            choose from, more reason to choose it.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <ButtonLink href="/shop" variant="accent" size="lg">
              Shop the collection
            </ButtonLink>
            <ButtonLink href="/about" variant="link">
              Our story
            </ButtonLink>
          </div>
        </div>

        <div className="relative lg:ml-auto lg:w-full lg:max-w-xl">
          <div className="relative aspect-[4/5] overflow-hidden rounded-panel bg-paper-deep">
            <Image
              src="/art/hero.jpg"
              alt="A still life of a glowing ring lamp, a navy notebook, a glass carafe and two stoneware cups"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          {spotlight ? (
            <Link
              href={`/products/${spotlight.slug}`}
              className="absolute -bottom-5 left-4 flex items-center gap-4 rounded-panel bg-surface p-3 pr-6 shadow-lift transition-shadow hover:shadow-overlay sm:-left-8"
            >
              <span className="relative size-16 shrink-0 overflow-hidden rounded-control bg-paper-deep">
                {spotlight.images[0] ? <Image src={spotlight.images[0].src} alt="" fill sizes="64px" className="object-cover" /> : null}
              </span>
              <span>
                <span className="block text-sm text-muted">Now available</span>
                <span className="block font-medium">{spotlight.name}</span>
                <span className="block text-sm tabular-nums">{formatPrice(spotlight.price)}</span>
              </span>
            </Link>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
