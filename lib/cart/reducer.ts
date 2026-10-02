import { MAX_QUANTITY_PER_ITEM } from "@/lib/validation/checkout";
import { sumLines } from "@/lib/utils/money";
import type { CartAction, CartItem, CartState } from "./types";

export const emptyCart: CartState = { items: [] };

/** Quantities are whole numbers between 1 and the item's limit. Anything else is corrected, never stored. */
export function clampQuantity(value: number, max: number): number {
  const limit = Math.max(0, Math.min(Math.floor(max), MAX_QUANTITY_PER_ITEM));
  if (!Number.isFinite(value)) return Math.min(1, limit);
  return Math.max(Math.min(1, limit), Math.min(Math.floor(value), limit));
}

export function maxFor(stock: number): number {
  return Math.max(0, Math.min(Math.floor(stock), MAX_QUANTITY_PER_ITEM));
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      if (action.item.maxQuantity < 1) return state; // sold out: nothing to add
      const existing = state.items.find((i) => i.productId === action.item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === existing.productId
              ? { ...i, ...action.item, quantity: clampQuantity(i.quantity + action.quantity, action.item.maxQuantity) }
              : i,
          ),
        };
      }
      return {
        items: [...state.items, { ...action.item, quantity: clampQuantity(action.quantity, action.item.maxQuantity) }],
      };
    }
    case "setQuantity":
      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: clampQuantity(action.quantity, i.maxQuantity) } : i,
        ),
      };
    case "remove":
      return { items: state.items.filter((i) => i.productId !== action.productId) };
    case "clear":
      return emptyCart;
    case "replace":
      return { items: action.items };
  }
}

export const cartItemCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => sumLines(items);

/** Reads a stored cart defensively: corrupt or tampered data is dropped, never trusted. */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const items: CartItem[] = [];
    for (const entry of data) {
      const e = entry as Partial<CartItem>;
      if (
        typeof e?.productId !== "string" ||
        typeof e.slug !== "string" ||
        typeof e.name !== "string" ||
        typeof e.price !== "number" ||
        !Number.isFinite(e.price) ||
        e.price < 0 ||
        typeof e.maxQuantity !== "number" ||
        typeof e.quantity !== "number"
      )
        continue;
      const max = maxFor(e.maxQuantity);
      if (max < 1) continue;
      const image =
        e.image && typeof e.image.src === "string" && typeof e.image.alt === "string"
          ? { src: e.image.src, alt: e.image.alt }
          : null;
      items.push({
        productId: e.productId,
        slug: e.slug,
        name: e.name,
        price: e.price,
        image,
        maxQuantity: max,
        quantity: clampQuantity(e.quantity, max),
      });
    }
    return items.slice(0, 50);
  } catch {
    return [];
  }
}
