import { siteConfig } from "@/lib/site";

const priceFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
});

/** Format a price in major units (e.g. 49.5 -> "$49.50"). Display only; never used to calculate totals. */
export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatDate(value: string | number | Date): string {
  return dateFormatter.format(new Date(value));
}
