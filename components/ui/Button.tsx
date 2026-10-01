import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

type StyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none " +
  "transition-[background-color,border-color,color,transform] duration-150 " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "rounded-control bg-ink text-paper hover:bg-ink-soft",
  accent: "rounded-control bg-accent text-white hover:bg-accent-hover",
  secondary: "rounded-control border border-edge bg-surface text-ink hover:border-ink",
  ghost: "rounded-control text-ink hover:bg-paper-deep",
  link: "text-ink underline decoration-line decoration-1 underline-offset-[5px] hover:decoration-ink",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-14 px-7 text-base",
};

/** Shared class builder so links and buttons look identical. */
export function buttonStyles({ variant = "primary", size = "md", fullWidth, className }: StyleOptions = {}) {
  return cn(base, variants[variant], variant !== "link" && sizes[size], fullWidth && "w-full", className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  StyleOptions & {
    /** Shows the spinner, disables the button and sets aria-busy. Prevents duplicate submissions. */
    loading?: boolean;
  };

export function Button({
  variant,
  size,
  fullWidth,
  className,
  loading = false,
  disabled,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & StyleOptions & { href: string };

export function ButtonLink({ variant, size, fullWidth, className, href, children, ...rest }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonStyles({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </Link>
  );
}
