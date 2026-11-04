/**
 * Países para el campo de teléfono (KAN-32, 2026-11-04). Los clientes de ELEVAR son
 * de Argentina y del resto de Latinoamérica: Argentina primero, después por nombre.
 * Banderas: /assets/flags/<iso>.png (flagcdn.com, 40 × 25).
 */
export type Pais = {
  iso: string;
  nombre: string;
  codigo: string;
  /** Ayuda debajo del campo. */
  ayuda: string;
  /** Ejemplo del número sin el código de país. */
  ejemplo: string;
};

const GENERAL = "Número completo, sin el código de país.";

export const PAISES: Pais[] = [
  { iso: "ar", nombre: "Argentina", codigo: "54", ayuda: "Código de área y número, sin 0 ni 15.", ejemplo: "3446 507779" },
  { iso: "bo", nombre: "Bolivia", codigo: "591", ayuda: GENERAL, ejemplo: "71234567" },
  { iso: "br", nombre: "Brasil", codigo: "55", ayuda: "DDD y número.", ejemplo: "11 91234 5678" },
  { iso: "cl", nombre: "Chile", codigo: "56", ayuda: GENERAL, ejemplo: "9 1234 5678" },
  { iso: "co", nombre: "Colombia", codigo: "57", ayuda: GENERAL, ejemplo: "321 1234567" },
  { iso: "cr", nombre: "Costa Rica", codigo: "506", ayuda: GENERAL, ejemplo: "8312 3456" },
  { iso: "cu", nombre: "Cuba", codigo: "53", ayuda: GENERAL, ejemplo: "5 1234567" },
  { iso: "ec", nombre: "Ecuador", codigo: "593", ayuda: "Número sin el 0 inicial.", ejemplo: "99 123 4567" },
  { iso: "sv", nombre: "El Salvador", codigo: "503", ayuda: GENERAL, ejemplo: "7012 3456" },
  { iso: "es", nombre: "España", codigo: "34", ayuda: GENERAL, ejemplo: "612 34 56 78" },
  { iso: "us", nombre: "Estados Unidos", codigo: "1", ayuda: GENERAL, ejemplo: "201 555 0123" },
  { iso: "gt", nombre: "Guatemala", codigo: "502", ayuda: GENERAL, ejemplo: "5123 4567" },
  { iso: "hn", nombre: "Honduras", codigo: "504", ayuda: GENERAL, ejemplo: "9123 4567" },
  { iso: "mx", nombre: "México", codigo: "52", ayuda: "Número de 10 dígitos.", ejemplo: "55 1234 5678" },
  { iso: "ni", nombre: "Nicaragua", codigo: "505", ayuda: GENERAL, ejemplo: "8123 4567" },
  { iso: "pa", nombre: "Panamá", codigo: "507", ayuda: GENERAL, ejemplo: "6123 4567" },
  { iso: "py", nombre: "Paraguay", codigo: "595", ayuda: "Número sin el 0 inicial.", ejemplo: "961 456789" },
  { iso: "pe", nombre: "Perú", codigo: "51", ayuda: GENERAL, ejemplo: "912 345 678" },
  { iso: "do", nombre: "República Dominicana", codigo: "1", ayuda: "Código de área y número.", ejemplo: "809 234 5678" },
  { iso: "uy", nombre: "Uruguay", codigo: "598", ayuda: "Número sin el 0 inicial.", ejemplo: "94 231 234" },
  { iso: "ve", nombre: "Venezuela", codigo: "58", ayuda: "Número sin el 0 inicial.", ejemplo: "412 1234567" },
];

export const PAIS_INICIAL = PAISES[0];

/** Cifras del número local (sin el código de país). */
export const cifras = (local: string) => local.replace(/\D/g, "");

/** El número local es plausible: entre 6 y 14 cifras. */
export const telefonoValido = (local: string) => {
  const n = cifras(local).length;
  return n >= 6 && n <= 14;
};

/**
 * Número completo para guardar, por ejemplo "+54 9 3446 507779". En Argentina los
 * celulares (y WhatsApp) llevan un 9 después del 54: se agrega si no está.
 */
export function telefonoCompleto(pais: Pais, local: string): string {
  // Si pegó el número completo con "+", se respeta tal cual.
  if (local.trim().startsWith("+")) return local.trim().replace(/\s+/g, " ");
  let n = local.trim().replace(/^0+/, "");
  if (pais.iso === "ar") {
    n = n.replace(/^15/, "");
    if (!n.startsWith("9")) n = `9 ${n}`;
  }
  return `+${pais.codigo} ${n}`.trim();
}
