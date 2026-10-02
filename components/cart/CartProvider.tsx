"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { cartItemCount, cartSubtotal, maxFor, parseStoredCart } from "@/lib/cart/reducer";
import { dispatchCart, getServerSnapshot, getSnapshot, subscribe } from "@/lib/cart/store";
import type { CartItem } from "@/lib/cart/types";
import type { Product } from "@/types/catalog";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  /** False on the server and during hydration, so the first browser paint matches the server HTML. */
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  replaceItems: (items: CartItem[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

const noopSubscribe = () => () => {};

export function CartProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [isOpen, setOpen] = useState(false);

  const items = useMemo(() => parseStoredCart(raw || null), [raw]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    dispatchCart({
      type: "add",
      quantity,
      item: {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0] ?? null,
        maxQuantity: maxFor(product.stock),
      },
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: cartItemCount(items),
      subtotal: cartSubtotal(items),
      hydrated,
      isOpen,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      addItem,
      setQuantity: (productId, quantity) => dispatchCart({ type: "setQuantity", productId, quantity }),
      removeItem: (productId) => dispatchCart({ type: "remove", productId }),
      clearCart: () => dispatchCart({ type: "clear" }),
      replaceItems: (next) => dispatchCart({ type: "replace", items: next }),
    }),
    [items, hydrated, isOpen, addItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
