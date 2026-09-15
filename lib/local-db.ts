/**
 * "Base de datos" del mockup: colecciones en localStorage sembradas con los
 * datos estáticos del sitio. Reemplaza al backend mientras el front se desarrolla
 * solo; las firmas de lib/api.ts no cambian cuando se conecte la API real.
 */

const PREFIX = "elevar_db_";

export type CollectionName =
  | "courses"
  | "posts"
  | "promos"
  | "leads"
  | "webinars"
  | "orders";

const CHANGED_EVENT = "elevar-db-changed";

function key(name: CollectionName): string {
  return `${PREFIX}${name}`;
}

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Lee la colección; si no existe todavía, la siembra con `seed`. */
export function readCollection<T>(name: CollectionName, seed: T[]): T[] {
  if (!isBrowser()) return seed;
  try {
    const raw = localStorage.getItem(key(name));
    if (raw == null) {
      localStorage.setItem(key(name), JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : seed;
  } catch {
    return seed;
  }
}

export function writeCollection<T>(name: CollectionName, rows: T[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key(name), JSON.stringify(rows));
  } catch {
    /* quota / modo privado: el mockup sigue funcionando en memoria */
  }
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT, { detail: name }));
}

export function onCollectionChange(cb: (name: CollectionName) => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = (e: Event) => cb((e as CustomEvent).detail as CollectionName);
  window.addEventListener(CHANGED_EVENT, handler);
  return () => window.removeEventListener(CHANGED_EVENT, handler);
}

/** Vuelve a los datos semilla (botón "restablecer" del panel). */
export function resetCollection(name: CollectionName): void {
  if (!isBrowser()) return;
  localStorage.removeItem(key(name));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT, { detail: name }));
}

export function resetAll(): void {
  (["courses", "posts", "promos", "leads", "webinars", "orders"] as CollectionName[]).forEach(
    (n) => {
      if (isBrowser()) localStorage.removeItem(key(n));
    }
  );
  if (isBrowser()) window.dispatchEvent(new CustomEvent(CHANGED_EVENT, { detail: "courses" }));
}

export function newId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function nextNumericId(rows: { id: number }[]): number {
  return rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}
