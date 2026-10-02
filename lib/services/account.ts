import "server-only";
import { logError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { OrderRow, OrderWithItems } from "@/types/database";

export type OrderSummaryRow = Pick<OrderRow, "order_number" | "total" | "status" | "created_at"> & { order_items: { quantity: number }[] };

/**
 * These queries run as the signed-in user, so Row Level Security in the database
 * is what guarantees nobody can read another customer's orders. The .eq("user_id") is a second lock.
 */
export async function listMyOrders(userId: string, limit?: number): Promise<{ orders: OrderSummaryRow[]; count: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("order_number,total,status,created_at,order_items(quantity)", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error, count } = await query;
  if (error) {
    logError("account.orders", error);
    throw new Error("Could not load orders.");
  }
  return { orders: (data ?? []) as unknown as OrderSummaryRow[], count: count ?? 0 };
}

export async function getMyOrder(userId: string, orderNumber: string): Promise<OrderWithItems | null> {
  if (!/^NOVA-\d{4,12}$/.test(orderNumber)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id,order_number,user_id,customer_name,customer_email,phone,address,city,subtotal,total,status,email_status,created_at,updated_at,order_items(*)")
    .eq("user_id", userId)
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) {
    logError("account.order", error);
    throw new Error("Could not load the order.");
  }
  return (data as unknown as OrderWithItems) ?? null;
}
