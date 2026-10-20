"use client";

/* Número que rueda cifra por cifra (referencia NumberFlow, rehecha en GSAP; Mateo,
 * 2026-10-20, /promociones). Cada dígito es una tira 0–9 que se desplaza hasta su
 * valor: 0,9 s expo.out, 0,04 s entre dígitos desde las unidades. El último cambio
 * gana (overwrite). Con movimiento reducido cambia sin moverse.
 * Los dígitos se identifican desde la derecha, así las unidades no saltan cuando el
 * número gana o pierde una cifra.
 */

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

export function NumeroRodante({ text, className = "" }: { text: string; className?: string }) {
  const chars = [...text];
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  return (
    <span className={`inline-flex items-baseline whitespace-nowrap ${className}`}>
      <span className="sr-only">{text}</span>
      {chars.map((ch, i) => {
        const fromRight = chars.length - i;
        return /\d/.test(ch) ? (
          <Digito key={`d${fromRight}`} d={Number(ch)} order={fromRight} animateIn={mounted.current} />
        ) : (
          <span key={`s${fromRight}${ch}`} aria-hidden className="whitespace-pre">
            {ch}
          </span>
        );
      })}
    </span>
  );
}

const STRIP = Array.from({ length: 10 }, (_, n) => n);

function Digito({ d, order, animateIn }: { d: number; order: number; animateIn: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  // El valor inicial va en el estilo del primer render (sin parpadeo al cargar); después
  // solo lo mueve GSAP, React no vuelve a tocar el transform. GSAP lee ese translateY
  // como `y` en píxeles: por eso cada llamada fija y: 0 y mueve solo yPercent.
  const [initial] = useState(() => (animateIn ? 0 : d));
  const first = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const yPercent = -d * 10;
    if (first.current && !animateIn) {
      first.current = false;
      gsap.set(el, { y: 0, yPercent });
      return;
    }
    first.current = false;
    if (prefersReducedMotion()) {
      gsap.set(el, { y: 0, yPercent });
      return;
    }
    gsap.to(el, { y: 0, yPercent, duration: 0.9, ease: "expo.out", delay: (order - 1) * 0.04, overwrite: true });
  }, [d, order, animateIn]);
  // El ancho lo da el dígito actual (invisible); la tira va encima, centrada, así un "1"
  // no deja el hueco de un "0" en tipografías sin cifras tabulares.
  return (
    <span aria-hidden className="relative inline-block h-[1em] overflow-hidden leading-none">
      <span className="invisible block leading-none">{d}</span>
      <span ref={ref} className="absolute inset-x-0 top-0 flex flex-col text-center" style={{ transform: `translateY(${-initial * 10}%)` }}>
        {STRIP.map((n) => (
          <span key={n} className="block h-[1em] leading-none">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}
