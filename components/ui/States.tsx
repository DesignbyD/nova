import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";
import { NovaStar } from "./NovaStar";

type StateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

function StateLayout({ title, description, action, className, tone }: StateProps & { tone: "empty" | "error" }) {
  return (
    <div className={cn("mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center", className)}>
      <NovaStar className={cn("size-8", tone === "error" ? "text-danger" : "text-accent/60")} />
      <h2 className="mt-6 text-title font-semibold">{title}</h2>
      {description ? <p className="mt-2 text-balance font-serif text-lg leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-8 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}

/** An empty screen is an invitation to act: say what is missing and offer the next step. */
export function EmptyState(props: StateProps) {
  return <StateLayout {...props} tone="empty" />;
}

type ErrorStateProps = Partial<StateProps> & {
  /** Renders a retry button. Pass `reset` from an error boundary or a refetch function. */
  onRetry?: () => void;
  retryLabel?: string;
};

/** Tells people what happened and how to recover. Never shows raw error text. */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert">
      <StateLayout
        tone="error"
        title={title}
        description={description}
        className={className}
        action={
          <>
            {onRetry ? <Button onClick={onRetry}>{retryLabel}</Button> : null}
            {action}
          </>
        }
      />
    </div>
  );
}
