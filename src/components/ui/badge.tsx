import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-app-bg text-muted",
        primary: "bg-soft text-primary",
        pendiente: "bg-status-pending-bg text-status-pending",
        progreso: "bg-status-progress-bg text-status-progress",
        finalizado: "bg-status-done-bg text-status-done",
        error: "bg-status-error-bg text-status-error",
        inactivo: "bg-status-inactive-bg text-status-inactive",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dotClassName?: string;
}

function Badge({ className, variant, dotClassName, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      <span className={cn("size-1.5 rounded-full bg-current opacity-70", dotClassName)} />
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
