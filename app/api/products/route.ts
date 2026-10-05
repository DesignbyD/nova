import { NextResponse } from "next/server";
import { localProducts } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        products: localProducts,
      });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, slug, name, description, price, category, stock, featured, badge, images, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/products] Supabase error:", error);

      return NextResponse.json(
        { error: "Failed to load products." },
        { status: 500 },
      );
    }

    const products = (data ?? []).map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      featured: product.featured,
      badge: product.badge,
      images: product.images,
      createdAt: product.created_at,
    }));

    return NextResponse.json({
      products,
    });
  } catch (error) {
    console.error("[api/products] Unexpected error:", error);

    return NextResponse.json(
      { error: "Failed to load products." },
      { status: 500 },
    );
  }
}