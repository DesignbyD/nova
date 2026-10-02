import { formatDate, formatPrice } from "@/lib/utils/format";
import type { OrderItemRow, OrderRow } from "@/types/database";

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

type Input = {
  order: Pick<OrderRow, "order_number" | "customer_name" | "created_at" | "subtotal" | "total" | "address" | "city">;
  items: Pick<OrderItemRow, "product_name" | "price" | "quantity">[];
  siteUrl: string;
};

/** Builds the confirmation email: branded HTML plus a plain-text fallback. Every dynamic value is escaped. */
export function renderOrderConfirmation({ order, items, siteUrl }: Input) {
  const firstName = order.customer_name.split(" ")[0];
  const date = formatDate(order.created_at);
  const subject = `Your NOVA order ${order.order_number} is confirmed`;

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #e1e4df;font-size:15px;color:#1b2130;">${esc(item.product_name)}<br><span style="color:#576070;font-size:13px;">${formatPrice(Number(item.price))} each</span></td>
          <td style="padding:14px 8px;border-bottom:1px solid #e1e4df;font-size:15px;color:#1b2130;text-align:center;">&times; ${item.quantity}</td>
          <td style="padding:14px 0;border-bottom:1px solid #e1e4df;font-size:15px;color:#1b2130;text-align:right;">${formatPrice(Number(item.price) * item.quantity)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#eff1ee;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Thank you, ${esc(firstName)}. Your order ${esc(order.order_number)} is confirmed.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff1ee;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;">
        <tr><td style="padding:32px 32px 8px;">
          <span style="font-size:28px;font-weight:800;letter-spacing:-0.04em;color:#1b2130;">NOVA</span><span style="color:#4a2fe0;font-size:16px;vertical-align:top;">&#10022;</span>
        </td></tr>
        <tr><td style="padding:16px 32px 0;">
          <h1 style="margin:0;font-size:26px;line-height:1.2;letter-spacing:-0.02em;color:#1b2130;">Thank you, ${esc(firstName)}.</h1>
          <p style="margin:12px 0 0;font-size:16px;line-height:1.6;color:#343c4e;">We've received your order and will be in touch when it moves. Here is a copy for your records.</p>
        </td></tr>
        <tr><td style="padding:24px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8e4fc;border-radius:6px;">
            <tr>
              <td style="padding:14px 16px;font-size:13px;color:#2b1a99;">Order number<br><strong style="font-size:17px;">${esc(order.order_number)}</strong></td>
              <td style="padding:14px 16px;font-size:13px;color:#2b1a99;text-align:right;">Order date<br><strong style="font-size:17px;">${esc(date)}</strong></td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
            <tr><td style="padding:16px 0 4px;font-size:15px;color:#576070;" colspan="2">Subtotal</td><td style="padding:16px 0 4px;font-size:15px;color:#1b2130;text-align:right;">${formatPrice(Number(order.subtotal))}</td></tr>
            <tr><td style="padding:4px 0 8px;font-size:17px;font-weight:700;color:#1b2130;" colspan="2">Total</td><td style="padding:4px 0 8px;font-size:17px;font-weight:700;color:#1b2130;text-align:right;">${formatPrice(Number(order.total))}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 32px 0;">
          <p style="margin:0;font-size:13px;color:#576070;">Delivering to</p>
          <p style="margin:4px 0 0;font-size:15px;line-height:1.5;color:#1b2130;">${esc(order.customer_name)}<br>${esc(order.address)}<br>${esc(order.city)}</p>
        </td></tr>
        <tr><td style="padding:28px 32px 32px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#343c4e;">If anything looks wrong, reply to this email and quote your order number.</p>
          <p style="margin:20px 0 0;font-size:13px;color:#576070;"><a href="${esc(siteUrl)}" style="color:#4a2fe0;">NOVA</a> &middot; Objects for the quiet hours</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    "NOVA",
    "",
    `Thank you, ${firstName}.`,
    "We've received your order and will be in touch when it moves. Here is a copy for your records.",
    "",
    `Order number: ${order.order_number}`,
    `Order date:   ${date}`,
    "",
    ...items.map(
      (item) => `${item.product_name}  x${item.quantity}  ${formatPrice(Number(item.price))} each  ${formatPrice(Number(item.price) * item.quantity)}`,
    ),
    "",
    `Subtotal: ${formatPrice(Number(order.subtotal))}`,
    `Total:    ${formatPrice(Number(order.total))}`,
    "",
    "Delivering to:",
    order.customer_name,
    order.address,
    order.city,
    "",
    "If anything looks wrong, reply to this email and quote your order number.",
    siteUrl,
  ].join("\n");

  return { subject, html, text };
}
