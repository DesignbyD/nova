"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { SearchIcon } from "@/components/ui/icons";
import { TextField } from "@/components/ui/Field";
import { headerAction } from "./headerStyles";

/** Header search. Submitting navigates to /shop?q=..., where the shop page searches real product data. */
export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string>();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Enter a product or category to search for.");
      return;
    }
    setError(undefined);
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <button type="button" className={headerAction} onClick={() => setOpen(true)} aria-label="Search">
        <SearchIcon />
        <span className="hidden lg:inline">Search</span>
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Search" align="top">
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
            Search products
          </Button>
        </form>
      </Dialog>
    </>
  );
}
