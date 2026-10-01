import { cn } from "@/lib/utils/cn";
import { NovaStar } from "./NovaStar";

type SpinnerProps = {
  className?: string;
  /** Provide a label when the spinner stands alone, so screen readers announce it. */
  label?: string;
};

/** Loading indicator: the nova star pulsing and turning. */
export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span role={label ? "status" : undefined} className="inline-flex">
      <NovaStar className={cn("nova-spin size-5", className)} />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
