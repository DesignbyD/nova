"use client";

import { useEffect, useState } from "react";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/types/catalog";
import { useCart } from "./CartProvider";

/** Compact add-to-cart for product tiles. Confirms in place, announces to screen readers, and never opens the drawer. */
export function QuickAdd({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(timer);
  }, [added]);

  if (soldOut) return null;

  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => {
          addItem(product, 1);
          setAdded(true);
        }}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-control px-4 text-sm font-medium shadow-lift transition-colors duration-150",
          added ? "bg-success text-white" : "bg-surface text-ink hover:bg-ink hover:text-paper",
        )}
      >
        {added ? <CheckIcon width={16} height={16} /> : <PlusIcon width={16} height={16} />}
        {added ? "Added" : "Add"}
        <span className="sr-only">{added ? `${product.name} added to cart` : `${product.name} to cart`}</span>
      </button>
    </div>
  );
}
