/** Single source of truth for site-level constants. */
export const siteConfig = {
  name: "NOVA",
  description:
    "NOVA is a considered collection of everyday objects, made to last and designed to be looked at.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Display currency. Prices are stored in major units in the database. */
  currency: "USD",
  locale: "en-US",
} as const;
