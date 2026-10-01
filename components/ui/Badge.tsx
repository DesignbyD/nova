import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "outline";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-paper-deep text-ink-soft",
  accent: "bg-accent-soft text-accent-deep",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  outline: "border border-edge text-ink-soft",
};

export function Badge({
  tone = "neutral",
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium leading-5",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
