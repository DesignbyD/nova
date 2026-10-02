"use client";

import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: number;
  max: number;
  onChange: (next: number) => void;
  label: string;
  min?: number;
  size?: "sm" | "md";
};

/** Accessible quantity control. The buttons disable at the limits so invalid quantities can't be entered. */
export function QuantityStepper({ value, max, onChange, label, min = 1, size = "md" }: Props) {
  const button = cn(
    "inline-flex items-center justify-center text-ink transition-colors hover:bg-paper-deep disabled:pointer-events-none disabled:opacity-35",
    size === "md" ? "size-11" : "size-9",
  );
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-control border border-edge bg-surface">
      <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <MinusIcon width={16} height={16} />
      </button>
      <output aria-live="polite" className={cn("min-w-8 text-center font-medium tabular-nums", size === "md" ? "text-base" : "text-sm")}>
        {value}
      </output>
      <button type="button" className={button} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <PlusIcon width={16} height={16} />
      </button>
    </div>
  );
}
