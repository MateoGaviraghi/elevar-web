import { ReactNode } from "react";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertBannerProps {
  variant: AlertVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  success: "bg-status-success/10 text-status-success border border-status-success/20",
  error: "bg-status-error/10 text-status-error border border-status-error/20",
  warning: "bg-status-warning/10 text-status-warning border border-status-warning/20",
  info: "bg-status-info/10 text-status-info border border-status-info/20",
};

export function AlertBanner({ variant, children, className = "" }: AlertBannerProps) {
  return (
    <div
      role="alert"
      className={`rounded-md p-4 text-sm ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
