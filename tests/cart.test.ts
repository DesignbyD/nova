import { describe, expect, it } from "vitest";
import { cartItemCount, cartReducer, cartSubtotal, clampQuantity, emptyCart, parseStoredCart } from "@/lib/cart/reducer";
import type { CartState } from "@/lib/cart/types";

const lamp = { productId: "p1", slug: "lamp", name: "Lamp", price: 148, image: null, maxQuantity: 5 };
const pen = { productId: "p2", slug: "pen", name: "Pen", price: 0.1, image: null, maxQuantity: 10 };

describe("cartReducer", () => {
  it("adds a new item", () => {
    const s = cartReducer(emptyCart, { type: "add", item: lamp, quantity: 2 });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].quantity).toBe(2);
  });
  it("increases quantity when adding an existing item, capped at its max", () => {
    let s = cartReducer(emptyCart, { type: "add", item: lamp, quantity: 3 });
    s = cartReducer(s, { type: "add", item: lamp, quantity: 4 });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].quantity).toBe(5);
  });
  it("never adds a sold-out item", () => {
    expect(cartReducer(emptyCart, { type: "add", item: { ...lamp, maxQuantity: 0 }, quantity: 1 })).toEqual(emptyCart);
  });
  it("clamps invalid quantities", () => {
    let s = cartReducer(emptyCart, { type: "add", item: lamp, quantity: 1 });
    s = cartReducer(s, { type: "setQuantity", productId: "p1", quantity: 0 });
    expect(s.items[0].quantity).toBe(1);
    s = cartReducer(s, { type: "setQuantity", productId: "p1", quantity: 99 });
    expect(s.items[0].quantity).toBe(5);
    s = cartReducer(s, { type: "setQuantity", productId: "p1", quantity: 2.7 });
    expect(s.items[0].quantity).toBe(2);
    s = cartReducer(s, { type: "setQuantity", productId: "p1", quantity: NaN });
    expect(s.items[0].quantity).toBe(1);
  });
  it("removes and clears", () => {
    let s: CartState = cartReducer(emptyCart, { type: "add", item: lamp, quantity: 1 });
    s = cartReducer(s, { type: "add", item: pen, quantity: 1 });
    s = cartReducer(s, { type: "remove", productId: "p1" });
    expect(s.items.map((i) => i.productId)).toEqual(["p2"]);
    expect(cartReducer(s, { type: "clear" })).toEqual(emptyCart);
  });
  it("totals correctly without floating point drift", () => {
    let s = cartReducer(emptyCart, { type: "add", item: pen, quantity: 3 });
    s = cartReducer(s, { type: "add", item: lamp, quantity: 1 });
    expect(cartItemCount(s.items)).toBe(4);
    expect(cartSubtotal(s.items)).toBe(148.3);
  });
});

describe("clampQuantity", () => {
  it("handles edge cases", () => {
    expect(clampQuantity(5, 3)).toBe(3);
    expect(clampQuantity(-4, 3)).toBe(1);
    expect(clampQuantity(Infinity, 3)).toBe(1);
    expect(clampQuantity(2, 0)).toBe(0);
    expect(clampQuantity(50, 99)).toBe(10);
  });
});

describe("parseStoredCart", () => {
  const valid = { ...lamp, quantity: 2, image: { src: "/a.jpg", alt: "a" } };
  it("round-trips a valid cart", () => {
    expect(parseStoredCart(JSON.stringify([valid]))).toEqual([valid]);
  });
  it("drops corrupt JSON, wrong shapes and sold-out lines", () => {
    expect(parseStoredCart("{not json")).toEqual([]);
    expect(parseStoredCart(JSON.stringify({ a: 1 }))).toEqual([]);
    expect(parseStoredCart(JSON.stringify([{ productId: 1 }, { ...valid, price: -5 }, { ...valid, maxQuantity: 0 }]))).toEqual([]);
    expect(parseStoredCart(null)).toEqual([]);
  });
  it("clamps tampered quantities", () => {
    expect(parseStoredCart(JSON.stringify([{ ...valid, quantity: 9999 }]))[0].quantity).toBe(5);
    expect(parseStoredCart(JSON.stringify([{ ...valid, quantity: -3 }]))[0].quantity).toBe(1);
  });
});
