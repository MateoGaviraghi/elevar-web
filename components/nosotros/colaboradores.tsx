"use client";

// Red de colaboradores (pedido de Laura: sin fotos, solo el texto). Blanco, entre
// Dirección (azul) y el cierre (naranja). El título entra por líneas; la frase
// principal sube y "distintos países de Latinoamérica" se subraya en naranja de
// izquierda a derecha (1,1 s); los dos párrafos entran escalonados con su línea.
// Con movimiento reducido, todo a la vista y el subrayado ya dibujado.

import { useRef } from "react";
import { gsap, prefersReducedMotion, START, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/ui/container";
import { SplitLines } from "@/components/anim/split-lines";
import { COLABORADORES } from "./contenido";

export function Colaboradores() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const lead = root.current?.querySelector(".cb-lead");
      if (prefersReducedMotion()) {
        lead?.classList.add("cb-on");
        return;
      }
      gsap
        .timeline({ scrollTrigger: { trigger: ".cb-lead", start: START, once: true } })
        .fromTo(".cb-lead", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out" }, 0)
        .call(() => lead?.classList.add("cb-on"), undefined, 0.5);
      gsap
        .timeline({ scrollTrigger: { trigger: ".cb-cols", start: START, once: true } })
        .fromTo(".cb-line", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut", stagger: 0.12 }, 0)
        .fromTo(".cb-p", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.12 }, 0.15);
    },
    { scope: root }
  );

  return (
    <section ref={root} className="bg-neutral-0 py-24 md:py-36">
      <Container>
        {/* Dos filas sobre la misma grilla: título | frase, y debajo un párrafo
            en cada columna, para que no quede vacío bajo el título. */}
        <div className="grid gap-10 lg:grid-cols-2 lg:items-end lg:gap-x-20">
          <SplitLines className="font-display text-[clamp(2.2rem,4.6vw,4rem)] font-semibold leading-[1.04] tracking-tight text-ink-900 [text-wrap:balance]">
            {COLABORADORES.title}
          </SplitLines>
          <p className="cb-lead font-display text-[clamp(1.4rem,2.2vw,2rem)] font-medium leading-[1.3] tracking-tight text-ink-900">
            {COLABORADORES.lead.map(([t, hl], i) =>
              hl ? (
                <span
                  key={i}
                  className="bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat text-brand-500 transition-[background-size] duration-[1100ms] ease-[cubic-bezier(0.87,0,0.13,1)] [background-position:0_94%] [background-size:0%_0.07em] [box-decoration-break:clone] [.cb-on_&]:[background-size:100%_0.07em] motion-reduce:transition-none"
                >
                  {t}
                </span>
              ) : (
                <span key={i}>{t}</span>
              )
            )}
          </p>
        </div>
        <div className="cb-cols mt-12 grid gap-8 md:mt-20 md:grid-cols-2 md:gap-x-20">
          {COLABORADORES.paragraphs.map((p) => (
            <div key={p} className="relative pt-6">
              <span aria-hidden className="cb-line absolute inset-x-0 top-0 h-px origin-left bg-neutral-200" />
              <p className="cb-p text-lg leading-relaxed text-neutral-700">{p}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
