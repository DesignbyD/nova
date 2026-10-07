 "use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { verifyCart } from "@/app/checkout/actions";
import { useCart } from "@/components/cart/CartProvider";
import { clampQuantity, maxFor } from "@/lib/cart/reducer";
import type { CartItem } from "@/lib/cart/types";
import { validateCustomer, type CustomerErrors } from "@/lib/validation/checkout";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 2,
  }).format(value);
}

function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

type Props = {
  defaultName: string;
  defaultEmail: string;
  signedIn: boolean;
  ordersEnabled: boolean;
};
type Verify = { status: "pending" | "done" | "error"; notices: string[] };
type OrderResponse = {
  orderNumber?: string;
  accessToken?: string;
  error?: string;
  fieldErrors?: CustomerErrors;
};

export function CheckoutClient({ defaultName, defaultEmail, signedIn, ordersEnabled }: Props) {
  const router = useRouter();
  const { items, subtotal, hydrated, replaceItems, clearCart } = useCart();
  const cartRef = useRef<CartItem[]>(items);
  const verifiedFor = useRef(-1);
  const [attempt, setAttempt] = useState(0);
  const [verify, setVerify] = useState<Verify>({ status: "pending", notices: [] });
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CustomerErrors>({});
  const [placed, setPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [idempotencyKey] = useState(createIdempotencyKey);

  useEffect(() => { cartRef.current = items; }, [items]);

  useEffect(() => {
    if (!hydrated || verifiedFor.current === attempt) return;
    const snapshot = cartRef.current;
    if (snapshot.length === 0) {
      setVerify({ status: "done", notices: [] });
      return;
    }
    verifiedFor.current = attempt;
    (async () => {
      try {
        const result = await verifyCart(snapshot.map((item) => ({
          productId: item.productId, quantity: item.quantity,
        })));
        if (!result.ok) {
          setVerify({ status: "error", notices: [] });
          return;
        }
        const byId = new Map(result.products.map((product) => [product.productId, product]));
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
          next.push({
            ...item, name: live.name, slug: live.slug, price: live.price,
            image: live.image ?? item.image, maxQuantity: max, quantity,
          });
        }
        replaceItems(next);
        setVerify({ status: "done", notices });
      } catch {
        setVerify({ status: "error", notices: [] });
      }
    })();
  }, [hydrated, attempt, replaceItems]);

  function retryVerification() {
    verifiedFor.current = 0;
    setVerify({ status: "pending", notices: [] });
    setAttempt((value) => value + 1);
  }

  function clearFieldError(field: keyof CustomerErrors) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || placed) return;
    setError("");
    setFieldErrors({});
    if (items.length === 0) { setError("Your cart is empty."); return; }
    if (!ordersEnabled) { setError("Ordering isn't available yet. Please finish the store database setup."); return; }
    if (verify.status === "pending") { setError("Please wait while we verify your cart."); return; }
    if (verify.status === "error") { setError("Please verify your cart again before placing the order."); return; }

    const customerResult = validateCustomer({ fullName: name, email, phone, address, city });
    if (!customerResult.ok) {
      setFieldErrors(customerResult.errors);
      setError("Please check the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idempotencyKey,
          customer: customerResult.data,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      const data = await response.json().catch(() => null) as OrderResponse | null;
      if (!response.ok) {
        if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
        setError(data?.error ?? "We couldn't place your order. Please try again.");
        verifiedFor.current = 0;
        setAttempt((value) => value + 1);
        return;
      }
      if (data?.orderNumber && data?.accessToken) {
        setPlaced(true);
        clearCart();
        router.push(`/order-success/${encodeURIComponent(data.orderNumber)}?token=${encodeURIComponent(data.accessToken)}`);
        return;
      }
      setError("Your order may have been created, but we couldn't open the confirmation page. Please contact support before trying again.");
    } catch {
      setError("We couldn't confirm the result of your request. Please try again using the same checkout session.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) return <div className="mx-auto max-w-3xl py-16 text-center"><p className="text-sm text-neutral-500">Loading your cart…</p></div>;
  if (items.length === 0 && !placed) return (
    <div className="mx-auto max-w-3xl py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Your cart is empty</h1>
      <p className="mt-3 text-sm text-neutral-500">Add something to your cart before checking out.</p>
      <Link href="/shop" className="mt-8 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white">Continue shopping</Link>
    </div>
  );

  const inputClass = "w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black";
  function fieldError(field: keyof CustomerErrors) {
    return fieldErrors[field] ? <p className="mt-2 text-sm text-red-600">{fieldErrors[field]}</p> : null;
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">NOVA checkout</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Complete your order</h1>
          <p className="mt-3 text-sm text-neutral-500">Review your details and place your order securely.</p>
        </div>

        {verify.notices.length > 0 && <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">We updated your cart.</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">{verify.notices.map((notice) => <li key={notice}>• {notice}</li>)}</ul>
        </div>}
        {verify.status === "error" && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">We couldn't verify your cart right now.</p>
          <button type="button" onClick={retryVerification} className="mt-3 rounded-full bg-black px-4 py-2 text-sm font-medium text-white">Try again</button>
        </div>}
        {!signedIn && <div className="mb-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <p className="text-sm text-neutral-700">Have an account? <Link href="/auth/sign-in" className="font-medium underline">Sign in</Link> to keep your orders together. You can also check out as a guest.</p>
        </div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl border border-neutral-200 p-6">
            <h2 className="text-lg font-medium">Contact information</h2>
            <div className="mt-6 space-y-5">
              <div><label htmlFor="name" className="mb-2 block text-sm font-medium">Full name</label><input id="name" name="name" value={name} onChange={(e) => { setName(e.target.value); clearFieldError("fullName"); }} autoComplete="name" aria-invalid={Boolean(fieldErrors.fullName)} className={inputClass} required />{fieldError("fullName")}</div>
              <div><label htmlFor="email" className="mb-2 block text-sm font-medium">Email address</label><input id="email" name="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }} autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} className={inputClass} required />{fieldError("email")}</div>
              <div><label htmlFor="phone" className="mb-2 block text-sm font-medium">Phone number</label><input id="phone" name="phone" type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); clearFieldError("phone"); }} autoComplete="tel" placeholder="+234 800 000 0000" aria-invalid={Boolean(fieldErrors.phone)} className={inputClass} required />{fieldError("phone")}</div>
            </div>
          </section>
          <section className="rounded-3xl border border-neutral-200 p-6">
            <h2 className="text-lg font-medium">Delivery information</h2>
            <div className="mt-6 space-y-5">
              <div><label htmlFor="address" className="mb-2 block text-sm font-medium">Delivery address</label><textarea id="address" name="address" value={address} onChange={(e) => { setAddress(e.target.value); clearFieldError("address"); }} autoComplete="street-address" placeholder="Enter your full delivery address" rows={3} aria-invalid={Boolean(fieldErrors.address)} className={`${inputClass} resize-none`} required />{fieldError("address")}</div>
              <div><label htmlFor="city" className="mb-2 block text-sm font-medium">City</label><input id="city" name="city" value={city} onChange={(e) => { setCity(e.target.value); clearFieldError("city"); }} autoComplete="address-level2" placeholder="Lagos" aria-invalid={Boolean(fieldErrors.city)} className={inputClass} required />{fieldError("city")}</div>
            </div>
          </section>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-800">{error}</p></div>}
          <button type="submit" disabled={submitting || verify.status === "pending" || verify.status === "error" || items.length === 0} className="w-full rounded-full bg-black px-6 py-4 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Placing order…" : "Place order"}</button>
        </form>
      </div>
      <aside className="h-fit rounded-3xl border border-neutral-200 p-6 lg:sticky lg:top-8">
        <h2 className="text-lg font-medium">Order summary</h2>
        <div className="mt-6 space-y-4">{items.map((item) => <div key={item.productId} className="flex items-start justify-between gap-4">
          <div className="min-w-0"><p className="truncate text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-neutral-500">Qty {item.quantity}</p></div>
          <p className="shrink-0 text-sm">{formatPrice(item.price * item.quantity)}</p>
        </div>)}</div>
        <div className="my-6 border-t border-neutral-200" />
        <div className="flex items-center justify-between"><span className="text-sm text-neutral-500">Subtotal</span><span className="font-medium">{formatPrice(subtotal)}</span></div>
        <div className="mt-3 flex items-center justify-between"><span className="text-sm text-neutral-500">Shipping</span><span className="text-sm">Calculated at checkout</span></div>
        <div className="my-6 border-t border-neutral-200" />
        <div className="flex items-center justify-between"><span className="font-medium">Total</span><span className="text-lg font-semibold">{formatPrice(subtotal)}</span></div>
      </aside>
    </div>
  );
}
