"use client";

/* Página de promociones (/promociones).
 * Rediseño pedido por Mateo el 2026-10-20 ("no me gustó" la de tarjetas). Referencia
 * elegida: Epic Web · The Testing Bundle ("tu elección"), con el número que rueda de
 * NumberFlow; plan respondido con "1 próximo 2 sí GO-AHEAD".
 * Recorrido: encabezado tinta → calculadora (blanco: curso, "Solo yo / Mi equipo",
 * personas y el total con el descuento aplicado) → pago desde el exterior (tinta: el
 * 20 % de Western Union, que se coordina por fuera de la web) → cupones vigentes
 * (blanco, solo si hay) → cierre naranja de la portada de Formación.
 * El cálculo es el mismo del carrito (lib/promos.ts): si la promoción se apaga desde
 * el panel, la calculadora deja de descontar. Datos: cursos y promociones reales.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { CartItem, Course, Promo } from "@/types";
import { getPromos } from "@/lib/api";
import { addItem } from "@/lib/cart";
import { onCollectionChange } from "@/lib/local-db";
import { CONTACT } from "@/lib/contact";
import { formatARS, formatDate } from "@/lib/formatters";
import { MODALITIES } from "@/lib/formacion-modalities";
import { MODALITY_TEMPLATES } from "@/lib/formacion-templates";
import { PROMOS_SEED, computePricing } from "@/lib/promos";
import { canQuickAdd, nextSession } from "@/lib/quick-add";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { flyToCart } from "@/components/cart/fly-to-cart";
import { Container } from "@/components/ui/container";
import { scrollPageTo } from "@/components/anim/smooth-scroll";
import { BTN, isFree, useMotion } from "@/components/curso/ficha-parts";
import { Closing } from "@/components/formacion/portada";
import { NumeroRodante } from "@/components/promos/numero-rodante";

const MAX_PEOPLE = 20;
const sessionBased = (c: Course) => c.modality === "LIVE" || c.modality === "WEBINAR";
const modalityShort = (c: Course) => MODALITIES.find((m) => m.modality === c.modality)?.short ?? "";

/** Promo automática por cantidad de personas (hoy: "Promoción grupo de alumnos", 10 % desde 2). */
const groupPromoOf = (promos: Promo[]) =>
  promos.find((p) => p.trigger === "AUTO" && p.kind === "PERCENT" && p.minQuantity != null && p.minAmount == null) ?? null;

/** Descuento por medio de pago (Western Union), tal como lo publica ELEVAR en cada curso. */
const PAYMENT_PROMO = MODALITY_TEMPLATES.LIVE.promos.find((p) => /western union/i.test(p.detail)) ?? null;
const PAYMENT_PCT = PAYMENT_PROMO?.detail.match(/(\d+)\s*%/)?.[1] ?? null;

function lineFor(course: Course, quantity: number): CartItem {
  const session = sessionBased(course) ? nextSession(course) : undefined;
  return {
    courseId: course.id,
    sessionId: session?.id ?? null,
    titleSnapshot: course.title,
    unitPrice: course.price,
    currency: course.currency,
    modality: course.modality,
    coverImage: course.cover_image,
    code: course.code,
    sessionLabel: session ? formatDate(session.starts_at) : undefined,
    quantity,
  };
}

/** Las promociones vigentes: arranca con las semilla (sin parpadeo) y se actualiza con el panel. */
function usePromos(): Promo[] {
  const [promos, setPromos] = useState<Promo[]>(() => PROMOS_SEED.filter((p) => p.active));
  useEffect(() => {
    let alive = true;
    const load = () =>
      getPromos()
        .then((p) => alive && setPromos(p))
        .catch(() => alive && setPromos([]));
    load();
    const off = onCollectionChange((name) => name === "promos" && load());
    return () => {
      alive = false;
      off();
    };
  }, []);
  return promos;
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`h-4 w-4 ${className}`}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

// ── 1. Encabezado ────────────────────────────────────────────────────────────

function Hero({ group }: { group: Promo | null }) {
  const lines = group
    ? [{ text: "Capacitá" }, { text: "a tu equipo" }, { text: `con ${group.value} % menos`, accent: true }]
    : [{ text: "Capacitá" }, { text: "a tu equipo", accent: true }, { text: "con ELEVAR" }];
  const facts = [
    ...(group ? [`Desde ${group.minQuantity} personas`, "Se aplica sola en el carrito"] : []),
    ...(group?.scope === "ALL" ? ["En todos los cursos pagos"] : []),
    ...(PAYMENT_PCT ? [`${PAYMENT_PCT} % pagando desde el exterior`] : []),
  ];
  // Igual que la portada: cada línea sube de su máscara (1,2 s, 0,12 s entre líneas).
  const ref = useMotion<HTMLDivElement>((root) => {
    gsap.from(root.querySelectorAll(".pr-line"), { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.12, delay: 0.15 });
    gsap.from(root.querySelectorAll(".pr-in"), { y: 18, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.6 });
  });
  return (
    <section data-tone="dark" className="bg-ink-900 pb-20 pt-14 text-neutral-0 md:pb-28 md:pt-20">
      <Container>
        <div ref={ref}>
          <h1 className="font-display text-[clamp(2.5rem,7vw,7.5rem)] font-semibold uppercase leading-[0.95] tracking-[-0.02em]">
            {lines.map((l) => (
              <span key={l.text} className="block overflow-hidden pt-[0.08em]">
                <span className={`pr-line block ${l.accent ? "text-brand-500" : ""}`}>{l.text}</span>
              </span>
            ))}
          </h1>
          <div className="mt-10 grid gap-8 border-t border-neutral-0/15 pt-8 md:mt-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
            <div className="max-w-2xl">
              <p className="pr-in text-lg leading-relaxed text-neutral-300">
                {group
                  ? `Inscribí a ${group.minQuantity} o más personas de tu laboratorio en el mismo curso y el total baja solo en el carrito.`
                  : "Formá a tu laboratorio bajo la norma ISO/IEC 17025 con cursos en vivo, asincrónicos y talleres."}
              </p>
              <ul className="pr-in mt-5 flex flex-wrap gap-x-3 gap-y-2 text-sm text-neutral-200">
                {facts.map((f, i) => (
                  <li key={f} className="flex items-center gap-3">
                    {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-brand-400" />}
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pr-in flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className={BTN.primary}
                onClick={() => {
                  const el = document.getElementById("calculadora");
                  if (el) scrollPageTo(el.getBoundingClientRect().top + window.scrollY - 64, 1.2);
                }}
              >
                Calcular mi descuento
              </button>
              <Link href="/formacion" className={BTN.ghostDark}>Ver los cursos</Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── 2. Calculadora ───────────────────────────────────────────────────────────

/** El curso de arranque: el próximo en vivo con fecha (Mateo: "1 próximo"). */
function defaultCourse(list: Course[]): Course | undefined {
  const at = (c: Course) => new Date(nextSession(c)?.starts_at ?? 0).getTime();
  const live = list.filter((c) => c.modality === "LIVE" && nextSession(c)).sort((a, b) => at(a) - at(b));
  return live[0] ?? list[0];
}

function CoursePicker({ courses, value, onChange }: { courses: Course[]; value: Course; onChange: (c: Course) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? courses.filter((c) => c.title.toLowerCase().includes(t) || c.code.toLowerCase().includes(t)) : courses;
  }, [courses, q]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    input.current?.focus();
    // La lista baja como cortina (0,5 s).
    if (panel.current && !prefersReducedMotion()) {
      gsap.fromTo(panel.current, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.5, ease: "expo.out" });
    }
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center justify-between gap-4 py-1 text-left"
      >
        <span className="min-w-0">
          <span className="block text-xs text-neutral-500">
            {value.code} · {modalityShort(value)}
          </span>
          <span className="mt-1 block truncate font-display text-lg font-semibold text-ink-900 md:text-xl">{value.title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-brand-600">
          Cambiar
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className={`h-4 w-4 transition-transform duration-500 ${open ? "rotate-180" : ""}`}>
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div ref={panel} className="absolute inset-x-0 top-full z-30 mt-3 border border-ink-900 bg-neutral-0 shadow-[0_8px_8px_-6px_rgb(0_0_0/0.12)]">
          <label className="flex items-center gap-3 border-b border-neutral-200 px-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-4 w-4 text-neutral-500">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Buscar curso</span>
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o código"
              className="h-12 w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-neutral-500"
            />
          </label>
          <ul role="listbox" aria-label="Cursos" data-lenis-prevent className="max-h-72 overflow-y-auto overscroll-contain">
            {list.length === 0 && <li className="px-4 py-4 text-sm text-neutral-500">No hay cursos con ese nombre.</li>}
            {list.map((c) => (
              <li key={c.id} role="option" aria-selected={c.id === value.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                    setQ("");
                  }}
                  className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-neutral-100 px-4 py-3 text-left transition-colors duration-300 hover:bg-neutral-50 ${c.id === value.id ? "bg-neutral-50" : ""}`}
                >
                  <span className="min-w-0">
                    <span className="block text-xs text-neutral-500">
                      {c.code} · {modalityShort(c)}
                    </span>
                    <span className="block truncate text-sm font-medium text-ink-900">{c.title}</span>
                  </span>
                  <span className="text-sm tabular-nums text-ink-700">{formatARS(c.price)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** "Solo yo / Mi equipo": el fondo de tinta se desliza a la opción elegida (0,5 s). */
function Audience({ team, onChange }: { team: boolean; onChange: (team: boolean) => void }) {
  const thumb = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  useEffect(() => {
    const el = thumb.current;
    if (!el) return;
    const x = team ? "100%" : "0%";
    if (first.current || prefersReducedMotion()) gsap.set(el, { x });
    else gsap.to(el, { x, duration: 0.5, ease: "expo.out", overwrite: true });
    first.current = false;
  }, [team]);
  const opt = (on: boolean) =>
    `relative z-10 flex-1 px-4 py-3 text-sm font-semibold transition-colors duration-500 ${on ? "text-neutral-0" : "text-ink-900"}`;
  return (
    <div role="radiogroup" aria-label="¿Quiénes cursan?" className="relative flex w-full border border-ink-900 sm:w-80">
      <span ref={thumb} aria-hidden className="absolute inset-y-0 left-0 w-1/2 bg-ink-900" />
      <button type="button" role="radio" aria-checked={!team} onClick={() => onChange(false)} className={opt(!team)}>
        Solo yo
      </button>
      <button type="button" role="radio" aria-checked={team} onClick={() => onChange(true)} className={opt(team)}>
        Mi equipo
      </button>
    </div>
  );
}

function Stepper({ value, min, onChange, disabled }: { value: number; min: number; onChange: (n: number) => void; disabled: boolean }) {
  const btn =
    "grid h-12 w-12 place-items-center border border-ink-900 text-ink-900 transition-colors duration-500 hover:bg-ink-900 hover:text-neutral-0 disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className="flex items-center gap-0">
      <button type="button" aria-label="Una persona menos" className={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-4 w-4"><path d="M5 12h14" strokeLinecap="round" /></svg>
      </button>
      <span className={`grid h-12 w-16 place-items-center border-y border-ink-900 font-display text-xl font-semibold text-ink-900 ${disabled ? "opacity-30" : ""}`} aria-live="polite">
        <NumeroRodante text={String(value)} />
      </span>
      <button type="button" aria-label="Una persona más" className={btn} disabled={disabled || value >= MAX_PEOPLE} onClick={() => onChange(value + 1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-4 w-4"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

function Calculator({ courses, promos, group }: { courses: Course[]; promos: Promo[]; group: Promo | null }) {
  const options = useMemo(() => courses.filter((c) => !isFree(c) && canQuickAdd(c)), [courses]);
  const [course, setCourse] = useState<Course | undefined>(() => defaultCourse(options));
  const [team, setTeam] = useState(false);
  const [people, setPeople] = useState(1);
  const minTeam = Math.max(2, group?.minQuantity ?? 2);
  const qty = team ? people : 1;

  const pricing = useMemo(
    () => (course ? computePricing({ items: [lineFor(course, qty)], promos }) : null),
    [course, qty, promos]
  );
  const saving = pricing?.discounts.find((d) => d.promoId === group?.id) ?? pricing?.discounts[0] ?? null;

  // La etiqueta del ahorro entra y sale (0,6 s); el último cambio gana.
  const badge = useRef<HTMLDivElement>(null);
  const hasSaving = !!saving;
  const firstBadge = useRef(true);
  useEffect(() => {
    const el = badge.current;
    if (!el) return;
    const to = hasSaving ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 };
    if (firstBadge.current || prefersReducedMotion()) gsap.set(el, to);
    else gsap.to(el, { ...to, duration: 0.6, ease: "expo.out", overwrite: true });
    firstBadge.current = false;
  }, [hasSaving]);

  const ref = useMotion<HTMLElement>((root) => {
    const st = { trigger: root, start: "top 70%", once: true };
    gsap.from(root.querySelectorAll(".pc-title"), { yPercent: 110, duration: 1.2, ease: "expo.out", scrollTrigger: st });
    gsap.from(root.querySelectorAll(".pc-rule"), { scaleX: 0, duration: 1.3, ease: "expo.out", stagger: 0.1, scrollTrigger: st });
    gsap.from(root.querySelectorAll(".pc-in"), { y: 24, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.15, scrollTrigger: st });
  });

  const cta = useRef<HTMLButtonElement>(null);
  const [added, setAdded] = useState(false);
  const add = () => {
    if (!course) return;
    const item = lineFor(course, qty);
    flyToCart({
      from: cta.current,
      code: course.code,
      modality: course.modality,
      onLand: () => {
        addItem(item);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 2400);
      },
    });
  };

  const setAudience = (t: boolean) => {
    setTeam(t);
    if (t) setPeople((p) => Math.max(minTeam, p));
  };

  if (!course || !pricing) return null;
  const session = sessionBased(course) ? nextSession(course) : undefined;
  const label = `${qty} ${qty === 1 ? "inscripción" : "inscripciones"}`;

  return (
    <section ref={ref} id="calculadora" data-tone="light" className="scroll-mt-16 bg-neutral-0 py-14 md:py-16">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-6 md:mb-10">
          <h2 className="overflow-hidden font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-[2.5rem]">
            <span className="pc-title block">Calculá tu descuento</span>
          </h2>
          {group && (
            <span className="hidden overflow-hidden whitespace-nowrap text-sm text-neutral-500 sm:block">
              <span className="pc-title block">{group.title}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
          {/* Elección: filas finas con línea, el patrón del sitio. */}
          <div>
            <div className="pc-rule h-px origin-left bg-ink-900" />
            {/* z-20: la entrada con GSAP deja a cada fila en su propia capa; sin esto, la
                lista de cursos queda debajo de la fila siguiente y no se puede tocar. */}
            <div className="pc-in relative z-20 grid grid-cols-[minmax(0,1fr)] gap-3 py-5 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center md:gap-8">
              <p className="text-sm text-neutral-500">Curso</p>
              <CoursePicker courses={options} value={course} onChange={setCourse} />
            </div>
            <div className="pc-rule h-px origin-left bg-neutral-200" />
            <div className="pc-in grid grid-cols-[minmax(0,1fr)] gap-3 py-5 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center md:gap-8">
              <p className="text-sm text-neutral-500">¿Quiénes cursan?</p>
              <Audience team={team} onChange={setAudience} />
            </div>
            <div className="pc-rule h-px origin-left bg-neutral-200" />
            <div className="pc-in grid grid-cols-[minmax(0,1fr)] gap-3 py-5 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center md:gap-8">
              <p className="text-sm text-neutral-500">Personas</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Stepper value={qty} min={team ? minTeam : 1} disabled={!team} onChange={(n) => setPeople(n)} />
                <p className="text-sm text-ink-700">
                  {!team && group
                    ? `Elegí "Mi equipo" para inscribir a ${minTeam} o más personas con ${group.value} % de descuento.`
                    : `Hasta ${MAX_PEOPLE} personas. Para grupos más grandes, escribinos.`}
                </p>
              </div>
            </div>
            <div className="pc-rule h-px origin-left bg-neutral-200" />
          </div>

          {/* Total: tinta, el número rueda al cambiar. */}
          <div className="pc-in flex flex-col bg-ink-900 p-6 text-neutral-0 md:p-7">
            <p className="text-sm text-neutral-400">Total · {label}</p>
            <p className="mt-2 font-display text-[clamp(2.5rem,5vw,3.75rem)] font-semibold leading-none tracking-[-0.02em]">
              <NumeroRodante text={formatARS(pricing.total)} />
            </p>
            <div ref={badge} className="mt-3 min-h-[3.25rem]" aria-live="polite">
              {saving && (
                <>
                  <p className="text-sm text-neutral-400">
                    <span className="line-through">{formatARS(pricing.subtotal)}</span>
                  </p>
                  <p className="mt-1 inline-flex items-center gap-2 bg-brand-500 px-2.5 py-1 text-sm font-semibold text-neutral-0">
                    Ahorrás {formatARS(saving.amount)} · {group?.value ?? ""} %
                  </p>
                </>
              )}
            </div>
            <ul className="mt-4 space-y-1.5 border-t border-neutral-0/15 pt-4 text-sm text-neutral-300">
              <li>
                {qty} × {formatARS(course.price)} por participante
              </li>
              {session && <li>Comienza el {formatDate(session.starts_at)}</li>}
              <li>El descuento se aplica solo en el carrito.</li>
            </ul>
            <button ref={cta} type="button" onClick={add} className={`${BTN.primary} mt-5 w-full before:bg-neutral-0 hover:text-ink-900`}>
              {added ? "Agregado a tu bolsa" : `Agregar ${label}`}
              <Arrow />
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── 3. Pago desde el exterior ────────────────────────────────────────────────

const WU_MESSAGE = "Hola ELEVAR, quiero pagar un curso desde el exterior por Western Union.";

function Abroad() {
  const ref = useMotion<HTMLElement>((root) => {
    const st = { trigger: root, start: "top 70%", once: true };
    gsap.from(root.querySelectorAll(".pa-big"), { yPercent: 110, duration: 1.3, ease: "expo.out", scrollTrigger: st });
    gsap.from(root.querySelectorAll(".pa-rule"), { scaleX: 0, duration: 1.3, ease: "expo.out", scrollTrigger: st });
    gsap.from(root.querySelectorAll(".pa-in"), { y: 24, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.2, scrollTrigger: st });
  });
  if (!PAYMENT_PROMO || !PAYMENT_PCT) return null;
  return (
    <section ref={ref} data-tone="dark" className="bg-ink-900 py-16 text-neutral-0 md:py-24">
      <Container>
        <div className="pa-rule h-px origin-left bg-neutral-0/20" />
        <div className="grid gap-8 pt-10 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-end md:gap-14 md:pt-14">
          <p className="overflow-hidden font-display text-[clamp(4rem,10vw,8rem)] font-semibold leading-[0.9] tracking-[-0.02em] text-brand-500">
            <span className="pa-big block">−{PAYMENT_PCT} %</span>
          </p>
          <div className="max-w-xl">
            <h2 className="pa-in font-display text-3xl font-semibold tracking-tight md:text-[2.5rem]">¿Pagás desde el exterior?</h2>
            <p className="pa-in mt-4 text-lg leading-relaxed text-neutral-300">
              Pagando desde el exterior mediante Western Union se aplica un descuento del {PAYMENT_PCT} %. Ese pago se coordina directamente con ELEVAR, por eso no se descuenta en el carrito.
            </p>
          </div>
          <a
            href={`${CONTACT.whatsappUrl}?text=${encodeURIComponent(WU_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`pa-in ${BTN.primary} before:bg-neutral-0 hover:text-ink-900`}
          >
            Coordinar el pago por WhatsApp
          </a>
        </div>
      </Container>
    </section>
  );
}

// ── 4. Cupones vigentes ──────────────────────────────────────────────────────

function Coupons({ promos }: { promos: Promo[] }) {
  const coupons = promos.filter((p) => p.trigger === "COUPON");
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useMotion<HTMLElement>((root) => {
    const st = { trigger: root, start: "top 70%", once: true };
    gsap.from(root.querySelectorAll(".pk-title"), { yPercent: 110, duration: 1.2, ease: "expo.out", scrollTrigger: st });
    gsap.from(root.querySelectorAll(".pk-row"), { y: 24, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.15, scrollTrigger: st });
  });
  const copy = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    window.setTimeout(() => setCopied((c) => (c === code ? null : c)), 1800);
  };
  if (coupons.length === 0) return null;
  return (
    <section ref={ref} data-tone="light" className="bg-neutral-0 py-16 md:py-24">
      <Container>
        <h2 className="mb-10 overflow-hidden font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-[2.5rem]">
          <span className="pk-title block">Cupones vigentes</span>
        </h2>
        <ul className="border-t border-ink-900">
          {coupons.map((p) => (
            <li key={p.id} className="pk-row grid gap-3 border-b border-neutral-200 py-6 md:grid-cols-[14rem_minmax(0,1fr)_auto] md:items-center md:gap-8">
              <p className="font-mono text-xl font-semibold tracking-wider text-ink-900">{p.code}</p>
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-ink-900">{p.title}</p>
                {p.description && <p className="mt-1 text-sm text-ink-700">{p.description}</p>}
              </div>
              <button type="button" onClick={() => copy(p.code)} className={`${BTN.ghostLight} justify-self-start`}>
                {copied === p.code ? "Copiado" : "Copiar código"}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-neutral-500">Cargá el código en el carrito antes de pasar al pago.</p>
      </Container>
    </section>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────

export function Promociones({ courses }: { courses: Course[] }) {
  const promos = usePromos();
  const group = groupPromoOf(promos);
  return (
    <>
      <Hero group={group} />
      <Calculator courses={courses} promos={promos} group={group} />
      <Abroad />
      <Coupons promos={promos} />
      <Closing />
    </>
  );
}
