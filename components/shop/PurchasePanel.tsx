"use client";

import { useState } from "react";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { maxFor } from "@/lib/cart/reducer";
import type { Product } from "@/types/catalog";

/** Quantity + add to cart for the product page. Adding opens the cart so the result is visible. */
export function PurchasePanel({ product }: { product: Product }) {
  const { addItem, openCart, items } = useCart();
  const max = maxFor(product.stock);
  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const room = Math.max(0, max - inCart);
  const [quantity, setQuantity] = useState(1);

  if (max < 1)
    return (
      <div className="flex flex-col gap-3">
        <Button size="lg" fullWidth disabled>
          Sold out
        </Button>
        <p className="text-sm text-muted">This item is currently unavailable.</p>
      </div>
    );

  const shown = Math.min(Math.max(quantity, 1), Math.max(room, 1));

  return (
    <div className="flex flex-col gap-4">
      {room === 0 ? (
        <Alert tone="info">You have the most available of this item in your cart.</Alert>
      ) : (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Quantity</span>
          <QuantityStepper value={shown} max={room} onChange={setQuantity} label={`Quantity for ${product.name}`} />
        </div>
      )}
      <Button
        variant="accent"
        size="lg"
        fullWidth
        disabled={room === 0}
        onClick={() => {
          addItem(product, shown);
          setQuantity(1);
          openCart();
        }}
      >
        Add to cart
      </Button>
    </div>
  );
}
