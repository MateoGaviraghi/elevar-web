"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

// Fila de cursos con scroll horizontal: al llegar, la sección queda fija bajo el
// header y el scroll de la página corre las tarjetas hacia la izquierda (GSAP
// ScrollTrigger, pin + scrub). Una línea abajo marca el avance.
// Movimiento reducido: sin fijar, fila deslizable con el dedo o el trackpad.

const HEADER = 64; // alto del header fijo del sitio (h-16)

export function CourseCarousel({
  children,
  header,
  label,
}: {
  children: ReactNode;
  header?: ReactNode;
  label: string;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const distance = () => Math.max(0, row.current!.scrollWidth - viewport.current!.clientWidth);

        // Entrada: el título y las tarjetas suben juntos, escalonados.
        gsap.from([".cc-head", ".rail-card"], {
          y: 48,
          opacity: 0,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: { trigger: scope.current, start: "top 70%", once: true },
        });

        // Scroll horizontal fijado.
        const tween = gsap.to(row.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: `top ${HEADER}px`,
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        gsap.fromTo(
          bar.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: scope.current,
              start: `top ${HEADER}px`,
              end: () => `+=${distance()}`,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          }
        );
        return () => tween.scrollTrigger?.kill();
      });

      // Las fuentes y las imágenes cambian medidas: recalcular cuando terminan.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => mm.revert();
    },
    { scope }
  );

  return (
    <div
      ref={scope}
      role="region"
      aria-roledescription="carrusel"
      aria-label={label}
      className="flex min-h-[calc(100svh-64px)] flex-col justify-center overflow-hidden py-[min(3.5rem,5svh)]"
    >
      {header && <div className="cc-head">{header}</div>}

      <div
        ref={viewport}
        className="mt-[min(2.5rem,4svh)] overflow-x-auto [scrollbar-width:none] motion-safe:overflow-x-visible [&::-webkit-scrollbar]:hidden"
      >
        <div
          ref={row}
          className="flex w-max gap-5 [--pad:1rem] sm:[--pad:1.5rem] lg:[--pad:2rem] motion-reduce:snap-x motion-reduce:snap-mandatory"
          style={{
            paddingLeft: "max(var(--pad), calc((100% - 1280px) / 2 + var(--pad)))",
            paddingRight: "max(var(--pad), calc((100% - 1280px) / 2 + var(--pad)))",
          }}
        >
          {children}
        </div>
      </div>

      {/* Avance del recorrido */}
      <div className="mx-auto mt-[min(2rem,4svh)] w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 motion-reduce:hidden">
        <span className="block h-px w-full bg-neutral-200" aria-hidden>
          <span ref={bar} className="block h-full w-full origin-left scale-x-0 bg-ink-900" />
        </span>
      </div>
    </div>
  );
}
