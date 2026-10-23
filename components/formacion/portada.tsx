"use client";

/* Portada de Formación (/formacion).
 * Elegida por Mateo el 2026-10-20 ("tu elección" → referencia 1, Hyper Island) con
 * "1 sacar 2 dejar GO-AHEAD" (sin la franja de promoción; "Cómo enseñamos" se queda con
 * su espacio de video). Recorrido: encabezado tinta con el título gigante en mayúsculas →
 * "Elegí cómo capacitarte" (blanco: una banda por modalidad que se llena de tinta al pasar
 * el mouse) → "Próximos en vivo y webinars" (tinta: el próximo en grande y los siguientes
 * en filas) → "Cómo enseñamos" (blanco) → cierre naranja.
 * Reglas de formación (15-MEMORY): tinta / blanco alternados, sin grillas de tarjetas,
 * movimiento propio por sección, pasos de 0,5 s o más. Datos: los cursos reales.
 */

import Link from "next/link";
import type { Course } from "@/types";
import { MODALITIES } from "@/lib/formacion-modalities";
import { CONTACT } from "@/lib/contact";
import { formatARS } from "@/lib/formatters";
import { gsap } from "@/lib/gsap";
import { Container } from "@/components/ui/container";
import { Pictogram } from "@/components/ui/pictogram";
import { VideoSlot } from "@/components/media/video-slot";
import { scrollPageTo } from "@/components/anim/smooth-scroll";
import { BTN, isFree, priceARS, sessionInfo, useMotion } from "@/components/curso/ficha-parts";

// ── Datos ────────────────────────────────────────────────────────────────────

const TZ = "America/Argentina/Buenos_Aires";
const startsAt = (c: Course) => (c.sessions[0] ? new Date(c.sessions[0].starts_at).getTime() : 0);
const upcoming = (c: Course) => !!c.sessions[0] && c.sessions[0].status !== "FINISHED";
const dated = (c: Course) => c.modality === "LIVE" || c.modality === "WEBINAR";

/** "23" y "OCT" de la próxima fecha, en hora de Argentina. */
function dayMonth(c: Course): { day: number; month: string } | null {
  const s = c.sessions[0];
  if (!s) return null;
  const d = new Date(s.starts_at);
  const day = Number(d.toLocaleDateString("es-AR", { timeZone: TZ, day: "numeric" }));
  const month = d.toLocaleDateString("es-AR", { timeZone: TZ, month: "short" }).replace(".", "").toUpperCase();
  return { day, month };
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`h-4 w-4 ${className}`}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

// ── 1. Encabezado ────────────────────────────────────────────────────────────

const HERO_LINES: { text: string; accent?: boolean }[] = [
  { text: "Capacitación" },
  { text: "en calidad", accent: true },
  { text: "de laboratorio" },
];

function Hero({ courses }: { courses: Course[] }) {
  const paid = courses.filter((c) => !isFree(c)).map((c) => parseFloat(c.price));
  const facts = [
    `${courses.length} cursos`,
    `${MODALITIES.length} modalidades`,
    ...(paid.length ? [`Desde ${formatARS(String(Math.min(...paid)))}`] : []),
  ];
  // Cada línea sube de su máscara (1,2 s, 0,12 s entre líneas); lo demás la sigue.
  // Pantallas bajas (1366 × 650, Mateo 2026-10-23 "ajustar encabezado"): el título también
  // se limita por el alto (13svh) y hay menos aire, para que botones y datos entren.
  const ref = useMotion<HTMLDivElement>((root) => {
    gsap.from(root.querySelectorAll(".ph-line"), { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.12, delay: 0.15 });
    gsap.from(root.querySelectorAll(".ph-in"), { y: 18, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.6 });
  });
  return (
    <section data-tone="dark" className="bg-ink-900 pb-20 pt-14 text-neutral-0 md:pb-28 md:pt-20 [@media(min-width:768px)_and_(max-height:800px)]:pb-14 [@media(min-width:768px)_and_(max-height:800px)]:pt-10">
      <Container>
        <div ref={ref}>
          <h1 className="font-display text-[clamp(2.5rem,min(7vw,13svh),7.5rem)] font-semibold uppercase leading-[0.95] tracking-[-0.02em]">
            {HERO_LINES.map((l) => (
              <span key={l.text} className="block overflow-hidden pt-[0.08em]">
                <span className={`ph-line block ${l.accent ? "text-brand-500" : ""}`}>{l.text}</span>
              </span>
            ))}
          </h1>
          <div className="mt-10 grid gap-8 border-t border-neutral-0/15 pt-8 md:mt-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12 [@media(min-width:768px)_and_(max-height:800px)]:mt-8 [@media(min-width:768px)_and_(max-height:800px)]:pt-6">
            <div className="max-w-2xl">
              <p className="ph-in text-lg leading-relaxed text-neutral-300">
                Formá a tu equipo bajo la norma ISO/IEC 17025: cursos en vivo, asincrónicos, webinars gratuitos, talleres y e-books.
              </p>
              <ul className="ph-in mt-5 flex flex-wrap gap-x-3 gap-y-2 text-sm text-neutral-200">
                {facts.map((f, i) => (
                  <li key={f} className="flex items-center gap-3">
                    {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-brand-400" />}
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="ph-in flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className={BTN.primary}
                onClick={() => {
                  const el = document.getElementById("proximos");
                  if (el) scrollPageTo(el.getBoundingClientRect().top + window.scrollY - 64, 1.2);
                }}
              >
                Ver los próximos cursos
              </button>
              <Link href="/contacto" className={BTN.ghostDark}>Hablar con ELEVAR</Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── 2. Elegí cómo capacitarte ────────────────────────────────────────────────

/** Tres cursos de la modalidad: los próximos por fecha, o los primeros del catálogo. */
function picksOf(list: Course[]): Course[] {
  if (list.some(dated)) return list.filter(upcoming).sort((a, b) => startsAt(a) - startsAt(b)).slice(0, 3);
  return list.slice(0, 3);
}

const EMPTY_NOTE: Record<string, string> = {
  WORKSHOP: "Talleres a medida para tu equipo, en tu laboratorio o por videollamada.",
  EBOOK: "Estamos preparando los primeros e‑books.",
};

function Paths({ courses }: { courses: Course[] }) {
  // Al llegar: el título sube y las líneas de cada banda se dibujan de a una.
  const ref = useMotion<HTMLElement>((root) => {
    const st = { trigger: root, start: "top 70%", once: true };
    gsap.from(root.querySelectorAll(".pp-title"), { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.08, scrollTrigger: st });
    root.querySelectorAll<HTMLElement>(".pp-band").forEach((band) => {
      const s = { trigger: band, start: "top 85%", once: true };
      gsap.from(band.querySelector(".pp-rule"), { scaleX: 0, duration: 1.3, ease: "expo.out", scrollTrigger: s });
      gsap.from(band.querySelectorAll(".pp-in"), { y: 24, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.06, delay: 0.1, scrollTrigger: s });
    });
  });
  return (
    <section ref={ref} data-tone="light" className="bg-neutral-0 py-20 md:py-28">
      <Container>
        <div className="mb-12 flex items-end justify-between gap-6 md:mb-16">
          <h2 className="overflow-hidden font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-[2.5rem]">
            <span className="pp-title block">Elegí cómo capacitarte</span>
          </h2>
          <span className="hidden overflow-hidden whitespace-nowrap text-sm text-neutral-500 sm:block">
            <span className="pp-title block">{MODALITIES.length} modalidades</span>
          </span>
        </div>
        <div className="border-t border-ink-900">
          {MODALITIES.map((m, i) => {
            const list = courses.filter((c) => c.modality === m.modality);
            const picks = picksOf(list);
            return (
              <div key={m.slug} className="pp-band group relative isolate">
                {/* Relleno de tinta que sube al pasar el mouse (0,8 s). */}
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 hidden origin-bottom scale-y-0 bg-ink-900 transition-transform duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-y-100 md:block"
                />
                <span aria-hidden className="pp-rule absolute inset-x-0 bottom-0 h-px origin-left bg-neutral-200" />
                <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-0 py-9 transition-[padding] duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-12 md:py-12 md:group-hover:px-8">
                  <div className="pp-in flex items-start gap-5">
                    <Pictogram src={m.img} index={i} className="h-14 w-14 shrink-0 md:h-16 md:w-16" />
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl font-semibold tracking-tight text-ink-900 transition-colors duration-500 md:text-3xl md:group-hover:text-neutral-0">
                        {/* El link se estira sobre toda la banda (en el celular, tocar la banda lleva a la lista). */}
                        <Link href={`/formacion/${m.slug}`} className="after:absolute after:inset-0 after:content-['']">
                          {m.title}
                        </Link>
                      </h3>
                      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-neutral-600 transition-colors duration-500 md:group-hover:text-neutral-300">{m.desc}</p>
                      <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-600 transition-colors duration-500 md:group-hover:text-brand-400">
                        {list.length > 0 ? `Ver ${list.length === 1 ? "el curso" : `los ${list.length}`}` : "Ver más"}
                        <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
                      </p>
                    </div>
                  </div>
                  <div className="pp-in md:pt-1">
                    {picks.length > 0 ? (
                      <ul className="relative z-10">
                        {picks.map((c) => {
                          const s = sessionInfo(c);
                          return (
                            <li key={c.id}>
                              <Link
                                href={`/cursos/${c.slug}`}
                                className="flex items-baseline gap-4 border-b border-neutral-200 py-3 text-ink-900 transition-colors duration-500 last:border-0 hover:text-brand-600 md:group-hover:border-neutral-0/15 md:group-hover:text-neutral-0 md:hover:!text-brand-400"
                              >
                                <span className="w-12 shrink-0 font-mono text-xs font-semibold text-brand-600 md:group-hover:text-brand-400">{c.code}</span>
                                <span className="min-w-0 flex-1 truncate text-[15px]">{c.title}</span>
                                <span className="hidden shrink-0 text-sm tabular-nums text-neutral-500 sm:block md:group-hover:text-neutral-400">
                                  {s && !s.past ? s.short.replace(/ de \d{4}$/, "") : priceARS(c)}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-[15px] text-neutral-500 md:group-hover:text-neutral-300">{EMPTY_NOTE[m.modality] ?? "Próximamente."}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

// ── 3. Próximos en vivo y webinars ───────────────────────────────────────────

function Upcoming({ courses }: { courses: Course[] }) {
  const list = courses.filter((c) => dated(c) && upcoming(c)).sort((a, b) => startsAt(a) - startsAt(b));
  const [first, ...rest] = list;
  const next = rest.slice(0, 5);
  const dm = first ? dayMonth(first) : null;
  const s = first ? sessionInfo(first) : null;

  // Al llegar: el día cuenta hasta la fecha, el destacado sube y las filas se dibujan.
  const ref = useMotion<HTMLElement>((root) => {
    const st = { trigger: root, start: "top 70%", once: true };
    gsap.from(root.querySelectorAll(".pu-title"), { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.08, scrollTrigger: st });
    const day = root.querySelector<HTMLElement>(".pu-day");
    if (day && dm) {
      const o = { v: 1 };
      gsap.to(o, { v: dm.day, duration: 1.4, ease: "power3.out", scrollTrigger: st, onUpdate: () => { day.textContent = String(Math.round(o.v)); } });
    }
    gsap.from(root.querySelectorAll(".pu-in"), { y: 24, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.2, scrollTrigger: st });
    root.querySelectorAll<HTMLElement>(".pu-row").forEach((row, i) => {
      const s2 = { trigger: row, start: "top 90%", once: true };
      gsap.from(row.querySelector(".pu-rule"), { scaleX: 0, duration: 1.3, ease: "expo.out", delay: i * 0.06, scrollTrigger: s2 });
      gsap.from(row.querySelectorAll(".pu-txt"), { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.04, delay: 0.08 + i * 0.06, scrollTrigger: s2 });
    });
  });

  if (!first) return null;
  return (
    <section id="proximos" ref={ref} data-tone="dark" className="bg-ink-900 py-20 text-neutral-0 md:py-28">
      <Container>
        <div className="mb-12 flex items-end justify-between gap-6 md:mb-16">
          <h2 className="overflow-hidden font-display text-3xl font-semibold tracking-tight md:text-[2.5rem]">
            <span className="pu-title block">Próximos en vivo y webinars</span>
          </h2>
          <Link href="/formacion/cursos-online-en-vivo" className="shrink-0 overflow-hidden whitespace-nowrap text-sm font-semibold text-brand-400 transition-colors hover:text-neutral-0">
            <span className="pu-title flex items-center gap-2">Ver todos <Arrow /></span>
          </Link>
        </div>

        {/* El próximo, en grande. */}
        <div className="grid gap-8 border-t border-neutral-0/15 pt-10 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-end md:gap-14">
          {dm && (
            <div className="pu-in font-display font-semibold leading-[0.85] tracking-[-0.02em]">
              <span className="pu-day block text-[clamp(5rem,12vw,10rem)] tabular-nums">{dm.day}</span>
              <span className="mt-2 block text-2xl text-brand-400 md:text-3xl">{dm.month}</span>
            </div>
          )}
          <div className="pu-in min-w-0">
            <p className="font-mono text-sm font-semibold text-brand-400">
              {first.code} · {first.modality === "WEBINAR" ? "Webinar" : "Curso en vivo"}
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold leading-snug tracking-tight md:text-4xl">{first.title}</h3>
            {s && <p className="mt-4 text-neutral-300">{s.short} · {s.time}{first.instructor?.name ? ` · ${first.instructor.name}` : ""}</p>}
          </div>
          <div className="pu-in flex flex-col items-start gap-3 md:items-end">
            <span className="text-2xl font-semibold tabular-nums">{priceARS(first)}</span>
            <Link href={`/cursos/${first.slug}`} className={BTN.primary}>
              {isFree(first) ? "Inscribirme gratis" : "Inscribirme"}
            </Link>
          </div>
        </div>

        {/* Los siguientes, en filas. */}
        {next.length > 0 && (
          <ul className="mt-16">
            {next.map((c) => {
              const d = dayMonth(c);
              const si = sessionInfo(c);
              return (
                <li key={c.id} className="pu-row relative">
                  <Link href={`/cursos/${c.slug}`} className="group grid grid-cols-[4.5rem_minmax(0,1fr)_1.5rem] items-baseline gap-4 py-5 md:grid-cols-[6rem_5rem_minmax(0,1fr)_10rem_7rem_1.5rem] md:gap-6">
                    <span className="block overflow-hidden"><span className="pu-txt block font-display text-lg font-semibold tabular-nums">{d ? `${d.day} ${d.month}` : ""}</span></span>
                    <span className="hidden overflow-hidden md:block"><span className="pu-txt block font-mono text-sm font-semibold text-brand-400">{c.code}</span></span>
                    <span className="block overflow-hidden"><span className="pu-txt block text-[15px] leading-snug text-neutral-200 transition-colors duration-500 group-hover:text-neutral-0 md:text-base">{c.title}</span></span>
                    <span className="hidden overflow-hidden md:block"><span className="pu-txt block text-sm text-neutral-400">{si?.time}</span></span>
                    <span className="hidden overflow-hidden text-right md:block"><span className={`pu-txt block text-sm font-semibold ${isFree(c) ? "text-brand-400" : ""}`}>{priceARS(c)}</span></span>
                    <Arrow className="justify-self-end text-brand-400 opacity-0 transition-all duration-500 -translate-x-1 group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                  <span aria-hidden className="pu-rule absolute inset-x-0 bottom-0 h-px origin-left bg-neutral-0/15" />
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </section>
  );
}

// ── 4. Cómo enseñamos ────────────────────────────────────────────────────────

const TEACH = ["Disertantes con experiencia real", "Material descargable", "Certificado de participación"];

function Teach() {
  // Al llegar: el título sube, los puntos se dibujan y el video se abre como ventana.
  const ref = useMotion<HTMLElement>((root) => {
    const st = { trigger: root, start: "top 70%", once: true };
    gsap.from(root.querySelectorAll(".pt-title"), { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.1, scrollTrigger: st });
    gsap.from(root.querySelectorAll(".pt-in"), { y: 18, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.25, scrollTrigger: st });
    gsap.from(root.querySelectorAll(".pt-rule"), { scaleX: 0, duration: 1.3, ease: "expo.out", stagger: 0.1, delay: 0.3, scrollTrigger: st });
    gsap.from(root.querySelector(".pt-win"), { clipPath: "inset(18% 18% 18% 18%)", duration: 1.6, ease: "expo.inOut", delay: 0.2, scrollTrigger: st });
  });
  return (
    <section ref={ref} data-tone="light" className="bg-neutral-0 py-20 md:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-[2.5rem]">
              <span className="block overflow-hidden"><span className="pt-title block">Aprendé viendo,</span></span>
              <span className="block overflow-hidden"><span className="pt-title block">no solo leyendo</span></span>
            </h2>
            <p className="pt-in mt-5 max-w-md text-lg leading-relaxed text-ink-700">
              Clases prácticas dictadas por profesionales que trabajan en laboratorios bajo ISO/IEC 17025.
            </p>
            <ul className="mt-8">
              {TEACH.map((t) => (
                <li key={t} className="relative flex items-center gap-3 py-4 text-ink-900">
                  <span aria-hidden className="pt-in block h-[2px] w-5 bg-brand-500" />
                  <span className="pt-in">{t}</span>
                  <span aria-hidden className="pt-rule absolute inset-x-0 bottom-0 h-px origin-left bg-neutral-200" />
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-win [clip-path:inset(0)]">
            <VideoSlot poster="/assets/mockup/m6.jpg" label="Video de muestra · próximamente" />
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── 5. Cierre ────────────────────────────────────────────────────────────────

/** Cierre naranja; también lo usa /promociones. */
export function Closing() {
  const ref = useMotion<HTMLElement>((root) => {
    const st = { trigger: root, start: "top 80%", once: true };
    gsap.from(root.querySelectorAll(".pc-title"), { yPercent: 110, duration: 1.2, ease: "expo.out", scrollTrigger: st });
    gsap.from(root.querySelectorAll(".pc-in"), { y: 18, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.25, scrollTrigger: st });
  });
  return (
    <section ref={ref} data-tone="dark" className="bg-brand-500 py-16 text-neutral-0 md:py-20">
      <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <h2 className="overflow-hidden font-display text-3xl font-semibold tracking-tight md:text-[2.5rem]">
            <span className="pc-title block">¿Tenés preguntas?</span>
          </h2>
          <p className="pc-in mt-4 text-lg text-neutral-0/85">Escribinos y te ayudamos a elegir el curso para vos o para tu equipo.</p>
        </div>
        <div className="pc-in flex shrink-0 flex-col gap-3 sm:flex-row">
          <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className={BTN.onBrand}>
            Escribir por WhatsApp
          </a>
          <Link href="/contacto" className={BTN.ghostDark}>Contacto</Link>
        </div>
      </Container>
    </section>
  );
}

export function FormacionPortada({ courses }: { courses: Course[] }) {
  return (
    <>
      <Hero courses={courses} />
      <Paths courses={courses} />
      <Upcoming courses={courses} />
      <Teach />
      <Closing />
    </>
  );
}
