import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-btn)] border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted/70 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-status-error aria-[invalid=true]:ring-status-error/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
