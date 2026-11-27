/**
 * Textos del panel en castellano: un solo lugar para estados, acciones y errores (08-CODIGO).
 */

export const ROLES: Record<string, string> = {
  admin: "Administración",
};

/** Texto de un error de la API, elegido por su código (07-SEGURIDAD §9). */
const ERRORES: Record<string, string> = {
  CREDENCIALES_INVALIDAS: "Correo o contraseña incorrectos.",
  INGRESO_BLOQUEADO: "Demasiados intentos. Probá de nuevo en 15 minutos.",
  RATE_LIMITED: "Demasiados intentos. Probá de nuevo en 15 minutos.",
  CODIGO_INCORRECTO: "Código incorrecto.",
  CLAVE_TEMPORAL_VENCIDA: "La contraseña temporal venció. Pedí una nueva.",
  SESION_VENCIDA: "La sesión venció. Ingresá de nuevo.",
  SIN_SESION: "Tenés que ingresar de nuevo.",
  SIN_PERMISO: "No tenés acceso a esta sección.",
  FALTA_SEGUNDO_FACTOR: "Primero configurá el segundo factor.",
  BACKEND_NO_DISPONIBLE: "No pudimos conectar. Reintentá.",
  RED: "No pudimos conectar. Reintentá.",
  ENVIO_FALLIDO: "No se pudo enviar el correo. Probá de nuevo en un momento.",
  DEMASIADO_PRONTO: "Ya se reenvió hace menos de 10 minutos. Esperá un poco.",
};

export function textoDeError(code: string | undefined, porDefecto = "Algo falló. Reintentá."): string {
  return (code && ERRORES[code]) || porDefecto;
}

/** Fecha larga de hoy para el inicio: «martes 18 de noviembre». */
export function fechaDeHoy(fecha = new Date()): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Argentina/Cordoba",
  }).format(fecha);
}

// --- Estados y orígenes (un solo lugar, 08-CODIGO) -------------------------------------------

export type Tono = "neutral" | "ok" | "warn" | "bad" | "brand" | "ink";

export const ESTADO_CONSULTA: Record<string, { texto: string; tono: Tono }> = {
  NEW: { texto: "Nueva", tono: "warn" },
  CONTACTED: { texto: "Contactada", tono: "ok" },
  CLOSED: { texto: "Cerrada", tono: "neutral" },
};

export const ORIGEN_CONSULTA: Record<string, string> = {
  CONTACTO: "Formulario",
  COMUNIDAD: "Comunidad de WhatsApp",
  WEBINAR: "Webinar",
  ARREPENTIMIENTO: "Arrepentimiento",
};

export const ESTADO_ORDEN: Record<string, { texto: string; tono: Tono }> = {
  PENDING: { texto: "Pendiente", tono: "warn" },
  PAID: { texto: "Pagada", tono: "ok" },
  FAILED: { texto: "Fallida", tono: "bad" },
  CANCELLED: { texto: "Cancelada", tono: "neutral" },
  FULFILLED: { texto: "Cumplida", tono: "ok" },
};

export const MEDIO_DE_PAGO: Record<string, string> = { MERCADOPAGO: "Mercado Pago", STRIPE: "Stripe" };

export const MODALIDAD: Record<string, string> = {
  ASYNC: "Asincrónico",
  LIVE: "En vivo",
  WEBINAR: "Webinar",
  WORKSHOP: "Taller",
};

export const ESTADO_FECHA: Record<string, { texto: string; tono: Tono }> = {
  SCHEDULED: { texto: "Programada", tono: "ok" },
  CANCELLED: { texto: "Cancelada", tono: "bad" },
  FINISHED: { texto: "Finalizada", tono: "neutral" },
};

/** Las acciones de la auditoría, en palabras (05-PANTALLAS, Auditoría). */
export const ACCION: Record<string, string> = {
  "ingreso.ok": "Ingresó al panel",
  "ingreso.fallido": "Intento de ingreso fallido",
  "ingreso.bloqueado": "Ingreso bloqueado por intentos",
  "codigo.fallido": "Código incorrecto",
  "sesion.cerrada": "Cerró sesión",
  "sesion.vencida": "La sesión venció",
  "segundo_factor.confirmado": "Configuró el segundo factor",
  "segundo_factor.codigos_nuevos": "Generó códigos de respaldo nuevos",
  "clave.cambiada": "Cambió su contraseña",
  "usuario.alta": "Alta de usuario",
  "usuario.baja": "Baja de usuario",
  "usuario.rol": "Cambio de rol",
  "usuario.nombre": "Cambió su nombre",
  "usuario.segundo_factor_reiniciado": "Reinicio del segundo factor",
  "consulta.estado": "Cambió el estado de una consulta",
  "consulta.respuesta": "Contestó una consulta por correo",
  "orden.cumplida": "Marcó una orden como cumplida",
  "orden.devuelta": "Se devolvió el pago de una orden",
  "orden.nota": "Escribió una nota en una orden",
  "orden.ver_dni": "Vio el DNI de un comprador",
  "orden.confirmacion_reenviada": "Reenvió el mail de compra confirmada",
  "aviso.resuelto": "Resolvió un aviso de cobro",
  "aviso.pospuesto": "Pospuso un aviso de cobro",
  "curso.alta": "Creó un curso",
  "curso.cambio": "Editó un curso",
  "fecha.alta": "Agregó una fecha",
  "fecha.cambio": "Editó una fecha",
  "fecha.cancelada": "Canceló una fecha",
  exportacion: "Exportó datos",
  "permiso.denegado": "Acceso denegado",
};

export const ENTIDAD: Record<string, string> = {
  lead: "Consulta",
  order: "Orden",
  course: "Curso",
  course_session: "Fecha",
  user: "Usuario",
  permiso: "Permiso",
  aviso: "Aviso de cobro",
};

/** El detalle de un evento en palabras cortas: «Nueva → Contactada», «price, title». */
export function detalleDeEvento(detalle: Record<string, unknown>): string {
  const partes: string[] = [];
  for (const [clave, valor] of Object.entries(detalle)) {
    if (clave === "status" && Array.isArray(valor) && valor.length === 2) {
      const [antes, despues] = valor.map((v) => ESTADO_CONSULTA[String(v)]?.texto ?? ESTADO_ORDEN[String(v)]?.texto ?? String(v));
      partes.push(`${antes} → ${despues}`);
    } else if (clave === "campos" && Array.isArray(valor)) {
      partes.push(`Campos: ${valor.join(", ")}`);
    } else if (clave === "filas") {
      partes.push(`${String(valor)} filas`);
    } else if (typeof valor === "string" || typeof valor === "number" || typeof valor === "boolean") {
      partes.push(`${clave}: ${String(valor)}`);
    }
  }
  return partes.join(" · ");
}

/** Los campos de un curso o una fecha, en palabras (la auditoría guarda el nombre técnico). */
export const CAMPO_CURSO: Record<string, string> = {
  title: "título", slug: "dirección", code: "código", code_suffix: "mes y año", category: "categoría", modality: "modalidad",
  price: "precio", price_usd: "precio en dólares", badge: "etiqueta", position: "posición", is_published: "publicación", is_featured: "destacado",
  lead: "bajada", summary: "resumen", description: "descripción", objectives: "objetivos", syllabus: "temario",
  instructor_names: "disertantes", instructor_role: "cargo", level: "nivel", duration_hours: "duración", pdf_url: "PDF", currency: "moneda",
  starts_at: "inicio", ends_at: "fin", capacity: "cupo", location: "lugar", meeting_url: "link de la reunión", status: "estado",
};

const MOTIVO: Record<string, string> = {
  clave_temporal_vencida: "la contraseña temporal había vencido",
  primer_ingreso: "en el primer ingreso",
  sin_permiso: "sin permiso",
  sin_perfil: "usuario sin perfil del panel",
};
const EXPORTA: Record<string, string> = { correos: "copió los correos", pdf: "bajó el PDF de la lista", inscripciones: "bajó la planilla de inscriptos" };

/**
 * El detalle de un evento como líneas en castellano para la tarjeta de Auditoría y Mi cuenta (2026-11-26,
 * Mateo: «Campos: is_published» no se entiende). Nunca muestra lo que no sea del evento: ni el mensaje de una
 * respuesta entera ni claves.
 */
export function detalleEnPalabras(accion: string, detalle: Record<string, unknown>): string[] {
  const d = detalle ?? {};
  const lineas: string[] = [];
  const campos = Array.isArray(d.campos) ? (d.campos as string[]) : [];
  if (accion === "curso.cambio" && campos.length === 1 && campos[0] === "is_published") lineas.push("Publicó o sacó del sitio el curso");
  else if (campos.length) lineas.push(`Cambió ${campos.map((c) => CAMPO_CURSO[c] ?? c).join(", ")}`);
  if (Array.isArray(d.status) && d.status.length === 2) {
    const [a, b] = d.status.map((v) => ESTADO_CONSULTA[String(v)]?.texto ?? ESTADO_ORDEN[String(v)]?.texto ?? String(v));
    lineas.push(`${a} → ${b}`);
  }
  if (typeof d.codigo === "string") lineas.push(`Código ${d.codigo}`);
  if (typeof d.curso === "number" || typeof d.curso === "string") lineas.push(`Del curso n.º ${d.curso}`);
  if (typeof d.asunto === "string") lineas.push(`Asunto: «${d.asunto}»`);
  if (typeof d.que === "string") lineas.push(`${EXPORTA[d.que] ?? d.que}${typeof d.filas === "number" ? ` (${d.filas} ${d.filas === 1 ? "fila" : "filas"})` : ""}`);
  if (typeof d.largo === "number") lineas.push(`Nota de ${d.largo} caracteres`);
  if (typeof d.motivo === "string") lineas.push(`Motivo: ${MOTIVO[d.motivo] ?? d.motivo.replaceAll("_", " ")}`);
  if (d.paso === "clave") lineas.push("En el paso de la contraseña");
  if (d.paso === "codigo") lineas.push("En el paso del código");
  if (d.segundo_factor === "pendiente") lineas.push("Falta el código del segundo factor");
  if (typeof d.otras_sesiones === "number") lineas.push(`Cerró ${d.otras_sesiones} ${d.otras_sesiones === 1 ? "sesión" : "sesiones"} de otros dispositivos`);
  if (d.una === true) lineas.push("Cerró la sesión de otro dispositivo");
  if (typeof d.otras_sesiones_cerradas === "number" && d.otras_sesiones_cerradas > 0) lineas.push(`Y cerró ${d.otras_sesiones_cerradas} sesiones abiertas`);
  if (typeof d.sesiones_cerradas === "number") lineas.push(`Se cerraron ${d.sesiones_cerradas} sesiones`);
  if (typeof d.comando === "string") lineas.push("Hecho por soporte");
  if (typeof d.ruta === "string") lineas.push(`Pidió ${d.ruta}`);
  if (typeof d.medio === "string") lineas.push(`Medio de pago: ${d.medio}`);
  if (typeof d.tipo === "string" && typeof d.aviso === "number") lineas.push(`Aviso: ${TIPO_AVISO_TEXTO[d.tipo] ?? d.tipo}`);
  if (typeof d.dias === "number") lineas.push(`Por ${d.dias} días`);
  return lineas;
}

/** El tipo de un aviso de cobro, para la auditoría (los textos de pantalla están en `components/admin/avisos.tsx`). */
const TIPO_AVISO_TEXTO: Record<string, string> = {
  MONTO_DISTINTO: "pagó otro monto",
  SIN_LUGAR: "pagó sin lugar",
  CONFIRMACION_FALLIDA: "no le llegó la confirmación",
  ALERTA_FALLIDA: "no llegó el aviso de venta",
  PAGO_SIN_ORDEN: "pago sin orden",
  DEVOLUCION_PARCIAL: "devolución parcial",
  DEVOLUCION_OTRO_PAGO: "devolución de otro pago",
};

/** «hace 5 min», «hace 3 h», «ayer 18:04» o la fecha: para la actividad de Mi cuenta y las sesiones. */
export function haceCuanto(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const dias = Math.round(h / 24);
  if (dias === 1) return `ayer, ${fechaHora(iso).slice(11)}`;
  if (dias < 7) return `hace ${dias} días`;
  return fechaHora(iso).slice(0, 10);
}

/** Fecha y hora en Argentina, 24 h: «17/11/2026 13:00». */
export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Cordoba",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  // Sin la coma que agrega Intl entre fecha y hora (06-DISENO: «17/11/2026 13:00»).
  return `${partes.day}/${partes.month}/${partes.year} ${partes.hour}:${partes.minute}`;
}

/** Plata para mostrar: «$ 48.000» (sin decimales si son cero). Llega como texto del backend. */
export function plata(valor: string, moneda = "ARS"): string {
  const [entero, decimales = "00"] = valor.split(".");
  const miles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const simbolo = moneda === "USD" ? "US$ " : "$ ";
  return decimales === "00" ? `${simbolo}${miles}` : `${simbolo}${miles},${decimales.padEnd(2, "0")}`;
}

/** Fecha para un <input type="datetime-local"> en hora de Argentina (y de vuelta a UTC). */
export function aCampoFecha(iso: string): string {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return partes.replace(" ", "T");
}

export function deCampoFecha(valor: string): string {
  // Argentina no tiene horario de verano: siempre UTC−3.
  return new Date(`${valor}:00-03:00`).toISOString();
}
