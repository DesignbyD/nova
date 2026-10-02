import { describe, expect, it } from "vitest";
import { validateCustomer, validateOrderLines, validateOrderRequest } from "@/lib/validation/checkout";
import { validateNewsletterEmail } from "@/lib/validation/newsletter";

const good = { fullName: "Ada Okoro", email: "Ada@Example.com ", phone: "+234 801 234 5678", address: "12 Marina Road", city: "Port Harcourt" };
const id = "eee5650c-2bf6-4e48-8491-1663afae6cac";
const key = "aaaaaaaa-0000-4000-8000-000000000001";

describe("validateCustomer", () => {
  it("accepts valid input and normalises it", () => {
    const r = validateCustomer(good);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.email).toBe("ada@example.com");
  });
  it("collapses whitespace in names", () => {
    const r = validateCustomer({ ...good, fullName: "  Ada    Okoro " });
    if (r.ok) expect(r.data.fullName).toBe("Ada Okoro");
  });
  it.each([
    ["fullName", "A"],
    ["email", "not-an-email"],
    ["email", "a@b"],
    ["phone", "12345"],
    ["phone", "call me maybe"],
    ["phone", "1".repeat(16)],
    ["address", "x"],
    ["city", ""],
  ])("rejects bad %s: %s", (field, value) => {
    const r = validateCustomer({ ...good, [field]: value });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[field as keyof typeof r.errors]).toBeTruthy();
  });
  it("rejects non-string values instead of throwing", () => {
    expect(validateCustomer({ fullName: 5, email: null, phone: {}, address: [], city: undefined }).ok).toBe(false);
  });
  it("rejects over-long fields", () => {
    expect(validateCustomer({ ...good, address: "x".repeat(201) }).ok).toBe(false);
  });
});

describe("validateOrderLines", () => {
  it("merges duplicate products", () => {
    const r = validateOrderLines([{ productId: id, quantity: 2 }, { productId: id.toUpperCase(), quantity: 3 }]);
    expect(r).toEqual({ ok: true, lines: [{ productId: id, quantity: 5 }] });
  });
  it("rejects when the merged quantity exceeds the limit", () => {
    expect(validateOrderLines([{ productId: id, quantity: 8 }, { productId: id, quantity: 8 }]).ok).toBe(false);
  });
  it.each([0, -1, 1.5, 11, "2", null, NaN])("rejects quantity %s", (q) => {
    expect(validateOrderLines([{ productId: id, quantity: q }]).ok).toBe(false);
  });
  it("rejects empty, non-array and bad ids", () => {
    expect(validateOrderLines([]).ok).toBe(false);
    expect(validateOrderLines("x").ok).toBe(false);
    expect(validateOrderLines([{ productId: "nope", quantity: 1 }]).ok).toBe(false);
  });
  it("rejects more than 50 lines", () => {
    expect(validateOrderLines(Array.from({ length: 51 }, () => ({ productId: id, quantity: 1 }))).ok).toBe(false);
  });
});

describe("validateOrderRequest", () => {
  it("accepts a full valid request", () => {
    expect(validateOrderRequest({ idempotencyKey: key, customer: good, items: [{ productId: id, quantity: 1 }] }).ok).toBe(true);
  });
  it("ignores any client-supplied price or total", () => {
    const r = validateOrderRequest({ idempotencyKey: key, customer: good, items: [{ productId: id, quantity: 1, price: 0.01 }], total: 0 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(JSON.stringify(r.data)).not.toContain("0.01");
  });
  it("requires a valid idempotency key", () => {
    expect(validateOrderRequest({ idempotencyKey: "abc", customer: good, items: [{ productId: id, quantity: 1 }] }).ok).toBe(false);
  });
  it("returns field errors for a bad customer", () => {
    const r = validateOrderRequest({ idempotencyKey: key, customer: { ...good, email: "x" }, items: [{ productId: id, quantity: 1 }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors?.email).toBeTruthy();
  });
  it("rejects null and non-objects", () => {
    expect(validateOrderRequest(null).ok).toBe(false);
    expect(validateOrderRequest("hi").ok).toBe(false);
  });
});

describe("validateNewsletterEmail", () => {
  it("normalises valid emails", () => expect(validateNewsletterEmail(" A@B.co ")).toEqual({ ok: true, email: "a@b.co" }));
  it("rejects bad input", () => {
    expect(validateNewsletterEmail("").ok).toBe(false);
    expect(validateNewsletterEmail("nope").ok).toBe(false);
    expect(validateNewsletterEmail(42).ok).toBe(false);
  });
});
