import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type ApiErrorResponse = {
  error?: string;
};

async function getHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("Mobile API URL is not configured.");
  }

  const headers = await getHeaders();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers ?? {}),
    },
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;

    throw new Error(
      errorData.error ?? `Request failed with status ${response.status}`,
    );
  }

  return data as T;
}

export type ProductImage = {
  src: string;
  alt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  featured: boolean;
  badge: string | null;
  images: ProductImage[];
  createdAt: string;
};

type ProductsResponse = {
  products: Product[];
};

export async function getProducts(): Promise<Product[]> {
  const data = await apiRequest<ProductsResponse>("/api/products");

  return data.products;
}