import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/checkout", "/order-success", "/api", "/login", "/auth", "/design"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
