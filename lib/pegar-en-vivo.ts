"use client";

// pegar() en vivo, para texto corrido en columnas angostas (cuerpo de las notas del blog).
// pegar() une de antemano cada palabra de enlace con la siguiente, y en cadenas («de la
// incertidumbre en microbiología») arma bloques que no entran y dejan líneas cortas: en el
// celular, 19 líneas por debajo del 70 % del ancho en tres notas, contra 5 sin unir (medido
// el 2026-11-26). Acá el texto se dibuja con espacios comunes y solo se une la palabra de
// enlace que de verdad quedó al final de una línea; se repite hasta que ninguna línea termine
// así. Se rehace cuando cambia el ancho.
import { useLayoutEffect, type RefObject } from "react";
import { ENLACE } from "@/lib/texto";

const ES_ENLACE = new RegExp(`^[(«“¿¡]*(${ENLACE})$`, "iu");
const DURO = " ";
/** Lo que unió pegar() después de una palabra de enlace (las frases fijas como «ISO 19036» quedan). */
const UNION = new RegExp(`(?<=^|[\\s\\u00A0(«“¿¡])(${ENLACE})\\u00A0`, "giu");

/** Une con U+00A0 la palabra de enlace que cierra una línea con la que sigue. */
function arreglar(el: HTMLElement, original: string) {
  const nodo = el.firstChild;
  if (!nodo || nodo.nodeType !== Node.TEXT_NODE || el.childNodes.length !== 1) return;
  const texto = nodo as Text;
  texto.data = original;
  const rango = document.createRange();
  for (let ronda = 0; ronda < 4; ronda++) {
  for (let vuelta = 0; vuelta < 40; vuelta++) {
    const d = texto.data;
    // Posiciones de cada espacio común (donde la línea puede cortar).
    let cambio = false;
    let inicio = 0;
    let prevIzq: number | null = null;
    let prevPalabra = "";
    let prevEspacio = -1;
    for (let i = 0; i <= d.length; i++) {
      if (i < d.length && d[i] !== " ") continue;
      const palabra = d.slice(inicio, i);
      if (palabra) {
        rango.setStart(texto, inicio);
        rango.setEnd(texto, Math.min(inicio + 1, d.length));
        // Una línea nueva empieza más a la izquierda que donde terminó la anterior. Se mide por el
        // borde izquierdo y no por el de arriba: así vale también con el bloque girado o achicado
        // por una animación (las tarjetas de la nota llegan giradas 4°).
        const izq = rango.getBoundingClientRect().left;
        if (prevIzq !== null && izq < prevIzq - 4) {
          // prevPalabra cerró una línea.
          const ultima = prevPalabra.split(DURO).pop() ?? "";
          if (ES_ENLACE.test(ultima) && prevEspacio >= 0) {
            texto.data = d.slice(0, prevEspacio) + DURO + d.slice(prevEspacio + 1);
            cambio = true;
            break;
          }
        }
        prevIzq = izq;
        prevPalabra = palabra;
      }
      prevEspacio = i;
      inicio = i + 1;
    }
    if (!cambio) break;
  }
  // Una sola palabra en la última línea: baja con la anterior, y se vuelve a revisar.
  const d = texto.data;
  const ult = d.lastIndexOf(" ");
  const ant = ult > 0 ? d.lastIndexOf(" ", ult - 1) : -1;
  if (ult <= 0 || d.slice(ult + 1).includes(DURO)) return;
  const izq = (desde: number) => {
    rango.setStart(texto, desde);
    rango.setEnd(texto, desde + 1);
    return rango.getBoundingClientRect().left;
  };
  if (izq(ult + 1) >= izq(ant + 1) - 4) return;
  texto.data = d.slice(0, ult) + DURO + d.slice(ult + 1);
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
      els.forEach((el) => arreglar(el, originales.get(el)!));
    };
    correr();
    document.fonts?.ready.then(() => {
      ancho = -1;
      correr();
    });
    const ro = new ResizeObserver(correr);
    ro.observe(raiz);
    return () => ro.disconnect();
  }, [ref, selector]);
}
