"use client";

import { useCart } from "@/components/cart/CartProvider";
import { BagIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { headerAction } from "./headerStyles";

/** Header cart control with the live item count. Opens the cart drawer. */
export function CartButton() {
  const { itemCount, hydrated, openCart, isOpen } = useCart();
  const count = hydrated ? itemCount : 0;
  const label = count === 1 ? "1 item" : `${count} items`;

  return (
    <button type="button" onClick={openCart} className={headerAction} aria-label={`Cart, ${label}`} aria-haspopup="dialog" aria-expanded={isOpen}>
      <BagIcon />
      <span className="hidden lg:inline">Cart</span>
      {/* key remounts the badge when the count changes, replaying the small pop animation */}
      <span
        key={count}
        aria-hidden="true"
        className={cn(
          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
          count > 0 ? "nova-pop bg-accent text-white" : "border border-edge text-muted",
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
}
