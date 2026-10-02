"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { formatPrice } from "@/lib/utils/format";
import { QuantityStepper } from "./QuantityStepper";
import { useCart } from "./CartProvider";

/** Cart drawer: a side panel on larger screens, full-screen on phones. */
export function CartDrawer() {
  const { items, itemCount, subtotal, hydrated, isOpen, closeCart, setQuantity, removeItem, clearCart } = useCart();

  const footer =
    items.length > 0 ? (
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Subtotal</span>
          <span className="text-title font-semibold tabular-nums">{formatPrice(subtotal)}</span>
        </div>
        <ButtonLink href="/checkout" variant="accent" size="lg" fullWidth onClick={closeCart}>
          Checkout
        </ButtonLink>
        <Button variant="link" className="self-center text-sm text-muted" onClick={clearCart}>
          Clear cart
        </Button>
      </div>
    ) : undefined;

  return (
    <Drawer
      open={isOpen}
      onClose={closeCart}
      title="Your cart"
      description={hydrated && itemCount > 0 ? `${itemCount} ${itemCount === 1 ? "item" : "items"}` : undefined}
      footer={footer}
    >
      {!hydrated ? (
        <div className="flex flex-col gap-6" role="status" aria-label="Loading your cart">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-24 w-20 shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Find something you'll keep for years."
          className="py-12"
          action={
            <ButtonLink href="/shop" onClick={closeCart}>
              Browse the shop
            </ButtonLink>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-4 py-5 first:pt-0">
              <Link href={`/products/${item.slug}`} onClick={closeCart} className="shrink-0">
                <div className="relative h-24 w-20 overflow-hidden rounded-control bg-paper-deep">
                  {item.image ? <Image src={item.image.src} alt={item.image.alt} fill sizes="80px" loading="eager" className="object-cover" /> : null}
                </div>
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/products/${item.slug}`} onClick={closeCart} className="font-medium leading-snug hover:text-accent">
                    {item.name}
                  </Link>
                  <p className="shrink-0 font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <QuantityStepper
                    size="sm"
                    value={item.quantity}
                    max={item.maxQuantity}
                    label={`Quantity for ${item.name}`}
                    onChange={(q) => setQuantity(item.productId, q)}
                  />
                  <Button variant="link" size="sm" className="text-sm text-muted" onClick={() => removeItem(item.productId)} aria-label={`Remove ${item.name} from cart`}>
                    Remove
                  </Button>
                </div>
                {item.quantity >= item.maxQuantity ? <p className="text-xs text-muted">That&apos;s the most available per order.</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
