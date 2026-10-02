import { describe, expect, it } from "vitest";
import { renderOrderConfirmation } from "@/lib/email/templates/orderConfirmation";

const order = { order_number: "NOVA-10001", customer_name: "Ada Okoro", created_at: "2026-10-01T10:00:00Z", subtotal: 324, total: 324, address: "12 Marina Road", city: "Port Harcourt" };
const items = [
  { product_name: "Halo Table Lamp", price: 148, quantity: 2 },
  { product_name: "Field Notebook", price: 28, quantity: 1 },
];

describe("renderOrderConfirmation", () => {
  const mail = renderOrderConfirmation({ order, items, siteUrl: "https://nova.example" });

  it("includes the details a customer needs, in both formats", () => {
    for (const body of [mail.html, mail.text]) {
      expect(body).toContain("NOVA-10001");
      expect(body).toContain("Halo Table Lamp");
      expect(body).toContain("$148.00");
      expect(body).toContain("$296.00"); // line total: 2 x 148
      expect(body).toContain("$324.00"); // total
      expect(body).toContain("Ada");
    }
    expect(mail.subject).toBe("Your NOVA order NOVA-10001 is confirmed");
    expect(mail.html).toContain("NOVA");
  });

  it("escapes customer-supplied text so it cannot inject markup", () => {
    const evil = renderOrderConfirmation({
      order: { ...order, customer_name: '<script>alert(1)</script> "Bob"', address: "<img src=x onerror=alert(1)>" },
      items: [{ product_name: "<b>Hack</b>", price: 1, quantity: 1 }],
      siteUrl: "https://nova.example",
    });
    expect(evil.html).not.toContain("<script>");
    expect(evil.html).not.toContain("<img src=x");
    expect(evil.html).not.toContain("<b>Hack</b>");
    expect(evil.html).toContain("&lt;script&gt;");
  });
});
