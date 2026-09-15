import type { Attendee, CartItem } from "@/types";

const KEY = "elevar_cart_v2";

export interface CartStorage {
  items: CartItem[];
  /** Cupón cargado por el usuario, se conserva entre carrito y checkout. */
  coupon: string | null;
  updatedAt: string;
}

const EMPTY: CartStorage = { items: [], coupon: null, updatedAt: "" };

function dispatchChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("elevar-cart-changed"));
}

function sameLine(a: CartItem, courseId: number, sessionId: number | null): boolean {
  return a.courseId === courseId && a.sessionId === sessionId;
}

export function getCart(): CartStorage {
  if (typeof window === "undefined") return { ...EMPTY, updatedAt: new Date().toISOString() };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, updatedAt: new Date().toISOString() };
    const parsed = JSON.parse(raw) as Partial<CartStorage>;
    const items = (parsed.items ?? []).map((i) => ({
      ...i,
      // Carritos de la versión anterior no tenían cantidad.
      quantity: Math.max(1, Number(i.quantity ?? 1)),
    })) as CartItem[];
    return {
      items,
      coupon: parsed.coupon ?? null,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return { ...EMPTY, updatedAt: new Date().toISOString() };
  }
}

function persist(next: Partial<CartStorage>): void {
  if (typeof window === "undefined") return;
  const current = getCart();
  const storage: CartStorage = {
    items: next.items ?? current.items,
    coupon: next.coupon !== undefined ? next.coupon : current.coupon,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(storage));
  dispatchChanged();
}

export function saveCart(items: CartItem[]): void {
  persist({ items });
}

/** Agrega el ítem; si ya estaba (mismo curso + fecha), suma unidades. */
export function addItem(item: CartItem): void {
  if (typeof window === "undefined") return;
  const { items } = getCart();
  const idx = items.findIndex((i) => sameLine(i, item.courseId, item.sessionId));
  const quantity = Math.max(1, item.quantity || 1);
  if (idx >= 0) {
    const merged = { ...items[idx], quantity: items[idx].quantity + quantity };
    persist({ items: items.map((i, n) => (n === idx ? trimAttendees(merged) : i)) });
  } else {
    persist({ items: [...items, trimAttendees({ ...item, quantity })] });
  }
}

export function setQuantity(
  courseId: number,
  sessionId: number | null,
  quantity: number
): void {
  const { items } = getCart();
  const q = Math.max(1, Math.min(50, Math.trunc(quantity) || 1));
  persist({
    items: items.map((i) =>
      sameLine(i, courseId, sessionId) ? trimAttendees({ ...i, quantity: q }) : i
    ),
  });
}

export function setAttendees(
  courseId: number,
  sessionId: number | null,
  attendees: Attendee[]
): void {
  const { items } = getCart();
  persist({
    items: items.map((i) => (sameLine(i, courseId, sessionId) ? { ...i, attendees } : i)),
  });
}

/** Recorta o completa la lista de asistentes para que coincida con la cantidad. */
function trimAttendees(item: CartItem): CartItem {
  if (!item.attendees) return item;
  const next = item.attendees.slice(0, item.quantity);
  while (next.length < item.quantity) next.push({ name: "", email: "" });
  return { ...item, attendees: next };
}

export function removeItem(courseId: number, sessionId: number | null): void {
  const { items } = getCart();
  persist({ items: items.filter((i) => !sameLine(i, courseId, sessionId)) });
}

export function setCoupon(code: string | null): void {
  persist({ coupon: code && code.trim() ? code.trim().toUpperCase() : null });
}

export function getCoupon(): string | null {
  return getCart().coupon;
}

export function clearCart(): void {
  persist({ items: [], coupon: null });
}

/** Unidades totales (no líneas), que es lo que muestra el ícono del header. */
export function cartCount(): number {
  if (typeof window === "undefined") return 0;
  return getCart().items.reduce((acc, i) => acc + i.quantity, 0);
}
