"use client";

/* Piezas de la ficha del curso (components/curso/ficha.tsx).
 * Tercera vuelta (Mateo, 2026-10-19: "los cards volvemos a lo mismo… no jugás con el
 * azul, blanco, azul… el navbar no me gusta… aplicá bien las reglas"):
 * - Nada de tarjetas iguales ni íconos en cuadrados: filas finas con línea, el patrón
 *   ya aprobado del sitio, y números solo donde hay un orden real (temario, cursada).
 * - Fondos que alternan tinta / blanco; las pestañas toman el color de la sección
 *   que tienen debajo, como el header en Sanalys.
 * - Cada sección entra con su propio movimiento (GSAP), no un fade-up para todo.
 * Datos: lib/data/cursos-elevar.json + lib/formacion-templates.ts. Nada inventado.
 */

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Course } from "@/types";
import type { ModalityTemplate } from "@/lib/formacion-templates";
import { formatARS } from "@/lib/formatters";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { openCartDrawer } from "@/lib/cart";
import { canQuickAdd, quickAddCourse } from "@/lib/quick-add";
import { Logo } from "@/components/brand/logo";
import { LOGO_GRAY } from "@/components/brand/logo-geometry";

export interface FichaData {
  course: Course;
  tpl: ModalityTemplate;
  modality: { slug: string; label: string };
}

export type Tone = "dark" | "light";

const LISTING_LABEL: Record<Course["modality"], string> = {
  ASYNC: "Cursos asincrónicos",
  LIVE: "Cursos online en vivo",
  WEBINAR: "Webinars gratuitos",
  WORKSHOP: "Talleres",
};

/** Fotos que existen en /public: el resto de los disertantes va con iniciales. */
const INSTRUCTOR_PHOTO: Record<string, string> = {
  "laura delissi": "/assets/equipo/laura.png",
  "daniela kuba": "/assets/equipo/foto_daniela_kuba.png",
};

// ── Datos derivados ─────────────────────────────────────────────────────────

export const isFree = (c: Course) => parseFloat(c.price) === 0;
export const priceARS = (c: Course) => (isFree(c) ? "Gratis" : formatARS(c.price));
export const priceUSD = (c: Course) =>
  c.price_usd ? `USD ${parseFloat(c.price_usd).toLocaleString("es-AR")}` : null;
export const pdfHref = (c: Course) => c.pdf_url ?? `/cursos/${c.slug}/imprimir`;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function sessionInfo(c: Course): { short: string; time: string; past: boolean } | null {
  const s = c.sessions[0];
  if (!s) return null;
  const tz = { timeZone: "America/Argentina/Buenos_Aires" } as const;
  const start = new Date(s.starts_at);
  const end = new Date(s.ends_at);
  const hm = (d: Date) => d.toLocaleTimeString("es-AR", { ...tz, hour: "2-digit", minute: "2-digit", hour12: false });
  return {
    short: start.toLocaleDateString("es-AR", { ...tz, day: "numeric", month: "long", year: "numeric" }),
    time: `${hm(start)} a ${hm(end)} h`,
    past: s.status === "FINISHED",
  };
}

/** Temario: líneas sueltas o módulos ("MÓDULO 1 | …"), en minúscula de oración. */
export function syllabusOf(c: Course): { title: string; isModule: boolean }[] {
  return (c.syllabus ?? []).map((line) => {
    const m = line.match(/^M[ÓO]DULO\s*\d+\s*[|.:\-–]\s*(.+)$/i);
    if (!m) return { title: line, isModule: false };
    const t = m[1].trim();
    return { title: t === t.toUpperCase() ? cap(t.toLowerCase()) : t, isModule: true };
  });
}

export function objectivesOf(c: Course): string[] {
  return (c.objectives ?? "").split("\n").map((s) => s.trim().replace(/\.$/, "")).filter(Boolean);
}

/** Resumen de arriba: la bajada de ELEVAR (`lead`) o uno armado con datos reales. */
export function leadOf({ course, tpl }: FichaData): string {
  if (course.lead) return course.lead;
  const who = course.instructor?.name ? ` con ${course.instructor.name}` : "";
  const s = sessionInfo(course);
  const first =
    course.modality === "ASYNC"
      ? `Curso asincrónico${course.duration_hours ? ` de ${course.duration_hours} ${course.duration_hours === 1 ? "hora" : "horas"}` : ""}${who}: lo hacés a tu ritmo.`
      : course.modality === "WEBINAR"
        ? `Webinar gratuito${s ? ` del ${s.short}` : ""}${who}.`
        : `Curso online en vivo${s ? ` el ${s.short}` : ""}${who}.`;
  const items = syllabusOf(course);
  const topics = items.slice(0, 3).map((i) => i.title.charAt(0).toLowerCase() + i.title.slice(1));
  const second = items.length
    ? ` En ${items.length} ${items.some((i) => i.isModule) ? "módulos" : "temas"} recorrés ${topics.join(", ").replace(/, ([^,]*)$/, " y $1")}${items.length > 3 ? ", entre otros" : ""}.`
    : "";
  const third = tpl.certificate ? " Al terminar recibís el certificado de ELEVAR." : "";
  return first + second + third;
}

export interface SectionLink {
  id: string;
  label: string;
}

/** En el mismo orden que la página. */
export function sectionsOf({ course, tpl }: FichaData): SectionLink[] {
  const s: SectionLink[] = [];
  if (course.objectives) s.push({ id: "objetivos", label: "Objetivos" });
  if (course.syllabus?.length) s.push({ id: "temario", label: "Temario" });
  if (tpl.includes.length) s.push({ id: "incluye", label: "Qué incluye" });
  if (tpl.howItWorks.length) s.push({ id: "cursada", label: "Cursada" });
  if (course.instructor) s.push({ id: "disertante", label: "Disertante" });
  if (tpl.certificate) s.push({ id: "certificado", label: "Certificado" });
  s.push({ id: "inscripcion", label: isFree(course) ? "Inscripción" : "Costo y pago" });
  return s;
}

export function instructorLines(c: Course): string[] {
  return (c.instructor?.role ?? "").split(/\s+[–-]\s+|\s+·\s+/).map((x) => x.trim()).filter(Boolean);
}

function instructorPhoto(name: string): string | null {
  const key = name.toLowerCase().replace(/^(lic\.|téc\.|tec\.|ing\.|dr\.|dra\.)\s*/, "").trim();
  return INSTRUCTOR_PHOTO[key] ?? null;
}

/** Lleva a una sección dejando lugar para el header y la barra de pestañas. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  // La sección arranca bajo el menú: la píldora flota sobre su propio relleno (64–80 px).
  const top = el.getBoundingClientRect().top + window.scrollY - 64;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

/** Corre `build` con GSAP dentro de `ref` (se limpia solo); nada si hay movimiento reducido. */
export function useMotion<T extends HTMLElement>(build: (root: T) => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const ctx = gsap.context(() => build(root), root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

/**
 * Tono ("dark" | "light") de la sección que queda detrás del centro de `ref`, según el
 * `data-tone` de cada sección. Se recalcula al hacer scroll.
 */
export function useToneBehind<T extends HTMLElement>(fallback: Tone = "dark") {
  const ref = useRef<T>(null);
  const [tone, setTone] = useState<Tone>(fallback);
  useEffect(() => {
    const read = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const hit = document
        .elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        .find((e) => !el.contains(e) && e.closest("[data-tone]"));
      const t = (hit?.closest("[data-tone]") as HTMLElement | null)?.dataset.tone as Tone | undefined;
      if (t) setTone(t);
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);
  return [ref, tone] as const;
}

// ── Íconos (trazo 1,75, como el resto del sitio) ────────────────────────────

const PATHS: Record<string, ReactNode> = {
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>),
  award: (<><circle cx="12" cy="9" r="6" /><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7" /></>),
  list: (<><path d="M9 6h12M9 12h12M9 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.2 3.5 5" /></>),
  download: (<><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></>),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {PATHS[name]}
    </svg>
  );
}

// ── Botones (relleno que sube, el patrón del sitio) ──────────────────────────

const FILL =
  "relative isolate overflow-hidden before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:transition-transform before:duration-[800ms] before:ease-[cubic-bezier(0.19,1,0.22,1)] hover:before:scale-y-100";
export const BTN = {
  primary: `${FILL} inline-flex items-center justify-center gap-2 bg-brand-500 px-6 py-3.5 text-sm font-semibold text-neutral-0 before:bg-ink-900`,
  onBrand: `${FILL} inline-flex items-center justify-center gap-2 bg-neutral-0 px-6 py-3.5 text-sm font-semibold text-ink-900 before:bg-ink-900 hover:text-neutral-0`,
  ghostDark: `${FILL} inline-flex items-center justify-center gap-2 border border-neutral-0/30 px-6 py-3.5 text-sm font-semibold text-neutral-0 before:bg-neutral-0 hover:text-ink-900`,
  ghostLight: `${FILL} inline-flex items-center justify-center gap-2 border border-ink-900/25 px-6 py-3.5 text-sm font-semibold text-ink-900 before:bg-ink-900 hover:text-neutral-0`,
};

/** Inscribirse + PDF: en el encabezado, tras el temario y en el cierre. */
export function Ctas({ course, tone = "dark", className = "" }: { course: Course; tone?: Tone | "brand"; className?: string }) {
  const primary = tone === "brand" ? BTN.onBrand : BTN.primary;
  const ghost = tone === "light" ? BTN.ghostLight : BTN.ghostDark;
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <button type="button" onClick={() => scrollToSection("inscripcion")} className={primary}>
        {isFree(course) ? "Inscribirme gratis" : `Inscribirme · ${priceARS(course)}`}
      </button>
      <a href={pdfHref(course)} target="_blank" rel="noopener noreferrer" className={ghost}>
        <Icon name="download" className="h-4 w-4" />
        Descargar PDF
      </a>
    </div>
  );
}

export function Breadcrumb({ data }: { data: FichaData }) {
  const c = "text-neutral-400 transition-colors hover:text-neutral-0";
  return (
    <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-2 text-xs">
      <Link href="/formacion" className={c}>Formación</Link>
      <span aria-hidden className="text-neutral-0/25">/</span>
      <Link href={`/formacion/${data.modality.slug}`} className={c}>{LISTING_LABEL[data.course.modality]}</Link>
      <span aria-hidden className="text-neutral-0/25">/</span>
      <span className="text-neutral-200">{data.course.code}</span>
    </nav>
  );
}

/** Datos rápidos del encabezado. */
export function HeroMeta({ data }: { data: FichaData }) {
  const { course, tpl } = data;
  const s = sessionInfo(course);
  const items: { icon: IconName; text: string }[] = [];
  if (s) items.push({ icon: "calendar", text: s.past ? `Se realizó el ${s.short}` : `${cap(s.short)} · ${s.time}` });
  else if (course.duration_hours) items.push({ icon: "clock", text: `${course.duration_hours} ${course.duration_hours === 1 ? "hora certificada" : "horas certificadas"}` });
  const n = course.syllabus?.length ?? 0;
  if (n) items.push({ icon: "list", text: `${n} ${syllabusOf(course).some((i) => i.isModule) ? "módulos" : "temas"}` });
  if (course.instructor) items.push({ icon: "user", text: course.instructor.name });
  if (tpl.certificate) items.push({ icon: "award", text: "Con certificado" });
  return (
    <ul className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-neutral-200">
      {items.map((i) => (
        <li key={i.text} className="hero-meta flex items-center gap-2">
          <Icon name={i.icon} className="h-4 w-4 text-brand-400" />
          {i.text}
        </li>
      ))}
    </ul>
  );
}

/**
 * Pestañas de la ficha (Mateo, 2026-10-19: "2 + 3", 21st.dev Scroll Spy + Framer
 * Floating Navbar, hechas en GSAP):
 * - Nace a lo ancho, en tinta, pegada al encabezado.
 * - Al empezar a bajar se encoge a una píldora flotante centrada en la columna de
 *   contenido (0,7 s expo.out: ancho, radio y 12 px hacia abajo).
 * - Adentro, un fondo se desliza a la sección que estás leyendo (0,5 s).
 * - La píldora invierte el color de la sección de atrás: blanca sobre tinta, tinta
 *   sobre blanco (0,5 s), para que siempre se note que con eso se navega.
 */
export function SectionTabs({ sections }: { sections: SectionLink[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const [compact, setCompact] = useState(false);
  const [pill, behind] = useToneBehind<HTMLDivElement>("light");
  const wrap = useRef<HTMLDivElement>(null);
  const lane = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const hl = useRef<HTMLSpanElement>(null);

  // Sección activa y si la barra ya quedó pegada (= modo píldora).
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const onScroll = () => {
      const top = wrap.current?.getBoundingClientRect().top ?? 999;
      setCompact(top <= 65);
      const probe = (pill.current?.getBoundingClientRect().bottom ?? 120) + 40;
      let current = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top <= probe) current = el.id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections, pill]);

  // Ancho a lo largo ↔ píldora.
  useEffect(() => {
    const el = pill.current;
    const ln = lane.current;
    const ls = list.current;
    if (!el || !ln || !ls) return;
    const apply = (instant = false) => {
      const full = ln.clientWidth;
      const natural = Math.min(ls.scrollWidth + 12, full);
      const d = instant || prefersReducedMotion() ? 0 : 0.7;
      gsap.to(el, {
        width: compact ? natural : full,
        borderRadius: compact ? 999 : 0,
        y: compact ? 12 : 0,
        duration: d,
        ease: "expo.out",
        overwrite: "auto",
      });
    };
    apply();
    const onResize = () => apply(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [compact, pill]);

  // Fondo de la pestaña activa: se desliza y deja la activa a la vista.
  useEffect(() => {
    const btn = list.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!btn || !hl.current) return;
    gsap.to(hl.current, { x: btn.offsetLeft, width: btn.offsetWidth, opacity: 1, duration: prefersReducedMotion() ? 0 : 0.5, ease: "expo.out" });
    const sc = list.current!;
    sc.scrollTo({ left: btn.offsetLeft - sc.clientWidth / 2 + btn.offsetWidth / 2, behavior: "smooth" });
  }, [active, compact]);

  // A lo largo: tinta (sigue al encabezado). Píldora: lo contrario de lo que hay detrás.
  const ink = compact ? behind === "light" : true;
  const t = "transition-colors duration-500";
  return (
    <div ref={wrap} className={`pointer-events-none sticky top-16 z-30 h-[60px] ${t} ${compact ? "bg-transparent" : "bg-ink-900"}`}>
      <div className="mx-auto h-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div ref={lane} className="flex h-full items-center justify-center lg:mr-[392px]">
          <div
            ref={pill}
            className={`pointer-events-auto relative w-full overflow-hidden p-1.5 ${t} ${
              compact ? (ink ? "bg-ink-900 shadow-[0_8px_8px_-6px_rgba(11,30,51,0.35)]" : "bg-neutral-0 shadow-[0_8px_8px_-6px_rgba(0,0,0,0.35)]") : "bg-transparent"
            }`}
          >
            <div ref={list} className="relative flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span
                ref={hl}
                aria-hidden
                className={`absolute left-0 top-0 h-full w-0 rounded-full opacity-0 ${t} ${ink ? "bg-neutral-0" : "bg-ink-900"}`}
              />
              {sections.map((s) => {
                const on = active === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    data-tab={s.id}
                    onClick={() => scrollToSection(s.id)}
                    aria-current={on ? "true" : undefined}
                    className={`relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${t} ${
                      on ? (ink ? "text-ink-900" : "text-neutral-0") : ink ? "text-neutral-300 hover:text-neutral-0" : "text-ink-700 hover:text-ink-900"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Título de sección: grande, sin íconos ni etiquetas encima; a la derecha, un dato. */
export function SectionTitle({ title, meta, tone = "light" }: { title: string; meta?: string; tone?: Tone }) {
  const ref = useMotion<HTMLDivElement>((root) => {
    const st = { trigger: root, start: "top 85%", once: true };
    gsap.from(root.querySelector(".st-rule"), { scaleX: 0, duration: 1.2, ease: "expo.out", scrollTrigger: st });
    gsap.from(root.querySelectorAll(".st-in"), { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: st });
  });
  const dark = tone === "dark";
  return (
    <div ref={ref} className="relative mb-10 flex items-end justify-between gap-6 pb-5">
      <h2 className={`overflow-hidden pb-1 font-display text-3xl font-semibold tracking-tight md:text-[2.5rem] ${dark ? "text-neutral-0" : "text-ink-900"}`}>
        <span className="st-in block">{title}</span>
      </h2>
      {meta && (
        <span className={`overflow-hidden text-sm ${dark ? "text-neutral-400" : "text-neutral-500"}`}>
          <span className="st-in block">{meta}</span>
        </span>
      )}
      <span aria-hidden className={`st-rule absolute inset-x-0 bottom-0 h-px origin-left ${dark ? "bg-neutral-0/15" : "bg-neutral-200"}`} />
    </div>
  );
}

/** Objetivos: filas grandes con la raya naranja que se dibuja al llegar. */
export function ObjectivesRows({ course }: { course: Course }) {
  const items = objectivesOf(course);
  const ref = useMotion<HTMLOListElement>((root) => {
    root.querySelectorAll<HTMLElement>(".ob-row").forEach((row) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 88%", once: true } });
      tl.from(row.querySelector(".ob-bar"), { scaleX: 0, duration: 0.9, ease: "expo.out" })
        .from(row.querySelector(".ob-text"), { x: -16, opacity: 0, duration: 1, ease: "expo.out" }, 0.1);
    });
  });
  return (
    <ol ref={ref} className="divide-y divide-neutral-200">
      {items.map((o) => (
        <li key={o} className="ob-row grid grid-cols-[2.25rem_1fr] items-baseline gap-3 py-5 first:pt-0">
          <span aria-hidden className="ob-bar block h-[2px] w-6 origin-left -translate-y-[0.3em] bg-brand-500" />
          <p className="ob-text text-lg leading-relaxed text-ink-900 md:text-xl">{o}.</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * Temario (sobre tinta): número, título y "Módulo N" alineados en una misma línea de
 * base. Cada fila entra al llegar: la línea se dibuja, el número sube de su máscara y
 * el título lo sigue.
 */
export function SyllabusRows({ course }: { course: Course }) {
  const items = syllabusOf(course);
  const ref = useMotion<HTMLOListElement>((root) => {
    root.querySelectorAll<HTMLElement>(".sy-row").forEach((row) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 90%", once: true } });
      tl.from(row.querySelector(".sy-rule"), { scaleX: 0, duration: 1.1, ease: "expo.out" })
        .from(row.querySelector(".sy-num"), { yPercent: 110, duration: 1, ease: "expo.out" }, 0.05)
        .from(row.querySelectorAll(".sy-txt"), { y: 18, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.06 }, 0.12);
    });
  });
  return (
    <ol ref={ref}>
      {items.map((it, i) => (
        <li key={i} className="sy-row group relative grid grid-cols-[3.5rem_1fr] items-baseline gap-x-4 py-6 sm:grid-cols-[5rem_1fr_auto]">
          <span aria-hidden className="sy-rule absolute inset-x-0 top-0 h-px origin-left bg-neutral-0/15" />
          <span className="block overflow-hidden">
            <span className="sy-num block font-display text-3xl font-semibold leading-none tabular-nums text-brand-500 md:text-4xl">
              {String(i + 1).padStart(2, "0")}
            </span>
          </span>
          <span className="sy-txt font-display text-lg font-semibold leading-snug text-neutral-0 transition-colors duration-500 group-hover:text-brand-300 md:text-xl">
            {it.title}
          </span>
          {it.isModule && (
            <span className="sy-txt col-start-2 mt-1 text-xs uppercase tracking-widest text-neutral-400 sm:col-start-3 sm:mt-0">Módulo {i + 1}</span>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Qué incluye: lista en dos columnas; el tilde se dibuja al llegar. */
export function IncludesList({ tpl }: { tpl: ModalityTemplate }) {
  const ref = useMotion<HTMLUListElement>((root) => {
    const st = { trigger: root, start: "top 85%", once: true };
    gsap.fromTo(root.querySelectorAll(".in-check path"), { strokeDashoffset: 24 }, { strokeDashoffset: 0, duration: 0.8, ease: "expo.out", stagger: 0.12, scrollTrigger: st });
    gsap.from(root.querySelectorAll(".in-txt"), { y: 14, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.1, scrollTrigger: st });
  });
  return (
    <ul ref={ref} className="grid border-t border-neutral-200 sm:grid-cols-2 sm:gap-x-12">
      {tpl.includes.map((it) => (
        <li key={it} className="flex items-start gap-4 border-b border-neutral-200 py-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="in-check mt-1 h-5 w-5 shrink-0 text-brand-500">
            <path d="M20 6 9 17l-5-5" strokeDasharray="24" />
          </svg>
          <span className="in-txt text-[17px] leading-relaxed text-ink-900">{it.replace(/\.$/, "")}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Cursada (sobre tinta): un recorrido de verdad, en orden. Una línea vertical une los
 * pasos y se pinta de naranja a medida que bajás (scrub); cada punto se llena al pasar.
 */
export function CursadaPath({ tpl }: { tpl: ModalityTemplate }) {
  const ref = useMotion<HTMLOListElement>((root) => {
    gsap.fromTo(root.querySelector(".cu-fill"), { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: root, start: "top 70%", end: "bottom 55%", scrub: 0.6 } });
    root.querySelectorAll<HTMLElement>(".cu-step").forEach((step) => {
      gsap.to(step.querySelector(".cu-dot"), { backgroundColor: "#E94E1B", borderColor: "#E94E1B", duration: 0.4, scrollTrigger: { trigger: step, start: "top 62%", toggleActions: "play none none reverse" } });
      gsap.from(step.querySelector(".cu-txt"), { x: 24, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: step, start: "top 85%", once: true } });
    });
  });
  return (
    <ol ref={ref} className="relative pl-12 md:pl-16">
      <span aria-hidden className="absolute bottom-3 left-[11px] top-3 w-px bg-neutral-0/15 md:left-[15px]" />
      <span aria-hidden className="cu-fill absolute bottom-3 left-[11px] top-3 w-px origin-top bg-brand-500 md:left-[15px]" />
      {tpl.howItWorks.map((step, i) => (
        <li key={i} className="cu-step relative pb-10 last:pb-0">
          <span aria-hidden className="cu-dot absolute -left-12 top-0.5 grid h-6 w-6 place-items-center rounded-full border border-neutral-0/40 bg-ink-900 font-mono text-[10px] font-semibold text-neutral-0 md:-left-16 md:h-8 md:w-8 md:text-xs">
            {i + 1}
          </span>
          <p className="cu-txt max-w-2xl text-[17px] leading-relaxed text-neutral-200">{step}</p>
        </li>
      ))}
    </ol>
  );
}

/** Disertante: la foto (ya viene recortada en círculo) se abre como una cortina desde abajo; el cargo en filas finas. */
export function InstructorFeature({ course }: { course: Course }) {
  const ins = course.instructor!;
  const photo = instructorPhoto(ins.name);
  const lines = instructorLines(course);
  const ref = useMotion<HTMLDivElement>((root) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: root, start: "top 78%", once: true } });
    tl.fromTo(root.querySelector(".di-photo"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" })
      .from(root.querySelector(".di-img"), { scale: 1.15, duration: 1.6, ease: "expo.out" }, 0.2)
      .from(root.querySelectorAll(".di-in"), { y: 20, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.07 }, 0.5);
  });
  const initials = ins.name.replace(/^(lic\.|téc\.|tec\.|ing\.)\s*/i, "").split(/\s+/).slice(0, 2).map((p) => p[0]).join("");
  return (
    <div ref={ref} className="grid items-center gap-8 sm:grid-cols-[220px_1fr] md:gap-12">
      <div className="di-photo aspect-square w-full max-w-[220px] overflow-hidden rounded-full bg-ink-900">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={ins.name} className="di-img h-full w-full object-cover" />
        ) : (
          <span aria-hidden className="di-img grid h-full w-full place-items-center font-display text-6xl font-semibold text-neutral-0">{initials}</span>
        )}
      </div>
      <div>
        <p className="di-in text-sm text-neutral-500">Disertante</p>
        <p className="di-in mt-1 font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-[2.5rem]">{ins.name}</p>
        <ul className="mt-6 border-t border-neutral-200">
          {lines.map((l) => (
            <li key={l} className="di-in border-b border-neutral-200 py-3 text-[15px] text-ink-800">{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * El certificado de ELEVAR como tarjeta 3D (Mateo: "que sea como una tarjeta 3D").
 * En reposo está de frente. Escritorio: se inclina siguiendo el mouse con un brillo
 * encima; teléfono: al arrastrarlo con el dedo. Al soltar vuelve de frente (1,1 s).
 * Entra subiendo y enderezándose (1,4 s expo.out). Sin firmas inventadas.
 */
export function Certificate3D({ course, tier }: { course: Course; tier: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const shine = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const st = stage.current;
    const el = card.current;
    if (!st || !el || prefersReducedMotion()) return;
    // De frente en reposo (Mateo, 2026-10-19: "que esté bien de frente").
    const REST = { rotateY: 0, rotateX: 0 };
    const ctx = gsap.context(() => {
      // Entra subiendo y enderezándose, ya de frente (sin girar de costado).
      gsap.fromTo(el, { rotateX: 18, y: 50, opacity: 0 }, { ...REST, y: 0, opacity: 1, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: st, start: "top 80%", once: true } });
    }, st);
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch" && e.buttons === 0) return;
      const r = st.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, { rotateY: x * 24, rotateX: -y * 24, duration: 0.6, ease: "power3.out", overwrite: "auto" });
      if (shine.current) gsap.to(shine.current, { backgroundPosition: `${50 + x * 80}% ${50 + y * 80}%`, opacity: 1, duration: 0.6, overwrite: "auto" });
    };
    const leave = () => {
      gsap.to(el, { ...REST, duration: 1.1, ease: "expo.out", overwrite: "auto" });
      if (shine.current) gsap.to(shine.current, { opacity: 0.35, duration: 0.8 });
    };
    st.addEventListener("pointermove", move);
    st.addEventListener("pointerleave", leave);
    st.addEventListener("pointerup", leave);
    return () => {
      ctx.revert();
      st.removeEventListener("pointermove", move);
      st.removeEventListener("pointerleave", leave);
      st.removeEventListener("pointerup", leave);
    };
  }, []);

  return (
    <div ref={stage} className="relative mx-auto w-full max-w-[480px] touch-pan-y py-6 [perspective:1300px]">
      <div
        ref={card}
        role="img"
        aria-label={`Ejemplo del certificado ${tier.toLowerCase()} de ELEVAR`}
        className="relative aspect-[1.414/1] w-full [transform-style:preserve-3d]"
      >
        <div aria-hidden className="absolute inset-0 bg-[#D9D3C7] [transform:translateZ(-6px)]" />
        <div aria-hidden className="absolute inset-0 bg-[#C9C1B2] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] [transform:translateZ(-12px)]" />
        <div className="absolute inset-0 overflow-hidden border border-[#E7E1D5] bg-[#FBFAF7] p-[6%]">
          <div aria-hidden className="absolute inset-[3.5%] border border-brand-500/50" />
          <div aria-hidden className="absolute inset-[5%] border border-brand-500/20" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between">
              <Logo wordColor={LOGO_GRAY} className="h-5 w-auto sm:h-6" />
              <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-neutral-500">{course.code}</span>
            </div>
            <p className="mt-[7%] text-[9px] font-semibold uppercase tracking-[0.35em] text-brand-600 sm:text-[10px]">Certificado</p>
            <p className="font-display text-lg font-semibold text-ink-900 sm:text-2xl">{tier}</p>
            <p className="mt-2 line-clamp-2 text-[10px] leading-snug text-neutral-700 sm:text-xs">{course.title}</p>
            {course.duration_hours ? <p className="mt-1 text-[9px] text-neutral-500 sm:text-[10px]">Duración certificada: {course.duration_hours} h</p> : null}
            <div className="mt-auto flex items-end justify-between">
              <span className="text-[8px] uppercase tracking-widest text-neutral-400">elevar.com.ar</span>
              <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-brand-500/60 text-[7px] font-bold uppercase tracking-wider text-brand-600 sm:h-14 sm:w-14 sm:text-[8px]">Elevar</span>
            </div>
          </div>
          <div
            ref={shine}
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-35 mix-blend-soft-light [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.95),rgba(255,255,255,0)_45%)] [background-position:30%_30%] [background-size:220%_220%]"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Tarjeta de compra fija (escritorio). Compacta a propósito: siempre entra entera en
 * la pantalla, con el PDF incluido (Mateo: "la idea es que siempre se vea todo").
 * Invierte el color de la sección que tiene detrás: sobre blanco va en tinta y sobre
 * tinta va en blanco, para que no se pierda (Mateo, 2026-10-19). Cambio en 0,5 s.
 */
export function BuyCard({ data }: { data: FichaData }) {
  const { course, tpl } = data;
  const [added, setAdded] = useState(false);
  const [cardRef, behind] = useToneBehind<HTMLDivElement>("dark");
  const ink = behind === "light"; // tarjeta en tinta sobre secciones blancas
  const s = sessionInfo(course);
  const usd = priceUSD(course);
  const quick = canQuickAdd(course);
  const facts: { icon: IconName; text: string }[] = [];
  if (s) facts.push({ icon: "calendar", text: s.past ? `Se realizó el ${s.short}` : `${cap(s.short)}, ${s.time}` });
  else if (course.duration_hours) facts.push({ icon: "clock", text: `${course.duration_hours} horas certificadas` });
  if (tpl.certificate) facts.push({ icon: "award", text: "Certificado de participación o aprobación" });
  if (tpl.promos.length) facts.push({ icon: "users", text: "10 % menos inscribiendo 2 o más" });
  if (usd) facts.push({ icon: "globe", text: `${usd} desde otros países` });

  const t = "transition-colors duration-500";
  return (
    <div ref={cardRef} className={`border ${t} ${ink ? "border-ink-700 bg-ink-900" : "border-neutral-200 bg-neutral-0"}`}>
      <div className="p-6">
        <p className={`text-xs ${t} ${ink ? "text-neutral-400" : "text-neutral-500"}`}>{isFree(course) ? "Inscripción" : "Por participante"}</p>
        <p className={`mt-1 font-display text-4xl font-semibold tracking-tight ${t} ${ink ? "text-neutral-0" : "text-ink-900"}`}>{priceARS(course)}</p>
        <ul className="mt-5 space-y-2.5">
          {facts.map((f) => (
            <li key={f.text} className={`flex items-start gap-3 text-sm ${t} ${ink ? "text-neutral-200" : "text-ink-800"}`}>
              <Icon name={f.icon} className={`mt-0.5 h-4 w-4 shrink-0 ${ink ? "text-brand-400" : "text-brand-500"}`} />
              {f.text}
            </li>
          ))}
        </ul>
      </div>
      <div className={`space-y-2.5 border-t p-6 ${t} ${ink ? "border-neutral-0/10" : "border-neutral-200"}`}>
        {quick ? (
          <button
            type="button"
            onClick={() => {
              quickAddCourse(course, cardRef.current, null);
              setAdded(true);
              window.setTimeout(() => setAdded(false), 2600);
            }}
            className={`${BTN.primary} w-full ${ink ? "before:!bg-brand-700" : ""}`}
          >
            {added ? "Agregado al carrito" : "Agregar al carrito"}
          </button>
        ) : (
          <button type="button" onClick={() => scrollToSection("inscripcion")} className={`${BTN.primary} w-full ${ink ? "before:!bg-brand-700" : ""}`}>
            {isFree(course) ? "Inscribirme gratis" : "Elegir fecha e inscribirme"}
          </button>
        )}
        <a href={pdfHref(course)} target="_blank" rel="noopener noreferrer" className={`${ink ? BTN.ghostDark : BTN.ghostLight} w-full`}>
          <Icon name="download" className="h-4 w-4" />
          Descargar información en PDF
        </a>
        {quick && (
          <button
            type="button"
            onClick={() => openCartDrawer()}
            className={`block w-full pt-1 text-center text-xs font-medium underline-offset-4 hover:underline ${ink ? "text-neutral-400 hover:text-neutral-0" : "text-neutral-500 hover:text-ink-900"}`}
          >
            Ver carrito
          </button>
        )}
      </div>
    </div>
  );
}

/** Formas de pago y promociones (sobre blanco): filas finas, el porcentaje en grande. */
export function PaymentRows({ tpl }: { tpl: ModalityTemplate }) {
  const ref = useMotion<HTMLDivElement>((root) => {
    gsap.from(root.querySelectorAll(".pa-in"), { y: 18, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: root, start: "top 85%", once: true } });
  });
  if (!tpl.payment.length && !tpl.promos.length) return null;
  return (
    <div ref={ref} className="grid gap-10 md:grid-cols-2 xl:grid-cols-1">
      {tpl.promos.length > 0 && (
        <ul className="border-t border-neutral-200">
          {tpl.promos.map((p) => (
            <li key={p.title} className="pa-in grid grid-cols-[4.5rem_1fr] items-baseline gap-3 border-b border-neutral-200 py-5">
              <span className="font-display text-3xl font-semibold tabular-nums text-brand-500">{p.detail.match(/\d+\s?%/)?.[0].replace(/\s/, "") ?? "%"}</span>
              <span className="text-[15px] leading-relaxed text-ink-800">
                <span className="font-semibold text-ink-900">{p.title}:</span> {p.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
      {tpl.payment.length > 0 && (
        <div className="grid grid-cols-2 gap-6 border-t border-neutral-200 pt-5">
          {tpl.payment.map((g) => (
            <div key={g.region} className="pa-in">
              <p className="text-sm font-semibold text-ink-900">{g.region}</p>
              <ul className="mt-3 space-y-2 text-[15px] text-ink-700">
                {g.methods.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Barra fija abajo en el teléfono: precio + inscribirse. */
export function BuyBar({ course }: { course: Course }) {
  const usd = priceUSD(course);
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-neutral-0/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-4 py-3 pl-4 pr-20 sm:pl-6">
        <div className="min-w-0">
          <p className="truncate text-xs text-neutral-500">{course.code} · {course.title}</p>
          <p className="font-display text-lg font-semibold text-ink-900">
            {priceARS(course)}
            {usd && <span className="ml-2 text-xs font-medium text-neutral-500">{usd}</span>}
          </p>
        </div>
        <button type="button" onClick={() => scrollToSection("inscripcion")} className={`${BTN.primary} shrink-0 !px-5 !py-3`}>
          Inscribirme
        </button>
      </div>
    </div>
  );
}

/** Botón de la página para imprimir: abre "Guardar como PDF" del navegador. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 bg-brand-500 px-5 py-3 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-600 print:hidden">
      Guardar como PDF
    </button>
  );
}
