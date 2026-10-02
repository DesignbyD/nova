import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Container } from "@/components/ui/Container";
import { getUser } from "@/lib/auth";
import { getOrderForSuccessPage } from "@/lib/services/orders";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { maskEmail } from "@/lib/utils/mask-email";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false, follow: false } };

export default async function OrderSuccessPage(props: PageProps<"/order-success/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : null;

  const user = await getUser();
  // Without the secret link (or the owner being signed in) this page does not exist.
  const view = await getOrderForSuccessPage(orderNumber, token, user?.id ?? null);
  if (!view) notFound();
  const { order } = view;
  const isOwner = Boolean(user) && order.user_id === user?.id;

  return (
    <Container className="py-12 sm:py-20">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-success-soft text-success" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path className="nova-draw" d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h1 className="mt-8 text-display-lg font-semibold">Thank you, your order is in.</h1>
        <p className="mt-4 font-serif text-lead text-ink-soft">
          {order.email_status === "sent"
            ? `We've sent a confirmation to ${maskEmail(order.customer_email)}.`
            : "Your order is confirmed and saved."}
        </p>

        {order.email_status !== "sent" ? (
          <Alert tone="warning" title="We couldn't send your confirmation email" className="mt-6 text-left">
            Your order is safe and nothing was duplicated. Keep your order number below for reference.
          </Alert>
        ) : null}

        <dl className="mt-10 divide-y divide-line rounded-panel border border-line bg-surface text-left">
          <div className="flex justify-between gap-4 px-5 py-4">
            <dt className="text-muted">Order number</dt>
            <dd className="font-semibold tabular-nums">{order.order_number}</dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-4">
            <dt className="text-muted">Date</dt>
            <dd>{formatDate(order.created_at)}</dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-4">
            <dt className="text-muted">Email</dt>
            <dd>{maskEmail(order.customer_email)}</dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-4">
            <dt className="text-muted">Total</dt>
            <dd className="text-title font-semibold tabular-nums">{formatPrice(Number(order.total))}</dd>
          </div>
        </dl>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop" variant="accent" size="lg">
            Continue shopping
          </ButtonLink>
          {isOwner ? (
            <ButtonLink href={`/account/orders/${order.order_number}`} variant="secondary" size="lg">
              View order
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
