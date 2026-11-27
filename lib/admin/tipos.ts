/**
 * Tipos del panel: copian campo por campo las respuestas de Django (elevar-backend/panel).
 * Si cambia un serializer o una vista, cambia este archivo en el mismo PR (08-CODIGO).
 */

export type Rol = "admin";

/** POST ingreso/ → paso siguiente. */
export interface IngresoRespuesta {
  paso: "codigo" | "primer-ingreso";
}

/** GET yo/ (YoSerializer). */
export interface Yo {
  nombre: string;
  correo: string;
  rol: Rol;
  segundo_factor_listo: boolean;
  cambiar_clave: boolean;
}

/** GET primer-ingreso/ (panel.ingreso.datos_primer_ingreso). */
export interface PrimerIngresoDatos {
  otpauth_url: string;
  /** Imagen SVG en una dirección data:, para un <img>. */
  qr: string;
  /** La clave en base32, para cargarla a mano. */
  clave: string;
  cambiar_clave: boolean;
}

/** POST primer-ingreso/ → los 10 códigos de respaldo, una sola vez. */
export interface PrimerIngresoRespuesta {
  codigos_respaldo: string[];
}

/** Formato común de error del backend (core/exceptions.py). */
export interface ErrorApi {
  error: {
    code: string;
    message: string;
    field_errors?: Record<string, string[]>;
  };
}

// --- Listas paginadas (core/pagination.py y CursorPagination de la auditoría) ----------------

export interface Pagina<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface EventoHistorial {
  fecha: string;
  persona: string;
  accion: string;
  detalle: Record<string, unknown>;
}

// --- Inicio --------------------------------------------------------------------------------

export interface Inicio {
  consultas_nuevas: number;
  ordenes_sin_cumplir: number;
  proxima_fecha: {
    id: number;
    curso: string;
    modalidad: Modalidad;
    inicio: string;
    inscriptos: number;
    cupo: number | null;
  } | null;
  consultas_viejas: Pick<ConsultaFila, "id" | "created_at" | "name" | "company" | "source" | "subject">[];
  // Los gráficos del Inicio (2026-11-24): solo lo que tiene historia, todo de la base.
  consultas_dias: { dia: string; n: number }[]; // últimos 30 días, hoy al final
  consultas_dias_antes: { dia: string; n: number }[]; // los 30 anteriores
  compras_meses: { mes: string; cantidad: number; montos: Record<string, string> }[]; // 12 meses, por moneda
  cursos_mas_vendidos: { cursos: { id: number; codigo: string; curso: string; lugares: number }[]; resto: number };
  proximas_fechas: NonNullable<Inicio["proxima_fecha"]>[];
  // Los tres pisos (2026-11-24, segunda pasada).
  arrepentimientos: { id: number; name: string; created_at: string; vence: string }[]; // sin contestar, vencen a las 24 h
  sin_acceso_desde: string | null; // cuándo pagó la compra sin acceso al aula más vieja
  compras_sin_completar: {
    cantidad: number;
    ordenes: { public_id: string; created_at: string; buyer_name: string; total: string; currency: string; status: string; payment_method: string }[];
  };
  ritmo_inscripcion: { dia: string; n: number }[]; // inscriptos acumulados de la próxima fecha (solo webinars)
  consultas_por_origen: { origen: OrigenConsulta; n: number }[]; // últimos 90 días
  webinar_a_compra: { inscriptos: number; compraron: number }; // últimos 12 meses, cruzado por correo
  tiempo_respuesta: { mediana_horas: number | null; medidas: number; mediana_horas_antes: number | null; medidas_antes: number };
}

// --- Consultas (etapa 3) -------------------------------------------------------------------

export type EstadoConsulta = "NEW" | "CONTACTED" | "CLOSED";
export type OrigenConsulta = "CONTACTO" | "COMUNIDAD" | "WEBINAR" | "ARREPENTIMIENTO";

/** ConsultaListaSerializer: sin mensaje, correo ni teléfono. */
export interface ConsultaFila {
  id: number;
  created_at: string;
  name: string;
  company: string;
  source: OrigenConsulta;
  subject: string;
  status: EstadoConsulta;
  /** Solo los pedidos de arrepentimiento: hasta cuándo hay para contestar (24 h, Res. 424/2020). */
  vence: string | null;
}

/** La banda de Consultas y la pestaña «Cuándo llegan». */
export interface ConsultaCifras {
  sin_contestar: number;
  arrepentimiento: number;
  vencidos: number;
  contactadas: number;
  cerradas: number;
  dias_mapa: number;
  por_hora: { dia: number; hora: number; n: number }[];
}

export interface ConsultaDetalle extends ConsultaFila {
  updated_at: string;
  email: string;
  phone: string;
  message: string;
  historial: EventoHistorial[];
}

// --- Auditoría y Mi cuenta (etapa 4) -------------------------------------------------------

export interface Evento {
  id: number;
  created_at: string;
  persona: string;
  accion: string;
  entidad: string;
  entidad_id: string;
  detalle: Record<string, unknown>;
  ip: string | null;
}

export interface AuditoriaCifras {
  total: number;
  hoy: number;
  semana: number;
  ingresos: number;
  fallidos: number;
  cursos: number;
  atencion: number;
}

export interface MiCuenta {
  nombre: string;
  correo: string;
  rol: string;
  creada_en: string;
  segundo_factor_listo: boolean;
  codigos_sin_usar: number;
  sesiones: number;
}

export interface Movimiento {
  id: number;
  created_at: string;
  accion: string;
  entidad: string;
  entidad_id: string;
  detalle: Record<string, unknown>;
}

export interface SesionAbierta {
  id: string;
  dispositivo: string;
  ingreso_en: string | null;
  ultimo_uso_en: string | null;
  actual: boolean;
}

// --- Inscripciones (etapa 5) ---------------------------------------------------------------

export type Modalidad = "ASYNC" | "LIVE" | "WEBINAR" | "WORKSHOP";
export type EstadoFecha = "SCHEDULED" | "CANCELLED" | "FINISHED";

export interface FechaInscripciones {
  id: number;
  curso: string;
  codigo: string;
  modalidad: Modalidad;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  seats_taken: number;
  status: EstadoFecha;
  /** En un webinar, los anotados; en un curso en vivo, los lugares pagos (como el Inicio). */
  inscriptos: number;
  curso_id: number;
}

export interface InscripcionCifras {
  proximas: number;
  semana: number;
  llenas: number;
  pasadas: number;
  personas_proximas: number;
}

/** Quién viene a una fecha: en un webinar, el que se anotó; en vivo, un participante de una orden pagada.
 *  `comprador` + `sin_nombre`: los lugares de una orden que no cargó a sus participantes. */
export interface PersonaInscripta {
  nombre: string;
  correo: string;
  fecha: string;
  orden: string | null;
  numero: string;
  sin_nombre: number;
  comprador: boolean;
  /** En vivo, el de quien compró (`telefono_de`); en un webinar, el que dejó al anotarse. Puede venir vacío. */
  telefono: string;
  telefono_de: string;
}

export interface Inscripto {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

// --- Cursos (etapa 6) ----------------------------------------------------------------------

export interface CursoFila {
  id: number;
  code: string;
  title: string;
  modality: Modalidad;
  /** Plata: texto con dos decimales («48000.00»). */
  price: string;
  currency: string;
  is_published: boolean;
  proxima_fecha: string | null;
  price_usd: string | null;
  is_featured: boolean;
  badge: "" | "NUEVO" | "PROXIMO";
  category: number;
  category_nombre: string;
}

/** La banda de Cursos: las cuatro cifras que filtran y el total. */
export interface CursoCifras {
  total: number;
  publicados: number;
  borradores: number;
  con_fecha: number;
  sin_fecha: number;
}

export interface CursoDatos {
  code: string;
  title: string;
  slug: string;
  summary: string;
  lead: string;
  description: string;
  objectives: string;
  syllabus: string[];
  category: number;
  modality: Modalidad;
  price: string;
  price_usd: string | null;
  currency: string;
  level: string;
  duration_hours: number | null;
  instructor_names: string;
  instructor_role: string;
  pdf_url: string;
  code_suffix: string;
  position: number;
  is_published: boolean;
  is_featured: boolean;
  badge: "" | "NUEVO" | "PROXIMO";
}

export interface Fecha {
  id: number;
  starts_at: string;
  ends_at: string;
  timezone: string;
  capacity: number | null;
  seats_taken: number;
  status: EstadoFecha;
  inscriptos: number;
  compras: number;
}

export interface CursoDetalle extends CursoDatos {
  id: number;
  category_nombre: string;
  created_at: string;
  updated_at: string;
  fechas: Fecha[];
  historial: EventoHistorial[];
}

export interface Categoria {
  id: number;
  name: string;
}

// --- Órdenes (etapa 7) ---------------------------------------------------------------------

export type EstadoOrden = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "FULFILLED";

export type MedioDePago = "MERCADOPAGO" | "STRIPE";

export interface OrdenFila {
  public_id: string;
  /** El número corto que ve el comprador: los primeros 8 caracteres en mayúsculas («F66DC23D»). */
  numero: string;
  created_at: string;
  paid_at: string | null;
  /** Devolución total o contracargo avisado por Mercado Pago o Stripe: el estado no cambia. */
  refunded_at: string | null;
  buyer_name: string;
  cursos: string[];
  total: string;
  currency: string;
  status: EstadoOrden;
  payment_method: MedioDePago;
}

export interface OrdenCifras {
  falta_acceso: number;
  /** De las que esperan el acceso, las pagadas hace más de 24 h. */
  demoradas: number;
  sin_completar: number;
  cumplidas: number;
  devueltas: number;
  /** Lo cobrado en el mes, una fila por moneda: nunca se suman pesos con dólares. */
  cobrado_mes: { moneda: string; cantidad: number; suma: string }[];
}

export interface Contadores {
  consultas: number;
  ordenes: number;
}

export interface Totales {
  cantidad: number;
  por_moneda: { moneda: string; cantidad: number; suma: string }[];
}

export interface OrdenDetalle {
  public_id: string;
  numero: string;
  status: EstadoOrden;
  created_at: string;
  paid_at: string | null;
  fulfilled_at: string | null;
  refunded_at: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_company: string;
  dni_enmascarado: string;
  items: {
    title_snapshot: string;
    fecha: string | null;
    quantity: number;
    unit_price: string;
    total: string;
    participantes: { nombre: string; correo: string }[];
  }[];
  subtotal: string;
  discount_total: string;
  discount_label: string;
  total: string;
  currency: string;
  payment_method: MedioDePago;
  mp_payment_id: string;
  mp_status: string;
  stripe_payment_intent_id: string;
  admin_notes: string;
  historial: EventoHistorial[];
}
