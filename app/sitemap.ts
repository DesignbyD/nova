import type { MetadataRoute } from "next";
import { categories } from "@/lib/catalog";
import { listProducts } from "@/lib/services/products";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${siteConfig.url}${path}`;
  const pages: MetadataRoute.Sitemap = [
    { url: url("/"), priority: 1 },
    { url: url("/shop"), priority: 0.9 },
    { url: url("/collections"), priority: 0.8 },
    { url: url("/about"), priority: 0.5 },
    ...categories.map((c) => ({ url: url(`/collections/${c.slug}`), priority: 0.7 })),
  ];
  try {
    const products = await listProducts({});
    return [...pages, ...products.map((p) => ({ url: url(`/products/${p.slug}`), lastModified: p.createdAt, priority: 0.6 }))];
  } catch {
    return pages;
  }
}
