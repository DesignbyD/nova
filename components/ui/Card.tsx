import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "md" | "lg";
  /** Adds a hover treatment. Only use when the whole card is a link or button. */
  interactive?: boolean;
};

const paddings = { none: "", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" } as const;

export function Card({ padding = "md", interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-panel border border-line bg-surface",
        paddings[padding],
        interactive && "transition-[border-color,box-shadow] duration-200 hover:border-edge hover:shadow-lift",
        className,
      )}
      {...rest}
    />
  );
}
