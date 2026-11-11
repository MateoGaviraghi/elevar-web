/** Archivo .ics de un curso para agregarlo al calendario (Google, Apple, Outlook). */

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");

export function eventoIcs(ev: {
  uid: string;
  titulo: string;
  inicio: string;
  fin: string;
  detalle: string;
  url: string;
}): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ELEVAR//Formacion//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${ev.uid}@elevar.com.ar`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(ev.inicio)}`,
    `DTEND:${stamp(ev.fin)}`,
    `SUMMARY:${esc(ev.titulo)}`,
    `DESCRIPTION:${esc(ev.detalle)}`,
    `URL:${ev.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function descargarIcs(nombre: string, contenido: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
