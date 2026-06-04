import type { CartItem } from "@/types";

const KEY = "elevar_cart_v1";

interface CartStorage {
  items: CartItem[];
  updatedAt: string;
}

function dispatchChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("elevar-cart-changed"));
}

export function getCart(): CartStorage {
  if (typeof window === "undefined") return { items: [], updatedAt: new Date().toISOString() };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { items: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as CartStorage;
  } catch {
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  const storage: CartStorage = { items, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(storage));
}

export function addItem(item: CartItem): void {
  if (typeof window === "undefined") return;
  const { items } = getCart();
  const exists = items.some(
    (i) => i.courseId === item.courseId && i.sessionId === item.sessionId
  );
  if (!exists) {
    saveCart([...items, item]);
    dispatchChanged();
  }
}

export function removeItem(courseId: number, sessionId: number | null): void {
  if (typeof window === "undefined") return;
  const { items } = getCart();
  const updated = items.filter(
    (i) => !(i.courseId === courseId && i.sessionId === sessionId)
  );
  saveCart(updated);
  dispatchChanged();
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  saveCart([]);
  dispatchChanged();
}

export function cartCount(): number {
  if (typeof window === "undefined") return 0;
  return getCart().items.length;
}
