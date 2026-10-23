"use client";

/* Lista de cursos por modalidad (/formacion/[modality]).
 * Elegida por Mateo el 2026-10-19 ("tu elección" → referencia 1, Dennis Snellenberg ·
 * Work): píldoras de filtro con la cantidad, tabla de filas finas y una vista previa que
 * sigue al mouse mientras las demás filas se apagan. Con sus respuestas: E-Books en
 * todos lados, asincrónicos agrupados por tema, webinars hechos abajo en "Finalizados".
 * Reglas de la ficha: encabezado en tinta con resumen y botones, fondos tinta / blanco,
 * sin tarjetas en grilla, movimiento propio por sección (GSAP), lo flotante invierte el
 * color de lo que tiene detrás.
 */

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import type { Course, Modality } from "@/types";
import { MODALITIES, type ModalityInfo } from "@/lib/formacion-modalities";
import { formatARS } from "@/lib/formatters";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Container } from "@/components/ui/container";
import { keepScrollOnNextPath, scrollPageTo } from "@/components/anim/smooth-scroll";
import { BTN, isFree, priceARS, priceUSD, sessionInfo, useToneBehind } from "@/components/curso/ficha-parts";

// ── Datos ────────────────────────────────────────────────────────────────────

interface Group {
  key: string;
  title: string | null;
  muted?: boolean;
  items: Course[];
}

const startsAt = (c: Course) => (c.sessions[0] ? new Date(c.sessions[0].starts_at).getTime() : 0);
const isPast = (c: Course) => c.sessions[0]?.status === "FINISHED";
const dated = (m: Modality) => m === "LIVE" || m === "WEBINAR";

/** Asincrónicos por tema; en vivo y webinars, próximos por fecha y los hechos abajo. */
function groupsOf(modality: Modality, list: Course[]): Group[] {
  if (modality === "ASYNC") {
    const byCat = new Map<string, Group>();
    for (const c of list) {
      const key = c.category?.slug ?? "otros";
      if (!byCat.has(key)) byCat.set(key, { key, title: c.category?.name ?? "Otros cursos", items: [] });
      byCat.get(key)!.items.push(c);
    }
    return Array.from(byCat.values());
  }
  if (dated(modality)) {
    const next = list.filter((c) => !isPast(c)).sort((a, b) => startsAt(a) - startsAt(b));
    const done = list.filter(isPast).sort((a, b) => startsAt(b) - startsAt(a));
    const g: Group[] = [];
    if (next.length) g.push({ key: "proximos", title: done.length ? "Próximos" : null, items: next });
    if (done.length) g.push({ key: "finalizados", title: "Finalizados", muted: true, items: done });
    return g;
  }
  return list.length ? [{ key: "todos", title: null, items: list }] : [];
}

/** Cuarta columna: el horario en lo que tiene fecha; las horas en lo demás. */
const hours = (c: Course) => sessionInfo(c)?.time ?? (c.duration_hours ? `${c.duration_hours} h` : "—");

/** Tercera columna: la fecha en lo que tiene fecha; el disertante en lo demás. */
function whenOrWho(c: Course): string {
  const s = sessionInfo(c);
  if (s) return s.short;
  return c.instructor?.name ?? c.instructor_names ?? "";
}

/** Datos del encabezado, calculados con los cursos reales de la modalidad. */
function heroFacts(m: ModalityInfo, list: Course[]): string[] {
  if (!list.length) return [];
  const facts: string[] = [];
  const noun = m.modality === "WEBINAR" ? (list.length === 1 ? "webinar" : "webinars") : list.length === 1 ? "curso" : "cursos";
  facts.push(`${list.length} ${noun}`);
  if (dated(m.modality)) {
    const next = list.filter((c) => !isPast(c)).sort((a, b) => startsAt(a) - startsAt(b))[0];
    const s = next && sessionInfo(next);
    if (s) facts.push(`Próximo: ${s.short}`);
  } else {
    const h = list.map((c) => c.duration_hours).filter((x): x is number => !!x);
    if (h.length) facts.push(Math.min(...h) === Math.max(...h) ? `${h[0]} horas` : `De ${Math.min(...h)} a ${Math.max(...h)} horas`);
  }
  const paid = list.filter((c) => !isFree(c)).map((c) => parseFloat(c.price));
  facts.push(paid.length ? `Desde ${formatARS(String(Math.min(...paid)))}` : "Gratis");
  return facts;
}

const COLS: Record<Modality, string> = {
  ASYNC: "Disertante",
  LIVE: "Fecha",
  WEBINAR: "Fecha",
  WORKSHOP: "Disertante",
  EBOOK: "Autor",
};

// ── Movimiento ───────────────────────────────────────────────────────────────

/** Entrada de las filas: la línea se dibuja y el texto sube de su máscara. */
function rowsIn(root: HTMLElement, delay = 0) {
  const rows = Array.from(root.querySelectorAll<HTMLElement>(".ct-row, .ct-head"));
  rows.forEach((row, i) => {
    const d = delay + Math.min(i, 14) * 0.06;
    gsap.fromTo(row.querySelector(".ct-rule"), { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: "expo.out", delay: d });
    gsap.fromTo(row.querySelectorAll(".ct-in"), { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: "expo.out", delay: d + 0.08, stagger: 0.04 });
  });
}

// ── Piezas ───────────────────────────────────────────────────────────────────

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`h-4 w-4 ${className}`}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

/** Texto enmascarado que entra subiendo (clase ct-in). */
function M({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <span className="ct-in block truncate">{children}</span>
    </span>
  );
}

function Row({ c, muted, onEnter }: { c: Course; muted?: boolean; onEnter: (c: Course, row: HTMLElement) => void }) {
  const price = priceARS(c);
  return (
    <Link
      href={`/cursos/${c.slug}`}
      onMouseEnter={(e) => onEnter(c, e.currentTarget)}
      className={`ct-row group relative block py-5 transition-opacity duration-500 md:grid md:grid-cols-[5.5rem_minmax(0,1fr)_11.5rem_8.5rem_7rem_1.5rem] md:items-baseline md:gap-6 md:py-6 ${
        muted ? "text-neutral-500" : "text-ink-900"
      }`}
    >
      <span aria-hidden className="ct-rule absolute inset-x-0 bottom-0 h-px origin-left bg-neutral-200" />
      <M className="font-mono text-sm font-semibold tabular-nums text-brand-600">{c.code}</M>
      {/* Título: dos líneas como máximo, sin cortar en el celular. */}
      <span className="ct-title mt-1 block overflow-hidden md:mt-0">
        <span className="ct-in block text-[17px] font-medium leading-snug transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] md:text-lg md:group-hover:translate-x-2">
          {c.title}
        </span>
      </span>
      {/* Celular: los datos en una línea debajo del título. */}
      <span className="mt-2 block overflow-hidden text-sm text-neutral-500 md:hidden">
        <span className="ct-in block">
          {[whenOrWho(c), hours(c) !== "—" ? hours(c) : null, price].filter(Boolean).join(" · ")}
        </span>
      </span>
      <M className="hidden text-sm text-neutral-600 md:block">{whenOrWho(c)}</M>
      <M className="hidden text-sm tabular-nums text-neutral-600 md:block">{hours(c)}</M>
      <M className={`hidden text-right text-sm font-semibold tabular-nums md:block ${isFree(c) ? "text-brand-600" : ""}`}>{price}</M>
      <span className="hidden justify-end md:flex">
        <Arrow className="-translate-x-1 text-brand-500 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
      </span>
    </Link>
  );
}

function GroupBlock({ g, modality, onEnter }: { g: Group; modality: Modality; onEnter: (c: Course, row: HTMLElement) => void }) {
  return (
    <div className="mt-14 first:mt-0">
      {g.title && (
        <div className="ct-head relative flex items-baseline justify-between gap-6 pb-4">
          <h3 className="overflow-hidden font-display text-xl font-semibold tracking-tight text-ink-900 md:text-2xl">
            <span className="ct-in block">{g.title}</span>
          </h3>
          <span className="overflow-hidden text-sm tabular-nums text-neutral-500">
            <span className="ct-in block">{g.items.length}</span>
          </span>
          <span aria-hidden className="ct-rule absolute inset-x-0 bottom-0 h-px origin-left bg-ink-900" />
        </div>
      )}
      {/* Encabezado de columnas (escritorio) solo en el primer grupo o sin título. */}
      <div className={`ct-head relative hidden grid-cols-[5.5rem_minmax(0,1fr)_11.5rem_8.5rem_7rem_1.5rem] gap-6 pb-3 pt-6 text-xs font-medium text-neutral-500 md:grid ${g.title ? "" : "pt-0"}`}>
        <M>Código</M>
        <M>{modality === "WEBINAR" ? "Webinar" : "Curso"}</M>
        <M>{COLS[modality]}</M>
        <M>{dated(modality) ? "Horario" : "Duración"}</M>
        <M className="text-right">Precio</M>
        <span />
        <span aria-hidden className="ct-rule absolute inset-x-0 bottom-0 h-px origin-left bg-neutral-200" />
      </div>
      <div>
        {g.items.map((c) => (
          <Row key={c.id} c={c} muted={g.muted} onEnter={onEnter} />
        ))}
      </div>
    </div>
  );
}

/**
 * Vista previa (escritorio): tinta sobre la tabla blanca. Lleva su propio estado, así
 * pasar el mouse por las filas no vuelve a dibujar la tabla (eso trababa el scroll).
 * Mateo, 2026-10-20: no puede tapar nada de la fila que estás mirando; las otras, que
 * quedan apagadas, sí. Va justo debajo de esa fila (o arriba si no entra), sobre la
 * columna del título, y acompaña a la fila, no al mouse. Crece en su lugar (0,5 s).
 */
interface PreviewApi {
  set: (c: Course | null, row?: HTMLElement | null) => void;
}

function Preview({ api }: { api: MutableRefObject<PreviewApi | null> }) {
  const [course, setCourse] = useState<Course | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLElement | null>(null);
  const place = useRef<(instant?: boolean) => void>(() => {});
  const last = useRef<number | null>(null);
  const show = course !== null;
  // Pantallas bajas (menos de 800 px): tarjeta compacta, para que entre arriba o abajo de la fila.
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const check = () => setCompact(window.innerHeight < 800);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    api.current = {
      set: (c, r) => {
        row.current = r ?? null;
        setCourse(c);
      },
    };
    return () => { api.current = null; };
  }, [api]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = prefersReducedMotion();
    // Coordenadas de la esquina de arriba a la izquierda (sin xPercent/yPercent).
    gsap.set(el, { scale: 0, autoAlpha: 0, transformOrigin: "50% 0%" });
    const x = gsap.quickTo(el, "x", { duration: reduce ? 0 : 0.6, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: reduce ? 0 : 0.6, ease: "power3" });
    place.current = (instant = false) => {
      const r = row.current;
      if (!r) return;
      const rr = r.getBoundingClientRect();
      const col = r.querySelector<HTMLElement>(".ct-title")?.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const gap = 12;
      // Debajo de la fila; si no entra, arriba; si tampoco, del lado con más lugar.
      const minTop = 136;
      const below = window.innerHeight - gap - rr.bottom;
      const above = rr.top - minTop;
      let top = rr.bottom + gap;
      if (h + gap > below) top = h + gap <= above || above > below ? rr.top - gap - h : rr.bottom + gap;
      top = Math.min(Math.max(top, minTop), window.innerHeight - gap - h);
      const tx = (col ? col.right : rr.left + rr.width / 2) - w;
      const ty = top;
      if (instant || Number(gsap.getProperty(el, "opacity")) === 0) gsap.set(el, { x: tx, y: ty });
      x(tx);
      y(ty);
    };
    const onScroll = () => place.current(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Con el contenido nuevo ya medido, se ubica junto a su fila.
  useLayoutEffect(() => { if (course) place.current(); }, [course]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    gsap.to(el, { scale: show ? 1 : 0, autoAlpha: show ? 1 : 0, duration: prefersReducedMotion() ? 0 : 0.45, ease: show ? "expo.out" : "power3.in", overwrite: "auto" });
  }, [show]);

  useEffect(() => {
    if (!course || !inner.current || prefersReducedMotion()) return;
    const dir = last.current === null || course.id > last.current ? 1 : -1;
    last.current = course.id;
    gsap.fromTo(inner.current, { yPercent: 14 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "expo.out", overwrite: "auto" });
  }, [course]);

  const m = course ? MODALITIES.find((x) => x.modality === course.modality) : null;
  const s = course ? sessionInfo(course) : null;
  const usd = course ? priceUSD(course) : null;
  return (
    <div ref={box} aria-hidden className="pointer-events-none fixed left-0 top-0 z-40 hidden w-72 overflow-hidden bg-ink-900 text-neutral-0 shadow-[0_8px_8px_-6px_rgba(11,30,51,0.4)] will-change-transform md:block">
      {course && (
        <div ref={inner} className={compact ? "p-5" : "p-6"}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-semibold text-brand-400">{course.code}</span>
            {m && <img src={m.img} alt="" className="h-9 w-9 object-contain" />}
          </div>
          <p className={`mt-3 font-display font-semibold leading-snug ${compact ? "line-clamp-2 text-base" : "line-clamp-3 text-lg"}`}>{course.title}</p>
          <dl className={`mt-4 space-y-1.5 text-sm text-neutral-300 ${compact ? "hidden" : ""}`}>
            {s && <div>{s.past ? `Se realizó el ${s.short}` : `${s.short} · ${s.time}`}</div>}
            {course.duration_hours && <div>{course.duration_hours} horas certificadas</div>}
            {course.instructor?.name && <div className="truncate">{course.instructor.name}</div>}
          </dl>
          <div className={`flex items-end justify-between border-t border-neutral-0/15 ${compact ? "mt-4 pt-3" : "mt-5 pt-4"}`}>
            <div>
              <div className="text-xl font-semibold tabular-nums">{priceARS(course)}</div>
              {usd && <div className="text-xs text-neutral-400">{usd} otros países</div>}
            </div>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-400">
              Ver curso <Arrow />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Píldoras de modalidad con la cantidad. Quedan flotando al bajar y toman el color
 * contrario de la sección que tienen detrás; el fondo de la activa se desliza (0,5 s).
 */
function Pills({ active, counts, onPick }: { active: string; counts: Record<string, number>; onPick: (slug: string) => void }) {
  const [pill, behind] = useToneBehind<HTMLDivElement>("dark");
  const list = useRef<HTMLDivElement>(null);
  const hl = useRef<HTMLSpanElement>(null);
  const ink = behind === "light";

  useEffect(() => {
    const place = (instant: boolean) => {
      const btn = list.current?.querySelector<HTMLElement>(`[data-pill="${active}"]`);
      if (!btn || !hl.current) return;
      gsap.to(hl.current, { x: btn.offsetLeft, width: btn.offsetWidth, opacity: 1, duration: instant || prefersReducedMotion() ? 0 : 0.5, ease: "expo.out" });
      const sc = list.current!;
      sc.scrollTo({ left: btn.offsetLeft - sc.clientWidth / 2 + btn.offsetWidth / 2, behavior: instant ? "auto" : "smooth" });
    };
    place(false);
    const onResize = () => place(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  const t = "transition-colors duration-500";
  return (
    <div className="pointer-events-none sticky top-16 z-30 -mt-[68px] h-[68px]">
      <div className="flex h-full items-center justify-center px-4">
        <div
          ref={pill}
          className={`pointer-events-auto relative max-w-full overflow-hidden rounded-full p-1.5 ${t} ${
            ink ? "bg-ink-900 shadow-[0_8px_8px_-6px_rgba(11,30,51,0.35)]" : "bg-neutral-0 shadow-[0_8px_8px_-6px_rgba(0,0,0,0.35)]"
          }`}
        >
          <div ref={list} role="tablist" aria-label="Modalidades" className="relative flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span aria-hidden ref={hl} className={`absolute left-0 top-0 h-full w-0 rounded-full opacity-0 ${t} ${ink ? "bg-neutral-0" : "bg-ink-900"}`} />
            {MODALITIES.map((m) => {
              const on = m.slug === active;
              return (
                <button
                  key={m.slug}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  data-pill={m.slug}
                  onClick={() => onPick(m.slug)}
                  className={`relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${t} ${
                    on ? (ink ? "text-ink-900" : "text-neutral-0") : ink ? "text-neutral-300 hover:text-neutral-0" : "text-ink-700 hover:text-ink-900"
                  }`}
                >
                  {m.short}
                  <sup className="ml-0.5 text-[10px] tabular-nums opacity-70">{counts[m.slug] ?? 0}</sup>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Encabezado (Mateo, 2026-10-20: "el hero está muy insulso" → referencia Lusion ·
 * Projects, "tu elección"): el nombre de la modalidad gigante, de lado a lado, con la
 * cantidad arriba a la derecha y una flecha que baja a la tabla. Al cargar, las letras
 * suben de su máscara y la cantidad cuenta desde 0; al cambiar de píldora, la palabra
 * cambia letra por letra (salen hacia arriba, entran desde abajo).
 */
function Hero({ info, items, onSeeList }: { info: ModalityInfo; items: Course[]; onSeeList: () => void }) {
  // `n` vuelve a montar las letras aunque la palabra se repita (A → B → A rápido).
  const [word, setWord] = useState({ text: info.short.toUpperCase(), n: 0 });
  const [count, setCount] = useState(items.length);
  const root = useRef<HTMLDivElement>(null);
  const lane = useRef<HTMLDivElement>(null);
  const wordEl = useRef<HTMLSpanElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const prevSlug = useRef(info.slug);
  const facts = heroFacts(info, items);

  // La palabra ocupa todo el ancho: se mide a 100 px y se escala (tope 15 rem). Al
  // cambiar de palabra el alto cambia (EN VIVO es más alta que ASINCRÓNICOS): se anima
  // en 0,6 s para que lo de abajo no salte.
  const fit = (animate = false) => {
    const w = wordEl.current;
    const l = lane.current;
    if (!w || !l) return;
    const h0 = l.offsetHeight;
    w.style.fontSize = "100px";
    const natural = w.scrollWidth;
    const size = Math.min((100 * l.clientWidth) / natural, 240);
    w.style.fontSize = `${Math.floor(size * 100) / 100}px`;
    if (animate && !prefersReducedMotion()) {
      gsap.fromTo(l, { height: h0 }, { height: l.scrollHeight, duration: 0.9, ease: "expo.inOut", clearProps: "height", overwrite: true });
    }
  };
  useLayoutEffect(() => fit(word.n > 0), [word.n]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => fit());
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carga: letras desde la máscara, cantidad desde 0, el resto sube detrás.
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(".hw-l", { yPercent: 115, duration: 1.2, ease: "expo.out", stagger: 0.035, delay: 0.15 });
      const o = { v: 0 };
      gsap.to(o, { v: items.length, duration: 1.4, ease: "power3.out", delay: 0.3, onUpdate: () => { if (num.current) num.current.textContent = String(Math.round(o.v)); } });
      gsap.from(".hero-in", { y: 18, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.55 });
    }, el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambio de modalidad: la palabra cambia letra por letra y la cantidad cuenta hasta la nueva.
  // Se compara con la modalidad anterior (no con "primera vez"): en desarrollo React monta
  // dos veces y un flag de primera vez disparaba la salida sola y dejaba las letras ocultas.
  useEffect(() => {
    if (info.slug === prevSlug.current) return;
    prevSlug.current = info.slug;
    const next = info.short.toUpperCase();
    const el = root.current;
    if (!el || prefersReducedMotion()) { setWord((w) => ({ text: next, n: w.n + 1 })); setCount(items.length); return; }
    const out = el.querySelectorAll(".hw-l");
    gsap.killTweensOf(out);
    gsap.to(out, {
      yPercent: -115, duration: 0.5, ease: "power2.inOut", stagger: 0.03,
      onComplete: () => setWord((w) => ({ text: next, n: w.n + 1 })),
    });
    const o = { v: Number(num.current?.textContent ?? 0) };
    gsap.to(o, { v: items.length, duration: 1.4, ease: "power3.inOut", onUpdate: () => { if (num.current) num.current.textContent = String(Math.round(o.v)); }, onComplete: () => setCount(items.length) });
    gsap.fromTo(el.querySelectorAll(".hero-sw"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.slug]);

  // Palabra nueva montada: entran sus letras (no en la carga, que tiene su propia entrada).
  useLayoutEffect(() => {
    const el = root.current;
    if (word.n === 0 || !el || prefersReducedMotion()) return;
    gsap.fromTo(el.querySelectorAll(".hw-l"), { yPercent: 115 }, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.045 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.n]);

  return (
    <section data-tone="dark" className="overflow-hidden bg-ink-900 pb-28 pt-12 text-neutral-0 md:pb-32 md:pt-20">
      <Container>
        <div ref={root}>
          <nav aria-label="Migas de pan" className="hero-in flex items-center gap-2 text-xs">
            <Link href="/formacion" className="text-neutral-400 transition-colors hover:text-neutral-0">Formación</Link>
            <span aria-hidden className="text-neutral-0/25">/</span>
            <span className="hero-sw text-neutral-200">{info.title}</span>
          </nav>

          {/* Palabra gigante + cantidad y flecha a la derecha. */}
          <div className="mt-10 flex items-start gap-3 md:mt-14 md:gap-6">
            <div ref={lane} className="min-w-0 flex-1">
              <h1 aria-label={info.title} className="font-display font-semibold leading-[0.9] tracking-[-0.02em]">
                <span ref={wordEl} aria-hidden className="inline-block whitespace-nowrap">
                  {Array.from(word.text).map((ch, i) => (
                    <span key={`${word.n}-${i}`} className="inline-block overflow-hidden pt-[0.1em] align-top">
                      <span className="hw-l inline-block">{ch === " " ? " " : ch}</span>
                    </span>
                  ))}
                </span>
              </h1>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-3 pt-3 md:gap-6 md:pt-6">
              <span className="font-display text-2xl font-medium tabular-nums md:text-5xl">
                <span ref={num}>{count}</span>
              </span>
              <button
                type="button"
                onClick={onSeeList}
                aria-label={`Ver los ${items.length} cursos`}
                className="group grid h-10 w-10 place-items-center text-brand-400 md:h-14 md:w-14"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-1 group-hover:translate-y-1 md:h-12 md:w-12" aria-hidden>
                  <path d="M6 6l12 12M18 8v10H8" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bajada y datos a la izquierda; botones a la derecha. */}
          <div className="mt-10 grid gap-8 border-t border-neutral-0/15 pt-8 md:mt-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
            <div className="max-w-2xl">
              <p className="hero-in hero-sw text-lg leading-relaxed text-neutral-300">{info.desc}</p>
              {facts.length > 0 && (
                <ul className="hero-in hero-sw mt-5 flex flex-wrap gap-x-3 gap-y-2 text-sm text-neutral-200">
                  {facts.map((f, i) => (
                    <li key={f} className="flex items-center gap-3">
                      {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-brand-400" />}
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="hero-in flex flex-col gap-3 sm:flex-row">
              {items.length > 0 && (
                <button type="button" className={BTN.primary} onClick={onSeeList}>
                  {info.modality === "WEBINAR" ? `Ver los ${items.length} webinars` : `Ver los ${items.length} cursos`}
                </button>
              )}
              <Link href="/contacto" className={BTN.ghostDark}>Hablar con ELEVAR</Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────

export function CourseCatalog({ courses, initial, workshop }: { courses: Course[]; initial: string; workshop: ReactNode }) {
  const byModality = useMemo(() => {
    const map: Record<string, Course[]> = {};
    for (const m of MODALITIES) map[m.slug] = courses.filter((c) => c.modality === m.modality);
    return map;
  }, [courses]);
  const counts = useMemo(() => Object.fromEntries(Object.entries(byModality).map(([k, v]) => [k, v.length])), [byModality]);

  // `active`: la píldora tocada (encabezado y dirección cambian ya). `shown`: lo que
  // muestra la tabla, que cambia cuando terminaron de salir las filas. `swap` dispara
  // la entrada aunque se vuelva a la misma modalidad en medio de la salida.
  const [active, setActive] = useState(initial);
  const [shown, setShown] = useState(initial);
  const [swap, setSwap] = useState(0);
  const target = useRef(initial);
  const waitToken = useRef(0);
  const leaving = useRef(false);
  const list = useRef<HTMLDivElement>(null);
  const preview = useRef<PreviewApi | null>(null);
  const fromH = useRef<number | null>(null);

  const activeInfo = MODALITIES.find((m) => m.slug === active) ?? MODALITIES[0];
  const info = MODALITIES.find((m) => m.slug === shown) ?? MODALITIES[0];
  const items = byModality[shown] ?? [];
  const onEnter = (c: Course, row: HTMLElement) => preview.current?.set(c, row);

  // La tabla solo se vuelve a dibujar cuando cambia la modalidad (no con el mouse).
  const table = useMemo(() => {
    const groups = groupsOf(info.modality, items);
    return groups.map((g) => <GroupBlock key={`${shown}-${g.key}`} g={g} modality={info.modality} onEnter={onEnter} />);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, items]);

  // Primera carga: las filas se dibujan cuando la tabla llega al 70 % de la pantalla.
  useEffect(() => {
    const root = list.current;
    if (!root || prefersReducedMotion()) return;
    gsap.set(root.querySelectorAll(".ct-rule"), { scaleX: 0 });
    gsap.set(root.querySelectorAll(".ct-in"), { yPercent: 110 });
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        rowsIn(root);
      },
      { rootMargin: "0px 0px -30% 0px" },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // Atrás / adelante del navegador: lo mismo que tocar la píldora (sube suave y las filas
  // salen y entran), sin volver a escribir la dirección. keepScrollOnNextPath evita que el
  // cambio de dirección suba la página de golpe (Mateo veía el salto al ir "atrás").
  const pickRef = useRef<(slug: string, push?: boolean) => void>(() => {});
  useEffect(() => {
    const onPop = () => {
      const slug = window.location.pathname.split("/").pop() ?? "";
      if (!MODALITIES.some((m) => m.slug === slug)) return;
      keepScrollOnNextPath();
      pickRef.current(slug, false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const toList = () => {
    const el = list.current;
    if (el) scrollPageTo(el.getBoundingClientRect().top + window.scrollY - 150);
  };

  // Cambio de modalidad. Nunca se bloquea: si se toca otra píldora mientras las filas
  // salen, la salida en curso termina en la última tocada; si entraban, se cortan y salen.
  const pick = (slug: string, push = true) => {
    if (slug === target.current) return;
    target.current = slug;
    setActive(slug);
    preview.current?.set(null);
    const m = MODALITIES.find((x) => x.slug === slug)!;
    if (push) {
      keepScrollOnNextPath();
      window.history.pushState(null, "", `/formacion/${slug}`);
    }
    document.title = `${m.title} — Elevar Formación`;
    // Mateo, 2026-10-20: cambiar de modalidad lleva arriba, al encabezado, para ver el
    // cambio y arrancar la lista desde el principio (si no, una lista más corta te dejaba
    // en el footer). 1,4 s, lento al arrancar y al llegar.
    // Si el menú del celular todavía tiene la página trabada, se espera a que la suelte.
    const t0 = performance.now();
    const goTop = () => {
      if (document.documentElement.style.overflow !== "hidden") {
        if (window.scrollY > 0) scrollPageTo(0, 1.4);
      } else if (performance.now() - t0 < 2000) requestAnimationFrame(goTop);
    };
    goTop();
    const root = list.current;
    const land = () => { setShown(target.current); setSwap((n) => n + 1); };
    if (!root || prefersReducedMotion()) { land(); return; }
    if (leaving.current) return;
    const ins = root.querySelectorAll(".ct-in");
    gsap.killTweensOf(root);
    gsap.killTweensOf(ins);
    gsap.killTweensOf(root.querySelectorAll(".ct-rule"));
    gsap.set(root, { clearProps: "height" });
    fromH.current = root.offsetHeight;
    // Sin filas a la vista (talleres, e-books vacío): se cambia directo. Pero si la página
    // está bajada, cambiar ya achica la página mientras sube y asoma el pie: primero se
    // apaga el contenido de talleres y se cambia cuando la página llegó arriba (o a 1,6 s).
    if (!ins.length || root.offsetParent === null) {
      if (window.scrollY <= 40) { land(); return; }
      const token = ++waitToken.current;
      const wk = document.querySelector("[data-workshop]");
      if (wk) gsap.to(wk, { autoAlpha: 0, duration: 0.5, ease: "power2.out" });
      const t0 = performance.now();
      const wait = () => {
        if (token !== waitToken.current) return;
        if (window.scrollY <= 40 || performance.now() - t0 > 1600) land();
        else requestAnimationFrame(wait);
      };
      requestAnimationFrame(wait);
      return;
    }
    leaving.current = true;
    gsap.to(root.querySelectorAll(".ct-rule"), { scaleX: 0, transformOrigin: "right", duration: 0.6, ease: "power2.inOut", stagger: { amount: 0.15 } });
    gsap.to(ins, {
      yPercent: -110, duration: 0.55, ease: "power2.inOut", stagger: { amount: 0.18 },
      onComplete: () => { leaving.current = false; land(); },
    });
  };
  pickRef.current = pick;

  // La dirección cambió por otro camino (menú de arriba, menú del celular, pie de página):
  // Next reusa esta misma página con otra modalidad, así que se cambia igual que con las
  // píldoras. Sin esto quedaba la modalidad vieja (Mateo, 2026-10-23: "hace como una
  // pequeña recarga donde parece que se buguea").
  useEffect(() => {
    if (initial !== target.current) pickRef.current(initial, false);
  }, [initial]);

  // Estando en la lista, cualquier link a otra modalidad (menú de arriba, menú del celular,
  // pie de página) hace lo mismo que la píldora: sin cambio de página de Next, que subía
  // la página de golpe. Se escucha en captura para adelantarse al Link (que respeta
  // `defaultPrevented`); el onClick del menú igual corre y lo cierra.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const slug = url.pathname.match(/^\/formacion\/([^/]+)$/)?.[1];
      if (!slug || !MODALITIES.some((m) => m.slug === slug)) return;
      e.preventDefault();
      pickRef.current(slug);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useLayoutEffect(() => {
    const root = list.current;
    if (!root || fromH.current === null) return;
    const h0 = fromH.current;
    fromH.current = null;
    gsap.set(root.querySelectorAll(".ct-rule"), { transformOrigin: "left" });
    gsap.fromTo(root, { height: h0 }, { height: root.scrollHeight, duration: 0.9, ease: "expo.inOut", clearProps: "height" });
    rowsIn(root, 0.25);
  }, [swap]);

  const isWorkshop = info.modality === "WORKSHOP";
  const isEbook = info.modality === "EBOOK";

  return (
    <>
      <Hero info={activeInfo} items={byModality[active] ?? []} onSeeList={toList} />

      <Pills active={active} counts={counts} onPick={pick} />

      {/* Talleres no tiene cursos cargados: muestra su contenido propio. */}
      {isWorkshop && <div data-workshop data-tone="light" className="pt-8">{workshop}</div>}

      {/* Tabla (blanco). */}
      <section data-tone="light" className={`bg-neutral-0 pt-16 md:pt-20 ${isWorkshop ? "hidden" : "pb-24 md:pb-32"}`}>
        <Container>
          {/* Al pasar el mouse por una fila, se apagan todas las demás (de todos los grupos). */}
          <div ref={list} className="overflow-hidden md:[&:has(.ct-row:hover)_.ct-row:not(:hover)]:opacity-[0.35]" onMouseLeave={() => preview.current?.set(null)}>
            {table.length > 0 ? (
              table
            ) : isWorkshop ? null : (
              <div className="ct-head relative max-w-2xl pb-10">
                <p className="overflow-hidden font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl">
                  <span className="ct-in block">{isEbook ? "Estamos preparando los primeros e‑books." : "Pronto hay cursos nuevos en esta modalidad."}</span>
                </p>
                <p className="mt-4 overflow-hidden text-lg text-neutral-600">
                  <span className="ct-in block">Escribinos y te avisamos apenas estén disponibles.</span>
                </p>
                <div className="mt-8 overflow-hidden">
                  <span className="ct-in block">
                    <Link href="/contacto" className={BTN.ghostLight}>Quiero que me avisen</Link>
                  </span>
                </div>
                <span aria-hidden className="ct-rule absolute inset-x-0 bottom-0 h-px origin-left bg-neutral-200" />
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Cierre (tinta). */}
      {!isWorkshop && (
        <section data-tone="dark" className="bg-ink-900 py-20 text-neutral-0 md:py-28">
          <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-[2.5rem]">¿No encontrás lo que buscás?</h2>
              <p className="mt-4 text-lg text-neutral-300">Armamos talleres a medida para tu equipo, en tu laboratorio o por videollamada.</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link href="/formacion/talleres" className={BTN.primary} onClick={(e) => { e.preventDefault(); pick("talleres"); }}>
                Ver talleres
              </Link>
              <Link href="/contacto" className={BTN.ghostDark}>Escribinos</Link>
            </div>
          </Container>
        </section>
      )}

      <Preview api={preview} />
    </>
  );
}
