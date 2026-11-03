"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, prefersReducedMotion, START, useGSAP } from "@/lib/gsap";
import { Container } from "@/components/ui/container";
import { Pictogram } from "@/components/ui/pictogram";
import { SplitLines } from "@/components/anim/split-lines";
import { LOGO_ARCS, LOGO_BARS, LOGO_ORANGE } from "@/components/brand/logo-geometry";
import { CONTACT } from "@/lib/contact";
import { sinViuda } from "@/lib/texto";
import { CIERRE, CONTACTO, INTRO, SERVICIOS, hrefServicio, incluye, parrafos, servicio, type Servicio } from "@/lib/servicios";

// /servicios y /servicios/[slug]: versión "Bandas" (elegida por Mateo, 2026-11-03).
// Un servicio por banda, tinta y blanco alternados, con el lenguaje de /nosotros:
// - portada en tinta casi a pantalla completa, con la foto y el isotipo encima que se arma
//   como en el logo animado (barras `back.out(1.6)`, arcos que se dibujan) y capas en parallax;
// - títulos por líneas (SplitLines) y la bajada que se enciende palabra por palabra (Enfoque);
// - "qué incluye" como las filas de Valores: línea que se dibuja, relleno naranja al pasar;
// - cierre naranja con el título grande y los botones que se llenan (Cierre de /nosotros).

const EXPO = "ease-[cubic-bezier(0.16,1,0.3,1)]";
const LLENA =
  "group/btn relative isolate inline-flex h-14 items-center justify-center gap-2 overflow-hidden px-8 text-sm font-semibold tracking-wide transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:transition-transform before:duration-[800ms] before:ease-[cubic-bezier(0.16,1,0.3,1)] hover:before:scale-y-100 motion-reduce:before:duration-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-2";
const BOTON = {
  /** Naranja sobre tinta: se llena de blanco. */
  naranja: `${LLENA} bg-brand-500 text-neutral-0 before:bg-neutral-0 hover:text-ink-900`,
  /** Naranja sobre blanco: se llena de tinta. */
  naranjaClaro: `${LLENA} bg-brand-500 text-neutral-0 before:bg-ink-900`,
  tinta: `${LLENA} bg-ink-900 text-neutral-0 before:bg-neutral-0 hover:text-ink-900`,
  blanco: `${LLENA} bg-neutral-0 text-ink-900 before:bg-ink-900 hover:text-neutral-0`,
};

const num = (i: number) => String(i + 1).padStart(2, "0");

function Check({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function Migas({ nombre }: { nombre: string }) {
  return (
    <nav aria-label="Migas de pan" className="flex items-center gap-2 text-xs text-neutral-400">
      <Link href="/servicios" className="transition-colors hover:text-neutral-0">
        Servicios
      </Link>
      <span aria-hidden>/</span>
      <span className="text-neutral-200">{nombre}</span>
    </nav>
  );
}

function Flecha({ abajo = false }: { abajo?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`transition-transform duration-500 ${EXPO} ${abajo ? "group-hover/btn:translate-y-1 group-hover/lk:translate-y-1" : "group-hover/btn:translate-x-1 group-hover/lk:translate-x-1"}`}
    >
      {abajo ? (
        <>
          <line x1="12" y1="4" x2="12" y2="19" />
          <polyline points="6 13 12 19 18 13" />
        </>
      ) : (
        <>
          <line x1="4" y1="12" x2="19" y2="12" />
          <polyline points="13 6 19 12 13 18" />
        </>
      )}
    </svg>
  );
}

/** Link de texto de /nosotros: subrayado naranja que se dibuja y flecha que se corre. */
function LinkTexto({ href, children, abajo = false, claro = false }: { href: string; children: React.ReactNode; abajo?: boolean; claro?: boolean }) {
  return (
    <a href={href} className={`group/lk inline-flex items-center gap-3 text-sm font-semibold tracking-wide ${claro ? "text-ink-900" : "text-neutral-0"}`}>
      <span className="relative">
        {children}
        <span className={`absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-brand-500 transition-transform duration-500 ${EXPO} group-hover/lk:scale-x-100`} />
      </span>
      <span className="text-brand-500">
        <Flecha abajo={abajo} />
      </span>
    </a>
  );
}

// ── Portada: el isotipo que se arma, como /nosotros ─────────────────────────

/**
 * Solo el isotipo en naranja (pedido de Mateo, 2026-11-03: "sacá esa imagen, dejá solo el
 * logo como en nosotros"): las barras suben `back.out(1.6)` de a una (0,12 s) y los arcos se
 * dibujan de abajo hacia arriba. Con el scroll, el isotipo y cada barra se corren a distinto
 * ritmo (parallax en capas).
 */
function Portada() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.set(".bp-bar", { scaleY: 0, transformOrigin: "50% 100%" });
      gsap.set(".bp-draw", { strokeDashoffset: 1 });
      // Arranca oculto (data-reveal) para que no se vea completo antes de armarse.
      gsap.set(".bp-marca", { visibility: "inherit" });
      gsap
        .timeline({ delay: 0.25 })
        .to(".bp-bar", { scaleY: 1, duration: 1.3, ease: "back.out(1.6)", stagger: 0.12 }, 0)
        .to(".bp-draw", { strokeDashoffset: 0, duration: 1.2, ease: "power3.out", autoRound: false }, 0.3);
      const st = { trigger: ref.current, start: "top top", end: "bottom top", scrub: 0.6 };
      gsap.to(".bp-marca", { yPercent: 12, ease: "none", scrollTrigger: st });
      gsap.utils.toArray<SVGElement>(".bp-bar").forEach((b, i) => gsap.to(b, { y: [-60, -140, -30][i], ease: "none", scrollTrigger: st }));
    },
    { scope: ref }
  );
  return (
    <div ref={ref} aria-hidden className="pointer-events-none flex justify-center lg:justify-end">
      <div data-reveal="" className="bp-marca h-[19rem] sm:h-[24rem] lg:h-[min(36rem,70svh)]">
        <svg viewBox="-2 0 676 981" className="h-full w-auto overflow-visible">
          <defs>
            {LOGO_ARCS.map((a) => (
              <mask key={a.id} id={`bp-arc-${a.id}`} maskUnits="userSpaceOnUse" x="-2" y="0" width="680" height="981">
                <path className="bp-draw" d={a.draw} fill="none" stroke="#fff" strokeWidth="96" pathLength={1} strokeDasharray="1 1" />
              </mask>
            ))}
          </defs>
          <g fill={LOGO_ORANGE}>
            {LOGO_ARCS.map((a) => (
              <path key={a.id} d={a.d} mask={`url(#bp-arc-${a.id})`} />
            ))}
            {LOGO_BARS.map((b) => (
              <path key={b.id} d={b.d} className="bp-bar" />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

/** Entradas de la portada: `.bh-in` sube y aparece (1,2 s expo.out, 0,1 s entre sí). */
function useHero<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useGSAP(
    () => {
      const els = ref.current!.querySelectorAll(".bh-in");
      gsap.set(els, { visibility: "inherit" });
      if (prefersReducedMotion()) return;
      gsap.fromTo(els, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.1, delay: 0.45 });
    },
    { scope: ref }
  );
  return ref;
}

// ── Listado ─────────────────────────────────────────────────────────────────

/**
 * Cada banda al llegar (70 %): el pictograma crece (Pictogram), la raya se estira, el texto
 * sube y los puntos entran como las filas de Valores (línea que se dibuja, fila que sube).
 * La foto se abre desde abajo y su imagen se corre con el scroll.
 */
function useBanda<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      const el = ref.current;
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: "top 70%", once: true } })
        .fromTo(el.querySelectorAll(".bb-raya"), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut" }, 0)
        .fromTo(el.querySelectorAll(".bb-in"), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.1 }, 0.25)
        .fromTo(el.querySelectorAll(".bb-line"), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut", stagger: 0.1 }, 0.35)
        .fromTo(el.querySelectorAll(".bb-row"), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.1 }, 0.5);
      const foto = el.querySelector(".bb-foto");
      if (foto) {
        gsap.fromTo(foto, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: foto, start: START, once: true } });
        gsap.fromTo(el.querySelector(".bb-img"), { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: foto, start: "top bottom", end: "bottom top", scrub: 0.6 } });
      }
    },
    { scope: ref }
  );
  return ref;
}

function Banda({ s, i }: { s: Servicio; i: number }) {
  const oscura = i % 2 === 1;
  const inc = incluye(s);
  const ref = useBanda<HTMLElement>();
  return (
    <section ref={ref} id={s.id} data-tone={oscura ? "dark" : "light"} className={`scroll-mt-16 py-20 md:py-28 ${oscura ? "bg-ink-900 text-neutral-0" : "bg-neutral-0 text-ink-900"}`}>
      <Container className="grid items-center gap-16 lg:grid-cols-12 lg:gap-16">
        <div className={`lg:col-span-5 ${oscura ? "lg:order-2" : ""}`}>
          <div className="flex items-center gap-5">
            <Pictogram src={s.pictogram} index={i} className="h-16 w-16 md:h-20 md:w-20" />
            <span aria-hidden className={`bb-raya h-px flex-1 origin-left ${oscura ? "bg-neutral-0/20" : "bg-neutral-200"}`} />
          </div>
          <SplitLines className="mt-7 font-display text-[clamp(2rem,3.6vw,3.25rem)] font-semibold leading-[1.04] tracking-tight [text-wrap:balance]">{s.nombre}</SplitLines>
          <p className={`bb-in mt-5 text-lg leading-relaxed ${oscura ? "text-neutral-300" : "text-neutral-600"}`}>{s.frase}</p>
          {inc && (
            <ul className={`mt-8 border-b ${oscura ? "border-neutral-0/15" : "border-neutral-200"}`}>
              {inc.puntos.slice(0, 3).map((p) => (
                <li key={p.t} className="relative">
                  <span aria-hidden className={`bb-line absolute inset-x-0 top-0 z-10 h-px origin-left ${oscura ? "bg-neutral-0/15" : "bg-neutral-200"}`} />
                  <Link href={hrefServicio(s.id)} className="group relative isolate block overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
                    <span aria-hidden className={`absolute inset-0 -z-10 origin-bottom scale-y-0 bg-brand-500 transition-transform duration-[800ms] ${EXPO} group-hover:scale-y-100`} />
                    <span className="bb-row flex items-center gap-4 px-1 py-4 md:px-3">
                      {p.img ? (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-0">
                          <img src={p.img} alt="" aria-hidden className="h-7 w-7 object-contain" />
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-neutral-0 transition-colors duration-500 group-hover:bg-neutral-0 group-hover:text-brand-500">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      <span className={`flex-1 text-[15px] font-medium leading-snug transition-colors duration-500 group-hover:text-neutral-0 ${oscura ? "text-neutral-100" : "text-ink-900"}`}>{p.t}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="bb-in mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href={hrefServicio(s.id)} className={oscura ? BOTON.naranja : BOTON.naranjaClaro}>
              Ver el servicio <Flecha />
            </Link>
            <LinkTexto href={s.cta.href} claro={!oscura}>
              {s.cta.label}
            </LinkTexto>
          </div>
        </div>
        <div className={`relative lg:col-span-7 ${oscura ? "lg:order-1" : ""}`}>
          <div className="bb-foto relative overflow-hidden">
            <img src={s.foto} alt="" aria-hidden className="bb-img aspect-[4/3] w-full scale-[1.16] object-cover lg:aspect-[5/4]" />
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Cierre naranja de /nosotros: título grande en tinta, botones que se llenan, teléfono y mail. */
function CierreNaranja({ boton, href }: { boton: string; href: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current!;
      gsap.set(el, { visibility: "inherit" });
      if (prefersReducedMotion()) return;
      gsap.fromTo(el.querySelectorAll(".bc-in"), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.1, delay: 0.2, scrollTrigger: { trigger: el, start: START, once: true } });
    },
    { scope: ref }
  );
  return (
    <section data-tone="dark" className="bg-brand-500 py-20 md:py-32">
      <Container className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <SplitLines className="font-display text-[clamp(2.4rem,5.6vw,5rem)] font-semibold leading-[1] tracking-tight text-ink-900 [text-wrap:balance]">{CIERRE.titulo}</SplitLines>
        <div ref={ref} data-reveal="">
          <p className="bc-in text-lg leading-relaxed text-ink-900">{CONTACTO.pregunta}</p>
          <p className="bc-in mt-2 flex flex-wrap gap-x-6 gap-y-1 text-lg font-semibold text-ink-900">
            <a href={CONTACT.phoneTel} className="whitespace-nowrap underline decoration-ink-900/30 underline-offset-4 transition-colors hover:decoration-ink-900">{CONTACTO.tel}</a>
            <a href={CONTACT.emailUrl} className="whitespace-nowrap underline decoration-ink-900/30 underline-offset-4 transition-colors hover:decoration-ink-900">{CONTACTO.mail}</a>
          </p>
          <div className="bc-in mt-8 flex flex-wrap gap-3">
            <Link href={href} className={BOTON.tinta}>
              {boton} <Flecha />
            </Link>
            <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className={BOTON.blanco}>
              WhatsApp
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function ServiciosListado() {
  const hero = useHero<HTMLDivElement>();
  return (
    <div className="overflow-x-clip">
      <section data-tone="dark" className="relative isolate bg-ink-900 text-neutral-0">
        <Container className="grid items-center gap-16 pb-24 pt-14 md:pt-20 lg:min-h-[calc(100svh-6.5rem)] lg:grid-cols-12 lg:gap-12 lg:pb-20">
          <div ref={hero} className="lg:col-span-7">
            <p data-reveal="" className="bh-in text-sm font-semibold tracking-wide text-brand-500">{INTRO.titulo}</p>
            <SplitLines as="h1" immediate className="mt-5 font-display text-[clamp(2.2rem,4.4vw,3.75rem)] font-semibold leading-[1.04] tracking-tight [text-wrap:balance]">
              {sinViuda(INTRO.bajada)}
            </SplitLines>
            <ol data-reveal="" className="bh-in mt-10 grid gap-x-8 border-t border-neutral-0/15 sm:grid-cols-2">
              {SERVICIOS.map((s, i) => (
                <li key={s.id} className="border-b border-neutral-0/15">
                  <a href={`#${s.id}`} className="group/lk flex items-center gap-3 py-3.5 text-[15px] text-neutral-200 transition-colors duration-500 hover:text-neutral-0">
                    <img src={s.pictogram} alt="" aria-hidden className="h-8 w-8 object-contain" />
                    <span className="flex-1">{s.nombre}</span>
                    <span className="text-brand-500 opacity-0 transition-opacity duration-500 group-hover/lk:opacity-100">
                      <Flecha abajo />
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-5">
            <Portada />
          </div>
        </Container>
      </section>
      {SERVICIOS.map((s, i) => (
        <Banda key={s.id} s={s} i={i} />
      ))}
      <CierreNaranja boton="Hablar con ELEVAR" href="/contacto" />
    </div>
  );
}

// ── Página del servicio ─────────────────────────────────────────────────────

/** La descripción en grande, encendiéndose palabra por palabra con el scroll (Enfoque de /nosotros). */
function Enfoque({ s }: { s: Servicio }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(".be-w", { opacity: 0.16 }, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: ".be-lead", start: "top 80%", end: "bottom 45%", scrub: 0.8 } });
      gsap.fromTo(".be-p", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".be-cols", start: START, once: true } });
    },
    { scope: ref }
  );
  const textos = parrafos(s);
  return (
    <section ref={ref} data-tone="light" className="bg-neutral-0 py-24 md:py-32">
      <Container className="grid gap-14 lg:grid-cols-[1.5fr_1fr] lg:items-start lg:gap-20">
        <p className="be-lead font-display text-[clamp(1.5rem,2.6vw,2.25rem)] font-semibold leading-[1.25] tracking-tight text-ink-900">
          {s.desc.split(" ").map((w, i) => (
            <span key={i} className="be-w">
              {w}{" "}
            </span>
          ))}
        </p>
        <div className="be-cols space-y-6 border-t border-neutral-200 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          {textos.map((p, i) => (
            <p key={i} className="be-p leading-relaxed text-neutral-700">
              {p}
            </p>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** "Qué incluye" como las filas de Valores, sobre tinta. */
function Incluye({ s }: { s: Servicio }) {
  const inc = incluye(s);
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap
        .timeline({ scrollTrigger: { trigger: ref.current, start: START, once: true } })
        .fromTo(".bi-line", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut", stagger: 0.1 }, 0)
        .fromTo(".bi-row", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.1 }, 0.15);
    },
    { scope: ref }
  );
  if (!inc) return null;
  return (
    <section id="incluye" data-tone="dark" className="scroll-mt-16 bg-ink-900 py-20 text-neutral-0 md:py-28">
      <Container>
        <SplitLines className="font-display text-[clamp(1.9rem,3.4vw,3rem)] font-semibold leading-[1.06] tracking-tight [text-wrap:balance]">{inc.titulo}</SplitLines>
        <div ref={ref}>
          {inc.sectores ? (
            <>
              <ul className="mt-12 grid grid-cols-2 border-l border-t border-neutral-0/15 md:grid-cols-4">
                {inc.puntos.map((p) => (
                  <li key={p.t} className="group relative isolate overflow-hidden border-b border-r border-neutral-0/15">
                    <span aria-hidden className={`absolute inset-0 -z-10 origin-bottom scale-y-0 bg-brand-500 transition-transform duration-[800ms] ${EXPO} group-hover:scale-y-100`} />
                    <div className="bi-row flex flex-col gap-5 p-5 md:p-7">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-0">
                        <img src={p.img} alt="" aria-hidden className="h-10 w-10 object-contain" />
                      </span>
                      <span className="text-[15px] font-medium leading-snug text-neutral-100">{p.t}</span>
                    </div>
                  </li>
                ))}
              </ul>
              {inc.nota && (
                <ul className="mt-8 flex flex-col gap-3 text-[15px] text-neutral-300 sm:flex-row sm:gap-10">
                  {inc.nota.map((n) => (
                    <li key={n} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-neutral-0">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {n}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <ul className="mt-12 border-b border-neutral-0/15 md:mt-16">
              {inc.puntos.map((p, i) => (
                <li key={p.t} className="relative">
                  <span aria-hidden className="bi-line absolute inset-x-0 top-0 z-10 h-px origin-left bg-neutral-0/15" />
                  <div tabIndex={0} className="group relative isolate overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
                    <span aria-hidden className={`absolute inset-0 -z-10 origin-bottom scale-y-0 bg-brand-500 transition-transform duration-[800ms] ${EXPO} group-hover:scale-y-100 group-focus-visible:scale-y-100`} />
                    <div className={`bi-row grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-3 px-1 py-7 md:gap-x-8 md:px-4 md:py-9 ${p.d ? "md:grid-cols-[3rem_4.5rem_minmax(0,1fr)_minmax(0,1.3fr)]" : "md:grid-cols-[3rem_4.5rem_minmax(0,1fr)]"}`}>
                      <span className="hidden font-display text-sm font-semibold tabular-nums text-brand-500 transition-colors duration-500 group-hover:text-ink-900 md:block">{num(i)}</span>
                      {p.img ? (
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-0 md:h-16 md:w-16">
                          <img src={p.img} alt="" aria-hidden className="h-9 w-9 object-contain md:h-10 md:w-10" />
                        </span>
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-0/25 text-neutral-0 transition-colors duration-500 group-hover:border-ink-900 group-hover:bg-ink-900 md:h-14 md:w-14">
                          <Check className="h-5 w-5" />
                        </span>
                      )}
                      <h3 className={`font-display font-semibold tracking-tight text-neutral-0 ${p.d ? "text-[19px] leading-snug md:text-2xl" : "text-[17px] leading-snug md:text-xl"}`}>{p.t}</h3>
                      {p.d && <p className="col-span-2 leading-relaxed text-neutral-300 transition-colors duration-500 group-hover:text-ink-900 md:col-span-1">{p.d}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Otros servicios: fotos que se abren de a una; al pasar, la foto crece y se estira la barra naranja. */
function Otros({ s }: { s: Servicio }) {
  const ref = useRef<HTMLUListElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.fromTo(".bo-foto", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut", stagger: 0.1, scrollTrigger: { trigger: ref.current, start: START, once: true } });
    },
    { scope: ref }
  );
  const otros = SERVICIOS.filter((x) => x.id !== s.id);
  return (
    <section data-tone="light" className="bg-neutral-0 py-20 md:py-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SplitLines className="font-display text-[clamp(1.9rem,3.4vw,3rem)] font-semibold leading-[1.06] tracking-tight text-ink-900">Otros servicios</SplitLines>
          <LinkTexto href={"/servicios"} claro>
            Todos los servicios
          </LinkTexto>
        </div>
        <ul ref={ref} className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-12 lg:grid-cols-5">
          {otros.map((o) => (
            <li key={o.id}>
              <Link href={hrefServicio(o.id)} className="group/lk block">
                <div className="bo-foto relative overflow-hidden">
                  <img src={o.foto} alt="" aria-hidden className={`aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ${EXPO} group-hover/lk:scale-110`} />
                  <span aria-hidden className={`absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-brand-500 transition-transform duration-700 ${EXPO} group-hover/lk:scale-x-100`} />
                  <span className="absolute left-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-0">
                    <img src={o.pictogram} alt="" aria-hidden className="h-8 w-8 object-contain" />
                  </span>
                </div>
                <span className="mt-4 flex items-start justify-between gap-3 font-display text-[17px] font-semibold leading-snug text-ink-900">
                  {o.nombre}
                  <span className="mt-1 text-brand-500">
                    <Flecha />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function ServicioDetalle({ id }: { id: string }) {
  const s = servicio(id)!;
  const hero = useHero<HTMLDivElement>();
  return (
    <div className="overflow-x-clip">
      <section data-tone="dark" className="relative isolate bg-ink-900 text-neutral-0">
        <Container className="grid items-center gap-16 pb-24 pt-8 md:pt-10 lg:min-h-[calc(100svh-6.5rem)] lg:grid-cols-12 lg:gap-12 lg:pb-20">
          <div ref={hero} className="lg:col-span-7">
            <div data-reveal="" className="bh-in">
              <Migas nombre={s.nombre} />
            </div>
            <div data-reveal="" className="bh-in mt-10 md:mt-14">
              <Pictogram src={s.pictogram} className="h-16 w-16 md:h-20 md:w-20" />
            </div>
            <SplitLines as="h1" immediate className="mt-6 font-display text-[clamp(2.3rem,4.6vw,4rem)] font-semibold leading-[1.03] tracking-tight [text-wrap:balance]">
              {s.titulo}
            </SplitLines>
            <p data-reveal="" className="bh-in mt-7 text-lg leading-relaxed text-neutral-300">{s.frase}</p>
            <div data-reveal="" className="bh-in mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Link href={s.cta.href} className={BOTON.naranja}>
                {s.cta.label} <Flecha />
              </Link>
              <LinkTexto href="#incluye" abajo>
                Qué incluye
              </LinkTexto>
            </div>
          </div>
          <div className="lg:col-span-5">
            <Portada />
          </div>
        </Container>
      </section>
      <Enfoque s={s} />
      <Incluye s={s} />
      <Otros s={s} />
      <CierreNaranja boton={s.cta.label} href={s.cta.href} />
    </div>
  );
}
