import Link from "next/link";
import { StatusBadge } from "@/components/account/StatusBadge";
import type { OrderSummaryRow } from "@/lib/services/account";
import { formatDate, formatPrice } from "@/lib/utils/format";

export function OrderList({ orders }: { orders: OrderSummaryRow[] }) {
  return (
    <ul className="divide-y divide-line rounded-panel border border-line bg-surface">
      {orders.map((o) => (
        <li key={o.order_number}>
          <Link href={`/account/orders/${o.order_number}`} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-paper">
            <span>
              <span className="block font-semibold tabular-nums">{o.order_number}</span>
              <span className="block text-sm text-muted">
                {formatDate(o.created_at)} &middot; {o.order_items.reduce((n, i) => n + i.quantity, 0)} items
              </span>
            </span>
            <span className="flex items-center gap-4">
              <StatusBadge status={o.status} />
              <span className="font-medium tabular-nums">{formatPrice(Number(o.total))}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
