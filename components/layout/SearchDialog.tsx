"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { SearchIcon } from "@/components/ui/icons";
import { TextField } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { formatPrice } from "@/lib/utils/format";
import { shopHref } from "@/lib/utils/shop-href";
import { headerAction } from "./headerStyles";

type Result = { slug: string; name: string; category: string; price: number; image: { src: string; alt: string } | null; soldOut: boolean };
type Lookup = { q: string; status: "ok" | "error"; results: Result[] };

/** Header search: instant suggestions from real product data; Enter opens the full results page. */
export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string>();
  const [lookup, setLookup] = useState<Lookup | null>(null);

  const trimmed = query.trim();
  const searching = trimmed.length >= 2;

  // Debounced lookup. State is only set from the async callback, and only for the query that is still current.
  useEffect(() => {
    if (!open || trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { results: Result[] };
        setLookup({ q: trimmed, status: "ok", results: data.results });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setLookup({ q: trimmed, status: "error", results: [] });
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, open]);

  const current = lookup && lookup.q === trimmed ? lookup : null;
  const close = () => setOpen(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!trimmed) {
      setError("Enter a product or category to search for.");
      return;
    }
    close();
    router.push(shopHref({ q: trimmed }));
  }

  return (
    <>
      <button type="button" className={headerAction} onClick={() => setOpen(true)} aria-label="Search">
        <SearchIcon />
        <span className="hidden lg:inline">Search</span>
      </button>
      <Dialog open={open} onClose={close} title="Search" align="top">
        <form onSubmit={onSubmit} role="search" noValidate className="flex flex-col gap-4">
          <TextField
            label="What are you looking for?"
            name="q"
            type="search"
            autoComplete="off"
            autoFocus
            value={query}
            error={error}
            onChange={(e) => {
              setQuery(e.target.value);
              if (error) setError(undefined);
            }}
          />
          <Button type="submit" variant="accent" size="lg" fullWidth>
            See all results
          </Button>
        </form>

        <div className="mt-6 min-h-6" aria-live="polite">
          {searching && !current ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Spinner className="size-4" /> Searching
            </p>
          ) : null}
          {current?.status === "error" ? <p className="text-sm text-danger">Search is unavailable right now. Press Enter to try the full search.</p> : null}
          {current?.status === "ok" && current.results.length === 0 ? (
            <p className="text-sm text-muted">No products match “{current.q}”. Try another word.</p>
          ) : null}
          {current?.status === "ok" && current.results.length > 0 ? (
            <ul className="divide-y divide-line">
              {current.results.map((r) => (
                <li key={r.slug}>
                  <Link href={`/products/${r.slug}`} onClick={close} className="flex items-center gap-4 py-3 hover:text-accent">
                    <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-control bg-paper-deep">
                      {r.image ? <Image src={r.image.src} alt="" fill sizes="56px" className="object-cover" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{r.name}</span>
                      <span className="block text-sm text-muted">{r.soldOut ? "Sold out" : r.category}</span>
                    </span>
                    <span className="tabular-nums">{formatPrice(r.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Dialog>
    </>
  );
}
