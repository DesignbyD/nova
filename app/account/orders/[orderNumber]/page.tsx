import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge, statusInfo } from "@/components/account/StatusBadge";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/States";
import { getUser } from "@/lib/auth";
import { getMyOrder } from "@/lib/services/account";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage(props: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/account/orders/${orderNumber}`)}`);

  let order;
  try {
    order = await getMyOrder(user.id, orderNumber);
  } catch {
    return <ErrorState title="We couldn't load this order" description="Please refresh the page to try again." />;
  }
  // Someone else's order and a non-existent order look identical: a 404.
  if (!order) notFound();

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-muted hover:text-ink">
        &larr; All orders
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="text-display-md font-semibold tabular-nums">{order.order_number}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-muted">
        Placed {formatDate(order.created_at)} &middot; {statusInfo[order.status]?.description}
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="items">
          <h2 id="items" className="mb-4 text-title font-semibold">
            Items
          </h2>
          <Card padding="none">
            <ul className="divide-y divide-line">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      Qty {item.quantity} &middot; {formatPrice(Number(item.price))} each
                    </p>
                  </div>
                  <p className="font-medium tabular-nums">{formatPrice(Number(item.price) * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-5 py-4">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(Number(order.subtotal))}</dd>
              </div>
              <div className="flex justify-between text-title font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(Number(order.total))}</dd>
              </div>
            </dl>
          </Card>
        </section>

        <section aria-labelledby="customer">
          <h2 id="customer" className="mb-4 text-title font-semibold">
            Delivery details
          </h2>
          <Card>
            <address className="space-y-1 not-italic">
              <p className="font-medium">{order.customer_name}</p>
              <p>{order.address}</p>
              <p>{order.city}</p>
              <p className="pt-2 text-muted">{order.phone}</p>
              <p className="text-muted">{order.customer_email}</p>
            </address>
          </Card>
        </section>
      </div>
    </div>
  );
}
