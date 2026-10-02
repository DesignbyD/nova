/**
 * Checkout validation, shared by the browser (instant feedback) and the server (the real check).
 * Hand-written on purpose: the rules are small and this avoids a dependency.
 */
export const MAX_QUANTITY_PER_ITEM = 10;
export const MAX_LINE_ITEMS = 50;

export type CustomerInput = { fullName: string; email: string; phone: string; address: string; city: string };
export type CustomerErrors = Partial<Record<keyof CustomerInput, string>>;
export type OrderLine = { productId: string; quantity: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^\+?[0-9\s().-]+$/;

export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

const clean = (value: unknown): string => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

export function validateCustomer(
  input: Partial<Record<keyof CustomerInput, unknown>>,
): { ok: true; data: CustomerInput } | { ok: false; errors: CustomerErrors } {
  const data: CustomerInput = {
    fullName: clean(input.fullName),
    email: clean(input.email).toLowerCase(),
    phone: clean(input.phone),
    address: clean(input.address),
    city: clean(input.city),
  };
  const errors: CustomerErrors = {};

  if (data.fullName.length < 2) errors.fullName = "Enter your full name.";
  else if (data.fullName.length > 100) errors.fullName = "Use 100 characters or fewer.";

  if (!data.email) errors.email = "Enter your email address.";
  else if (data.email.length > 254 || !EMAIL.test(data.email)) errors.email = "Enter a valid email address, like name@example.com.";

  const digits = data.phone.replace(/\D/g, "");
  if (!data.phone) errors.phone = "Enter a phone number.";
  else if (!PHONE_CHARS.test(data.phone) || digits.length < 7 || digits.length > 15 || data.phone.length > 25)
    errors.phone = "Enter a phone number with 7 to 15 digits.";

  if (data.address.length < 5) errors.address = "Enter your delivery address.";
  else if (data.address.length > 200) errors.address = "Use 200 characters or fewer.";

  if (data.city.length < 2) errors.city = "Enter your city.";
  else if (data.city.length > 100) errors.city = "Use 100 characters or fewer.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

/** Validates the cart lines and merges duplicates of the same product. */
export function validateOrderLines(input: unknown): { ok: true; lines: OrderLine[] } | { ok: false; error: string } {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: "Your cart is empty." };
  if (input.length > MAX_LINE_ITEMS) return { ok: false, error: "Your cart has too many items." };

  const merged = new Map<string, number>();
  for (const raw of input) {
    const line = raw as { productId?: unknown; quantity?: unknown };
    if (!isUuid(line?.productId)) return { ok: false, error: "Your cart contains an invalid item." };
    const quantity = line.quantity;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM)
      return { ok: false, error: `Quantities must be whole numbers from 1 to ${MAX_QUANTITY_PER_ITEM}.` };
    const id = line.productId.toLowerCase();
    merged.set(id, (merged.get(id) ?? 0) + quantity);
  }
  const lines = [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  if (lines.some((line) => line.quantity > MAX_QUANTITY_PER_ITEM))
    return { ok: false, error: `You can order up to ${MAX_QUANTITY_PER_ITEM} of each item.` };
  return { ok: true, lines };
}

export type OrderRequest = { idempotencyKey: string; customer: CustomerInput; lines: OrderLine[] };

export type OrderRequestResult =
  | { ok: true; data: OrderRequest }
  | { ok: false; formError?: string; fieldErrors?: CustomerErrors };

export function validateOrderRequest(body: unknown): OrderRequestResult {
  if (typeof body !== "object" || body === null) return { ok: false, formError: "Invalid request." };
  const { idempotencyKey, customer, items } = body as Record<string, unknown>;

  if (!isUuid(idempotencyKey)) return { ok: false, formError: "Invalid request. Please refresh and try again." };

  const lines = validateOrderLines(items);
  if (!lines.ok) return { ok: false, formError: lines.error };

  const parsed = validateCustomer((customer ?? {}) as Record<string, unknown>);
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };

  return { ok: true, data: { idempotencyKey: idempotencyKey.toLowerCase(), customer: parsed.data, lines: lines.lines } };
}
