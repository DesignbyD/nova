import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderList } from "@/components/account/OrderList";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { avatarUrl, displayName, getUser } from "@/lib/auth";
import { listMyOrders } from "@/lib/services/account";
import { formatDate } from "@/lib/utils/format";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");

  let data: Awaited<ReturnType<typeof listMyOrders>> | null = null;
  try {
    data = await listMyOrders(user.id, 3);
  } catch {
    data = null;
  }
  const avatar = avatarUrl(user);

  return (
    <div className="grid gap-10 lg:grid-cols-[22rem_1fr]">
      <Card padding="lg" className="h-fit">
        <div className="flex items-center gap-4">
          {avatar ? (
            <Image src={avatar} alt="" width={56} height={56} className="size-14 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-title font-semibold text-accent-deep" aria-hidden="true">
              {displayName(user).charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-title font-semibold">{displayName(user)}</h1>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-6 text-sm">
          <div>
            <dt className="text-muted">Orders</dt>
            <dd className="mt-1 text-title font-semibold tabular-nums">{data ? data.count : "-"}</dd>
          </div>
          <div>
            <dt className="text-muted">Member since</dt>
            <dd className="mt-1 font-medium">{formatDate(user.created_at)}</dd>
          </div>
        </dl>
      </Card>

      <section aria-labelledby="recent">
        <div className="flex items-baseline justify-between">
          <h2 id="recent" className="text-title font-semibold">
            Recent orders
          </h2>
          {data && data.count > 3 ? (
            <Link href="/account/orders" className="text-sm underline underline-offset-4 hover:text-accent">
              View all
            </Link>
          ) : null}
        </div>
        <div className="mt-5">
          {data === null ? (
            <Card padding="none">
              <EmptyState title="We couldn't load your orders" description="Please refresh the page to try again." />
            </Card>
          ) : data.orders.length === 0 ? (
            <Card padding="none">
              <EmptyState title="No orders yet" description="When you order, it will appear here." action={<ButtonLink href="/shop">Start shopping</ButtonLink>} />
            </Card>
          ) : (
            <OrderList orders={data.orders} />
          )}
        </div>
      </section>
    </div>
  );
}
