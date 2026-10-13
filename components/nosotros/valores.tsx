"use client";

// Valores: tres filas a todo el ancho (número · pictograma · título · descripción)
// con línea arriba que se dibuja y texto que sube, de a una (0,1 s). Al pasar el
// mouse o enfocar, sube desde abajo un relleno naranja (0,8 s, la curva de los
// botones del sitio): el título pasa a blanco, la descripción a tinta y el
// pictograma se invierte a blanco con su anillo, para no perderse sobre el naranja.

import { useRef } from "react";
import { gsap, prefersReducedMotion, START, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Pictogram } from "@/components/ui/pictogram";
import { VALORES } from "./contenido";

export function Valores() {
  const list = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap
        .timeline({ scrollTrigger: { trigger: list.current, start: START, once: true } })
        .fromTo(".vl-line", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut", stagger: 0.1 }, 0)
        .fromTo(".vl-row", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.1 }, 0.15);
    },
    { scope: list }
  );

  return (
    <section className="bg-neutral-0 py-20 md:py-28">
      <Container>
        <SectionHeader eyebrow="Cómo trabajamos" title="Nuestros valores" />
        <ul ref={list} className="mt-12 border-b border-neutral-200 md:mt-16">
          {VALORES.map((v, i) => (
            <li key={v.title} className="relative">
              <span aria-hidden className="vl-line absolute inset-x-0 top-0 z-10 h-px origin-left bg-neutral-200" />
              <div
                tabIndex={0}
                className="group relative isolate overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-brand-500 transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100 group-focus-visible:scale-y-100 motion-reduce:transition-none"
                />
                <div className="vl-row grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 px-1 py-7 md:grid-cols-[3rem_5rem_minmax(0,1fr)_minmax(0,1.3fr)] md:gap-x-8 md:px-4 md:py-10">
                  <span className="hidden text-sm font-medium text-neutral-400 transition-colors duration-500 group-hover:text-ink-900 md:block">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Pictogram
                    src={v.img}
                    index={i}
                    className="h-14 w-14 md:h-16 md:w-16 [&_.pictogram-ring_circle]:stroke-neutral-0 [&_img]:transition-[filter] [&_img]:duration-500 group-hover:[&_img]:brightness-0 group-hover:[&_img]:invert group-focus-visible:[&_img]:brightness-0 group-focus-visible:[&_img]:invert"
                  />
                  <h3 className="font-display text-3xl font-semibold tracking-tight text-ink-900 transition-colors duration-500 group-hover:text-neutral-0 md:text-5xl">
                    {v.title}
                  </h3>
                  <p className="col-span-2 leading-relaxed text-neutral-700 transition-colors duration-500 group-hover:text-ink-900 md:col-span-1">
                    {v.desc}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
