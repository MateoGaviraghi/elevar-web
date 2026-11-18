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
