"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

/**
 * Pictograma de marca (PNG del diseñador, sin tocar el dibujo).
 * - Al llegar con el scroll, el círculo crece desde el centro.
 * - Al pasar el mouse por la tarjeta (`group`), se dibuja un anillo naranja
 *   alrededor y el círculo crece apenas. Estilos del anillo en globals.css.
 * `className` define el tamaño (h-/w-) y los márgenes, como el <img> anterior.
 */
export function Pictogram({
  src,
  className = "",
  index = 0,
}: {
  src: string;
  className?: string;
  /** Posición en la grilla, para escalonar la entrada. */
  index?: number;
}) {
  const wrap = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".pictogram-img", {
        scale: 0.55,
        opacity: 0,
        duration: 1.1,
        ease: "expo.out",
        // Escalona dentro de una fila; en una columna (celular) no suma espera.
        delay: (index % 3) * 0.08,
        scrollTrigger: { trigger: wrap.current, start: "top 85%", once: true },
      });
    },
    { scope: wrap }
  );

  return (
    <span ref={wrap} className={`pictogram relative inline-block shrink-0 ${className}`} aria-hidden>
      <span className="pictogram-scale block h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="pictogram-img block h-full w-full object-contain" />
      </span>
      <svg className="pictogram-ring" viewBox="0 0 100 100" focusable="false">
        <circle cx="50" cy="50" r="49.2" pathLength={1} />
      </svg>
    </span>
  );
}
