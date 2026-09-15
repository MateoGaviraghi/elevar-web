export function formatARS(value: string | number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(Number(value));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

/** Cotización de referencia para mostrar precios en USD (PayPal). */
export const USD_RATE = Number(process.env.NEXT_PUBLIC_USD_RATE ?? 1450);

export function formatUSD(value: string | number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export function formatMoney(value: string | number, currency: string): string {
  return currency === "USD" ? formatUSD(value) : formatARS(value);
}

/** Convierte un total en ARS a USD con la cotización de referencia. */
export function arsToUsd(ars: string | number): number {
  return Math.round((Number(ars) / USD_RATE) * 100) / 100;
}
