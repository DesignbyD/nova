"use server";

import { logError } from "@/lib/logger";
import { getProductsByIds } from "@/lib/services/products";
import { validateOrderLines } from "@/lib/validation/checkout";

export type VerifiedProduct = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  image: { src: string; alt: string } | null;
};

/**
 * Looks up the current price and stock of everything in the cart, from the catalog.
 * The checkout page uses this so shoppers see real prices before they order (the order itself is re-priced again).
 */
export async function verifyCart(lines: unknown): Promise<{ ok: true; products: VerifiedProduct[] } | { ok: false; error: string }> {
  const parsed = validateOrderLines(lines);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  try {
    const products = await getProductsByIds(parsed.lines.map((l) => l.productId));
    return {
      ok: true,
      products: products.map((p) => ({ productId: p.id, slug: p.slug, name: p.name, price: p.price, stock: p.stock, image: p.images[0] ?? null })),
    };
  } catch (error) {
    logError("checkout.verify", error);
    return { ok: false, error: "We couldn't check your cart." };
  }
}
