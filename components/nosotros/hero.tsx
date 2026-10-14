"use client";

// Hero de /nosotros: la presentación de ELEVAR como título (no un rótulo) y, como
// imagen, el isotipo de la marca en grande, saliendo por el borde derecho.
// Al cargar: el título entra por líneas (SplitLines) y las 3 barras del isotipo
// suben y se asientan como en el logo animado ("Niveles": `back.out(1.6)` 1,3 s),
// los arcos se dibujan de abajo hacia arriba. Con el scroll el isotipo se desplaza
// más lento que la página y cada barra a su propio ritmo (parallax en capas).
// "gestión de calidad" va en naranja y se subraya cuando el isotipo termina.

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/ui/container";
import { SplitLines } from "@/components/anim/split-lines";
import { LOGO_ARCS, LOGO_BARS, LOGO_ORANGE } from "@/components/brand/logo-geometry";
import { HERO } from "./contenido";

export function NosotrosHero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      gsap.set(el.querySelectorAll("[data-reveal]:not(h1)"), { visibility: "inherit" });
      // El subrayado naranja de "gestión de calidad" se dibuja cuando el isotipo
      // termina de armarse (por clase y transición CSS: SplitText rehace los nodos).
      if (prefersReducedMotion()) {
        el.classList.add("nh-on");
        return;
      }
      gsap.delayedCall(1.5, () => el.classList.add("nh-on"));

      gsap.set(".nh-bar", { scaleY: 0, transformOrigin: "50% 100%" });
      gsap.set(".nh-draw", { strokeDashoffset: 1 });
      gsap
        .timeline({ delay: 0.25 })
        .to(".nh-bar", { scaleY: 1, duration: 1.3, ease: "back.out(1.6)", stagger: 0.12 }, 0)
        .to(".nh-draw", { strokeDashoffset: 0, duration: 1.2, ease: "power3.out" }, 0.3)
        .fromTo(".nh-in", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.1 }, 0.45);

      const st = { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 };
      gsap.to(".nh-mark", { yPercent: 12, ease: "none", scrollTrigger: st });
      gsap.utils.toArray<SVGElement>(".nh-bar").forEach((b, i) =>
        gsap.to(b, { y: [-60, -140, -30][i], ease: "none", scrollTrigger: st })
      );
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative isolate overflow-hidden bg-ink-900 text-neutral-0">
      {/* Isotipo completo (pedido de Mateo, 2026-10-14: antes se cortaba por el borde):
          a la derecha en escritorio; debajo del texto en el teléfono. */}
      <div
        aria-hidden
        className="nh-mark pointer-events-none absolute bottom-10 right-[8%] h-[19rem] sm:h-[24rem] lg:bottom-16 lg:right-[6%] lg:top-16 lg:h-auto"
      >
        <svg viewBox="-2 0 676 981" className="h-full w-auto overflow-visible">
          <defs>
            {LOGO_ARCS.map((a) => (
              <mask key={a.id} id={`nh-arc-${a.id}`} maskUnits="userSpaceOnUse" x="-2" y="0" width="680" height="981">
                <path className="nh-draw" d={a.draw} fill="none" stroke="#fff" strokeWidth="96" pathLength={1} strokeDasharray="1 1" />
              </mask>
            ))}
          </defs>
          <g fill={LOGO_ORANGE}>
            {LOGO_ARCS.map((a) => (
              <path key={a.id} d={a.d} mask={`url(#nh-arc-${a.id})`} />
            ))}
            {LOGO_BARS.map((b) => (
              <path key={b.id} d={b.d} className="nh-bar" />
            ))}
          </g>
        </svg>
      </div>

      <Container className="relative pb-[24rem] pt-16 sm:pb-[30rem] md:pt-24 lg:flex lg:min-h-[calc(100svh-6.5rem)] lg:items-center lg:pb-24">
        <div className="max-w-3xl lg:max-w-[60%]">
          <SplitLines
            as="h1"
            immediate
            className="font-display text-[clamp(2.1rem,4.4vw,4rem)] font-semibold leading-[1.04] tracking-tight [text-wrap:balance]"
          >
            {HERO.title.map(([t, hl], i) =>
              hl ? (
                <span
                  key={i}
                  className="nh-hl bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat text-brand-500 transition-[background-size] duration-[1100ms] ease-[cubic-bezier(0.87,0,0.13,1)] [background-position:0_94%] [background-size:0%_0.07em] [box-decoration-break:clone] [.nh-on_&]:[background-size:100%_0.07em]"
                >
                  {t}
                </span>
              ) : (
                <span key={i}>{t}</span>
              )
            )}
          </SplitLines>
          <div data-reveal="" className="mt-8 md:mt-10">
            <p className="nh-in max-w-xl text-lg leading-relaxed text-neutral-300">{HERO.lead}</p>
            <a
              href={HERO.link.href}
              className="nh-in group mt-8 inline-flex items-center gap-3 text-sm font-semibold tracking-wide text-neutral-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-4 focus-visible:ring-offset-ink-900"
            >
              <span className="relative">
                {HERO.link.label}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-brand-500 transition-transform duration-500 ease-out group-hover:scale-x-100" />
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-brand-500 transition-transform duration-500 ease-out group-hover:translate-y-1">
                <line x1="12" y1="4" x2="12" y2="19" />
                <polyline points="6 13 12 19 18 13" />
              </svg>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
