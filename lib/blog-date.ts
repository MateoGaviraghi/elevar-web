const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/**
 * Formatea una fecha "YYYY-MM-DD" como "28 may 2026" sin construir un Date
 * (evita corrimientos por zona horaria con fechas sin hora).
 */
export function formatBlogDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
