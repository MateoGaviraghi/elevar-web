"use client";

// Lista del blog (/blog), «Revista» (referencia: The Explora Journal; elegida por Mateo
// el 2026-11-24 tras tres rondas), con el idioma del sitio:
// 1. Encabezado azul con «CÁPSULAS» gigante de lado a lado y la cantidad que cuenta
//    (el mismo de la lista de cursos, ref. Lusion · Projects).
// 2. La más nueva: la foto arranca como una ventana chica y se abre al ancho completo
//    con el scroll (la apertura «Ventana» del sitio); después sube su recuadro.
// 3. Todas las cápsulas en grilla o en lista; al cambiar, cada foto viaja a su lugar
//    (GSAP Flip). Las fotos se revelan con una cortina; el relleno azul sube al pasar.
// 4. Cierre naranja: la comunidad de WhatsApp, con el texto que el sitio ya usa.
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { Flip } from "gsap/Flip";
import { Container } from "@/components/ui/container";
import { SplitLines } from "@/components/anim/split-lines";
import { CommunityButton } from "@/components/common/whatsapp";
import { BTN } from "@/components/curso/ficha-parts";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { CAPSULAS, type Capsula } from "./datos";
import { BAJADA, Flecha, Link, Meta, pegar } from "./piezas";

if (typeof window !== "undefined") gsap.registerPlugin(Flip);

const HEADER = 64;
const PALABRA = "CÁPSULAS";
type Vista = "grilla" | "lista";

function bajarALaLista() {
  document.getElementById("capsulas")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── 1. Encabezado ──────────────────────────────────────────────────────────────
function Encabezado() {
  const root = useRef<HTMLDivElement>(null);
  const lane = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLSpanElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const total = CAPSULAS.length;
  const minutos = CAPSULAS[0]?.minutos ?? 2;

  // La palabra ocupa todo el ancho: se mide a 100 px y se escala (tope 15 rem).
  useLayoutEffect(() => {
    const fit = () => {
      const w = word.current;
      const l = lane.current;
      if (!w || !l) return;
      w.style.fontSize = "100px";
      w.style.fontSize = `${Math.floor(Math.min((99.5 * l.clientWidth) / w.scrollWidth, 240) * 100) / 100}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".hw-l", { yPercent: 115, duration: 1.2, ease: "expo.out", stagger: 0.035, delay: 0.15 });
      const o = { v: 0 };
      if (num.current) num.current.textContent = "0";
      gsap.to(o, { v: total, duration: 1.4, ease: "power3.out", delay: 0.3, onUpdate: () => { if (num.current) num.current.textContent = String(Math.round(o.v)); } });
      gsap.from(".hero-in", { y: 18, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.55 });
      gsap.from(".hero-rule", { scaleX: 0, transformOrigin: "left center", duration: 1.4, ease: "expo.inOut", delay: 0.35 });
    },
    { scope: root }
  );

  const facts = [`${total} cápsulas`, "ISO/IEC 17025", `${minutos} minutos de lectura`];

  return (
    <section data-tone="dark" className="overflow-hidden bg-ink-900 pb-24 pt-12 text-neutral-0 md:pb-28 md:pt-20">
      <Container>
        <div ref={root}>
          <nav aria-label="Migas de pan" className="hero-in flex items-center gap-2 text-xs">
            <Link href="/" className="text-neutral-400 transition-colors hover:text-neutral-0">Inicio</Link>
            <span aria-hidden className="text-neutral-0/25">/</span>
            <span className="text-neutral-200">Blog</span>
          </nav>

          <div className="mt-10 flex items-start gap-3 md:mt-14 md:gap-6">
            <div ref={lane} className="min-w-0 flex-1">
              <h1 aria-label="Cápsulas informativas" className="font-display font-semibold leading-[0.9] tracking-[-0.02em]">
                <span ref={word} aria-hidden className="inline-block whitespace-nowrap">
                  {Array.from(PALABRA).map((ch, i) => (
                    <span key={i} className="inline-block overflow-hidden pt-[0.1em] align-top">
                      <span className="hw-l inline-block">{ch}</span>
                    </span>
                  ))}
                </span>
              </h1>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-3 pt-3 md:gap-6 md:pt-6">
              <span className="font-display text-2xl font-medium tabular-nums md:text-5xl">
                <span ref={num} data-contador>{total}</span>
              </span>
              <button
                type="button"
                onClick={bajarALaLista}
                aria-label="Ver todas las cápsulas"
                className="group grid h-10 w-10 place-items-center text-brand-400 md:h-14 md:w-14"
              >
                <Flecha className="h-8 w-8 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-1 group-hover:translate-y-1 md:h-12 md:w-12" />
              </button>
            </div>
          </div>

          <div className="relative mt-10 grid gap-8 pt-8 md:mt-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
            <span aria-hidden className="hero-rule absolute inset-x-0 top-0 h-px bg-neutral-0/15" />
            <div>
              <p className="hero-in text-lg leading-relaxed text-neutral-300">{pegar(BAJADA)}</p>
              <ul className="hero-in mt-5 flex flex-wrap gap-x-3 gap-y-2 text-sm text-neutral-200">
                {facts.map((f, i) => (
                  <li key={f} className="flex items-center gap-3 whitespace-nowrap">
                    {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-brand-400" />}
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hero-in flex flex-col gap-3 sm:flex-row">
              <button type="button" className={BTN.primary} onClick={bajarALaLista}>
                Ver las cápsulas
              </button>
              <CommunityButton tone="dark" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── 2. La más nueva: ventana que se abre con el scroll ─────────────────────────
function Destacada({ c }: { c: Capsula }) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)", phone: "(max-width: 767px) and (prefers-reduced-motion: no-preference)" },
        (ctx) => {
          const { desktop } = ctx.conditions as { desktop: boolean };
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: scope.current,
              start: `top ${HEADER}px`,
              end: desktop ? "+=110%" : "+=70%",
              pin: true,
              scrub: 1.2,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
          tl.fromTo(
            ".ds-ventana",
            { clipPath: desktop ? "inset(18% 26% 18% 26%)" : "inset(14% 10% 30% 10%)" },
            { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: 1 }
          )
            .fromTo(".ds-foto", { scale: 1.18 }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
            .fromTo(".ds-caja", { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, ease: "expo.out", duration: 0.45 }, 0.7);
          return () => tl.scrollTrigger?.kill();
        }
      );
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => mm.revert();
    },
    { scope }
  );

  return (
    <section ref={scope} className="relative h-[calc(100svh-64px)] overflow-hidden bg-neutral-0">
      <Link href={c.href} className="group block h-full" aria-label={c.title}>
        <div className="ds-ventana absolute inset-0 overflow-hidden">
          <Image
            src={c.foto}
            alt=""
            fill
            sizes="100vw"
            className="ds-foto object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)]"
          />
        </div>
        <Container className="relative flex h-full items-end pb-8 md:pb-14">
          <div className="ds-caja w-full bg-neutral-0 p-6 sm:max-w-2xl md:p-10">
            <div>
              <Meta c={c} />
            </div>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.1] tracking-tight text-ink-900 [text-wrap:balance] md:text-[2.4rem]">
              {c.title}
            </h2>
            <p className="mt-4 hidden text-base leading-relaxed text-ink-600 sm:block">{pegar(c.teaser)}</p>
            <span className={`${BTN.primary} mt-7`}>
              Leer la cápsula
              <Flecha className="h-4 w-4 -rotate-45" />
            </span>
          </div>
        </Container>
      </Link>
    </section>
  );
}

// ── 3. Todas las cápsulas: grilla o lista ──────────────────────────────────────
function Tarjeta({ c }: { c: Capsula }) {
  return (
    <Link
      href={c.href}
      className="re-item group relative isolate block overflow-hidden bg-neutral-0 before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-ink-900 before:transition-transform before:duration-[800ms] before:ease-[cubic-bezier(0.19,1,0.22,1)] [@media(hover:hover)_and_(pointer:fine)]:hover:before:scale-y-100"
    >
      <div data-flip-id={c.slug} className="re-foto relative aspect-[4/3] overflow-hidden bg-ink-900">
        <div className="re-cortina absolute inset-0">
          <Image
            src={c.foto}
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.06]"
          />
        </div>
      </div>
      <div className="p-5 transition-colors duration-500 md:p-6 [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-neutral-0">
        <div className="[@media(hover:hover)_and_(pointer:fine)]:group-hover:[&_p]:text-neutral-300">
          <Meta c={c} />
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold leading-snug tracking-tight text-ink-900 transition-colors duration-500 [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-neutral-0">
          {c.title}
        </h3>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-500">
          Leer la cápsula
          <Flecha className="h-4 w-4 -rotate-45 transition-transform duration-500 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function Fila({ c }: { c: Capsula }) {
  return (
    <li className="re-item re-fila relative transition-opacity duration-500">
      <span aria-hidden className="re-regla absolute inset-x-0 top-0 h-px bg-ink-900/12" />
      <Link href={c.href} className="group grid grid-cols-[96px_minmax(0,1fr)] items-center gap-5 py-6 md:grid-cols-[180px_minmax(0,1fr)_auto] md:gap-10 md:py-8">
        <div data-flip-id={c.slug} className="re-foto relative aspect-[4/3] overflow-hidden bg-ink-900">
          <div className="re-cortina absolute inset-0">
            <Image src={c.foto} alt="" fill sizes="180px" className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]" />
          </div>
        </div>
        <div>
          <Meta c={c} />
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug tracking-tight text-ink-900 transition-colors duration-500 md:text-[1.75rem] md:leading-tight [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-brand-600">
            {c.title}
          </h3>
        </div>
        <span className="hidden h-14 w-14 place-items-center border border-ink-900/15 text-ink-900 transition-colors duration-500 md:grid [@media(hover:hover)_and_(pointer:fine)]:group-hover:border-brand-500 [@media(hover:hover)_and_(pointer:fine)]:group-hover:bg-brand-500 [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-neutral-0">
          <Flecha className="h-6 w-6 -rotate-45" />
        </span>
      </Link>
    </li>
  );
}

function Todas({ notas }: { notas: Capsula[] }) {
  const scope = useRef<HTMLElement>(null);
  const pills = useRef<HTMLDivElement>(null);
  const hl = useRef<HTMLSpanElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const [vista, setVista] = useState<Vista>("grilla");

  // Píldora activa: el fondo se desliza (0,5 s), como en la lista de cursos.
  useLayoutEffect(() => {
    const btn = pills.current?.querySelector<HTMLElement>(`[data-v="${vista}"]`);
    if (!btn || !hl.current) return;
    gsap.to(hl.current, { x: btn.offsetLeft, width: btn.offsetWidth, opacity: 1, duration: prefersReducedMotion() ? 0 : 0.5, ease: "expo.out" });
  }, [vista]);

  // Entrada: cortina de abajo hacia arriba en cada foto, de a una fila; título por líneas.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        ScrollTrigger.batch(".re-item", {
          start: "top 85%",
          once: true,
          onEnter: (els) => {
            gsap.fromTo(
              els.map((e) => e.querySelector(".re-cortina")),
              { clipPath: "inset(100% 0% 0% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.inOut", stagger: 0.09 }
            );
            gsap.fromTo(els, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "expo.out", stagger: 0.09 });
          },
        });
      });
      return () => mm.revert();
    },
    { scope }
  );

  // Cambio de vista: cada foto viaja de la grilla a su fila (o al revés).
  const cambiar = (v: Vista) => {
    if (v === vista) return;
    if (!prefersReducedMotion() && scope.current) flipState.current = Flip.getState(scope.current.querySelectorAll(".re-foto"));
    setVista(v);
  };
  useLayoutEffect(() => {
    const st = flipState.current;
    if (!st || !scope.current) return;
    flipState.current = null;
    gsap.set(scope.current.querySelectorAll(".re-cortina"), { clipPath: "inset(0% 0% 0% 0%)" });
    gsap.set(scope.current.querySelectorAll(".re-item"), { opacity: 1, y: 0 });
    Flip.from(st, { duration: 0.9, ease: "expo.inOut", absolute: true, nested: true, scale: true });
    gsap.from(scope.current.querySelectorAll(".re-item h3, .re-item p, .re-regla"), { opacity: 0, y: 14, duration: 0.8, ease: "expo.out", delay: 0.45, stagger: 0.02 });
    ScrollTrigger.refresh();
  }, [vista]);

  return (
    <section ref={scope} id="capsulas" className="scroll-mt-16 bg-[#F4F6F8] py-20 md:py-28">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SplitLines className="font-display text-4xl font-semibold leading-[1] tracking-tight text-ink-900 md:text-6xl">
            Todas las cápsulas
          </SplitLines>
          <div ref={pills} role="tablist" aria-label="Cómo ver las cápsulas" className="relative flex self-start rounded-full bg-ink-900 p-1.5 sm:self-auto">
            <span aria-hidden ref={hl} className="absolute left-0 top-1.5 h-[calc(100%-12px)] w-0 rounded-full bg-neutral-0 opacity-0" />
            {(["grilla", "lista"] as Vista[]).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={vista === v}
                data-v={v}
                onClick={() => cambiar(v)}
                className={`relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-500 ${vista === v ? "text-ink-900" : "text-neutral-300 hover:text-neutral-0"}`}
              >
                {v === "grilla" ? "Grilla" : "Lista"}
                <sup className="ml-0.5 text-[10px] tabular-nums opacity-70">{notas.length}</sup>
              </button>
            ))}
          </div>
        </div>

        {vista === "grilla" ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {notas.map((c) => (
              <Tarjeta key={c.slug} c={c} />
            ))}
          </div>
        ) : (
          <ul className="mt-10 border-b border-ink-900/12 [@media(hover:hover)_and_(pointer:fine)]:[&:hover>li:not(:hover)]:opacity-40">
            {notas.map((c) => (
              <Fila key={c.slug} c={c} />
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

// ── 4. Cierre naranja: la comunidad ────────────────────────────────────────────
function Cierre() {
  return (
    <section data-tone="dark" className="bg-brand-500 py-20 text-neutral-0 md:py-28">
      <Container className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-16">
        <div>
          <SplitLines className="font-display text-[2.6rem] font-semibold uppercase leading-[0.95] tracking-[-0.01em] md:text-[5.5rem]">
            Comunidad Elevar
          </SplitLines>
          <p className="mt-6 text-lg leading-relaxed text-neutral-0/90">
            {pegar("Sumate a nuestra comunidad de WhatsApp y recibí novedades de cursos, promociones y contenido técnico sobre ISO/IEC 17025.")}
          </p>
        </div>
        <CommunityButton tone="light" />
      </Container>
    </section>
  );
}

export function BlogLista() {
  const [nueva, ...resto] = CAPSULAS;
  return (
    <>
      <Encabezado />
      <Destacada c={nueva} />
      <Todas notas={resto} />
      <Cierre />
    </>
  );
}
