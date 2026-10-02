import { cartReducer, parseStoredCart } from "./reducer";
import type { CartAction, CartItem } from "./types";

/**
 * Browser cart storage. localStorage is the single source of truth, exposed to React through
 * useSyncExternalStore: no load-then-save race, and other tabs stay in sync automatically.
 * If storage is blocked (some private modes) the cart falls back to memory for the visit.
 */
export const CART_STORAGE_KEY = "nova.cart.v1";

let memoryRaw = "";
const listeners = new Set<() => void>();

function read(): string {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY) ?? "";
  } catch {
    return memoryRaw;
  }
}

function write(raw: string) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, raw);
  } catch {
    memoryRaw = raw;
  }
  listeners.forEach((listener) => listener());
}

export function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export const getSnapshot = read;
export const getServerSnapshot = () => "";

export function dispatchCart(action: CartAction) {
  const items: CartItem[] = parseStoredCart(read() || null);
  write(JSON.stringify(cartReducer({ items }, action).items));
}
