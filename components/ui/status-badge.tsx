import type { OrderStatus } from "@/types";
import { Badge, BadgeTone } from "./badge";

export interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const STATUS_MAP: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Pendiente", tone: "warning" },
  PAID: { label: "Pagada", tone: "success" },
  FAILED: { label: "Fallida", tone: "error" },
  CANCELLED: { label: "Cancelada", tone: "neutral" },
  FULFILLED: { label: "Cumplida", tone: "success" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, tone } = STATUS_MAP[status];
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}
