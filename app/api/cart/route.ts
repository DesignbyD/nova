import { NextResponse } from "next/server";
import { getUser, getUserFromRequest } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

const MAX_BODY_BYTES = 10_000;

type CartAction =
  | {
      type: "add";
      productId: string;
      quantity?: number;
    }
  | {
      type: "setQuantity";
      productId: string;
      quantity: number;
    }
  | {
      type: "remove";
      productId: string;
    }
  | {
      type: "clear";
    };

const json = (
  body: Record<string, unknown>,
  status = 200,
) =>
  NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });

async function requireUser(request: Request) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return getUserFromRequest(request);
  }

  return getUser();
}

async function getOrCreateCart(userId: string) {
  const admin = createAdminClient();

  const { data: existing, error: findError } = await admin
    .from("carts")
    .select("id, user_id, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existing) {
    return existing;
  }

  const { data: created, error: createError } = await admin
    .from("carts")
    .insert({
      user_id: userId,
    })
    .select("id, user_id, created_at, updated_at")
    .single();

  if (createError) {
    // Another request may have created the cart at the same time.
    const { data: retry, error: retryError } = await admin
      .from("carts")
      .select("id, user_id, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (retryError) {
      throw retryError;
    }

    if (retry) {
      return retry;
    }

    throw createError;
  }

  return created;
}

async function readCart(userId: string) {
  const admin = createAdminClient();
  const cart = await getOrCreateCart(userId);

  const { data: items, error } = await admin
    .from("cart_items")
    .select(`
      id,
      product_id,
      quantity,
      products (
        id,
        slug,
        name,
        price,
        images,
        stock
      )
    `)
    .eq("cart_id", cart.id)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return {
    id: cart.id,
    items: (items ?? []).map((item) => {
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;

      return {
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        product: product
          ? {
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: Number(product.price),
              images: product.images,
              stock: product.stock,
            }
          : null,
      };
    }),
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return json(
        {
          code: "unauthorized",
          error: "Please sign in to access your cart.",
        },
        401,
      );
    }

    return json(await readCart(user.id));
  } catch (error) {
    logError("api.cart.get", error);

    return json(
      {
        code: "server",
        error: "We couldn't load your cart.",
      },
      500,
    );
  }
}

export async function POST(request: Request) {
  return updateCart(request);
}

export async function PATCH(request: Request) {
  return updateCart(request);
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return json(
        {
          code: "unauthorized",
          error: "Please sign in to access your cart.",
        },
        401,
      );
    }

    const cart = await getOrCreateCart(user.id);
    const admin = createAdminClient();

    let productId: string | null = null;

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const text = await request.text();

      if (text.length > MAX_BODY_BYTES) {
        return json(
          {
            code: "validation",
            error: "Request too large.",
          },
          413,
        );
      }

      if (text.trim()) {
        try {
          const body = JSON.parse(text);

          if (typeof body.productId === "string") {
            productId = body.productId;
          }
        } catch {
          return json(
            {
              code: "validation",
              error: "Invalid request.",
            },
            400,
          );
        }
      }
    }

    let query = admin
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id);

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    await admin
      .from("carts")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", cart.id);

    return json(await readCart(user.id));
  } catch (error) {
    logError("api.cart.delete", error);

    return json(
      {
        code: "server",
        error: "We couldn't update your cart.",
      },
      500,
    );
  }
}

async function updateCart(request: Request) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return json(
        {
          code: "unauthorized",
          error: "Please sign in to access your cart.",
        },
        401,
      );
    }

    if (
      !request.headers
        .get("content-type")
        ?.includes("application/json")
    ) {
      return json(
        {
          code: "validation",
          error: "Invalid request.",
        },
        415,
      );
    }

    const text = await request.text();

    if (text.length > MAX_BODY_BYTES) {
      return json(
        {
          code: "validation",
          error: "Request too large.",
        },
        413,
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(text);
    } catch {
      return json(
        {
          code: "validation",
          error: "Invalid request.",
        },
        400,
      );
    }

    if (!body || typeof body !== "object") {
      return json(
        {
          code: "validation",
          error: "Invalid request.",
        },
        422,
      );
    }

    const action = body as Partial<CartAction>;

    if (
      action.type !== "add" &&
      action.type !== "setQuantity"
    ) {
      return json(
        {
          code: "validation",
          error: "Invalid cart action.",
        },
        422,
      );
    }

    if (
      typeof action.productId !== "string" ||
      !action.productId
    ) {
      return json(
        {
          code: "validation",
          error: "Invalid product.",
        },
        422,
      );
    }

    const quantity =
      typeof action.quantity === "number"
        ? Math.floor(action.quantity)
        : 1;

    if (quantity < 1 || quantity > 10) {
      return json(
        {
          code: "validation",
          error: "Quantity must be between 1 and 10.",
        },
        422,
      );
    }

    const admin = createAdminClient();
    const cart = await getOrCreateCart(user.id);

    const { data: product, error: productError } = await admin
      .from("products")
      .select("id, stock")
      .eq("id", action.productId)
      .maybeSingle();

    if (productError) {
      throw productError;
    }

    if (!product) {
      return json(
        {
          code: "stock",
          productId: action.productId,
          error: "That product is no longer available.",
        },
        409,
      );
    }

    const { data: existing, error: existingError } = await admin
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cart.id)
      .eq("product_id", action.productId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    let nextQuantity = quantity;

    if (action.type === "add") {
      nextQuantity = (existing?.quantity ?? 0) + quantity;
    }

    if (nextQuantity > 10) {
      nextQuantity = 10;
    }

    if (product.stock < nextQuantity) {
      return json(
        {
          code: "stock",
          productId: action.productId,
          error: "There isn't enough stock for that quantity.",
        },
        409,
      );
    }

    if (existing) {
      const { error } = await admin
        .from("cart_items")
        .update({
          quantity: nextQuantity,
        })
        .eq("id", existing.id);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await admin
        .from("cart_items")
        .insert({
          cart_id: cart.id,
          product_id: action.productId,
          quantity: nextQuantity,
        });

      if (error) {
        throw error;
      }
    }

    await admin
      .from("carts")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", cart.id);

    return json(await readCart(user.id));
  } catch (error) {
    logError("api.cart.update", error);

    return json(
      {
        code: "server",
        error: "We couldn't update your cart.",
      },
      500,
    );
  }
}