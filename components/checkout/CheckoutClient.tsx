"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { verifyCart } from "@/app/checkout/actions";
import { useCart } from "@/components/cart/CartProvider";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { clampQuantity, maxFor } from "@/lib/cart/reducer";
import type { CartItem } from "@/lib/cart/types";
import { formatPrice } from "@/lib/utils/format";
import { validateCustomer, type CustomerErrors, type CustomerInput } from "@/lib/validation/checkout";
import { OrderSummary } from "./OrderSummary";

type Props = { defaultName: string; defaultEmail: string; signedIn: boolean; ordersEnabled: boolean };
type Verify = { status: "pending" | "done" | "error"; notices: string[] };

const FIELD_ORDER: (keyof CustomerInput)[] = ["fullName", "email", "phone", "address", "city"];

function Steps() {
  const steps = ["Cart", "Details", "Confirmation"];
  return (
    <ol className="mb-8 flex items-center gap-3 text-sm" aria-label="Checkout progress">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-3" aria-current={i === 1 ? "step" : undefined}>
          <span className={i === 1 ? "font-semibold text-ink" : i === 0 ? "text-ink-soft" : "text-muted"}>
            <span className={`mr-2 inline-flex size-6 items-center justify-center rounded-full text-xs ${i === 1 ? "bg-ink text-paper" : i === 0 ? "bg-paper-deep" : "border border-edge"}`}>
              {i === 0 ? "\u2713" : i + 1}
            </span>
            {label}
          </span>
          {i < steps.length - 1 ? <span aria-hidden="true" className="h-px w-6 bg-edge sm:w-12" /> : null}
        </li>
      ))}
    </ol>
  );
}

export function CheckoutClient({ defaultName, defaultEmail, signedIn, ordersEnabled }: Props) {
  const router = useRouter();
  const { items, subtotal, hydrated, replaceItems, clearCart } = useCart();

  const [values, setValues] = useState<CustomerInput>({ fullName: defaultName, email: defaultEmail, phone: "", address: "", city: "" });
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [verify, setVerify] = useState<Verify>({ status: "pending", notices: [] });
  const [attempt, setAttempt] = useState(0);

  const verifiedFor = useRef<number>(-1);
  const keyRef = useRef<{ hash: string; key: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const cartRef = useRef<CartItem[]>(items);
  // Keep the latest cart for the verification effect without re-running it on every cart change.
  useEffect(() => {
    cartRef.current = items;
  });

  // Check current prices and stock once per attempt, then bring the cart in line with the catalog.
  useEffect(() => {
    if (!hydrated || verifiedFor.current === attempt) return;
    const snapshot = cartRef.current;
    if (snapshot.length === 0) return;
    verifiedFor.current = attempt;

    (async () => {
      let result: Awaited<ReturnType<typeof verifyCart>>;
      try {
        result = await verifyCart(snapshot.map((i) => ({ productId: i.productId, quantity: i.quantity })));
      } catch {
        setVerify({ status: "error", notices: [] });
        return;
      }
      if (!result.ok) {
        setVerify({ status: "error", notices: [] });
        return;
      }
      const byId = new Map(result.products.map((p) => [p.productId, p]));
      const notices: string[] = [];
      const next: CartItem[] = [];
      for (const item of snapshot) {
        const live = byId.get(item.productId);
        const max = live ? maxFor(live.stock) : 0;
        if (!live || max < 1) {
          notices.push(`${item.name} is no longer available and was removed from your cart.`);
          continue;
        }
        if (live.price !== item.price) notices.push(`The price of ${live.name} is now ${formatPrice(live.price)}.`);
        const quantity = clampQuantity(item.quantity, max);
        if (quantity < item.quantity) notices.push(`Only ${max} of ${live.name} ${max === 1 ? "is" : "are"} available, so we updated your quantity.`);
        next.push({ ...item, name: live.name, slug: live.slug, price: live.price, image: live.image ?? item.image, maxQuantity: max, quantity });
      }
      replaceItems(next);
      setVerify({ status: "done", notices });
    })();
  }, [hydrated, attempt, replaceItems]);

  function setField(field: keyof CustomerInput, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validateField(field: keyof CustomerInput) {
    const result = validateCustomer(values);
    setErrors((e) => ({ ...e, [field]: result.ok ? undefined : result.errors[field] }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || placed) return; // blocks duplicate submissions

    const parsed = validateCustomer(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setFormError(null);
      const first = FIELD_ORDER.find((f) => parsed.errors[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    // The same cart + details always reuse the same key, so a retry can never create a second order.
    const lines = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    const hash = JSON.stringify({ c: parsed.data, l: lines });
    if (keyRef.current?.hash !== hash) keyRef.current = { hash, key: crypto.randomUUID() };

    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: keyRef.current.key, customer: parsed.data, items: lines }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        orderNumber?: string;
        accessToken?: string;
        error?: string;
        code?: string;
        fieldErrors?: CustomerErrors;
      };

      if (res.ok && data.orderNumber && data.accessToken) {
        // Success is only shown now, after the server has confirmed the order.
        setPlaced(true);
        clearCart();
        router.push(`/order-success/${data.orderNumber}?token=${encodeURIComponent(data.accessToken)}`);
        return;
      }

      if (data.fieldErrors) setErrors(data.fieldErrors);
      if (data.code === "stock") {
        verifiedFor.current = -1;
        setAttempt((a) => a + 1); // re-check the cart so the shopper sees what changed
        keyRef.current = null;
      }
      setFormError(data.error ?? "We couldn't place your order. Please try again.");
    } catch {
      setFormError("We couldn't confirm your order. It's safe to try again: you won't be ordered twice.");
    } finally {
      setSubmitting(false);
    }
  }

  // ----- states -----
  if (!hydrated || (items.length > 0 && verify.status === "pending" && !placed)) {
    return (
      <div role="status" aria-label="Preparing checkout" className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-48" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (placed) {
    return <EmptyState title="Order placed" description="Taking you to your confirmation." />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add something you love, then come back to check out."
        action={<ButtonLink href="/shop">Browse the shop</ButtonLink>}
      />
    );
  }

  if (verify.status === "error") {
    return (
      <ErrorState
        title="We couldn't check your cart"
        description="We need the latest prices and stock before you order. Please try again."
        onRetry={() => {
          verifiedFor.current = -1;
          setVerify({ status: "pending", notices: [] });
          setAttempt((a) => a + 1);
        }}
      />
    );
  }

  return (
    <div>
      <Steps />
      <h1 className="text-display-md font-semibold">Checkout</h1>

      {verify.notices.length > 0 ? (
        <Alert tone="warning" title="We updated your cart" className="mt-6">
          <ul className="list-disc pl-5">
            {verify.notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {!ordersEnabled ? (
        <Alert tone="warning" title="Ordering isn't set up yet" className="mt-6">
          This store isn&apos;t connected to its database, so orders can&apos;t be placed. See the README to finish setup.
        </Alert>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div>
          <details className="mb-8 rounded-panel border border-line bg-surface lg:hidden">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 font-medium">
              <span>Order summary</span>
              <span className="tabular-nums">{formatPrice(subtotal)}</span>
            </summary>
            <div className="border-t border-line p-4">
              <OrderSummary items={items} subtotal={subtotal} />
            </div>
          </details>

          <form ref={formRef} onSubmit={onSubmit} noValidate aria-describedby={formError ? "form-error" : undefined}>
            {!signedIn ? (
              <p className="mb-6 text-sm text-muted">
                Have an account?{" "}
                <Link href="/login?next=/checkout" className="text-ink underline underline-offset-4 hover:text-accent">
                  Sign in
                </Link>{" "}
                to keep your orders together. You can also check out as a guest.
              </p>
            ) : null}
            <fieldset disabled={submitting} className="grid gap-5 sm:grid-cols-2">
              <legend className="mb-5 text-title font-semibold">Your details</legend>
              <TextField label="Full name" name="fullName" autoComplete="name" value={values.fullName} error={errors.fullName} onChange={(e) => setField("fullName", e.target.value)} onBlur={() => validateField("fullName")} wrapperClassName="sm:col-span-2" required />
              <TextField label="Email" name="email" type="email" autoComplete="email" inputMode="email" hint="Your confirmation is sent here." value={values.email} error={errors.email} onChange={(e) => setField("email", e.target.value)} onBlur={() => validateField("email")} required />
              <TextField label="Phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={values.phone} error={errors.phone} onChange={(e) => setField("phone", e.target.value)} onBlur={() => validateField("phone")} required />
              <TextField label="Address" name="address" autoComplete="street-address" value={values.address} error={errors.address} onChange={(e) => setField("address", e.target.value)} onBlur={() => validateField("address")} wrapperClassName="sm:col-span-2" required />
              <TextField label="City" name="city" autoComplete="address-level2" value={values.city} error={errors.city} onChange={(e) => setField("city", e.target.value)} onBlur={() => validateField("city")} wrapperClassName="sm:col-span-2" required />
            </fieldset>

            {formError ? (
              <div id="form-error" className="mt-6">
                <Alert tone="danger">{formError}</Alert>
              </div>
            ) : null}

            <Button type="submit" variant="accent" size="lg" fullWidth className="mt-8" loading={submitting} disabled={!ordersEnabled}>
              {submitting ? "Placing your order" : `Place order \u00b7 ${formatPrice(subtotal)}`}
            </Button>
            <p className="mt-3 text-center text-sm text-muted">The total is confirmed by our server when you place the order.</p>
          </form>
        </div>

        <aside className="hidden lg:block" aria-label="Order summary">
          <div className="sticky top-28 rounded-panel border border-line bg-surface p-6">
            <h2 className="mb-5 text-title font-semibold">Order summary</h2>
            <OrderSummary items={items} subtotal={subtotal} />
            <Link href="/shop" className="mt-5 inline-block text-sm text-muted underline underline-offset-4 hover:text-ink">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
