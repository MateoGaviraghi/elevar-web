"use client";

// Botón para volver arriba (Mateo, 2026-11-03: "no tiene el botón de la flecha para
// regresar"). Aparece al pasar los 600 px de scroll, a la izquierda del de WhatsApp, y sube
// con el scroll suave del sitio. Tinta con flecha naranja; al pasar el mouse se llena de
// naranja desde abajo, como los botones del sitio.

import { useEffect, useState } from "react";
import { scrollPageTo } from "./smooth-scroll";

export function VolverArriba() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Volver arriba"
      tabIndex={visible ? 0 : -1}
      onClick={() => scrollPageTo(0, Math.min(1.6, 0.7 + window.scrollY / 4000))}
      className={`group fixed bottom-6 right-[5.5rem] z-40 grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-ink-900 text-brand-500 shadow-[0_10px_24px_-10px_rgba(11,30,51,0.7)] ring-1 ring-neutral-0/15 transition-[opacity,transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] before:absolute before:inset-0 before:origin-bottom before:scale-y-0 before:rounded-full before:bg-brand-500 before:transition-transform before:duration-500 before:ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-neutral-0 hover:before:scale-y-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 print:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="relative transition-transform duration-500 group-hover:-translate-y-0.5">
        <line x1="12" y1="20" x2="12" y2="5" />
        <polyline points="6 11 12 5 18 11" />
      </svg>
    </button>
  );
}
