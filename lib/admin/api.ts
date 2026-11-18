/**
 * Cliente de la API del panel. Todo pedido de datos del panel pasa por acá (08-CODIGO):
 * un fetch por endpoint, siempre por el puente /api/panel/, con credentials "include",
 * cache "no-store" y el token CSRF en las escrituras.
 *
 * Nada se guarda en el almacenamiento del navegador: la sesión es una cookie HttpOnly.
 */
import type {
  ErrorApi,
  IngresoRespuesta,
  PrimerIngresoDatos,
  PrimerIngresoRespuesta,
  Yo,
} from "./tipos";

const BASE = "/api/panel/";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  get sinSesion() {
    return this.status === 401;
  }

  get sinPermiso() {
    return this.status === 403;
  }

  get noEncontrado() {
    return this.status === 404;
  }

  get demasiados() {
    return this.status === 429;
  }
}

/** Error de red o del servidor: la pantalla muestra «Reintentar». */
export const ERROR_RED = "RED";

function esErrorApi(valor: unknown): valor is ErrorApi {
  if (typeof valor !== "object" || valor === null || !("error" in valor)) return false;
  const error = (valor as { error: unknown }).error;
  return typeof error === "object" && error !== null && "code" in error;
}

async function leer<T>(respuesta: Response): Promise<T> {
  if (respuesta.status === 204) return undefined as T;
  let cuerpo: unknown = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = null;
  }
  if (respuesta.ok) return cuerpo as T;
  if (esErrorApi(cuerpo)) {
    throw new ApiError(respuesta.status, cuerpo.error.code, cuerpo.error.message, cuerpo.error.field_errors);
  }
  throw new ApiError(respuesta.status, ERROR_RED, "Algo falló. Reintentá.");
}

async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(BASE + ruta, { ...init, credentials: "include", cache: "no-store" });
  } catch {
    throw new ApiError(0, ERROR_RED, "No pudimos conectar. Reintentá.");
  }
  return leer<T>(respuesta);
}

/**
 * Token CSRF fresco antes de cada escritura: Django lo cambia al ingresar, y en producción la
 * cookie es HttpOnly, así que se toma del cuerpo de csrf/ (decidido 2026-11-18).
 */
async function tokenCsrf(): Promise<string> {
  const { csrf_token } = await pedir<{ csrf_token: string }>("csrf");
  return csrf_token;
}

async function escribir<T>(ruta: string, metodo: "POST" | "PUT" | "PATCH" | "DELETE", datos?: unknown): Promise<T> {
  const token = await tokenCsrf();
  return pedir<T>(ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json", "X-CSRFToken": token },
    body: datos === undefined ? undefined : JSON.stringify(datos),
  });
}

// --- Ingreso y sesión (etapa 1 del backend) -------------------------------------------------

export function ingresar(correo: string, clave: string) {
  return escribir<IngresoRespuesta>("ingreso", "POST", { correo, clave });
}

export function enviarCodigo(codigo: string) {
  return escribir<{ paso: "listo" }>("ingreso/codigo", "POST", { codigo });
}

export function datosPrimerIngreso() {
  return pedir<PrimerIngresoDatos>("primer-ingreso");
}

export function confirmarPrimerIngreso(codigo: string, claveNueva?: string) {
  return escribir<PrimerIngresoRespuesta>("primer-ingreso", "POST", {
    codigo,
    ...(claveNueva ? { clave_nueva: claveNueva } : {}),
  });
}

export function salir() {
  return escribir<void>("salida", "POST");
}

export function yo() {
  return pedir<Yo>("yo");
}

// --- Ayudas para las pantallas -------------------------------------------------------------

/** Solo rutas internas del panel: evita que ?volver= mande a otro sitio. */
export function rutaDeVuelta(valor: string | null | undefined): string {
  if (!valor || !valor.startsWith("/admin") || valor.startsWith("//") || valor.includes("\\")) return "/admin";
  if (valor.startsWith("/admin/ingresar") || valor.startsWith("/admin/primer-ingreso")) return "/admin";
  return valor;
}

export function rutaDeIngreso(volver?: string): string {
  const destino = rutaDeVuelta(volver);
  return destino === "/admin" ? "/admin/ingresar" : `/admin/ingresar?volver=${encodeURIComponent(destino)}`;
}
