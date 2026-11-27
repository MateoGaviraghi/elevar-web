"use client";

// pegar() en vivo, para texto corrido en columnas angostas (cuerpo de las notas del blog).
// pegar() une de antemano cada palabra de enlace con la siguiente, y en cadenas («de la
// incertidumbre en microbiología») arma bloques que no entran y dejan líneas cortas: en el
// celular, 19 líneas por debajo del 70 % del ancho en tres notas, contra 5 sin unir (medido
// el 2026-11-26). Acá el texto se dibuja con espacios comunes y solo se une la palabra de
// enlace que de verdad quedó al final de una línea (y la última palabra si quedó sola); se
// repite hasta que no quede ninguna. Se rehace cuando cambia el ancho.
//
// Rendimiento (2026-11-26: la nota hacía 419 recálculos de diseño al cargar, contra 182 en
// /blog): cada vuelta primero LEE todos los párrafos y después ESCRIBE todos los cambios
// juntos, así el navegador recalcula una vez por vuelta y no una vez por palabra unida.
import { useLayoutEffect, type RefObject } from "react";
import { ENLACE } from "@/lib/texto";

const ES_ENLACE = new RegExp(`^[(«“¿¡]*(${ENLACE})$`, "iu");
const DURO = " ";
/** Lo que unió pegar() después de una palabra de enlace (las frases fijas como «ISO 19036» quedan). */
const UNION = new RegExp(`(?<=^|[\\s\\u00A0(«“¿¡])(${ENLACE})\\u00A0`, "giu");

/** El nodo de texto único de un párrafo, o null si tiene otra cosa adentro (no se toca). */
function nodoDe(el: HTMLElement): Text | null {
  const n = el.firstChild;
  return n && n.nodeType === Node.TEXT_NODE && el.childNodes.length === 1 ? (n as Text) : null;
}

/**
 * Solo lee: posiciones de los espacios comunes que hay que volver duros. Una línea nueva empieza
 * más a la izquierda que donde terminó la anterior (se mide el borde izquierdo y no el de arriba:
 * vale también con el bloque girado o achicado por una animación).
 */
function aUnir(texto: Text, rango: Range): number[] {
  const d = texto.data;
  const out: number[] = [];
  const palabras: { inicio: number; espacioAntes: number; izq: number; ancho: number; texto: string }[] = [];
  let inicio = 0;
  for (let i = 0; i <= d.length; i++) {
    if (i < d.length && d[i] !== " ") continue;
    if (i > inicio) {
      rango.setStart(texto, inicio);
      rango.setEnd(texto, inicio + 1);
      const izq = rango.getBoundingClientRect().left;
      rango.setEnd(texto, i);
      // Ancho del bloque entero (si quedó partido en dos renglones, se toma el más ancho).
      const ancho = Math.max(...[...rango.getClientRects()].map((r) => r.width), 0);
      palabras.push({ inicio, espacioAntes: inicio - 1, izq, ancho, texto: d.slice(inicio, i) });
    }
    inicio = i + 1;
  }
  // Una unión solo vale si las dos piezas juntas entran en el renglón: si no, se saldrían de la
  // columna («errores sistemáticos» en una tarjeta a 360, 2026-11-26).
  const caja = texto.parentElement?.getBoundingClientRect().width ?? Infinity;
  const espacio = parseFloat(getComputedStyle(texto.parentElement ?? document.body).fontSize) * 0.3;
  const entran = (a: number, b: number) => palabras[a].ancho + espacio + palabras[b].ancho <= caja - 2;
  for (let k = 1; k < palabras.length; k++) {
    if (palabras[k].izq >= palabras[k - 1].izq - 4) continue;
    // palabras[k - 1] cerró una línea: si termina en palabra de enlace, se pega a la que sigue.
    const ultima = palabras[k - 1].texto.split(DURO).pop() ?? "";
    // Solo la primera de cada párrafo por vuelta: unirla cambia los cortes que siguen.
    if (ES_ENLACE.test(ultima) && entran(k - 1, k)) return [palabras[k].espacioAntes];
  }
  // Una sola palabra en la última línea: baja con la anterior (si entran juntas).
  const n = palabras.length;
  if (n >= 3 && palabras[n - 1].izq < palabras[n - 2].izq - 4 && !palabras[n - 1].texto.includes(DURO) && entran(n - 2, n - 1)) {
    out.push(palabras[n - 1].espacioAntes);
  }
  return out;
}

/** Arregla todos los párrafos juntos: vueltas de leer todo y escribir todo. */
function arreglarTodos(els: HTMLElement[], originales: Map<HTMLElement, string>) {
  const textos = els.map(nodoDe);
  textos.forEach((t, i) => {
    if (t) t.data = originales.get(els[i])!;
  });
  const rango = document.createRange();
  // Solo se vuelven a medir los párrafos que cambiaron en la vuelta anterior (los demás ya
  // quedaron bien): en la nota de 7 partes medir todos en cada vuelta bloqueaba 4 s un celular medio.
  let activos = textos.map((t, i) => (t ? i : -1)).filter((i) => i >= 0);
  for (let vuelta = 0; vuelta < 40 && activos.length; vuelta++) {
    const cambios = activos.map((i) => [i, aUnir(textos[i]!, rango)] as const);
    activos = [];
    for (const [i, pos] of cambios) {
      if (!pos.length) continue;
      const t = textos[i]!;
      const letras = t.data.split("");
      for (const p of pos) if (p >= 0 && letras[p] === " ") letras[p] = DURO;
      t.data = letras.join("");
      activos.push(i);
    }
  }
}

/** Corre sobre cada `p` y `li` dentro de `ref` al montar y cuando cambia su ancho. */
export function usePegarEnVivo(ref: RefObject<HTMLElement | null>, selector = "p, li") {
  useLayoutEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    const els = [...raiz.querySelectorAll<HTMLElement>(selector)];
    const originales = new Map(els.map((el) => [el, (el.textContent ?? "").replace(UNION, "$1 ")]));
    let ancho = -1;
    const correr = () => {
      if (raiz.clientWidth === ancho) return;
      ancho = raiz.clientWidth;
      arreglarTodos(els, originales);
    };
    correr();
    // Si la fuente todavía no cargó, los cortes cambian cuando llega: se rehace una vez.
    if (document.fonts && document.fonts.status !== "loaded") {
      document.fonts.ready.then(() => {
        ancho = -1;
        correr();
      });
    }
    const ro = new ResizeObserver(correr);
    ro.observe(raiz);
    return () => ro.disconnect();
  }, [ref, selector]);
}
