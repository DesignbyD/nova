import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "About",
  description: "NOVA makes a small range of everyday objects, designed to be looked at and made to last.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <Container className="py-12 sm:py-20">
        <h1 className="max-w-4xl text-display-xl font-semibold">A smaller, calmer way to own things.</h1>
        <p className="mt-10 max-w-2xl font-serif text-lead text-ink-soft">
          NOVA began with a simple frustration: most of what fills a home is forgettable the day it arrives. We wanted objects you
          notice once, then rely on for years.
        </p>
      </Container>

      <Container>
        <div className="relative aspect-[16/9] overflow-hidden rounded-panel bg-ink">
          <Image src="/art/editorial.jpg" alt="A slate tray, a notebook, a brass pen and a stone paperweight on a dark desk" fill sizes="100vw" className="object-cover" priority />
        </div>
      </Container>

      <Container className="section-y grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
        <h2 className="text-display-md font-semibold">How we work</h2>
        <div className="max-w-2xl space-y-6 font-serif text-lead text-ink-soft">
          <p>We design in small runs and keep the range deliberately short. Each season we reconsider every piece and retire anything that isn&apos;t earning its place.</p>
          <p>We choose materials that improve with use: stoneware that holds heat, brass that darkens, leather that softens, glass that catches the light. Where a material can&apos;t age well, we don&apos;t use it.</p>
          <p>Prices are fixed and plain. What you see is what the thing costs.</p>
        </div>
      </Container>

      <section className="bg-paper-deep">
        <Container className="flex flex-col items-start gap-6 py-14 sm:py-20">
          <h2 className="text-display-md font-semibold">See what we make.</h2>
          <ButtonLink href="/shop" variant="accent" size="lg">
            Shop the collection
          </ButtonLink>
        </Container>
      </section>
    </>
  );
}
