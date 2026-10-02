import { describe, expect, it } from "vitest";
import { maskEmail } from "@/lib/utils/mask-email";
import { safeNext } from "@/lib/utils/safe-redirect";
import { sumLines } from "@/lib/utils/money";

describe("safeNext", () => {
  it("allows same-site paths", () => {
    expect(safeNext("/account/orders")).toBe("/account/orders");
    expect(safeNext("/checkout?x=1")).toBe("/checkout?x=1");
  });
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "evil", "/ok\nSet-Cookie: x"])(
    "rejects %s",
    (value) => expect(safeNext(value)).toBe("/account"),
  );
  it("falls back for empty values", () => {
    expect(safeNext(null)).toBe("/account");
    expect(safeNext("", "/")).toBe("/");
  });
});

describe("maskEmail", () => {
  it("hides most of the address", () => {
    expect(maskEmail("ada@example.com")).toBe("a**@example.com");
    expect(maskEmail("bad")).toBe("***");
  });
});

describe("sumLines", () => {
  it("avoids float drift", () => expect(sumLines([{ price: 0.1, quantity: 3 }])).toBe(0.3));
});
