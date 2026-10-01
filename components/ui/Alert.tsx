import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { AlertIcon, CheckIcon, InfoIcon } from "./icons";

export type AlertTone = "info" | "success" | "warning" | "danger";

const tones: Record<AlertTone, { box: string; icon: ReactNode }> = {
  info: { box: "border-accent/25 bg-accent-soft text-accent-deep", icon: <InfoIcon /> },
  success: { box: "border-success/25 bg-success-soft text-success", icon: <CheckIcon /> },
  warning: { box: "border-warning/25 bg-warning-soft text-warning", icon: <AlertIcon /> },
  danger: { box: "border-danger/25 bg-danger-soft text-danger", icon: <AlertIcon /> },
};

type AlertProps = {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Inline message. Urgent tones use role="alert"; others use role="status". */
export function Alert({ tone = "info", title, children, action, className }: AlertProps) {
  const urgent = tone === "danger" || tone === "warning";
  return (
    <div
      role={urgent ? "alert" : "status"}
      className={cn("flex gap-3 rounded-panel border px-4 py-3.5", tones[tone].box, className)}
    >
      <span className="mt-0.5 shrink-0">{tones[tone].icon}</span>
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5" : undefined}>{children}</div> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}
