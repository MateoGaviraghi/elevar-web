"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * Smooth scroll con inercia (Lenis) sincronizado con GSAP ScrollTrigger.
 *
 * Es lo que le da al sitio la sensación fluida y premium: la rueda no salta,
 * el scroll interpola con momentum. Los parallax (MediaHero/ParallaxBand) y los
 * reveals por IntersectionObserver siguen funcionando porque Lenis mueve la
 * posición real del scroll, solo que suavizada.
 *
 * Respeta prefers-reduced-motion (cae al scroll nativo).
 * Montar UNA vez en el layout del sitio.
 */

// Compartida para poder resetear el scroll al navegar.
let lenisRef: Lenis | null = null;

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // Solo en desktop con mouse. En teléfono/tablet el scroll táctil nativo ya es
    // fluido (el "feel de app") y Lenis lo entorpece o lo rompe. Sin Lenis, los
    // reveals (IntersectionObserver) y el parallax (ScrollTrigger) siguen andando
    // sobre el scroll nativo.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const lenis = new Lenis({
      lerp: 0.085, // más bajo = más “pesado”/suave; 0.08–0.1 es el dulce
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });
    lenisRef = lenis;

    // ScrollTrigger se sincroniza con cada frame de Lenis.
    lenis.on("scroll", ScrollTrigger.update);

    // rAF propio de Lenis: independiente del ticker de GSAP (que puede dormirse
    // cuando no hay tweens activos y dejaría el smooth sin manejar).
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef = null;
    };
  }, []);

  // Al navegar entre páginas, arrancar arriba sin animación.
  useEffect(() => {
    if (lenisRef) lenisRef.scrollTo(0, { immediate: true });
    else if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
