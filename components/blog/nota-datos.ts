// Datos de la página de una nota del blog (/blog/<slug>): la nota partida en introducción y
// partes, una foto por parte y las notas vecinas. Sin "use client": lo usa la página del servidor.
import type { BlogBlock } from "@/lib/blog";
import { getBlogContent } from "@/lib/blog-content";
import { CAPSULAS, getCapsula, type Capsula } from "./datos";

export interface Parte {
  titulo: string;
  bloques: BlogBlock[];
}

export interface DatosNota {
  c: Capsula;
  intro: BlogBlock[];
  partes: Parte[];
  /** Una foto por parte: la de la nota primero y después las de las otras notas (Mateo, 2026-11-26: «fotos sí»). */
  fotos: string[];
  /** Por fecha: la anterior es la publicada antes y la siguiente la publicada después. */
  anterior: Capsula;
  siguiente: Capsula;
  /** «Cápsula siguiente», u «Otra cápsula» en la más nueva (no tiene siguiente). */
  siguienteRotulo: string;
}

/** Subtítulo sin emojis (🔸, 📌, 1️⃣): leen como viñetas sueltas. */
function limpiar(t: string): string {
  return t
    .replace(/^\s*\d️?⃣\s*/u, "")
    .replace(/[\p{Extended_Pictographic}️⃣]/gu, "")
    .trim();
}

/** Separa el texto en una introducción y las partes que abre cada subtítulo. */
export function partir(bloques: BlogBlock[]): { intro: BlogBlock[]; partes: Parte[] } {
  const intro: BlogBlock[] = [];
  const partes: Parte[] = [];
  for (const b of bloques) {
    if (b.type === "h") partes.push({ titulo: limpiar(b.text), bloques: [] });
    else if (partes.length) partes[partes.length - 1].bloques.push(b);
    else intro.push(b);
  }
  return { intro, partes };
}

/** «Primer componente - Incertidumbre técnica» → rótulo «Primer componente» y nombre «Incertidumbre técnica». */
export function partirTitulo(t: string): { rotulo: string | null; nombre: string } {
  const m = t.split(/\s+[-–]\s+/u);
  return m.length > 1 ? { rotulo: m[0], nombre: m.slice(1).join(" – ") } : { rotulo: null, nombre: t };
}

export function datosNota(slug: string): DatosNota | null {
  const c = getCapsula(slug);
  if (!c) return null;
  const { intro, partes } = partir(getBlogContent(c.slug));
  const fotos = [c.foto, ...CAPSULAS.filter((x) => x.slug !== c.slug).map((x) => x.foto)];
  const i = CAPSULAS.findIndex((x) => x.slug === c.slug);
  const n = CAPSULAS.length;
  const nueva = i === 0;
  return {
    c,
    intro,
    partes,
    fotos,
    anterior: CAPSULAS[(i + 1) % n],
    siguiente: nueva ? CAPSULAS[(i + 2) % n] : CAPSULAS[i - 1],
    siguienteRotulo: nueva ? "Otra cápsula" : "Cápsula siguiente",
  };
}
