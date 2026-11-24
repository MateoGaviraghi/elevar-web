"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Íconos propios del menú del panel, a dos colores: el trazo en el color del texto y una parte en
 * naranja. Al pasar el mouse o enfocar, el trazo se vuelve a escribir (0,5 s).
 */

const TRAZOS: Record<string, { lineas: string[]; acento: string }> = {
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
  // Íconos de las etiquetas del Inicio, uno por tarjeta (2026-11-24, «no se notan y no se entienden»).
  espera: { lineas: ["M4 5h16v11H9l-5 4z"], acento: "M12 7.5v3.5l2.2 1.4" },
  responder: { lineas: ["M4 5h16v11H9l-5 4z"], acento: "M12.5 8 9.5 10.5l3 2.5M9.8 10.5H16" },
  llave: { lineas: ["M8.5 20.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10z", "M12 12 20.5 3.5"], acento: "M16.5 7.5l2.6 2.6M14 10l2.2 2.2" },
  moneda: { lineas: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"], acento: "M14.6 9.4c-.5-.9-1.5-1.4-2.6-1.4-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2.1-.5-2.6-1.4M12 6.5V8M12 16v1.5" },
  tendencia: { lineas: ["M4 4v16h16"], acento: "M7.5 15l3.5-3.5 3 3 5-5.5M15.5 9h3.5v3.5" },
  sol: { lineas: ["M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"], acento: "M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" },
  personas: { lineas: ["M3 20c.8-3 3-4.5 6-4.5s5.2 1.5 6 4.5", "M9 12.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"], acento: "M16 5.6a3.3 3.3 0 0 1 0 6.3M18 15.6c1.5.7 2.5 2 3 4.4" },
};

export function Icono({ nombre, className = "", acento = "#E94E1B", grosor = 1.8 }: { nombre: keyof typeof TRAZOS | string; className?: string; acento?: string; grosor?: number }) {
  const t = TRAZOS[nombre] ?? TRAZOS.inicio!;
  return (
    <svg data-icono viewBox="0 0 24 24" width="20" height="20" fill="none" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden>
      {t.lineas.map((d) => <path key={d} d={d} stroke="currentColor" pathLength={1} />)}
      <path d={t.acento} stroke={acento} pathLength={1} />
    </svg>
  );
}

/** Devuelve el manejador que reescribe el ícono de un elemento (para onPointerEnter y onFocus). */
export function useEscribirIcono() {
  const ultimo = useRef(0);
  return (e: React.SyntheticEvent<HTMLElement>) => {
    if (prefersReducedMotion() || Date.now() - ultimo.current < 400) return;
    ultimo.current = Date.now();
    const trazos = e.currentTarget.querySelectorAll("[data-icono] path");
    gsap.fromTo(trazos, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out", stagger: 0.08, autoRound: false, overwrite: "auto" });
  };
}
