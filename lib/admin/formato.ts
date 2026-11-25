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

export const MEDIO_DE_PAGO: Record<string, string> = { MERCADOPAGO: "Mercado Pago", STRIPE: "Stripe", PAYPAL: "PayPal" };

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
  "usuario.segundo_factor_reiniciado": "Reinicio del segundo factor",
  "consulta.estado": "Cambió el estado de una consulta",
  "consulta.respuesta": "Contestó una consulta por correo",
  "orden.cumplida": "Marcó una orden como cumplida",
  "orden.nota": "Escribió una nota en una orden",
  "orden.ver_dni": "Vio el DNI de un comprador",
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
