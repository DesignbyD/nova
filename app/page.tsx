import Link from "next/link";
import { Container } from "@/components/ui/Container";

// Temporary page. The real homepage is built in Phase 3.
export default function Home() {
  return (
    <Container className="section-y">
      <h1 className="max-w-4xl text-display-xl font-semibold">NOVA</h1>
      <p className="mt-8 max-w-xl font-serif text-lead text-ink-soft">
        The design system and global layout are in place. The storefront is built next.
      </p>
      {process.env.NODE_ENV !== "production" ? (
        <p className="mt-6 text-sm text-muted">
          Development only:{" "}
          <Link href="/design" className="underline underline-offset-4 hover:text-accent">
            view the design system
          </Link>
        </p>
      ) : null}
    </Container>
  );
}
