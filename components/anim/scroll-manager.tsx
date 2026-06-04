"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * Recalcula las posiciones de TODOS los ScrollTrigger después de que el layout se
 * asienta. Sin esto, un trigger creado con la página ya scrolleada (navegación
 * client-side, reflow al cargar las webfonts, Fast Refresh en dev) puede no
 * reevaluar su estado inicial y dejar el contenido revelado en opacity:0.
 *
 * Montar UNA vez en el layout del sitio.
 */
export function ScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();

    // Tras pintar el nuevo árbol de esta ruta.
    const raf = requestAnimationFrame(refresh);

    // Reflow al terminar de cargar las webfonts (DM Sans / Inter).
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(refresh).catch(() => {});
    }

    // Imágenes diferidas (carrusel del hero, logos) que cambian la altura.
    window.addEventListener("load", refresh);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", refresh);
    };
  }, [pathname]);

  return null;
}
