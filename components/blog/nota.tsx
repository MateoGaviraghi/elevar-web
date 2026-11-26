"use client";

// Página de una nota del blog (/blog/<slug>): «Cartas», elegida por Mateo el 2026-11-26 entre tres
// prototipos («vamos a ir con lo de la carta») y corregida en dos vueltas. Ref. Skiper UI · Sticky
// Card 003, con el idioma de los heros del sitio:
// 1. Cabecera azul con el isotipo que se arma (el de Nosotros y Servicios) y los datos de la nota.
// 2. Introducción que sube por líneas y las partes como tarjetitas que llevan a cada una.
// 3. Cada parte es una tarjeta que llega girada y se endereza con la rueda: foto a todo el alto con
//    el número, rótulo, isotipo, título, texto y un pie «Sigue: …». Cuando se terminó de leer queda
//    fija y la siguiente sube encima; la de abajo se achica, sube, gira y se apaga. Cada tarjeta
//    tiene su capa en orden.
// 4. Anterior y siguiente como tarjetas grandes, «Ver todas las cápsulas» y la banda de la comunidad.
// Rechazado antes (no reintentar): riel de partes con notas al margen sobre la cabecera azul
// (versión «The thread»), la regla de lectura abajo y el botón «Volver al blog».
import Image from "next/image";
import Link from "next/link";
import { useId, useRef } from "react";
import { Container } from "@/components/ui/container";
import { SplitLines } from "@/components/anim/split-lines";
import { scrollPageTo } from "@/components/anim/smooth-scroll";
import { LOGO_ARCS, LOGO_BARS, LOGO_ORANGE } from "@/components/brand/logo-geometry";
import { airMasks, gsap, LINE_FROM, prefersReducedMotion, ScrollTrigger, SplitText, START, useGSAP } from "@/lib/gsap";
import type { BlogBlock } from "@/lib/blog";
import { usePegarEnVivo } from "@/lib/pegar-en-vivo";
import type { Capsula } from "./datos";
import { Cierre } from "./lista";
import { partirTitulo, type DatosNota } from "./nota-datos";
import { Flecha, Meta } from "./piezas";

/** Texto de un párrafo o un ítem: 1️⃣ pasa a «1.», y salen las viñetas pegadas al texto
 * (▪, 🔸) que duplicaban la viñeta de la lista. */
function limpiarTexto(t: string): string {
  return t
    .replace(/(\d)\uFE0F?\u20E3/gu, "$1.")
    .replace(/^[\s▪•·]+/u, "")
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "")
    .replace(/^\s+/u, "");
}

/** Une las dos últimas palabras de un subtítulo si juntas son cortas (sin palabra sola abajo,
 * sin un bloque que no entre en la columna del celular). */
function sinSola(t: string): string {
  return t.replace(/\s+(\S+)$/u, (m, ult: string) => {
    const previa = t.slice(0, t.length - m.length).split(/\s/).pop() ?? "";
    return previa.length + ult.length < 20 ? `\u00A0${ult}` : m;
  });
}

const dos = (n: number) => String(n).padStart(2, "0");

function Bloques({ bloques }: { bloques: BlogBlock[] }) {
  const out: React.ReactNode[] = [];
  let li: string[] = [];
  const cerrar = () => {
    if (!li.length) return;
    out.push(
      <ul key={`ul-${out.length}`} className="list-disc space-y-3 pl-5 marker:text-brand-500">
        {li.map((t, i) => (
          <li key={i} className="pl-1">
            {limpiarTexto(t)}
          </li>
        ))}
      </ul>
    );
    li = [];
  };
  for (const b of bloques) {
    if (b.type === "li") {
      li.push(b.text);
      continue;
    }
    cerrar();
    out.push(<p key={`p-${out.length}`}>{limpiarTexto(b.text)}</p>);
  }
  cerrar();
  return <>{out}</>;
}

/** Lleva la página a la parte, dejando `margen` px libres arriba (el header). */
function irAParte(id: string, margen: number) {
  const el = document.getElementById(id);
  if (!el) return;
  scrollPageTo(Math.max(0, el.getBoundingClientRect().top + window.scrollY - margen));
}

const HOVER = "[@media(hover:hover)_and_(pointer:fine)]";

/** El isotipo en SVG, con las barras y los arcos por separado para armarlo. */
function Isotipo({ className = "", clase }: { className?: string; clase: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="-2 0 676 981" className={`overflow-visible ${className}`} aria-hidden>
      <defs>
        {LOGO_ARCS.map((a) => (
          <mask key={a.id} id={`${id}-${a.id}`} maskUnits="userSpaceOnUse" x="-2" y="0" width="680" height="981">
            <path className={`${clase}-trazo`} d={a.draw} fill="none" stroke="#fff" strokeWidth="96" pathLength={1} strokeDasharray="1 1" />
          </mask>
        ))}
      </defs>
      <g fill={LOGO_ORANGE}>
        {LOGO_ARCS.map((a) => (
          <path key={a.id} d={a.d} mask={`url(#${id}-${a.id})`} />
        ))}
        {LOGO_BARS.map((b) => (
          <path key={b.id} d={b.d} className={`${clase}-barra`} />
        ))}
      </g>
    </svg>
  );
}

// ── 1. Cabecera ────────────────────────────────────────────────────────────────
function Cabecera({ c, partes }: { c: Capsula; partes: number }) {
  const root = useRef<HTMLElement>(null);
  const bajada = useRef<HTMLDivElement>(null);
  usePegarEnVivo(bajada, "p");
  const largo = Math.max(...c.title.split(" ").map((b) => b.length), 8) + 1;
  const datos = [c.fecha, `${c.minutos} minutos de lectura`, ...(partes > 1 ? [`${partes} partes`] : [])];

  useGSAP(
    () => {
      const el = root.current!;
      gsap.set(el.querySelectorAll("[data-hero-in]"), { visibility: "inherit" });
      if (prefersReducedMotion()) return;
      gsap.set(".cb-barra", { scaleY: 0, transformOrigin: "50% 100%" });
      gsap.set(".cb-trazo", { strokeDashoffset: 1 });
      gsap
        .timeline({ delay: 0.2 })
        .to(".cb-barra", { scaleY: 1, duration: 1.3, ease: "back.out(1.6)", stagger: 0.12 }, 0)
        .to(".cb-trazo", { strokeDashoffset: 0, duration: 1.2, ease: "power3.out", autoRound: false }, 0.3)
        .from(".cb-in", { y: 20, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 }, 0.35)
        .from(".cb-regla", { scaleX: 0, transformOrigin: "left center", duration: 1.4, ease: "expo.inOut" }, 0.3);
      const st = { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 };
      gsap.to(".cb-marca", { yPercent: 10, ease: "none", scrollTrigger: st });
      gsap.utils.toArray<SVGElement>(".cb-barra").forEach((b, i) => gsap.to(b, { y: [-50, -120, -25][i], ease: "none", scrollTrigger: st }));
    },
    { scope: root }
  );

  return (
    <section ref={root} data-tone="dark" className="relative isolate overflow-hidden bg-ink-900 text-neutral-0">
      <div aria-hidden data-hero-in="" className="cb-marca pointer-events-none absolute bottom-10 right-[8%] h-[12rem] sm:h-[16rem] lg:bottom-16 lg:right-[6%] lg:top-20 lg:h-auto">
        <Isotipo clase="cb" className="h-full w-auto" />
      </div>
      <Container className="relative pb-[16rem] pt-12 sm:pb-[20rem] md:pt-20 lg:pb-24">
        <nav data-hero-in="" aria-label="Migas de pan" className="cb-in flex flex-wrap items-center gap-2 text-xs">
          <Link href="/" className="text-neutral-400 transition-colors hover:text-neutral-0">Inicio</Link>
          <span aria-hidden className="text-neutral-0/25">/</span>
          <Link href="/blog" className="text-neutral-400 transition-colors hover:text-neutral-0">Blog</Link>
          <span aria-hidden className="text-neutral-0/25">/</span>
          <span className="text-neutral-200">Cápsula informativa</span>
        </nav>

        <div className="lg:max-w-[62%]">
          <p data-hero-in="" className="cb-in mt-10 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-brand-400 md:mt-14">
            <span aria-hidden className="h-px w-8 bg-brand-500" />
            Cápsula informativa
          </p>
          <div style={{ ["--ajuste" as string]: `calc((100vw - 3rem) / ${(largo * 0.76).toFixed(2)})` }}>
            <SplitLines
              as="h1"
              immediate
              delay={0.15}
              className="mt-5 font-display text-[length:min(2.1rem,var(--ajuste))] font-semibold uppercase leading-[0.98] tracking-[-0.01em] [text-wrap:balance] sm:text-[length:min(2.6rem,var(--ajuste))] md:text-[3.2rem] lg:text-[3.6rem] xl:text-[4.2rem]"
            >
              {c.title}
              <span className="text-brand-500">.</span>
            </SplitLines>
          </div>
          <div ref={bajada} className="relative mt-10 pt-8">
            <span data-hero-in="" aria-hidden className="cb-regla absolute inset-x-0 top-0 h-px bg-neutral-0/15" />
            <p data-hero-in="" className="cb-in text-lg leading-relaxed text-neutral-300 md:text-xl">{c.teaser}</p>
            <ul data-hero-in="" className="cb-in mt-6 flex flex-wrap gap-x-3 gap-y-2 text-sm text-neutral-200">
              {datos.map((d, i) => (
                <li key={d} className="flex items-center gap-3 whitespace-nowrap">
                  {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-brand-400" />}
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── 3. Una tarjeta ─────────────────────────────────────────────────────────────
function Carta({ p, i, total, foto, proxima, siguiente }: { p: DatosNota["partes"][number]; i: number; total: number; foto: string; proxima?: string; siguiente: Capsula }) {
  const { rotulo, nombre } = partirTitulo(p.titulo);
  return (
    <section id={`carta-${i + 1}`} className="ca-carta relative" style={{ zIndex: i + 1 }}>
      {/* ca-entra lleva la llegada (sube girando, como una carta que se reparte); ca-cuerpo, el apilado. */}
      <div className="ca-entra origin-bottom">
      <div className="ca-cuerpo grid grid-cols-[minmax(0,1fr)] origin-top overflow-hidden border border-ink-900/10 bg-neutral-0 shadow-[0_40px_90px_-40px_rgba(10,22,40,0.55)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="ca-foto relative aspect-[16/10] overflow-hidden bg-ink-900 lg:aspect-auto lg:min-h-[520px]">
          <Image src={foto} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="ca-img scale-[1.12] object-cover" />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/0 to-ink-900/0" />
          <span aria-hidden className="ca-num absolute bottom-4 left-5 flex items-end gap-2 overflow-hidden pt-[0.1em] font-display text-[4.5rem] font-semibold leading-[0.8] tracking-[-0.03em] text-neutral-0 md:bottom-7 md:left-8 md:text-[7rem]">
            <span className="ca-num-in inline-block">{dos(i + 1)}</span>
            <span className="ca-punto mb-[0.12em] h-3 w-3 bg-brand-500 md:h-4 md:w-4" />
          </span>
        </div>

        <div className="flex flex-col p-6 md:p-10 lg:p-12">
          <div className="flex items-start justify-between gap-6">
            <p className="ca-rot flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-widest text-brand-600">
              {total > 1 && (
                <span className="flex items-center gap-3">
                  <span aria-hidden className="h-px w-8 bg-brand-500" />
                  Parte {i + 1} de {total}
                </span>
              )}
              {rotulo && <span className="font-medium normal-case tracking-normal text-ink-500">{rotulo}</span>}
            </p>
            <Isotipo clase="ci" className="ci-marca h-8 w-auto shrink-0 md:h-10" />
          </div>
          <h2 className="ca-tit mt-5 font-display text-[1.85rem] font-semibold leading-[1.08] tracking-tight text-ink-900 [text-wrap:balance] md:text-[2.5rem]">
            {sinSola(nombre)}
          </h2>
          <span aria-hidden className="ca-linea mt-6 block h-px w-full origin-left bg-ink-900/10" />
          <div className="ca-texto mt-6 space-y-5 text-[16px] leading-[1.7] text-ink-700 md:text-[17px]">
            <Bloques bloques={p.bloques} />
          </div>

          <div className="ca-pie mt-auto pt-10">
            {proxima ? (
              <button
                type="button"
                onClick={() => irAParte(`carta-${i + 2}`, 88)}
                className="group flex w-full items-center justify-between gap-4 border-t border-ink-900/10 pt-5 text-left"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-widest text-ink-500">Sigue</span>
                  <span className={`mt-1 block truncate text-base font-medium text-ink-900 transition-colors duration-500 ${HOVER}:group-hover:text-brand-600`}>{proxima}</span>
                </span>
                <span className={`grid h-11 w-11 shrink-0 place-items-center border border-ink-900/15 text-ink-900 transition-colors duration-500 ${HOVER}:group-hover:border-brand-500 ${HOVER}:group-hover:bg-brand-500 ${HOVER}:group-hover:text-neutral-0`}>
                  <Flecha className="h-5 w-5" />
                </span>
              </button>
            ) : (
              <Link href={siguiente.href} className="group flex w-full items-center justify-between gap-4 border-t border-ink-900/10 pt-5">
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-widest text-ink-500">Terminaste la cápsula · Seguí con</span>
                  <span className={`mt-1 block truncate text-base font-medium text-ink-900 transition-colors duration-500 ${HOVER}:group-hover:text-brand-600`}>{siguiente.title}</span>
                </span>
                <span className={`grid h-11 w-11 shrink-0 place-items-center bg-brand-500 text-neutral-0 transition-transform duration-500 ${HOVER}:group-hover:translate-x-1`}>
                  <Flecha className="h-5 w-5 -rotate-45" />
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

// ── 4. Anterior y siguiente ────────────────────────────────────────────────────
function Vecina({ c, lado, rotulo }: { c: Capsula; lado: "anterior" | "siguiente"; rotulo: string }) {
  return (
    <Link
      href={c.href}
      className={`vc-tarjeta group relative isolate grid grid-cols-[minmax(0,1fr)] overflow-hidden border border-ink-900/10 bg-neutral-0 before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-ink-900 before:transition-transform before:duration-[800ms] before:ease-[cubic-bezier(0.19,1,0.22,1)] ${HOVER}:hover:before:scale-y-100`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-ink-900">
        <Image src={c.foto} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className={`object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)] ${HOVER}:group-hover:scale-[1.06]`} />
      </div>
      <div className={`flex flex-col gap-4 p-6 transition-colors duration-500 md:p-8 ${HOVER}:group-hover:[&_p]:text-neutral-300`}>
        <span className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink-500 transition-colors duration-500 ${lado === "siguiente" ? "flex-row-reverse justify-end" : ""} ${HOVER}:group-hover:text-brand-400`}>
          <Flecha className={`h-4 w-4 ${lado === "anterior" ? "rotate-[135deg]" : "-rotate-45"}`} />
          {rotulo}
        </span>
        <Meta c={c} />
        <h3 className={`font-display text-2xl font-semibold leading-tight tracking-tight text-ink-900 transition-colors duration-500 [text-wrap:balance] md:text-[1.9rem] ${HOVER}:group-hover:text-neutral-0`}>
          {sinSola(c.title)}
        </h3>
      </div>
    </Link>
  );
}

function Vecinas({ anterior, siguiente, siguienteRotulo }: { anterior: Capsula; siguiente: Capsula; siguienteRotulo: string }) {
  return (
    <section className="bg-neutral-0 py-16 md:py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display text-[1.85rem] font-semibold leading-tight tracking-tight text-ink-900 md:text-[2.4rem]">Seguí leyendo</h2>
          <Link href="/blog" className="group inline-flex items-center gap-3 text-sm font-semibold tracking-wide text-ink-900">
            <span className="relative">
              Ver todas las cápsulas
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-brand-500 transition-transform duration-500 ease-out group-hover:scale-x-100" />
            </span>
            <Flecha className="h-4 w-4 -rotate-45 text-brand-500 transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Vecina c={anterior} lado="anterior" rotulo="Cápsula anterior" />
          <Vecina c={siguiente} lado="siguiente" rotulo={siguienteRotulo} />
        </div>
      </Container>
    </section>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────
export function NotaCapsula({ c, intro, partes, fotos, anterior, siguiente, siguienteRotulo }: DatosNota) {
  const scope = useRef<HTMLDivElement>(null);
  usePegarEnVivo(scope);

  useGSAP(
    () => {
      const reducido = prefersReducedMotion();
      const cartas = gsap.utils.toArray<HTMLElement>(".ca-carta", scope.current);
      const mazo = scope.current?.querySelector<HTMLElement>(".ca-mazo");
      if (!reducido && mazo) {
        // Introducción: el texto sube por líneas desde una máscara; después el rótulo y las tres
        // tarjetitas entran de a una, girando apenas.
        document.fonts.ready.then(() => {
          scope.current?.querySelectorAll<HTMLElement>(".in-texto p, .in-texto li").forEach((el) => {
            SplitText.create(el, {
              type: "lines",
              mask: "lines",
              autoSplit: true,
              onSplit: (self) => {
                airMasks(self.masks);
                return gsap.from(self.lines, { yPercent: LINE_FROM, duration: 1.1, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
              },
            });
          });
        });
        if (scope.current?.querySelector(".in-rot"))
          gsap
          .timeline({ scrollTrigger: { trigger: ".in-rot", start: "top 85%", once: true } })
          .from(".in-rot-linea", { scaleX: 0, duration: 1, ease: "expo.inOut" }, 0)
          .from(".in-rot", { x: -12, autoAlpha: 0, duration: 0.9, ease: "expo.out" }, 0.1)
          .from(".in-carta", { y: 70, rotate: (k: number) => [-3, 2, -2][k % 3], autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: 0.12 }, 0.2);

        cartas.forEach((carta, i) => {
          // Llegada atada a la rueda: la tarjeta sube girando y se endereza, como una carta que se reparte.
          gsap.fromTo(
            carta.querySelector(".ca-entra"),
            { y: 160, rotate: i % 2 ? 4 : -4, scale: 0.94 },
            { y: 0, rotate: 0, scale: 1, ease: "power2.out", scrollTrigger: { trigger: carta, start: "top bottom", end: "top 45%", scrub: 0.8 } }
          );
          // La foto se mueve adentro de la tarjeta mientras se lee.
          gsap.fromTo(carta.querySelector(".ca-img"), { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: carta, start: "top bottom", end: "bottom top", scrub: true } });
          // Adentro, en orden: número, rótulo, isotipo, título por líneas, línea y texto.
          const h = carta.querySelector<HTMLElement>(".ca-tit");
          const bloques = carta.querySelectorAll(".ca-texto > p, .ca-texto li");
          gsap
            .timeline({ scrollTrigger: { trigger: carta, start: "top 72%", once: true } })
            .from(carta.querySelector(".ca-num-in"), { yPercent: 110, duration: 1.1, ease: "expo.out" }, 0)
            .from(carta.querySelector(".ca-punto"), { scale: 0, duration: 0.6, ease: "back.out(2)" }, 0.5)
            .from(carta.querySelector(".ca-rot"), { x: -16, autoAlpha: 0, duration: 0.9, ease: "expo.out" }, 0.1)
            .from(carta.querySelectorAll(".ci-barra"), { scaleY: 0, transformOrigin: "50% 100%", duration: 1.1, ease: "back.out(1.6)", stagger: 0.1 }, 0.1)
            .fromTo(carta.querySelectorAll(".ci-trazo"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: "power3.out", autoRound: false }, 0.35)
            .from(carta.querySelector(".ca-linea"), { scaleX: 0, duration: 1.2, ease: "expo.inOut" }, 0.35)
            .from(bloques, { y: 22, autoAlpha: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 }, 0.45)
            .from(carta.querySelector(".ca-pie"), { y: 16, autoAlpha: 0, duration: 0.9, ease: "expo.out" }, 0.7);
          if (h) {
            document.fonts.ready.then(() => {
              SplitText.create(h, {
                type: "lines",
                mask: "lines",
                autoSplit: true,
                onSplit: (self) => {
                  airMasks(self.masks);
                  return gsap.from(self.lines, { yPercent: LINE_FROM, duration: 1.2, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: carta, start: "top 72%", once: true } });
                },
              });
            });
          }
          if (i === cartas.length - 1) return;
          // Queda fija recién cuando se leyó entera.
          ScrollTrigger.create({
            trigger: carta,
            start: () => (carta.offsetHeight > window.innerHeight - 112 ? "bottom bottom-=24" : "top 88px"),
            endTrigger: mazo,
            end: "bottom bottom",
            pin: true,
            pinSpacing: false,
            invalidateOnRefresh: true,
          });
          // Mientras la siguiente sube, esta se achica, sube, gira y se apaga.
          gsap.fromTo(
            carta.querySelector(".ca-cuerpo"),
            { scale: 1, y: 0, rotate: 0, filter: "brightness(1)" },
            { scale: 0.9, y: -36, rotate: i % 2 ? 3 : -3, filter: "brightness(0.78)", ease: "none", scrollTrigger: { trigger: cartas[i + 1], start: "top bottom", end: "top 120px", scrub: true } }
          );
        });
        gsap.utils.toArray<HTMLElement>(".vc-tarjeta").forEach((t, k) =>
          gsap.from(t, { y: 60, autoAlpha: 0, duration: 1.1, ease: "expo.out", delay: k * 0.08, scrollTrigger: { trigger: t, start: START, once: true } })
        );
      }
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope }
  );

  return (
    <article>
      <Cabecera c={c} partes={partes.length} />
      {/* overflow-x-clip: las tarjetas entran giradas y en el celular ensanchaban la página (406 px en 375). */}
      <div ref={scope} className="overflow-x-clip">
        <div className="bg-neutral-100">
          <section className="py-16 md:py-24">
            <Container className="max-w-[920px]">
              <div className="in-texto space-y-6 text-[19px] leading-[1.6] text-ink-900 md:text-[23px]">
                <Bloques bloques={intro} />
              </div>
              {partes.length > 1 && (
                <>
              <p className="in-rot mt-12 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-ink-500">
                <span aria-hidden className="in-rot-linea h-px w-8 origin-left bg-brand-500" />
                En esta cápsula
              </p>
              <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                {partes.map((p, i) => (
                  <li key={i} className="in-carta">
                    <button
                      type="button"
                      onClick={() => irAParte(`carta-${i + 1}`, 88)}
                      className={`group relative isolate flex h-full w-full flex-col gap-6 overflow-hidden border border-ink-900/10 bg-neutral-0 p-5 text-left before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-ink-900 before:transition-transform before:duration-[700ms] before:ease-[cubic-bezier(0.19,1,0.22,1)] ${HOVER}:hover:before:scale-y-100`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="font-display text-2xl font-semibold tabular-nums text-brand-600 transition-colors duration-500 group-hover:text-brand-400">{dos(i + 1)}</span>
                        <Flecha className={`h-5 w-5 text-ink-400 transition-[color,transform] duration-500 ${HOVER}:group-hover:translate-y-1 ${HOVER}:group-hover:text-neutral-0`} />
                      </span>
                      <span className={`text-sm font-medium leading-snug text-ink-900 transition-colors duration-500 ${HOVER}:group-hover:text-neutral-0`}>
                        {sinSola(partirTitulo(p.titulo).nombre)}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
                </>
              )}
            </Container>
          </section>

          <div className="ca-mazo pb-24 md:pb-32">
            <Container className="space-y-10">
              {partes.map((p, i) => (
                <Carta
                  key={i}
                  p={p}
                  i={i}
                  total={partes.length}
                  foto={fotos[i % fotos.length]}
                  proxima={partes[i + 1] ? partirTitulo(partes[i + 1].titulo).nombre : undefined}
                  siguiente={anterior}
                />
              ))}
            </Container>
          </div>
        </div>
        <Vecinas anterior={anterior} siguiente={siguiente} siguienteRotulo={siguienteRotulo} />
      </div>
      <Cierre />
    </article>
  );
}
