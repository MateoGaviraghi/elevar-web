"use client";

import { forwardRef } from "react";
import type { Course, Modality } from "@/types";
import { ModalityChip } from "@/components/ui/modality-chip";
import { formatARS, formatDateShort } from "@/lib/formatters";
import { canQuickAdd, nextSession, quickAddCourse } from "@/lib/quick-add";

// Tarjeta alta del carrusel de cursos (referencia: Apple · Get to know iPhone).
// Sin foto: el código del curso hace de imagen sobre el color de la modalidad.

export const RAIL_GRADIENTS: Record<Modality, string> = {
  ASYNC: "from-ink-600 to-ink-900",
  LIVE: "from-emerald-600 to-emerald-800",
  WEBINAR: "from-brand-500 to-brand-700",
  WORKSHOP: "from-amber-500 to-amber-700",
  EBOOK: "from-sky-600 to-ink-800",
};

export function courseWhen(course: Course): string {
  if (course.modality === "ASYNC") return "Acceso inmediato";
  const s = nextSession(course);
  return s ? `Próxima fecha: ${formatDateShort(s.starts_at)}` : "Próximamente";
}

export const CourseRailCard = forwardRef<
  HTMLElement,
  { course: Course; onOpen: (course: Course, el: HTMLElement) => void; className?: string }
>(function CourseRailCard({ course, onOpen, className = "" }, ref) {
  const free = parseFloat(course.price) === 0;
  const addable = canQuickAdd(course);

  return (
    <article
      ref={ref}
      data-course-id={course.id}
      className={`rail-card group relative flex h-[min(440px,max(300px,52svh))] w-[78vw] max-w-[320px] shrink-0 snap-start flex-col overflow-hidden border border-neutral-200 bg-neutral-0 transition-[border-color,box-shadow] duration-300 hover:border-ink-900 hover:shadow-[0_18px_50px_-24px_rgba(15,23,42,0.35)] sm:w-[300px] ${className}`}
    >
      <button
        type="button"
        onClick={(e) => onOpen(course, e.currentTarget.closest("article") as HTMLElement)}
        className="flex flex-1 flex-col text-left focus-visible:outline-none"
        aria-label={`Ver detalle: ${course.title}`}
      >
        <div className={`rail-cover relative basis-1/2 shrink-0 overflow-hidden bg-gradient-to-br ${RAIL_GRADIENTS[course.modality]}`}>
          <svg
            className="absolute -right-10 -top-10 h-56 w-56 text-neutral-0/12 transition-transform duration-700 ease-out group-hover:scale-110"
            viewBox="0 0 200 200"
            fill="none"
            aria-hidden
          >
            <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="2" />
            <circle cx="100" cy="100" r="64" stroke="currentColor" strokeWidth="2" />
            <circle cx="100" cy="100" r="36" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="absolute bottom-5 left-6 font-display text-6xl font-bold tracking-tight text-neutral-0/90">
            {course.code}
          </span>
        </div>
        <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
          <ModalityChip modality={course.modality} className="self-start" />
          <h3 className="mt-3 line-clamp-3 font-display text-base font-semibold leading-snug text-ink-900 transition-colors group-hover:text-brand-600">
            {course.title}
          </h3>
          <p className="mt-auto pt-3 text-xs text-neutral-500">{courseWhen(course)}</p>
          <p className="mt-1 font-display text-lg font-semibold text-ink-900">
            {free ? <span className="text-brand-600">Gratis</span> : formatARS(course.price)}
          </p>
        </div>
      </button>

      {addable && (
        <button
          type="button"
          onClick={(e) => {
            const card = e.currentTarget.closest("article");
            quickAddCourse(course, card?.querySelector<HTMLElement>(".rail-cover") ?? null, card);
          }}
          aria-label={`Agregar al carrito: ${course.title}`}
          className="absolute bottom-6 right-6 grid h-10 w-10 place-items-center border border-ink-900 bg-neutral-0 text-ink-900 transition-colors duration-300 hover:bg-ink-900 hover:text-neutral-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </article>
  );
});
