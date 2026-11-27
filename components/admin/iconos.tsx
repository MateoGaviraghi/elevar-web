"use client";

import { useEffect } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Íconos propios del panel, a dos colores: el trazo en el color del texto y una parte de acento (naranja si
 * nadie dice otra cosa; un botón lo cambia con la variable `--acento`). Cada vez que el mouse entra a lo que
 * los contiene (un botón, un link, una tarjeta del Inicio o un bloque con `data-escribe`), cuando se lo enfoca
 * o cuando se lo toca, el trazo se vuelve a escribir (0,5 s). Mateo, 2026-11-26: «los seguís haciendo
 * estáticos» y «hacen sola vez una animación».
 */

const TRAZOS: Record<string, { lineas: string[]; acento: string }> = {
  // Menú y cifras.
  inicio: { lineas: ["M3 10.5 12 3l9 7.5", "M5 9v11h14V9"], acento: "M10 20v-6h4v6" },
  consultas: { lineas: ["M4 5h16v11H9l-5 4z"], acento: "M8 9.5h8M8 12.5h5" },
  ordenes: { lineas: ["M6 3h12v18l-3-2-3 2-3-2-3 2z"], acento: "M9 8h6M9 11.5h6M9 15h3" },
  inscripciones: { lineas: ["M4 6h16v14H4z", "M8 3v5M16 3v5"], acento: "m8.5 14 2.5 2.5 4.5-5" },
  cursos: { lineas: ["M4 5c3-1.5 5.5-1.5 8 0v14c-2.5-1.5-5-1.5-8 0z", "M12 5c2.5-1.5 5-1.5 8 0v14c-3-1.5-5.5-1.5-8 0"], acento: "M7 9h2M15 9h2" },
  auditoria: { lineas: ["M5 4h10l4 4v12H5z"], acento: "M8 11h8M8 14.5h8M8 18h5" },
  cuenta: { lineas: ["M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"], acento: "M12 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5" },
  salir: { lineas: ["M10 4H5v16h5"], acento: "M14 8l4 4-4 4M18 12H9" },
  grafico: { lineas: ["M4 4v16h16"], acento: "M8 16v-4M12 16V8M16 16v-6" },
  reloj: { lineas: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"], acento: "M12 7v5l3 2" },
  actividad: { lineas: ["M4 12h3l2-6 4 12 2-6h5"], acento: "M19.5 12h.5" },
  // Etiquetas del Inicio. Pendientes: una burbuja con tres puntos (alguien espera respuesta).
  // Por cumplir: un candado abierto (pagaron y falta abrirles el aula). Mateo, 2026-11-26: «me sirve lo de la burbuja y lo del candado».
  espera: { lineas: ["M4 5h16v11H9l-5 4z"], acento: "M7.6 10.5h.8M11.6 10.5h.8M15.6 10.5h.8" },
  candado: { lineas: ["M5 11h14v10H5z", "M12 15v2.5"], acento: "M8 11V7.5a4 4 0 0 1 7.7-1.6" },
  responder: { lineas: ["M4 5h16v11H9l-5 4z"], acento: "M12.5 8 9.5 10.5l3 2.5M9.8 10.5H16" },
  moneda: { lineas: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"], acento: "M14.6 9.4c-.5-.9-1.5-1.4-2.6-1.4-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2.1-.5-2.6-1.4M12 6.5V8M12 16v1.5" },
  tendencia: { lineas: ["M4 4v16h16"], acento: "M7.5 15l3.5-3.5 3 3 5-5.5M15.5 9h3.5v3.5" },
  sol: { lineas: ["M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"], acento: "M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" },
  personas: { lineas: ["M3 20c.8-3 3-4.5 6-4.5s5.2 1.5 6 4.5", "M9 12.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"], acento: "M16 5.6a3.3 3.3 0 0 1 0 6.3M18 15.6c1.5.7 2.5 2 3 4.4" },
  // Botones de fila y de tarjeta (antes, de un color y quietos en `lista/Botones.tsx`).
  llave: { lineas: ["M8.5 20.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10z", "M12 12 20.5 3.5"], acento: "M16.5 7.5l2.6 2.6M14 10l2.2 2.2" },
  sobre: { lineas: ["M3.5 5.5h17v13h-17z"], acento: "M4 6.5l8 6.5 8-6.5" },
  tilde: { lineas: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"], acento: "m8 12.3 2.8 2.8L16.2 9.5" },
  whatsapp: { lineas: ["M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5z"], acento: "M9 8.6c.3-.5.6-.6 1-.6h.4l.9 2-.6.9c.5 1 1.4 1.9 2.4 2.4l.9-.6 2 .9v.4c0 .4-.3.9-.8 1.2-.7.4-1.7.4-3.3-.4a8.6 8.6 0 0 1-3.2-3.2c-.8-1.5-.6-2.4-.2-3" },
  abrir: { lineas: ["M10 4.5H4.5v15h15V14"], acento: "M14 4.5h5.5V10M19.5 4.5 11 13" },
  ojo: { lineas: ["M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"], acento: "M12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z" },
  ocultar: { lineas: ["M2.5 12S6 5.5 12 5.5c1.6 0 3 .5 4.2 1.1M21.5 12S18 18.5 12 18.5c-1.6 0-3-.5-4.2-1.1"], acento: "M4 20 20 4" },
  copiar: { lineas: ["M4.5 8.5h11v11.5h-11z"], acento: "M8.5 8.5V4h11v11.5h-4" },
  descargar: { lineas: ["M4 15v5h16v-5"], acento: "M12 4v11M7.5 10.5 12 15l4.5-4.5" },
  persona: { lineas: ["M5 20.5c1-3.3 3.7-5 7-5s6 1.7 7 5"], acento: "M12 12.5a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6z" },
  tarjeta: { lineas: ["M3 6h18v12H3z"], acento: "M3 10h18M7 14.5h4" },
  devuelta: { lineas: ["M5.5 10H15a4.5 4.5 0 0 1 0 9h-4"], acento: "M9 6 5 10l4 4" },
  editar: { lineas: ["M4 20h4.5L19.5 9 15 4.5 4 15.5z"], acento: "M13 6.5l4.5 4.5" },
  nota: { lineas: ["M6 3.5h8.5l3.5 3.5v13.5H6z"], acento: "M9 11h6M9 14.5h6M9 18h3.5" },
  enviar: { lineas: ["M20.5 3.5 3.5 10.5l7 3 3 7z"], acento: "M20.5 3.5 10.5 13.5" },
  mas: { lineas: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"], acento: "M12 8v8M8 12h8" },
  // Mi cuenta y Auditoría (2026-11-26).
  escudo: { lineas: ["M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"], acento: "m8.8 12 2.3 2.3 4.2-4.6" },
  pantalla: { lineas: ["M3.5 4.5h17v11.5h-17z"], acento: "M9 20h6M12 16v4" },
  celular: { lineas: ["M7 3h10v18H7z"], acento: "M11 17.5h2" },
  flechas: { lineas: [], acento: "M8 9.5 12 5.5l4 4M8 14.5l4 4 4-4" },
  alerta: { lineas: ["M12 3.5 2.8 19.5h18.4z"], acento: "M12 10v4.2M12 16.8v.2" },
  empresa: { lineas: ["M5 20.5V6.5l7-2.5v16.5M12 9h7v11.5M320.5h18"], acento: "M8 9h1M8 12.5h1M15 12.5h1M15 16h1" },
};

/** Lo que reescribe sus íconos: el botón o link más cercano, una tarjeta del Inicio o un bloque marcado. */
const DISPARADOR = "button, a, [data-tarjeta], [data-escribe]";
const ultimo = new WeakMap<Element, number>();

/** Reescribe los íconos que le pertenecen a `el` (no los de un botón que tenga adentro). Una vez cada 0,4 s. */
export function escribirEn(el: Element, retraso = 0) {
  if (prefersReducedMotion()) return;
  const ahora = Date.now();
  if (ahora - (ultimo.get(el) ?? 0) < 400) return;
  ultimo.set(el, ahora);
  const trazos = Array.from(el.querySelectorAll<SVGPathElement>("[data-icono] path")).filter((p) => p.closest(DISPARADOR) === el || !p.closest(DISPARADOR));
  if (!trazos.length) return;
  gsap.fromTo(trazos, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, delay: retraso, ease: "power2.out", stagger: 0.08, autoRound: false, overwrite: "auto" });
}

/** Un solo escucha para todo el panel: se instala con el primer ícono que aparece. */
let instalado = false;
function instalar() {
  if (instalado || typeof document === "undefined") return;
  instalado = true;
  // Al entrar el mouse a un disparador (y a cada disparador que lo contiene y recién se entra).
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    const desde = e.relatedTarget instanceof Node ? e.relatedTarget : null;
    let el = e.target instanceof Element ? e.target.closest(DISPARADOR) : null;
    while (el) {
      if (!desde || !el.contains(desde)) escribirEn(el);
      el = el.parentElement?.closest(DISPARADOR) ?? null;
    }
  }, { passive: true });
  // Con el teclado y al tocar en el celular.
  document.addEventListener("focusin", (e) => { const el = e.target instanceof Element ? e.target.closest(DISPARADOR) : null; if (el) escribirEn(el); });
  document.addEventListener("pointerdown", (e) => { if (e.pointerType !== "touch") return; const el = e.target instanceof Element ? e.target.closest(DISPARADOR) : null; if (el) escribirEn(el); }, { passive: true });
}

export function Icono({ nombre, className = "", acento, grosor = 1.8, tam = 20 }: { nombre: keyof typeof TRAZOS | string; className?: string; acento?: string; grosor?: number; tam?: number }) {
  useEffect(instalar, []);
  const t = TRAZOS[nombre] ?? TRAZOS.inicio!;
  return (
    <svg data-icono viewBox="0 0 24 24" width={tam} height={tam} fill="none" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden>
      {t.lineas.map((d) => <path key={d} d={d} stroke="currentColor" pathLength={1} />)}
      <path d={t.acento} stroke={acento ?? "var(--acento, #E94E1B)"} pathLength={1} />
    </svg>
  );
}

/**
 * Devuelve el manejador que reescribe el ícono de un elemento (para onPointerEnter y onFocus). Comparte la
 * espera de 0,4 s con el escucha general, así el ícono no se escribe dos veces.
 */
export function useEscribirIcono() {
  return (e: React.SyntheticEvent<HTMLElement>) => escribirEn(e.currentTarget);
}
