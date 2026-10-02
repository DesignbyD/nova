export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  /** Last known price, for display. The server re-prices the order. */
  price: number;
  image: { src: string; alt: string } | null;
  quantity: number;
  /** Most the shopper can add: the lower of current stock and the per-item limit. */
  maxQuantity: number;
};

export type CartState = { items: CartItem[] };

export type CartAction =
  | { type: "add"; item: Omit<CartItem, "quantity">; quantity: number }
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" }
  | { type: "replace"; items: CartItem[] };
