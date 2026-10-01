import Link from "next/link";
import { BagIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { headerAction } from "./headerStyles";

/**
 * Cart entry point with a live item count.
 * The count is supplied by the caller; the cart state arrives in the cart phase.
 */
export function CartButton({ count = 0 }: { count?: number }) {
  const label = count === 1 ? "1 item" : `${count} items`;
  return (
    <Link href="/cart" className={headerAction} aria-label={`Cart, ${label}`}>
      <BagIcon />
      <span className="hidden lg:inline">Cart</span>
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
          count > 0 ? "bg-accent text-white" : "border border-edge text-muted",
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    </Link>
  );
}
