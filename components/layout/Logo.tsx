import Link from "next/link";
import { NovaStar } from "@/components/ui/NovaStar";
import { cn } from "@/lib/utils/cn";

/** NOVA wordmark with the star set like a spark off the final letter. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="NOVA, home"
      className={cn("inline-flex items-start text-[1.625rem] font-extrabold leading-none tracking-[-0.045em]", className)}
    >
      NOVA
      <NovaStar className="ml-0.5 size-[0.55em] -translate-y-px text-accent" />
    </Link>
  );
}
