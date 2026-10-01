"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from "./icons";

type ToastTone = "info" | "success" | "danger";
type ToastInput = { title: string; description?: string; tone?: ToastTone; durationMs?: number };
type ToastItem = ToastInput & { id: number; tone: ToastTone };

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

/** Show a short, non-blocking notification. Errors stay longer so they can be read. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const toneStyles: Record<ToastTone, { icon: ReactNode; accent: string }> = {
  info: { icon: <InfoIcon width={18} height={18} />, accent: "text-accent" },
  success: { icon: <CheckIcon width={18} height={18} />, accent: "text-success" },
  danger: { icon: <AlertIcon width={18} height={18} />, accent: "text-danger" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback((input: ToastInput) => {
    setItems((list) => [...list.slice(-2), { ...input, tone: input.tone ?? "info", id: Date.now() + Math.random() }]);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), item.durationMs ?? (item.tone === "danger" ? 8000 : 5000));
    return () => window.clearTimeout(timer);
  }, [item, onDismiss]);

  return (
    <div
      className={cn(
        "nova-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-panel border border-line",
        "bg-surface px-4 py-3.5 shadow-lift",
      )}
    >
      <span className={cn("mt-0.5 shrink-0", toneStyles[item.tone].accent)}>{toneStyles[item.tone].icon}</span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">{item.title}</p>
        {item.description ? <p className="mt-0.5 text-muted">{item.description}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="-m-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-control text-muted hover:bg-paper-deep hover:text-ink"
      >
        <CloseIcon width={16} height={16} />
      </button>
    </div>
  );
}
