"use client";

import Link from "next/link";
import { useState } from "react";
import { Drawer } from "@/components/ui/Dialog";
import { MenuIcon } from "@/components/ui/icons";
import { primaryNav } from "@/lib/nav";
import { headerAction } from "./headerStyles";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const linkClass = "block py-3 text-display-md font-semibold transition-colors hover:text-accent";

  return (
    <>
      <button
        type="button"
        className={`${headerAction} lg:hidden`}
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MenuIcon />
      </button>
      <Drawer open={open} onClose={close} title="Menu" side="left">
        <nav aria-label="Mobile">
          <ul className="divide-y divide-line">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={close} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-8 flex flex-col gap-1 text-lg">
            <li>
              <Link href="/account" onClick={close} className="block py-2.5 text-muted hover:text-ink">
                Account
              </Link>
            </li>
            <li>
              <Link href="/account/orders" onClick={close} className="block py-2.5 text-muted hover:text-ink">
                Orders
              </Link>
            </li>
          </ul>
        </nav>
      </Drawer>
    </>
  );
}
