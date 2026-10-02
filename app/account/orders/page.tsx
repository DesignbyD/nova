import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderList } from "@/components/account/OrderList";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState, EmptyState } from "@/components/ui/States";
import { getUser } from "@/lib/auth";
import { listMyOrders } from "@/lib/services/account";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/orders");

  let orders;
  try {
    orders = (await listMyOrders(user.id)).orders;
  } catch {
    return <ErrorState title="We couldn't load your orders" description="Please refresh the page to try again." />;
  }

  return (
    <section aria-labelledby="orders-title">
      <h1 id="orders-title" className="text-display-md font-semibold">
        Your orders
      </h1>
      <div className="mt-8">
        {orders.length === 0 ? (
          <EmptyState title="No orders yet" description="When you order, it will appear here." action={<ButtonLink href="/shop">Start shopping</ButtonLink>} />
        ) : (
          <OrderList orders={orders} />
        )}
      </div>
    </section>
  );
}
