import { ReactNode } from "react";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "error" | "info";

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-neutral-200 text-ink-800",
  brand: "bg-brand-100 text-brand-700",
  success: "bg-status-success/10 text-status-success",
  warning: "bg-status-warning/10 text-status-warning",
  error: "bg-status-error/10 text-status-error",
  info: "bg-status-info/10 text-status-info",
};

export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold tracking-wide ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
