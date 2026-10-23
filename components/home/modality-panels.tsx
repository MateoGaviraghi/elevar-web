"use client";

/* Paneles de color de "Cinco formas de capacitarte" (inicio).
 * Referencia CodeFronts · Color Block ("tu elección", Mateo 2026-10-23, plan con
 * "GO-AHEAD"): una modalidad abierta a la vez, con el color de sus tapas de curso.
 * Escritorio: 5 paneles en fila; el abierto se ensancha (0,9 s) y su contenido sube
 * después (0,6 s, 0,06 s entre líneas); los cerrados quedan en 5 rem con el nombre en
 * vertical. Celular: acordeón, el abierto baja en 0,8 s. Se abre al tocar; el último
 * toque gana. Entrada con el scroll: los paneles suben de a uno.
 * Sin pictogramas (Mateo: "sacame esos logos de ahí, no quedan bien con los colores").
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Modality } from "@/types";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { RAIL_GRADIENTS } from "@/components/catalog/course-rail-card";
import { useMotion } from "@/components/curso/ficha-parts";

export interface PanelCourse {
  code: string;
  title: string;
  slug: string;
  /** "23 OCT" en las modalidades con fecha; si no, el precio ("$ 50.000" / "Gratis"). */
  meta: string;
}

export interface PanelItem {
  slug: string;
  modality: Modality;
  title: string;
  short: string;
  desc: string;
  img: string;
  count: number;
  picks: PanelCourse[];
  /** Texto cuando la modalidad todavía no tiene cursos para mostrar. */
  note: string | null;
}

const EASE = "cubic-bezier(0.19,1,0.22,1)";

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`h-4 w-4 ${className}`}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

/** Lo que muestra el panel abierto (igual en escritorio y celular). */
/** Lo que muestra el panel abierto. En el celular (`compact`) el nombre ya está en la fila.
 * Las clases `[@media(max-height:800px)]` achican aire en pantallas bajas (1366 × 650); van
 * escritas enteras, sin armar con variables, para que Tailwind las encuentre. */
function PanelBody({ item, compact = false }: { item: PanelItem; compact?: boolean }) {
  const label = item.count === 1 ? "curso" : "cursos";
  return (
    <div className="flex h-full flex-col">
      {!compact && (
        <>
          <h3 className={`mp-in font-display text-[2.5rem] font-semibold leading-tight tracking-tight [@media(max-height:800px)]:text-3xl`}>{item.title}</h3>
        </>
      )}
      <p className={`mp-in max-w-xl text-base leading-relaxed text-neutral-0/85 [@media(max-height:800px)]:text-sm ${compact ? "" : "mt-3"}`}>{item.desc}</p>
      <div className={compact ? "pt-5" : `mt-auto pt-8 [@media(max-height:800px)]:pt-4`}>
        {item.picks.length > 0 ? (
          <ul className="border-t border-neutral-0/30">
            {item.picks.map((c) => (
              <li key={c.slug} className="mp-in border-b border-neutral-0/30">
                <Link
                  href={`/cursos/${c.slug}`}
                  className={`grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-baseline gap-4 py-3 text-sm [@media(max-height:800px)]:py-2 transition-opacity duration-500 hover:opacity-75`}
                >
                  <span className="font-semibold">{c.code}</span>
                  <span className="truncate">{c.title}</span>
                  <span className="whitespace-nowrap text-neutral-0/80">{c.meta}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          item.note && <p className="mp-in border-t border-neutral-0/30 pt-4 text-sm text-neutral-0/85">{item.note}</p>
        )}
        <Link
          href={`/formacion/${item.slug}`}
          className="mp-in group mt-5 inline-flex items-center gap-2 text-sm font-semibold"
        >
          {item.count > 0 ? `Ver los ${item.count} ${label}` : `Ver ${item.short}`}
          <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

export function ModalityPanels({ items }: { items: PanelItem[] }) {
  const [open, setOpen] = useState(0);
  const desk = useRef<HTMLDivElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const prev = useRef(open);

  // El contenido del abierto sube después de que el panel empezó a abrirse; el último toque gana.
  useEffect(() => {
    if (prev.current === open) return;
    prev.current = open;
    if (prefersReducedMotion()) return;
    for (const root of [desk.current, phone.current]) {
      const lines = root?.querySelectorAll(`[data-panel="${open}"] .mp-in`);
      if (!lines?.length) continue;
      gsap.fromTo(
        lines,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "expo.out", stagger: 0.06, delay: 0.35, overwrite: true }
      );
    }
  }, [open]);

  // Entrada con el scroll: los paneles suben de a uno.
  const motion = useMotion<HTMLDivElement>((root) => {
    gsap.from(root.querySelectorAll(".mp-panel"), {
      y: 48,
      opacity: 0,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: root, start: "top 75%", once: true },
    });
  });

  return (
    <div ref={motion}>
      {/* Escritorio: paneles en fila. */}
      <div ref={desk} className="hidden h-[clamp(24rem,calc(100svh-15.75rem),34rem)] lg:flex">
        {items.map((item, i) => {
          const isOpen = i === open;
          return (
            <div
              key={item.slug}
              data-panel={i}
              className={`mp-panel relative overflow-hidden bg-gradient-to-br text-neutral-0 ${RAIL_GRADIENTS[item.modality]}`}
              style={{ flex: isOpen ? "1 1 0%" : "0 0 5rem", transition: `flex 900ms ${EASE}` }}
            >
              {/* Cerrado: toda la columna es el botón, con el nombre en vertical. */}
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={`${item.title}: ${item.count} ${item.count === 1 ? "curso" : "cursos"}`}
                onClick={() => setOpen(i)}
                className={`absolute inset-0 z-10 flex flex-col items-center justify-between py-6 transition-opacity duration-500 ${isOpen ? "pointer-events-none opacity-0" : "opacity-100 hover:bg-neutral-0/10"}`}
              >
                <span className="text-sm font-semibold tabular-nums text-neutral-0/80">{item.count}</span>
                <span className="font-display text-lg font-semibold uppercase tracking-wide [writing-mode:vertical-rl] rotate-180">
                  {item.short}
                </span>
              </button>
              {/* Abierto: ancho fijo, así el texto no se reacomoda mientras el panel se abre. */}
              <div
                aria-hidden={!isOpen}
                className={`absolute inset-y-0 left-0 w-[min(46rem,calc(100vw-30rem))] p-10 [@media(max-height:800px)]:p-6 transition-opacity duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
              >
                <PanelBody item={item} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Celular y tablet: acordeón. */}
      <div ref={phone} className="lg:hidden">
        {items.map((item, i) => {
          const isOpen = i === open;
          return (
            <div key={item.slug} data-panel={i} className={`mp-panel bg-gradient-to-br text-neutral-0 ${RAIL_GRADIENTS[item.modality]}`}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
              >
                <span className="font-display text-xl font-semibold">{item.title}</span>
                <span className="flex items-center gap-3 text-sm text-neutral-0/80">
                  {item.count}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className={`h-4 w-4 transition-transform duration-700 ${isOpen ? "rotate-180" : ""}`}>
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              <div
                className="grid"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", transition: `grid-template-rows 800ms ${EASE}` }}
              >
                <div className="min-h-0 overflow-hidden" aria-hidden={!isOpen}>
                  <div className="px-5 pb-6 pt-0">
                    <PanelBody item={item} compact />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
