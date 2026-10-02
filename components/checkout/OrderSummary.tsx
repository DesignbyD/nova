import Image from "next/image";
import { formatPrice } from "@/lib/utils/format";
import type { CartItem } from "@/lib/cart/types";

export function OrderSummary({ items, subtotal }: { items: CartItem[]; subtotal: number }) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-4 py-4 first:pt-0">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-control bg-paper-deep">
              {item.image ? <Image src={item.image.src} alt={item.image.alt} fill sizes="64px" className="object-cover" /> : null}
            </div>
            <div className="flex min-w-0 flex-1 justify-between gap-3">
              <div>
                <p className="font-medium leading-snug">{item.name}</p>
                <p className="mt-1 text-sm text-muted">
                  Qty {item.quantity} &middot; {formatPrice(item.price)} each
                </p>
              </div>
              <p className="shrink-0 font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</p>
            </div>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 border-t border-line pt-4">
        <div className="flex justify-between text-[0.9375rem]">
          <dt className="text-muted">Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between text-title font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
        </div>
      </dl>
    </div>
  );
}
