"use client";

// Sección "Dirección" de /nosotros: Laura Delissi, sobre azul (la página alterna azul y blanco). Mezcla de Dennis Snellenberg
// (about: nombre a todo el ancho, retrato con parallax, credencial destacada como
// sello) y Morten Stig Christensen (info: credenciales en filas finas por grupo).
// - Nombre: sube palabra por palabra desde una máscara (1,3 s `expo.out`, 0,1 s).
// - Retrato: cortina del color del fondo (1,3 s `expo.inOut`) + foto 1,15 → 1 y
//   parallax ±3 %. La foto mide 135 % del marco y arranca 5 % arriba para dejar
//   fuera del cuadro el defecto que tiene abajo a la izquierda.
// - Sello OAA: entra girando un cuarto de vuelta (1,4 s) y queda quieto.
// - Filas: la línea se dibuja y el texto sube, de a una (0,08 s).

import { useRef } from "react";
import { gsap, prefersReducedMotion, START, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/ui/container";
import { CRED_GROUPS, LAURA, type CredGroup } from "./laura";

// Botón sobre azul: naranja que se llena de blanco al pasar el mouse (el relleno
// tinta de los botones del sitio se perdería contra el fondo).
const CV_BUTTON =
  "group relative isolate inline-flex h-12 items-center justify-center gap-2 overflow-hidden bg-brand-500 px-7 text-sm font-semibold tracking-wide text-neutral-0 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-neutral-0 before:transition-transform before:duration-[800ms] before:ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-ink-900 hover:before:scale-y-100 motion-reduce:before:duration-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";

function Portrait({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current!;
      if (prefersReducedMotion()) return;
      const img = el.querySelector("img");
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: START, once: true } })
        .fromTo(".dr-plate", { scaleY: 1 }, { scaleY: 0, duration: 1.3, ease: "expo.inOut" }, 0)
        .fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0.1);
      gsap.fromTo(
        img,
        { yPercent: -3 },
        { yPercent: 3, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } }
      );
    },
    { scope: ref }
  );
  return (
    <div ref={ref} className={`relative overflow-hidden bg-ink-800 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LAURA.photo} alt={LAURA.name} className="absolute inset-x-0 -top-[5%] h-[135%] w-full object-cover object-top" />
      <span aria-hidden className="dr-plate pointer-events-none absolute inset-0 hidden origin-top bg-ink-900 motion-safe:[.js_&]:block" />
    </div>
  );
}

function Seal({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        ref.current,
        { rotate: -90, scale: 0.6, autoAlpha: 0 },
        { rotate: 0, scale: 1, autoAlpha: 1, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ref.current, start: START, once: true } }
      );
    },
    { scope: ref }
  );
  return (
    <div ref={ref} className={className} role="img" aria-label={`${LAURA.seal.title} — ${LAURA.seal.detail}`}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx="60" cy="60" r="59" className="fill-brand-500" />
        <defs>
          <path id="dr-ring" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
        </defs>
        <text className="fill-neutral-0" style={{ fontSize: 8.6, letterSpacing: "0.12em", fontWeight: 600 }}>
          <textPath href="#dr-ring">EXPERTA TÉCNICA · ORGANISMO ARGENTINO DE ACREDITACIÓN · </textPath>
        </text>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-semibold leading-none text-neutral-0">OAA</span>
    </div>
  );
}

function Rows({ group }: { group: CredGroup }) {
  const ref = useRef<HTMLUListElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap
        .timeline({ scrollTrigger: { trigger: ref.current, start: START, once: true } })
        .fromTo(".dr-line", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut", stagger: 0.08 }, 0)
        .fromTo(".dr-row", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.08 }, 0.15);
    },
    { scope: ref }
  );
  return (
    <ul ref={ref}>
      {group.rows.map((r) => (
        <li key={r.title} className="group relative">
          <span aria-hidden className="dr-line absolute inset-x-0 top-0 h-px origin-left bg-neutral-0/15" />
          {/* Al pasar el mouse la línea se pinta de naranja de punta a punta y el texto se corre. */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-brand-500 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 motion-reduce:transition-none" />
          <div className="dr-row py-4 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5 motion-reduce:transition-none">
            {r.when && <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">{r.when}</p>}
            <p className="mt-1 font-display text-base font-semibold leading-snug text-neutral-0">{r.title}</p>
            <p className="mt-0.5 text-sm text-neutral-400">{r.place}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Direccion() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = root.current!;
      const title = el.querySelector(".dr-title")!;
      const intro = el.querySelector(".dr-intro")!;
      gsap.set([title, intro], { visibility: "inherit" });
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        ".dr-word",
        { yPercent: 110 },
        { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: title, start: START, once: true } }
      );
      gsap.fromTo(
        ".dr-in",
        { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: intro, start: START, once: true } }
      );
    },
    { scope: root }
  );

  return (
    <section id="direccion" className="scroll-mt-16 bg-ink-900 py-24 text-neutral-0 md:py-32">
      <Container>
        <div ref={root}>
          <h2
            data-reveal=""
            className="dr-title font-display text-[clamp(3rem,9vw,6rem)] font-semibold leading-[0.95] tracking-tight text-neutral-0"
          >
            {LAURA.name.split(" ").map((w) => (
              <span key={w} className="mr-[0.22em] inline-block overflow-hidden pb-[0.06em] align-top last:mr-0">
                <span className="dr-word inline-block">{w}</span>
              </span>
            ))}
          </h2>

          <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-2 lg:gap-20">
            <div className="relative">
              <Portrait className="aspect-[4/5]" />
              <Seal className="absolute -bottom-10 right-4 h-28 w-28 md:-right-10 md:h-36 md:w-36" />
            </div>
            <div data-reveal="" className="dr-intro lg:pt-6">
              <p className="dr-in font-medium text-brand-400">{LAURA.role}</p>
              <p className="dr-in mt-4 font-display text-2xl font-medium leading-snug tracking-tight text-neutral-0 md:text-3xl">{LAURA.lead}</p>
              <p className="dr-in mt-6 leading-relaxed text-neutral-300">Experta técnica del {LAURA.seal.detail} (OAA).</p>
              <div className="dr-in mt-8">
                <a href={LAURA.cv} download={LAURA.cvFileName} className={CV_BUTTON}>
                  Descargar CV
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 4v12" />
                    <polyline points="6 11 12 17 18 11" />
                    <line x1="5" y1="20" x2="19" y2="20" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-20 grid gap-12 md:grid-cols-3 md:gap-10 lg:mt-28">
            {CRED_GROUPS.map((g) => (
              <div key={g.id}>
                <p className="mb-3 font-display text-lg font-semibold text-neutral-0">{g.label}</p>
                <Rows group={g} />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
