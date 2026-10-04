"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { verifyCart } from "@/app/checkout/actions";
import { useCart } from "@/components/cart/CartProvider";
import { clampQuantity, maxFor } from "@/lib/cart/reducer";
import type { CartItem } from "@/lib/cart/types";
function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value);
}

type Props = {
  defaultName: string;
  defaultEmail: string;
  signedIn: boolean;
  ordersEnabled: boolean;
};

type Verify = {
  status: "pending" | "done" | "error";
  notices: string[];
};

export function CheckoutClient({
  defaultName,
  defaultEmail,
  signedIn,
  ordersEnabled,
}: Props) {
  const router = useRouter();

  const {
    items,
    subtotal,
    hydrated,
    replaceItems,
    clearCart,
  } = useCart();

  const cartRef = useRef<CartItem[]>(items);
  const verifiedFor = useRef(0);

  const [attempt, setAttempt] = useState(0);
  const [verify, setVerify] = useState<Verify>({
    status: "pending",
    notices: [],
  });

  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);

  const [placed, setPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cartRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!hydrated || verifiedFor.current === attempt) {
      return;
    }

    const snapshot = cartRef.current;

    if (snapshot.length === 0) {
      setVerify({
        status: "done",
        notices: [],
      });
      return;
    }

    verifiedFor.current = attempt;

    (async () => {
      let result: Awaited<ReturnType<typeof verifyCart>>;

      try {
        result = await verifyCart(
          snapshot.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        );
      } catch {
        setVerify({
          status: "error",
          notices: [],
        });
        return;
      }

      if (!result.ok) {
        setVerify({
          status: "error",
          notices: [],
        });
        return;
      }

      const byId = new Map(
        result.products.map((product) => [
          product.productId,
          product,
        ]),
      );

      const notices: string[] = [];
      const next: CartItem[] = [];

      for (const item of snapshot) {
        const live = byId.get(item.productId);
        const max = live ? maxFor(live.stock) : 0;

        if (!live || max < 1) {
          notices.push(
            `${item.name} is no longer available and was removed from your cart.`,
          );
          continue;
        }

        if (live.price !== item.price) {
          notices.push(
            `The price of ${live.name} is now ${formatPrice(live.price)}.`,
          );
        }

        const quantity = clampQuantity(
          item.quantity,
          max,
        );

        if (quantity < item.quantity) {
          notices.push(
            `Only ${max} of ${live.name} ${
              max === 1 ? "is" : "are"
            } available, so we updated your quantity.`,
          );
        }

        next.push({
          ...item,
          name: live.name,
          slug: live.slug,
          price: live.price,
          image: live.image ?? item.image,
          maxQuantity: max,
          quantity,
        });
      }

      replaceItems(next);

      setVerify({
        status: "done",
        notices,
      });
    })();
  }, [hydrated, attempt, replaceItems]);

  function retryVerification() {
    verifiedFor.current = 0;
    setVerify({
      status: "pending",
      notices: [],
    });
    setAttempt((value) => value + 1);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting || placed) {
      return;
    }

    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!ordersEnabled) {
      setError(
        "Ordering isn't available yet. Please finish the store database setup.",
      );
      return;
    }

    if (verify.status === "error") {
      setError(
        "Please verify your cart again before placing the order.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          customerName: name.trim(),
          customerEmail: email.trim(),
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.error ??
            "We couldn't place your order. Please try again.",
        );

        setAttempt((value) => value + 1);
        return;
      }

      if (
        data?.orderNumber &&
        data?.accessToken
      ) {
        setPlaced(true);

        clearCart();

        router.push(
          `/order-success/${data.orderNumber}?token=${encodeURIComponent(
            data.accessToken,
          )}`,
        );

        return;
      }

      setError(
        "Your order was created, but we couldn't open the confirmation page.",
      );
    } catch {
      setError(
        "Something went wrong while placing your order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-sm text-neutral-500">
          Loading your cart…
        </p>
      </div>
    );
  }

  if (items.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Your cart is empty
        </h1>

        <p className="mt-3 text-sm text-neutral-500">
          Add something to your cart before checking out.
        </p>

        <Link
          href="/shop"
          className="mt-8 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            NOVA checkout
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Complete your order
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            Review your details and place your order securely.
          </p>
        </div>

        {verify.notices.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              We updated your cart.
            </p>

            <ul className="mt-2 space-y-1 text-sm text-amber-800">
              {verify.notices.map((notice) => (
                <li key={notice}>• {notice}</li>
              ))}
            </ul>
          </div>
        )}

        {verify.status === "error" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              We couldn't verify your cart right now.
            </p>

            <button
              type="button"
              onClick={retryVerification}
              className="mt-3 rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!signedIn && (
          <div className="mb-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <p className="text-sm text-neutral-700">
              Have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="font-medium underline"
              >
                Sign in
              </Link>{" "}
              to keep your orders together. You can also
              check out as a guest.
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="rounded-3xl border border-neutral-200 p-6">
            <h2 className="text-lg font-medium">
              Contact information
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium"
                >
                  Full name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  autoComplete="name"
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              verify.status === "pending" ||
              verify.status === "error" ||
              items.length === 0
            }
            className="w-full rounded-full bg-black px-6 py-4 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Placing order…"
              : "Place order"}
          </button>
        </form>
      </div>

      <aside className="h-fit rounded-3xl border border-neutral-200 p-6 lg:sticky lg:top-8">
        <h2 className="text-lg font-medium">
          Order summary
        </h2>

        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {item.name}
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  Qty {item.quantity}
                </p>
              </div>

              <p className="shrink-0 text-sm">
                {formatPrice(
                  item.price * item.quantity,
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="my-6 border-t border-neutral-200" />

        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">
            Subtotal
          </span>

          <span className="font-medium">
            {formatPrice(subtotal)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-neutral-500">
            Shipping
          </span>

          <span className="text-sm">
            Calculated at checkout
          </span>
        </div>

        <div className="my-6 border-t border-neutral-200" />

        <div className="flex items-center justify-between">
          <span className="font-medium">
            Total
          </span>

          <span className="text-lg font-semibold">
            {formatPrice(subtotal)}
          </span>
        </div>
      </aside>
    </div>
  );
}