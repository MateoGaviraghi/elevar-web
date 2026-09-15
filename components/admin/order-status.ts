import type { OrderStatus, PaymentMethod } from "@/types";

export const ORDER_STATUS_CHIP: Record<OrderStatus, { label: string; tone: string }> = {
  PENDING: { label: "Pendiente", tone: "warn" },
  PAID: { label: "Pagada", tone: "ok" },
  FULFILLED: { label: "Entregada", tone: "ok" },
  FAILED: { label: "Fallida", tone: "bad" },
  CANCELLED: { label: "Cancelada", tone: "bad" },
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  MERCADOPAGO: "Mercado Pago",
  PAYPAL: "PayPal",
  TRANSFER: "Transferencia",
};
