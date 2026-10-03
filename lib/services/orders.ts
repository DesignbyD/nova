import "server-only";
import { isAdminConfigured, isResendConfigured } from "@/lib/env";
import { sendEmail } from "@/lib/email/resend";
import { renderOrderConfirmation } from "@/lib/email/templates/orderConfirmation";
import { logError } from "@/lib/logger";
import { siteConfig } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerInput, OrderLine } from "@/lib/validation/checkout";
import type { EmailStatus, OrderItemRow, OrderRow } from "@/types/database";

export type OrderErrorCode =
  | "insufficient_stock"
  | "product_not_found"
  | "invalid_quantity"
  | "duplicate_items"
  | "invalid_items"
  | "unavailable";

export class OrderError extends Error {
  constructor(
    public code: OrderErrorCode,
    public productId?: string,
  ) {
    super(code);
    this.name = "OrderError";
  }
}

const KNOWN: OrderErrorCode[] = ["insufficient_stock", "product_not_found", "invalid_quantity", "duplicate_items", "invalid_items"];

export type CreatedOrder = { created: boolean; order: OrderRow & { access_token: string }; items: OrderItemRow[] };

/**
 * Creates the order inside the database in one transaction. The database reads the real prices and stock;
 * nothing the browser sends about money is used.
 */
export async function createOrder(input: {
  idempotencyKey: string;
  userId: string | null;
  customer: CustomerInput;
  lines: OrderLine[];
}): Promise<CreatedOrder> {
  if (!isAdminConfigured()) throw new OrderError("unavailable");
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("create_order", {
    p_idempotency_key: input.idempotencyKey,
    p_user_id: input.userId,
    p_customer_name: input.customer.fullName,
    p_customer_email: input.customer.email,
    p_phone: input.customer.phone,
    p_address: input.customer.address,
    p_city: input.customer.city,
    p_items: input.lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
  });

  if (error) {
    const known = KNOWN.find((code) => code === error.message);
    if (known) throw new OrderError(known, error.details ?? undefined);
    logError("orders.create", error);
    throw new OrderError("unavailable");
  }

  const result = data as { created: boolean; order: OrderRow & { access_token: string }; items?: OrderItemRow[] };
  const items =
    result.items ??
    ((await admin.from("order_items").select("*").eq("order_id", result.order.id)).data as OrderItemRow[] | null) ??
    [];
  return { created: result.created, order: result.order, items };
}

/**
 * Sends the confirmation email at most once per order, however many times this is called.
 * The claim step is atomic in the database, so a double submit cannot send two emails.
 * The outcome is stored on the order; a failure never affects the order itself.
 */
export async function sendConfirmationEmail(order: OrderRow, items: OrderItemRow[]): Promise<EmailStatus> {
  const admin = createAdminClient();

if (!isResendConfigured()) {
  await admin
    .from("orders")
    .update({
      email_status: "failed",
      email_error: "Resend is not configured.",
    })
    .eq("id", order.id)
    .neq("email_status", "sent");
  return "failed";
}

  const { data: claimed, error: claimError } = await admin.rpc("claim_order_email", { p_order_id: order.id });
  if (claimError) {
    logError("orders.emailClaim", claimError, { order: order.order_number });
    return "failed";
  }
  if (!claimed) {
    // Someone else is sending, or it was already sent. Report what is stored.
    const { data } = await admin.from("orders").select("email_status").eq("id", order.id).single();
    return ((data as { email_status: EmailStatus } | null)?.email_status ?? "pending") as EmailStatus;
  }

  try {
    const message = renderOrderConfirmation({ order, items, siteUrl: siteConfig.url });
    await sendEmail({ to: order.customer_email, ...message });
    await admin
      .from("orders")
      .update({ email_status: "sent", email_error: null, email_sent_at: new Date().toISOString() })
      .eq("id", order.id);
    return "sent";
  } catch (error) {
    logError("orders.email", error, { order: order.order_number });
    const reason = error instanceof Error ? error.message.slice(0, 300) : "Unknown error";
    await admin.from("orders").update({ email_status: "failed", email_error: reason }).eq("id", order.id);
    return "failed";
  }
}

export type OrderView = { order: OrderRow; items: OrderItemRow[] };

/**
 * Loads an order for the success page. Access requires the secret token from the checkout response,
 * or the order's owner being signed in. Order numbers alone are never enough.
 */
export async function getOrderForSuccessPage(orderNumber: string, token: string | null, userId: string | null): Promise<OrderView | null> {
  if (!isAdminConfigured() || !/^NOVA-\d{4,12}$/.test(orderNumber)) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.from("orders").select("*, order_items(*)").eq("order_number", orderNumber).maybeSingle();
  if (error) {
    logError("orders.success", error);
    return null;
  }
  if (!data) return null;
  const { order_items, access_token, ...order } = data as OrderRow & { order_items: OrderItemRow[]; access_token: string };
  const tokenOk = Boolean(token) && token!.length === access_token.length && timingSafeEqual(token!, access_token);
  const owner = Boolean(userId) && order.user_id === userId;
  if (!tokenOk && !owner) return null;
  return { order, items: order_items };
}

function timingSafeEqual(a: string, b: string): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
