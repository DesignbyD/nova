import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { NovaStar } from "@/components/ui/NovaStar";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export type ProductCardProps = {
  href: string;
  name: string;
  category: string;
  price: number;
  image?: { src: string; alt: string };
  badge?: string;
  soldOut?: boolean;
  /** Slot for the add-to-cart control, wired up in the cart phase. */
  action?: ReactNode;
  /** Set true for the first row of products so the browser loads them eagerly. */
  priority?: boolean;
  sizes?: string;
};

/** Presentational product tile. Data and actions are supplied by the caller. */
export function ProductCard({
  href,
  name,
  category,
  price,
  image,
  badge,
  soldOut,
  action,
  priority,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
}: ProductCardProps) {
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-panel bg-paper-deep">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={sizes}
            priority={priority}
            className={cn(
              "object-cover transition-transform duration-500 ease-nova group-hover:scale-[1.03]",
              soldOut && "opacity-60",
            )}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-accent/25" aria-hidden="true">
            <NovaStar className="size-14" />
          </div>
        )}
        {/* The white backing on the badge wrapper keeps it legible on any image. */}
        {badge || soldOut ? (
          <div className="absolute left-3 top-3 rounded-full bg-surface">
            <Badge tone={soldOut ? "outline" : "accent"}>{soldOut ? "Sold out" : badge}</Badge>
          </div>
        ) : null}
        {action ? <div className="absolute inset-x-3 bottom-3 z-10">{action}</div> : null}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-medium leading-snug">
            {/* The stretched link makes the whole tile clickable while keeping one tab stop. */}
            <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-offset-4">
              {name}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-muted">{category}</p>
        </div>
        <p className="shrink-0 font-medium tabular-nums">{formatPrice(price)}</p>
      </div>
    </article>
  );
}
