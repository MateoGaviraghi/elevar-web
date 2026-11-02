/**
 * Sin frases partidas (regla de Mateo, 2026-10-26: "dejar de hacer esos saltos de línea
 * estúpidos y al pedo"). Portado de Sanalys (`web/src/lib/texto.ts`).
 *
 * Pega cada palabra corta de enlace (artículos, preposiciones, conjunciones: «a», «de», «la»,
 * «y», «con», «para»…) a la palabra que sigue con un espacio que no se corta (U+00A0). Así una
 * línea nunca termina en «de» o «y»: la palabra baja junto con la siguiente. El texto no
 * cambia, solo dónde puede cortar. text-wrap: pretty (globals.css) evita la palabra sola
 * abajo, no el corte a mitad de frase.
 */
const ENLACE =
  "a|al|ante|cada|con|como|de|del|desde|e|el|en|entre|es|hasta|la|las|le|les|lo|los|me|mi|más|muy|no|ni|nos|o|para|pero|por|que|se|sin|sobre|su|sus|te|tu|tus|u|un|una|unos|unas|y|ya";

const DURO = " ";

const PEGAR = new RegExp(`(?<=^|[\\s\\u00A0(«“¿¡])(${ENLACE})\\s+`, "giu");

/** Frases que nunca se parten aunque no tengan palabra de enlace. Cuando aparezca otra, se suma acá. */
const FRASES = ["ISO/IEC 17025", "ISO 17025", "ISO 9001"];
const UNIDAS = new RegExp(FRASES.map((f) => f.replace(/ /g, "[\\s\\u00A0]+")).join("|"), "giu");

export function pegar(texto: string): string {
  return texto.replace(PEGAR, `$1${DURO}`).replace(UNIDAS, (f) => f.replace(/\s/g, DURO));
}

/** Títulos cortos: une las dos últimas palabras para que la última nunca baje sola
 * («¿Tiene alguna / consulta?» pasa a «¿Tiene / alguna consulta?»). Incluye pegar(). */
export function sinViuda(texto: string): string {
  return pegar(texto).replace(/\s+(\S+)$/u, `${DURO}$1`);
}

/** El texto con espacios comunes, para buscar dentro de un texto que pasó por pegar(). */
export function sinDuros(texto: string): string {
  return texto.replace(/ /g, " ");
}

/** pegar() que deja pasar null/undefined, para campos opcionales de los datos. */
export function pegarOpt<T extends string | null | undefined>(texto: T): T {
  return (typeof texto === "string" ? pegar(texto) : texto) as T;
}

/** Claves que no son texto para leer (rutas, ids, códigos): pegarTodo() no las toca. */
const NO_TEXTO = new Set(["id", "slug", "href", "url", "src", "img", "image", "icon", "code", "modality", "email", "phone", "key", "kind", "type"]);

/** pegar() en todos los textos de un dato de solo lectura (servicios, Nosotros, blog…). */
export function pegarTodo<T>(dato: T): T {
  if (typeof dato === "string") return pegar(dato) as T;
  if (Array.isArray(dato)) return dato.map((x) => pegarTodo(x)) as T;
  if (dato && typeof dato === "object") {
    return Object.fromEntries(
      Object.entries(dato).map(([k, v]) => [k, NO_TEXTO.has(k) ? v : pegarTodo(v)])
    ) as T;
  }
  return dato;
}
