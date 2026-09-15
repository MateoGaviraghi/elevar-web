import type { Order, OrderStatus } from "@/types";
import { readCollection, writeCollection } from "@/lib/local-db";

// Órdenes del mockup (sin backend): las crea el checkout, las lee la pantalla de
// estado y el panel de administración.

export function listOrders(): Order[] {
  return readCollection<Order>("orders", []);
}

export function saveOrder(order: Order): void {
  const rows = listOrders();
  const idx = rows.findIndex((o) => o.public_id === order.public_id);
  if (idx >= 0) rows[idx] = order;
  else rows.unshift(order);
  writeCollection("orders", rows);
}

export function getStoredOrder(id: string): Order | null {
  return listOrders().find((o) => o.public_id === id) ?? null;
}

export function setOrderStatus(
  id: string,
  status: OrderStatus,
  paidAt: string | null
): void {
  const rows = listOrders();
  const idx = rows.findIndex((o) => o.public_id === id);
  if (idx < 0) return;
  rows[idx] = { ...rows[idx], status, paid_at: paidAt };
  writeCollection("orders", rows);
}

export function deleteOrder(id: string): void {
  writeCollection(
    "orders",
    listOrders().filter((o) => o.public_id !== id)
  );
}
