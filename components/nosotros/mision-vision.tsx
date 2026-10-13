"use client";

// Misión y Visión sobre azul: dos columnas con el título grande en blanco,
// separadas por una línea vertical que se dibuja (1,2 s `expo.inOut`). Títulos por
// líneas (SplitLines) y texto que sube. Las frases clave llevan resaltador naranja
// (el recurso de marca, como el fluo de Sanalys): cuando cada frase llega a la
// pantalla, el naranja se pinta detrás de izquierda a derecha, uno tras otro, y el
// texto pasa a tinta para leerse sobre el naranja. En la Misión se resaltan también
// los 6 sectores (reemplazan a la banda de sectores, rechazada).

import { useRef } from "react";
import { gsap, prefersReducedMotion, START, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/ui/container";
import { SplitLines } from "@/components/anim/split-lines";
import { MISION_VISION } from "./contenido";

const MARKER =
  "mv-mark bg-transparent bg-[linear-gradient(theme(colors.brand.500),theme(colors.brand.500))] bg-no-repeat px-1 [background-position:0_55%] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]";

export function MisionVision() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const marks = gsap.utils.toArray<HTMLElement>(".mv-mark");
      if (prefersReducedMotion()) {
        gsap.set(marks, { backgroundSize: "100% 82%", color: "#0B1E33" });
        return;
      }
      const grid = root.current!.querySelector(".mv-grid");
      gsap
        .timeline({ scrollTrigger: { trigger: grid, start: START, once: true } })
        .fromTo(".mv-divider", { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: "expo.inOut" }, 0)
        .fromTo(".mv-text", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.12 }, 0.25);
      // Por párrafo: los resaltados se pintan uno detrás de otro (0,12 s) cuando el
      // párrafo llega a la pantalla; en la Misión eso incluye los 6 sectores.
      gsap.utils.toArray<HTMLElement>(".mv-text").forEach((p) => {
        const ms = p.querySelectorAll(".mv-mark");
        if (!ms.length) return;
        gsap.fromTo(
          ms,
          { backgroundSize: "0% 82%", color: "#FFFFFF" },
          {
            backgroundSize: "100% 82%",
            color: "#0B1E33",
            duration: 0.8,
            ease: "expo.inOut",
            stagger: 0.12,
            delay: 0.6,
            scrollTrigger: { trigger: p, start: "top 70%", once: true },
          }
        );
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="bg-ink-900 py-24 text-neutral-0 md:py-32">
      <Container>
        <div className="mv-grid relative grid gap-16 md:grid-cols-2 md:gap-0">
          <span aria-hidden className="mv-divider absolute bottom-0 left-1/2 top-0 hidden w-px origin-top bg-neutral-0/15 md:block" />
          {MISION_VISION.map((b, i) => (
            <article key={b.title} className={i === 0 ? "md:pr-14 lg:pr-20" : "md:pl-14 lg:pl-20"}>
              <SplitLines as="h2" className="font-display text-5xl font-semibold tracking-tight md:text-6xl">
                {b.title}
              </SplitLines>
              <p className="mv-text mt-7 text-lg leading-[1.85] text-neutral-300">
                {b.text.map(([t, hl], k) =>
                  hl ? (
                    <mark key={k} className={`${MARKER} font-medium text-neutral-0`}>
                      {t}
                    </mark>
                  ) : (
                    <span key={k}>{t}</span>
                  )
                )}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
