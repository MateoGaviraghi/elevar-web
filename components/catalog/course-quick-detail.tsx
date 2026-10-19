"use client";

import Link from "next/link";
import type { Course, Promo } from "@/types";
import { promoBadge } from "@/lib/promos";
import { formatARS } from "@/lib/formatters";
import { canQuickAdd, quickAddCourse } from "@/lib/quick-add";
import { buttonClasses } from "@/components/ui/button";
import { ModalityChip } from "@/components/ui/modality-chip";
import { courseWhen } from "@/components/catalog/course-rail-card";

// Contenido del detalle rápido de un curso (dentro de la ventana del carrusel).
// Cada bloque lleva .qd-item para entrar en secuencia.

export function CourseQuickDetail({ course, promos, onClose }: { course: Course; promos: Promo[]; onClose: () => void }) {
  const related = promos.filter(
    (p) =>
      p.scope === "ALL" ||
      (p.scope === "MODALITY" && p.modality === course.modality) ||
      (p.scope === "CATEGORY" && p.categorySlug === course.category?.slug) ||
      (p.scope === "COURSE" && (p.courseIds ?? []).includes(course.id))
  );
  const free = parseFloat(course.price) === 0;
  const meta: [string, string][] = [
    ["Modalidad", { ASYNC: "Asincrónico", LIVE: "En vivo", WEBINAR: "Webinar", WORKSHOP: "Taller" }[course.modality]],
    ["Fecha", courseWhen(course).replace("Próxima fecha: ", "")],
    ...(course.duration_hours ? ([["Duración", `${course.duration_hours} h`]] as [string, string][]) : []),
    ...(course.instructor_names ? ([["Disertante", course.instructor_names]] as [string, string][]) : []),
  ];

  return (
    <div className="flex flex-col">
      <div className="qd-item flex items-center gap-3">
        <ModalityChip modality={course.modality} />
        <span className="font-mono text-xs text-neutral-500">{course.code}</span>
      </div>
      <h3 className="qd-item mt-3 font-display text-2xl font-semibold leading-tight tracking-tight text-ink-900">
        {course.title}
      </h3>
      <p className="qd-item mt-3 line-clamp-4 text-sm leading-relaxed text-neutral-700">{course.summary}</p>

      <dl className="qd-item mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
        {meta.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{k}</dt>
            <dd className="text-right text-ink-900">{v}</dd>
          </div>
        ))}
      </dl>

      {related.length > 0 && !free && (
        <ul className="qd-item mt-5 flex flex-col gap-2">
          {related.map((p) => (
            <li key={p.id} className="flex items-center gap-3 text-xs text-ink-700">
              <span className="bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-0">{promoBadge(p)}</span>
              {p.title}
            </li>
          ))}
        </ul>
      )}

      {/* En el teléfono, precio y compra quedan fijos abajo mientras se lee. */}
      <div className="qd-item sticky bottom-0 -mx-6 mt-6 border-t border-neutral-200 bg-neutral-0 px-6 pb-4 pt-4 sm:static sm:mx-0 sm:border-0 sm:p-0">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold text-ink-900">
          {free ? <span className="text-brand-600">Gratis</span> : formatARS(course.price)}
        </span>
        {!free && <span className="text-xs uppercase tracking-wider text-neutral-400">{course.currency} · por participante</span>}
      </div>

      <div className="mt-4 flex gap-3 sm:mt-6">
        {canQuickAdd(course) ? (
          <button
            type="button"
            onClick={(e) => {
              const from = e.currentTarget;
              quickAddCourse(course, from);
              onClose();
            }}
            className={buttonClasses({ variant: "primary", size: "md", className: "flex-1 whitespace-nowrap !px-4" })}
          >
            <span className="sm:hidden">Agregar</span>
            <span className="hidden sm:inline">Agregar al carrito</span>
          </button>
        ) : (
          <Link href={`/cursos/${course.slug}`} className={buttonClasses({ variant: "primary", size: "md", className: "flex-1 whitespace-nowrap !px-4" })}>
            {course.modality === "WEBINAR" ? "Inscribirme gratis" : "Elegir fecha"}
          </Link>
        )}
        <Link href={`/cursos/${course.slug}`} className={buttonClasses({ variant: "outline", size: "md", className: "flex-1 whitespace-nowrap !px-4" })}>
          <span className="sm:hidden">Ver curso</span>
          <span className="hidden sm:inline">Ver curso completo</span>
        </Link>
      </div>
      </div>
    </div>
  );
}
