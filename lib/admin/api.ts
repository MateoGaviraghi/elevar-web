/**
 * Cliente de la API del panel. Todo pedido de datos del panel pasa por acá (08-CODIGO):
 * un fetch por endpoint, siempre por el puente /api/panel/, con credentials "include",
 * cache "no-store" y el token CSRF en las escrituras.
 *
 * Nada se guarda en el almacenamiento del navegador: la sesión es una cookie HttpOnly.
 */
import type {
  Categoria,
  ConsultaCifras,
  Contadores,
  ConsultaDetalle,
  ConsultaFila,
  CursoDatos,
  CursoDetalle,
  CursoFila,
  ErrorApi,
  EstadoConsulta,
  Evento,
  Fecha,
  FechaInscripciones,
  InscripcionCifras,
  Inicio,
  Inscripto,
  PersonaInscripta,
  OrdenCifras,
  OrdenDetalle,
  OrdenFila,
  Pagina,
  PaginaCursor,
  SesionAbierta,
  Totales,
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

// --- Datos del panel (etapas 3 a 7) ----------------------------------------------------------

/** Arma ?a=1&b=2 sin los valores vacíos. Nunca correo, teléfono ni DNI en la dirección (07 §7). */
function consulta(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const texto = q.toString();
  return texto ? `?${texto}` : "";
}

type Params = Record<string, string | number | undefined | null>;

export const panel = {
  inicio: () => pedir<Inicio>("inicio"),
  /** Los números del menú lateral (un pedido liviano). */
  contadores: () => pedir<Contadores>("contadores"),

  consultas: (p: Params) => pedir<Pagina<ConsultaFila>>(`consultas${consulta(p)}`),
  consultaCifras: () => pedir<ConsultaCifras>("consultas/cifras"),
  consulta: (id: string) => pedir<ConsultaDetalle>(`consultas/${encodeURIComponent(id)}`),
  cambiarEstadoConsulta: (id: number, estado: EstadoConsulta) =>
    escribir<ConsultaDetalle>(`consultas/${id}/estado`, "POST", { estado }),
  /** Manda el correo escrito en el panel. `clave`: un UUID por intento (no se manda dos veces). */
  responderConsulta: (id: number, asunto: string, mensaje: string, clave: string) =>
    escribir<ConsultaDetalle>(`consultas/${id}/respuesta`, "POST", { asunto, mensaje, clave }),

  auditoria: (p: Params, cursor?: string | null) =>
    pedir<PaginaCursor<Evento>>(`auditoria${consulta({ ...p, cursor: cursor ?? undefined })}`),
  cambiarClave: (actual: string, nueva: string, cerrar_otras: boolean) =>
    escribir<{ otras_sesiones_cerradas: number }>("cuenta/clave", "POST", { actual, nueva, cerrar_otras }),
  codigosNuevos: () => escribir<{ codigos_respaldo: string[] }>("cuenta/codigos-respaldo", "POST"),
  sesiones: () => pedir<SesionAbierta[]>("cuenta/sesiones"),
  cerrarOtrasSesiones: () => escribir<{ cerradas: number }>("cuenta/sesiones/cerrar-otras", "POST"),

  fechasConInscripciones: () => pedir<FechaInscripciones[]>("inscripciones/fechas"),
  inscriptos: (sesion: number, p: Params) =>
    pedir<Pagina<Inscripto> & { fecha: FechaInscripciones }>(`inscripciones${consulta({ ...p, sesion })}`),
  fechasInscripciones: (p: Params) => pedir<Pagina<FechaInscripciones>>(`inscripciones/lista${consulta(p)}`),
  inscripcionCifras: () => pedir<InscripcionCifras>("inscripciones/cifras"),
  personasDeFecha: (sesion: number) =>
    pedir<{ fecha: FechaInscripciones; personas: PersonaInscripta[] }>(`inscripciones/personas${consulta({ sesion })}`),
  /** Queda en la auditoría como una exportación. */
  correosDeFecha: (sesion: number) => pedir<{ correos: string[] }>(`inscripciones/correos${consulta({ sesion })}`),
  /** Los datos del PDF de la fecha; queda en la auditoría como una exportación. */
  pdfDeFecha: (sesion: number) =>
    pedir<{ fecha: FechaInscripciones; personas: PersonaInscripta[] }>(`inscripciones/pdf${consulta({ sesion })}`),
    /** La exportación es un archivo: se descarga con un link al puente (GET, con la cookie). */
  urlExportarInscriptos: (sesion: number) => `${BASE}inscripciones/exportar${consulta({ sesion })}`,

  categorias: () => pedir<Categoria[]>("categorias"),
  cursos: (p: Params) => pedir<Pagina<CursoFila>>(`cursos${consulta(p)}`),
  curso: (id: string) => pedir<CursoDetalle>(`cursos/${encodeURIComponent(id)}`),
  crearCurso: (datos: Partial<CursoDatos>) => escribir<CursoDetalle>("cursos", "POST", datos),
  editarCurso: (id: number, datos: Partial<CursoDatos>) => escribir<CursoDetalle>(`cursos/${id}`, "PATCH", datos),
  agregarFecha: (cursoId: number, datos: Partial<Fecha>) => escribir<Fecha>(`cursos/${cursoId}/fechas`, "POST", datos),
  editarFecha: (id: number, datos: Partial<Fecha>) => escribir<Fecha>(`fechas/${id}`, "PATCH", datos),
  cancelarFecha: (id: number) => escribir<Fecha>(`fechas/${id}/cancelar`, "POST"),

  ordenes: (p: Params) => pedir<Pagina<OrdenFila> & { totales: Totales }>(`ordenes${consulta(p)}`),
  ordenCifras: () => pedir<OrdenCifras>("ordenes/cifras"),
  orden: (publicId: string) => pedir<OrdenDetalle>(`ordenes/${encodeURIComponent(publicId)}`),
  verDni: (publicId: string) => escribir<{ dni: string }>(`ordenes/${publicId}/dni`, "POST"),
  marcarCumplida: (publicId: string) => escribir<OrdenDetalle>(`ordenes/${publicId}/cumplida`, "POST"),
  guardarNota: (publicId: string, nota: string) => escribir<OrdenDetalle>(`ordenes/${publicId}/nota`, "POST", { nota }),
};

/** El cursor de la auditoría viene como URL completa del backend: se usa solo el parámetro. */
export function cursorDe(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).searchParams.get("cursor");
  } catch {
    return null;
  }
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
