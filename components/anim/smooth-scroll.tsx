"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { ScrollTrigger, gsap, prefersReducedMotion } from "@/lib/gsap";
import { MODALITIES } from "@/lib/formacion-modalities";

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
// La lista de cursos cambia la dirección sin cambiar de página: ahí no se sube.
let keepNext = false;

/** El próximo cambio de dirección no lleva la página arriba. */
export function keepScrollOnNextPath(): void {
  keepNext = true;
}

/** Desplaza la página con el mismo scroll suave del sitio (o el nativo sin Lenis). */
export function scrollPageTo(y: number, duration = 0.9): void {
  if (lenisRef) lenisRef.scrollTo(y, { duration, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });
  else if (prefersReducedMotion()) window.scrollTo(0, y);
  else {
    // Sin Lenis (celular): el scroll "smooth" nativo se cortaba cuando ScrollTrigger
    // recalculaba (lleva la página a 0 para medir y la devuelve), así que el cambio de
    // modalidad no subía. Se mueve cuadro por cuadro; un toque o la rueda lo cortan.
    const o = { y: window.scrollY };
    const stop = () => tween.kill();
    const tween = gsap.to(o, {
      y,
      duration,
      ease: "power3.inOut",
      overwrite: true,
      onUpdate: () => window.scrollTo(0, o.y),
      onComplete: () => {
        window.removeEventListener("touchstart", stop);
        window.removeEventListener("wheel", stop);
      },
    });
    window.addEventListener("touchstart", stop, { once: true, passive: true });
    window.addEventListener("wheel", stop, { once: true, passive: true });
  }
}

/** Congela el scroll de la página mientras hay un panel encima (carrito). */
export function setScrollLocked(locked: boolean): void {
  if (lenisRef) {
    if (locked) lenisRef.stop();
    else lenisRef.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

/** Lista de cursos de una modalidad (/formacion/<modalidad>). */
const isModalityList = (path: string) => {
  const m = path.match(/^\/formacion\/([^/]+)$/);
  return !!m && MODALITIES.some((x) => x.slug === m[1]);
};

export function SmoothScroll() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // Solo en desktop con mouse. En teléfono/tablet el scroll táctil nativo ya es
    // fluido (el "feel de app") y Lenis lo entorpece o lo rompe. Sin Lenis, los
    // reveals (IntersectionObserver) y el parallax (ScrollTrigger) siguen andando
    // sobre el scroll nativo.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const lenis = new Lenis({
      // Mateo, 2026-10-20: "el scroll está súper lento". Con 0.075 una muesca hacía el
      // 90 % en 0,51 s y frenaba en 1 s; con 0.14, 0,25 s y 0,5 s (como lenis.dev).
      lerp: 0.14,
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
    const from = prevPath.current;
    prevPath.current = pathname;
    if (keepNext) {
      keepNext = false;
      return;
    }
    // Entre dos listas de modalidad la subida la hace la lista, suave (1,4 s), como con
    // las píldoras; acá no se salta arriba de golpe.
    if (from !== pathname && isModalityList(from) && isModalityList(pathname)) return;
    if (lenisRef) lenisRef.scrollTo(0, { immediate: true });
    else if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
