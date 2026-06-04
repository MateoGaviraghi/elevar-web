import type { Order, OrderStatus } from "@/types";

// Órdenes del mockup en localStorage (sin backend). El flujo de compra crea la orden
// en el checkout y la lee la página de estado.
const KEY = "elevar_orders_v1";

type Store = Record<string, Order>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(store));
}

export function saveOrder(order: Order): void {
  const store = read();
  store[order.public_id] = order;
  write(store);
}

export function getStoredOrder(id: string): Order | null {
  return read()[id] ?? null;
}

export function setOrderStatus(id: string, status: OrderStatus, paidAt: string | null): void {
  const store = read();
  if (store[id]) {
    store[id] = { ...store[id], status, paid_at: paidAt };
    write(store);
  }
}
