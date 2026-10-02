export type ProductImage = { src: string; alt: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Price in major currency units. For display only; the server prices every order itself. */
  price: number;
  category: string;
  stock: number;
  featured: boolean;
  badge: string | null;
  images: ProductImage[];
  createdAt: string;
};

export type Category = { slug: string; name: string; tagline: string; description: string };

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "name";
