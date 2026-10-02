import { describe, expect, it } from "vitest";
import { availability, localProducts } from "@/lib/catalog";
import { applyQuery, searchTerms } from "@/lib/services/products";

describe("catalog data", () => {
  it("has unique ids and slugs and valid prices", () => {
    expect(new Set(localProducts.map((p) => p.id)).size).toBe(localProducts.length);
    expect(new Set(localProducts.map((p) => p.slug)).size).toBe(localProducts.length);
    expect(localProducts.every((p) => p.price > 0 && p.images.length >= 1 && p.images.every((i) => i.alt.length > 3))).toBe(true);
  });
});

describe("applyQuery", () => {
  it("searches across name, category and description", () => {
    expect(applyQuery(localProducts, { q: "lamp" }).map((p) => p.slug)).toContain("halo-table-lamp");
    expect(applyQuery(localProducts, { q: "tableware" }).length).toBe(3);
  });
  it("requires every word to match", () => {
    expect(applyQuery(localProducts, { q: "lamp stoneware" }).map((p) => p.slug)).toEqual(["halo-table-lamp"]);
    expect(applyQuery(localProducts, { q: "lamp zzzz" })).toEqual([]);
  });
  it("is case-insensitive and tolerates hostile characters", () => {
    expect(applyQuery(localProducts, { q: "HALO" }).length).toBe(1);
    expect(searchTerms("a,b%c_(d)*\"e\\")).toEqual(["a", "b", "c", "d", "e"]);
    expect(() => applyQuery(localProducts, { q: "%%%,,,)))" })).not.toThrow();
  });
  it("filters by category and sorts", () => {
    const desk = applyQuery(localProducts, { category: "desk", sort: "price-asc" });
    expect(desk.every((p) => p.category === "desk")).toBe(true);
    expect(desk.map((p) => p.price)).toEqual([...desk.map((p) => p.price)].sort((a, b) => a - b));
    expect(applyQuery(localProducts, { sort: "price-desc" })[0].price).toBe(148);
  });
  it("puts featured products first by default and respects limit/exclude", () => {
    expect(applyQuery(localProducts, {})[0].featured).toBe(true);
    expect(applyQuery(localProducts, { limit: 3 })).toHaveLength(3);
    const lamp = localProducts[0];
    expect(applyQuery(localProducts, { excludeId: lamp.id }).some((p) => p.id === lamp.id)).toBe(false);
  });
});

describe("availability", () => {
  it("labels stock levels", () => {
    expect(availability({ stock: 0 }).state).toBe("sold-out");
    expect(availability({ stock: 3 })).toEqual({ state: "low", label: "Only 3 left" });
    expect(availability({ stock: 40 }).state).toBe("in-stock");
  });
});
