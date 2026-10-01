import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ContainerProps = HTMLAttributes<HTMLElement> & { as?: ElementType };

/** Page-width wrapper: one max width and one responsive gutter across the site. */
export function Container({ as: Tag = "div", className, ...rest }: ContainerProps) {
  return <Tag className={cn("gutter-x mx-auto w-full max-w-[90rem]", className)} {...rest} />;
}
