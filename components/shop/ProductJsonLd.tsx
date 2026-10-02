import { siteConfig } from "@/lib/site";
import type { Product } from "@/types/catalog";

/** Structured data so search engines can show price and availability. */
export function ProductJsonLd({ product }: { product: Product }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => new URL(i.src, siteConfig.url).toString()),
    category: product.category,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: siteConfig.currency,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: new URL(`/products/${product.slug}`, siteConfig.url).toString(),
    },
  };
  // "<" is escaped so product text can never close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
