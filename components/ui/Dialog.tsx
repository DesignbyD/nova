"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { CloseIcon } from "./icons";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** "modal" is centered; "drawer" slides from a side (full-screen on small viewports). */
  variant?: "modal" | "drawer";
  side?: "left" | "right";
  align?: "center" | "top";
  /** Pinned below the scrolling body (e.g. cart totals and checkout button). */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Accessible overlay built on the native <dialog> element.
 * Escape, focus trapping, focus return and an inert background come from the browser.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  variant = "modal",
  side = "right",
  align = "center",
  footer,
  children,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="nova-dialog"
      data-variant={variant}
      data-side={side}
      data-align={align}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(event) => {
        // The panel fills the dialog, so a click that targets the dialog itself is a backdrop click.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "flex flex-col",
          variant === "drawer" ? "h-full" : "max-h-[calc(100dvh-2rem)]",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3 sm:px-6">
          <div>
            <h2 id={titleId} className="text-title font-semibold">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-control text-ink transition-colors hover:bg-paper-deep"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? <div className="border-t border-line px-5 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </dialog>
  );
}

/** Convenience wrapper for side drawers such as the cart and mobile menu. */
export function Drawer(props: Omit<DialogProps, "variant">) {
  return <Dialog {...props} variant="drawer" />;
}
