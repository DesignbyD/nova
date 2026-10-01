export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
];

export const footerNav: { heading: string; links: NavItem[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "All products", href: "/shop" },
      { label: "Collections", href: "/collections" },
    ],
  },
  {
    heading: "Company",
    links: [{ label: "About NOVA", href: "/about" }],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Your orders", href: "/account/orders" },
    ],
  },
];
