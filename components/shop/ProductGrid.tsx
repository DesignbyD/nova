import { QuickAdd } from "@/components/cart/QuickAdd";
import { getCategory } from "@/lib/catalog";
import type { Product } from "@/types/catalog";
import { ProductCard } from "./ProductCard";

/** Responsive product grid. The first row loads eagerly because it is usually above the fold. */
export function ProductGrid({ products, eagerCount = 4 }: { products: Product[]; eagerCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            href={`/products/${product.slug}`}
            name={product.name}
            category={getCategory(product.category)?.name ?? product.category}
            price={product.price}
            image={product.images[0]}
            badge={product.badge && product.stock > 0 ? product.badge : undefined}
            soldOut={product.stock <= 0}
            priority={index < eagerCount}
            action={<QuickAdd product={product} />}
          />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeletons({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="flex flex-col gap-3" aria-hidden="true">
            <div className="aspect-[4/5] w-full animate-pulse rounded-panel bg-paper-deep" />
            <div className="h-4 w-3/4 animate-pulse rounded-control bg-paper-deep" />
            <div className="h-3.5 w-1/3 animate-pulse rounded-control bg-paper-deep" />
          </div>
        </li>
      ))}
    </ul>
  );
}
