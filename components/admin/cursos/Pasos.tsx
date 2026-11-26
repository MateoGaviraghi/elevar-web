"use client";

import { Children, useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * El formulario en pasos del portal CESS (su `components/ui/Pasos.tsx`, D-026), con los colores del panel
 * (2026-11-26, D-006). Una pastilla blanca se desliza al paso actual (0,32 s); el paso hecho cambia su número por
 * un tilde; a los que ya se llegó se vuelve tocándolos. En el celular solo el paso actual muestra su nombre.
 */
export function IndicadorPasos({ pasos, actual, alcanzado, alIr, etiqueta }: IndicadorProps) {
  const pista = useRef<HTMLOListElement>(null);
  const pastilla = useRef<HTMLSpanElement>(null);
  const primera = useRef(true);

  useLayoutEffect(() => {
    const p = pista.current;
    const r = pastilla.current;
    if (!p || !r) return;
    const ubicar = (animar: boolean) => {
      const el = p.querySelector<HTMLElement>('[aria-current="step"]');
      if (!el) return;
      const destino = { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight, opacity: 1 };
      if (animar && !prefersReducedMotion()) gsap.to(r, { ...destino, duration: 0.32, ease: "power3.out", overwrite: "auto" });
      else gsap.set(r, destino);
    };
    ubicar(!primera.current);
    primera.current = false;
    const ro = new ResizeObserver(() => ubicar(false));
    ro.observe(p);
    return () => ro.disconnect();
  }, [actual]);

  return (
    <ol ref={pista} aria-label={etiqueta} className="relative flex gap-0.5 rounded-[14px] bg-ink-50 p-0.5 ring-1 ring-ink-100">
      <span ref={pastilla} aria-hidden className="absolute left-0 top-0 rounded-[12px] bg-neutral-0 opacity-0 shadow-[0_4px_14px_-6px_rgba(11,30,51,.35)] ring-1 ring-ink-200" />
      {pasos.map((nombre, i) => {
        const esActual = i === actual;
        const hecho = !esActual && i < alcanzado;
        const estado = esActual ? "es el actual" : hecho ? "completo" : "pendiente";
        return (
          <li key={nombre} className={`min-w-0 ${esActual ? "flex-[2_1_0] sm:flex-1" : "flex-1"}`}>
            <button type="button" aria-current={esActual ? "step" : undefined} disabled={i > alcanzado} onClick={() => !esActual && alIr(i)}
              aria-label={`Paso ${i + 1} de ${pasos.length}: ${nombre}, ${estado}`}
              className={`relative z-[1] flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[12px] px-2 font-sub text-sm font-semibold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed ${
                esActual ? "cursor-default text-ink-900" : "text-neutral-700 [@media(hover:hover)]:enabled:hover:text-ink-900"
              }`}>
              <span aria-hidden className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs tabular-nums ${
                esActual ? "bg-brand-500 text-neutral-0" : hecho ? "bg-status-success/15 text-status-success" : "bg-neutral-0 text-neutral-700 ring-1 ring-ink-200"
              }`}>
                {hecho ? (
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m4.5 10.5 3.5 3.5 7.5-8" /></svg>
                ) : i + 1}
              </span>
              <span aria-hidden className={`truncate ${esActual ? "" : "hidden sm:inline"}`}>{nombre}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

interface IndicadorProps {
  /** El nombre de cada paso, en orden. */
  pasos: readonly string[];
  /** El paso que se ve (desde 0). */
  actual: number;
  /** Hasta qué paso se llegó: los anteriores quedan con tilde y se vuelve a ellos tocándolos. */
  alcanzado: number;
  alIr: (paso: number) => void;
  etiqueta: string;
}

/**
 * Los paneles de los pasos. Todos quedan montados y apilados en la misma celda: lo escrito en un paso no se pierde
 * al pasar a otro y la tarjeta no cambia de alto. El que no se ve queda `inert` (ni el foco ni el teclado entran).
 * Al cambiar de paso, el que se va sale 16 px hacia un lado (0,15 s) y el nuevo entra 24 px desde el otro (0,32 s).
 */
export function PanelesPasos({ actual, nombres, children }: { actual: number; nombres: readonly string[]; children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);
  const antes = useRef(actual);

  useLayoutEffect(() => {
    const paneles = Array.from(caja.current?.children ?? []) as HTMLElement[];
    const previo = antes.current;
    antes.current = actual;
    if (previo === actual) return;
    const sale = paneles[previo];
    const entra = paneles[actual];
    if (!sale || !entra) return;
    const lado = actual > previo ? 1 : -1;
    gsap.killTweensOf([sale, entra]);
    if (prefersReducedMotion()) {
      gsap.set(sale, { autoAlpha: 0, x: 0 });
      gsap.set(entra, { opacity: 1, x: 0, visibility: "visible" });
      return;
    }
    gsap.fromTo(sale, { autoAlpha: 1, x: 0 }, { autoAlpha: 0, x: -16 * lado, duration: 0.15, ease: "power2.in" });
    // El que entra queda visible desde ya (solo transparente): con visibility: hidden no podría recibir el foco.
    gsap.fromTo(entra, { opacity: 0, x: 24 * lado, visibility: "visible" }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out", delay: 0.12, clearProps: "transform" });
  }, [actual]);

  return (
    <div ref={caja} className="grid">
      {Children.map(children, (panel, i) => (
        <div role="group" aria-label={nombres[i]} inert={i !== actual} data-activo={i === actual || undefined}
          className="min-w-0 [grid-area:1/1]" style={i === actual ? undefined : { visibility: "hidden", opacity: 0 }}>
          {panel}
        </div>
      ))}
    </div>
  );
}
