"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
      {links.map((l) => {
        const active = l.href === "/account" ? pathname === "/account" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn("inline-flex h-11 items-center rounded-control px-4 font-medium", active ? "bg-ink text-paper" : "hover:bg-paper-deep")}
          >
            {l.label}
          </Link>
        );
      })}
      <form action="/auth/signout" method="post" className="ml-auto">
        <Button type="submit" variant="ghost">
          Sign out
        </Button>
      </form>
    </nav>
  );
}
