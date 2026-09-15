import type { AdminSession } from "@/types";

/**
 * Login simple de mockup (usuario + contraseña), tal como pide el alcance para
 * el panel. Cuando exista el backend, `signIn` pega contra la API y guarda el
 * token; la sesión sigue leyéndose con `getSession`.
 */

const KEY = "elevar_admin_session";
const EVENT = "elevar-admin-session";

interface DemoUser {
  username: string;
  password: string;
  name: string;
}

const USERS: DemoUser[] = [
  { username: "admin", password: "elevar2026", name: "Laura Delissi" },
  { username: "elevar", password: "elevar2026", name: "Equipo Elevar" },
];

export const DEMO_CREDENTIALS = { username: "admin", password: "elevar2026" };

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export async function signIn(
  username: string,
  password: string
): Promise<AdminSession> {
  // Latencia simulada para que el formulario muestre su estado de carga.
  await new Promise((r) => setTimeout(r, 450));
  const user = USERS.find(
    (u) => u.username === username.trim().toLowerCase() && u.password === password
  );
  if (!user) throw new Error("Usuario o contraseña incorrectos.");
  const session: AdminSession = {
    username: user.username,
    name: user.name,
    logged_at: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(EVENT));
  return session;
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function onSessionChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
