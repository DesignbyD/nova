import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { listProducts } from "@/lib/services/products";

/** GET /api/search?q=... returns a handful of matching products for the search dialog. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const products = await listProducts({ q, limit: 5, sort: "featured" });
    return NextResponse.json(
      {
        results: products.map((p) => ({
          slug: p.slug,
          name: p.name,
          category: p.category,
          price: p.price,
          image: p.images[0] ?? null,
          soldOut: p.stock <= 0,
        })),
      },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
    );
  } catch (error) {
    logError("api.search", error);
    return NextResponse.json({ results: [], error: "Search is unavailable right now." }, { status: 503 });
  }
}
