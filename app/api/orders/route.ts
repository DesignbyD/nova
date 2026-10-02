import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isAdminConfigured } from "@/lib/env";
import { logError } from "@/lib/logger";
import { createOrder, OrderError, sendConfirmationEmail } from "@/lib/services/orders";
import { validateOrderRequest } from "@/lib/validation/checkout";

const MAX_BODY_BYTES = 20_000;

const json = (body: Record<string, unknown>, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * POST /api/orders: validates the request, has the database create the order (pricing it there),
 * then sends the confirmation email. The order is the source of truth; email trouble never undoes it.
 */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    return json({ code: "validation", error: "Invalid request." }, 415);

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ code: "validation", error: "Request too large." }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ code: "validation", error: "Invalid request." }, 400);
  }

  const parsed = validateOrderRequest(body);
  if (!parsed.ok)
    return json({ code: "validation", error: parsed.formError ?? "Please check the highlighted fields.", fieldErrors: parsed.fieldErrors }, 422);

  if (!isAdminConfigured())
    return json({ code: "unavailable", error: "Ordering isn't available right now. Please try again later." }, 503);

  try {
    const user = await getUser();
    const result = await createOrder({
      idempotencyKey: parsed.data.idempotencyKey,
      userId: user?.id ?? null,
      customer: parsed.data.customer,
      lines: parsed.data.lines,
    });

    // New orders, and replays whose email has not gone out yet, both try to send. It sends at most once.
    const emailStatus = await sendConfirmationEmail(result.order, result.items);

    return json(
      {
        orderNumber: result.order.order_number,
        accessToken: result.order.access_token,
        total: Number(result.order.total),
        emailStatus,
        replayed: !result.created,
      },
      result.created ? 201 : 200,
    );
  } catch (error) {
    if (error instanceof OrderError) {
      if (error.code === "unavailable") return json({ code: "unavailable", error: "We couldn't place your order. Please try again." }, 503);
      if (error.code === "insufficient_stock" || error.code === "product_not_found")
        return json(
          { code: "stock", productId: error.productId, error: "Some items are no longer available in the quantity you chose. We've updated your cart." },
          409,
        );
      return json({ code: "validation", error: "Your cart has an invalid item. Please review it and try again." }, 422);
    }
    logError("api.orders", error);
    return json({ code: "server", error: "Something went wrong placing your order. Please try again." }, 500);
  }
}
