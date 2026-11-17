/**
 * Enlace a Google Calendar con el evento ya cargado: la persona solo toca «Guardar».
 * Reemplaza el archivo .ics (2026-11-17, Mateo: descargar un archivo está descartado).
 */

/** 2026-12-03T16:00:00.000Z → 20261203T160000Z (UTC, el formato que pide Google). */
const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function enlaceGoogleCalendar(ev: { titulo: string; inicio: string; fin: string; detalle: string }): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.titulo,
    dates: `${utc(ev.inicio)}/${utc(ev.fin)}`,
    details: ev.detalle,
    ctz: "America/Argentina/Buenos_Aires",
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
