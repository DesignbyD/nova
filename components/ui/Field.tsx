import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { AlertIcon } from "./icons";

/* Shared wrapper: label, control, hint and error, wired together with ARIA. */

type ShellProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

function FieldShell({ id, label, hint, error, optional, className, children }: ShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-muted">optional</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-sm text-danger">
          <AlertIcon width={16} height={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

const control =
  "w-full rounded-control border bg-surface px-3.5 text-[0.9375rem] text-ink " +
  "placeholder:text-muted/80 transition-colors duration-150 " +
  "hover:border-ink focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent " +
  "disabled:cursor-not-allowed disabled:bg-paper-deep disabled:text-muted";

const controlBorder = (error?: string) => (error ? "border-danger" : "border-edge");

function describedBy(id: string, hint?: string, error?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type CommonProps = { label: string; hint?: string; error?: string; optional?: boolean; wrapperClassName?: string };

export function TextField({
  label,
  hint,
  error,
  optional,
  wrapperClassName,
  className,
  id,
  ...rest
}: CommonProps & InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cn(control, controlBorder(error), "h-12", className)}
        {...rest}
      />
    </FieldShell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  optional,
  wrapperClassName,
  className,
  id,
  ...rest
}: CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cn(control, controlBorder(error), "min-h-28 py-3 leading-relaxed", className)}
        {...rest}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  wrapperClassName,
  className,
  id,
  children,
  ...rest
}: CommonProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cn(control, controlBorder(error), "h-12 pr-9", className)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}
