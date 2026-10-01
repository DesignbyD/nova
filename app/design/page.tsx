import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { DesignDemos } from "./DesignDemos";

export const metadata: Metadata = { title: "Design system", robots: { index: false, follow: false } };

// Rendered per request so the production guard below runs at runtime.
export const dynamic = "force-dynamic";

const colors = [
  ["paper", "bg-paper", "#EFF1EE"],
  ["paper-deep", "bg-paper-deep", "#E4E8E3"],
  ["surface", "bg-surface", "#FFFFFF"],
  ["ink", "bg-ink", "#1B2130"],
  ["muted", "bg-muted", "#576070"],
  ["line", "bg-line", "#D3D8D2"],
  ["edge", "bg-edge", "#868E84"],
  ["accent", "bg-accent", "#4A2FE0"],
  ["accent-soft", "bg-accent-soft", "#E8E4FC"],
  ["success", "bg-success", "#17663F"],
  ["warning", "bg-warning", "#7A4E00"],
  ["danger", "bg-danger", "#B0241C"],
] as const;

export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="text-display-lg font-semibold">Design system</h1>
      <p className="mt-4 max-w-xl font-serif text-lead text-ink-soft">
        Every shared token and component in one place. Development only: this route returns a 404 in production.
      </p>

      <section className="mt-16" aria-labelledby="colors">
        <h2 id="colors" className="text-title font-semibold">Colour</h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {colors.map(([name, cls, hex]) => (
            <li key={name}>
              <div className={`${cls} h-20 rounded-panel border border-line`} />
              <p className="mt-2 text-sm font-medium">{name}</p>
              <p className="text-sm tabular-nums text-muted">{hex}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16" aria-labelledby="type">
        <h2 id="type" className="text-title font-semibold">Typography</h2>
        <div className="mt-6 flex flex-col gap-8 border-t border-line pt-8">
          <p className="text-display-xl font-semibold">Display XL</p>
          <p className="text-display-lg font-semibold">Display large</p>
          <p className="text-display-md font-semibold">Display medium</p>
          <p className="text-title font-semibold">Title: the weight of an interface heading</p>
          <p className="max-w-prose font-serif text-lead text-ink-soft">
            Lead text is set in Newsreader. It is used for introductions and product descriptions, where a calmer,
            more editorial voice helps people read.
          </p>
          <p className="max-w-prose font-serif text-lg italic text-muted">Italic is available for emphasis and captions.</p>
          <p className="text-base">Body text in Bricolage Grotesque handles interface copy and labels.</p>
          <p className="text-sm text-muted">Small supporting text for hints, metadata and legal copy.</p>
        </div>
      </section>

      <DesignDemos />
    </Container>
  );
}
