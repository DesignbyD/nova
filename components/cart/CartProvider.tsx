"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  cartItemCount,
  cartSubtotal,
  maxFor,
} from "@/lib/cart/reducer";

import type { CartItem } from "@/lib/cart/types";
import type { Product } from "@/types/catalog";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  replaceItems: (items: CartItem[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }

  return ctx;
}

type ServerCartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    images: {
      src: string;
      alt: string;
    }[];
    stock: number;
  } | null;
};

type ServerCart = {
  id: string;
  items: ServerCartItem[];
};

function productToCartItem(
  item: ServerCartItem,
): CartItem | null {
  if (!item.product) {
    return null;
  }

  const product = item.product;

  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.images[0] ?? null,
    quantity: item.quantity,
    maxQuantity: maxFor(product.stock),
  };
}

function serverCartToItems(cart: ServerCart): CartItem[] {
  return cart.items
    .map(productToCartItem)
    .filter(
      (item): item is CartItem => item !== null,
    );
}

async function fetchCart(): Promise<ServerCart | null> {
  const response = await fetch("/api/cart", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load cart.");
  }

  return response.json();
}

async function updateServerCart(
  action:
    | {
        type: "add";
        productId: string;
        quantity: number;
      }
    | {
        type: "setQuantity";
        productId: string;
        quantity: number;
      },
): Promise<ServerCart> {
  const response = await fetch("/api/cart", {
    method: action.type === "add" ? "POST" : "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(action),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.error ?? "Unable to update cart.",
    );
  }

  return response.json();
}

async function deleteFromServerCart(
  productId?: string,
): Promise<ServerCart> {
  const response = await fetch("/api/cart", {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      productId
        ? {
            productId,
          }
        : {},
    ),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.error ?? "Unable to update cart.",
    );
  }

  return response.json();
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      try {
        const cart = await fetchCart();

        if (!cancelled && cart) {
          setItems(serverCartToItems(cart));
        }
      } catch (error) {
        console.error(
          "Failed to load cart:",
          error,
        );
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    }

    loadCart();

    return () => {
      cancelled = true;
    };
  }, []);

  const addItem = useCallback(
    (
      product: Product,
      quantity = 1,
    ) => {
      const previousItems = items;

      const optimisticItem: CartItem = {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0] ?? null,
        quantity,
        maxQuantity: maxFor(product.stock),
      };

      setItems((current) => {
        const existing = current.find(
          (item) =>
            item.productId === product.id,
        );

        if (!existing) {
          return [
            ...current,
            optimisticItem,
          ];
        }

        return current.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + quantity,
                  item.maxQuantity,
                ),
              }
            : item,
        );
      });

      updateServerCart({
        type: "add",
        productId: product.id,
        quantity,
      })
        .then((cart) => {
          setItems(
            serverCartToItems(cart),
          );
        })
        .catch((error) => {
          console.error(
            "Failed to add item to cart:",
            error,
          );

          setItems(previousItems);
        });
    },
    [items],
  );

  const setQuantity = useCallback(
    (
      productId: string,
      quantity: number,
    ) => {
      const previousItems = items;

      setItems((current) =>
        current.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: Math.max(
                  1,
                  Math.min(
                    quantity,
                    item.maxQuantity,
                  ),
                ),
              }
            : item,
        ),
      );

      updateServerCart({
        type: "setQuantity",
        productId,
        quantity,
      })
        .then((cart) => {
          setItems(
            serverCartToItems(cart),
          );
        })
        .catch((error) => {
          console.error(
            "Failed to update cart quantity:",
            error,
          );

          setItems(previousItems);
        });
    },
    [items],
  );

  const removeItem = useCallback(
    (productId: string) => {
      const previousItems = items;

      setItems((current) =>
        current.filter(
          (item) =>
            item.productId !== productId,
        ),
      );

      deleteFromServerCart(productId)
        .then((cart) => {
          setItems(
            serverCartToItems(cart),
          );
        })
        .catch((error) => {
          console.error(
            "Failed to remove cart item:",
            error,
          );

          setItems(previousItems);
        });
    },
    [items],
  );

  const clearCart = useCallback(() => {
    const previousItems = items;

    setItems([]);

    deleteFromServerCart()
      .then((cart) => {
        setItems(
          serverCartToItems(cart),
        );
      })
      .catch((error) => {
        console.error(
          "Failed to clear cart:",
          error,
        );

        setItems(previousItems);
      });
  }, [items]);

  const replaceItems = useCallback(
    (next: CartItem[]) => {
      const previousItems = items;

      // Update the interface immediately.
      setItems(next);

      // Synchronize the verified cart with
      // the shared server cart.
      void (async () => {
        try {
          // Remove everything currently stored
          // on the server first.
          await deleteFromServerCart();

          // Add the verified items back.
          for (const item of next) {
            await updateServerCart({
              type: "setQuantity",
              productId: item.productId,
              quantity: item.quantity,
            });
          }

          // Reload the authoritative server cart.
          const cart = await fetchCart();

          if (cart) {
            setItems(
              serverCartToItems(cart),
            );
          }
        } catch (error) {
          console.error(
            "Failed to synchronize verified cart:",
            error,
          );

          // Restore the previous local state
          // if synchronization fails.
          setItems(previousItems);
        }
      })();
    },
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: cartItemCount(items),
      subtotal: cartSubtotal(items),
      hydrated,
      isOpen,

      openCart: () => {
        setOpen(true);
      },

      closeCart: () => {
        setOpen(false);
      },

      addItem,
      setQuantity,
      removeItem,
      clearCart,
      replaceItems,
    }),
    [
      items,
      hydrated,
      isOpen,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      replaceItems,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}