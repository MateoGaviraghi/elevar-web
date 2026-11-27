/**
 * Cliente de la API del panel. Todo pedido de datos del panel pasa por acá (08-CODIGO):
 * un fetch por endpoint, siempre por el puente /api/panel/, con credentials "include",
 * cache "no-store" y el token CSRF en las escrituras.
 *
 * Nada se guarda en el almacenamiento del navegador: la sesión es una cookie HttpOnly.
 */
import type {
  AvisoCobro,
  Categoria,
  ConsultaCifras,
  Contadores,
  ConsultaDetalle,
  ConsultaFila,
  CursoCifras,
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
  AuditoriaCifras,
  MiCuenta,
  Movimiento,
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

// --- Memoria de lo último visto (Etapa 3, 2026-11-26: «navego entre las páginas y está súper lento») ---------
// Cada lectura guarda su respuesta por dirección, solo en la memoria de esta pestaña (nunca en el disco): al volver
// a una pantalla se muestra al instante y se actualiza por detrás (`components/admin/lista/memoria.ts`). Se borra
// al salir y cuando la sesión vence.

const recuerdo = new Map<string, unknown>();
/** De qué dirección vino cada respuesta guardada (para saber si una pantalla muestra datos de otro filtro). */
export const origenDe = new WeakMap<object, string>();
let capturar: ((ruta: string) => void) | null = null;

/** La dirección que pediría `fn`, sin pedir nada (null si no pasa por una lectura simple). */
export function rutaDe(fn: () => Promise<unknown>): string | null {
  let ruta: string | null = null;
  capturar = (r) => { ruta = r; };
  try { void fn().catch(() => {}); } catch { /* nada */ } finally { capturar = null; }
  return ruta;
}
export const recordado = <T,>(ruta: string) => recuerdo.get(ruta) as T | undefined;
export function olvidarTodo() { recuerdo.clear(); }

async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const lectura = !init.method && ruta !== "csrf";
  if (capturar && lectura) { capturar(ruta); return new Promise<T>(() => {}); }
  const datos = await pedirSinMemoria<T>(ruta, init);
  if (lectura && typeof datos === "object" && datos !== null) { recuerdo.set(ruta, datos); origenDe.set(datos, ruta); }
  return datos;
}

async function pedirSinMemoria<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(BASE + ruta, { ...init, credentials: "include", cache: "no-store" });
  } catch {
    throw new ApiError(0, ERROR_RED, "No pudimos conectar. Reintentá.");
  }
  if (respuesta.status === 401) olvidarTodo();
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
  // En orden alfabético: la misma consulta da siempre la misma dirección (la memoria y la precarga la usan de clave).
  for (const [k, v] of Object.entries(params).sort(([a], [b]) => a.localeCompare(b))) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
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

  auditoria: (p: Params) => pedir<Pagina<Evento>>(`auditoria${consulta(p)}`),
  auditoriaCifras: () => pedir<AuditoriaCifras>("auditoria/cifras"),
  miCuenta: () => pedir<MiCuenta>("cuenta"),
  cambiarNombre: (nombre: string) => escribir<MiCuenta>("cuenta", "PATCH", { nombre }),
  miActividad: () => pedir<Movimiento[]>("cuenta/actividad"),
  cerrarSesionDe: (id: string) => escribir<{ cerrada: boolean }>(`cuenta/sesiones/${encodeURIComponent(id)}/cerrar`, "POST"),
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
  cursoCifras: () => pedir<CursoCifras>("cursos/cifras"),
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
  /** Le vuelve a mandar al comprador el mail de compra confirmada (una vez cada 10 minutos). */
  reenviarConfirmacion: (publicId: string) => escribir<OrdenDetalle>(`ordenes/${publicId}/reenviar-confirmacion`, "POST"),

  avisos: () => pedir<AvisoCobro[]>("avisos"),
  resolverAviso: (id: number, nota: string) => escribir<void>(`avisos/${id}/resolver`, "POST", { nota }),
  posponerAviso: (id: number) => escribir<void>(`avisos/${id}/posponer`, "POST"),
};


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
