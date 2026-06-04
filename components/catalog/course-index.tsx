"use client";

import { useState } from "react";
import Link from "next/link";
import type { Course } from "@/types";
import { Reveal } from "@/components/anim/reveal";

function badgeLabel(b: string): string {
  if (b === "NUEVO") return "Nuevo";
  if (b === "PROXIMO") return "Próximo";
  return b;
}

/** Flecha que se desliza en hover. */
function Arrow() {
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
      className="shrink-0 -translate-x-1 text-brand-500 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100"
      aria-hidden="true"
    >
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

/** Fila editorial: código (naranja) + título, badge y flecha en hover. */
function CourseRow({ course }: { course: Course }) {
  return (
    <Link
      href={`/cursos/${course.slug}`}
      className="group relative flex items-center gap-4 border-b border-neutral-200 py-5 pl-0 pr-2 transition-[padding,background-color] duration-300 hover:bg-neutral-50 hover:pl-4 sm:gap-6"
    >
      {/* Acento izquierdo que crece en hover */}
      <span
        className="absolute left-0 top-1/2 h-0 w-px -translate-y-1/2 bg-brand-500 transition-all duration-300 group-hover:h-8"
        aria-hidden
      />
      <span className="w-12 shrink-0 font-mono text-sm font-semibold tabular-nums text-brand-600 sm:w-16">
        {course.code}
      </span>
      <span className="min-w-0 flex-1 text-[15px] leading-snug text-ink-700 transition-colors duration-300 group-hover:text-ink-900 sm:text-base">
        {course.title}
      </span>
      {course.badge && (
        <span className="hidden shrink-0 border border-brand-500/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-600 sm:inline-block">
          {badgeLabel(course.badge)}
        </span>
      )}
      <Arrow />
    </Link>
  );
}

/** Categoría colapsable (acordeón) para los cursos asincrónicos. */
function CategoryGroup({
  name,
  courses,
  defaultOpen,
}: {
  name: string;
  courses: Course[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-ink-900/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-4 py-6 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="h-px w-8 bg-brand-500 transition-all duration-300 group-hover:w-12" aria-hidden />
          <span className="font-display text-lg font-semibold tracking-tight text-ink-900 transition-colors group-hover:text-brand-600 sm:text-xl">
            {name}
          </span>
          <span className="text-xs font-medium tabular-nums text-neutral-400">
            {courses.length}
          </span>
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-ink-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expand sin medir altura: grid 0fr → 1fr */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pb-2">
            {courses.map((c) => (
              <CourseRow key={c.id} course={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface CourseIndexProps {
  courses: Course[];
  /** Si true, agrupa por categoría en acordeones (cursos asincrónicos). */
  grouped?: boolean;
}

export function CourseIndex({ courses, grouped = false }: CourseIndexProps) {
  if (!courses.length) {
    return (
      <p className="border-t border-ink-900/10 py-12 text-center text-neutral-500">
        Próximamente nuevos cursos en esta modalidad.
      </p>
    );
  }

  if (!grouped) {
    return (
      <Reveal as="div" className="border-t border-ink-900/10" stagger={0.05}>
        {courses.map((c) => (
          <CourseRow key={c.id} course={c} />
        ))}
      </Reveal>
    );
  }

  // Agrupar por categoría preservando el orden de aparición.
  const order: string[] = [];
  const byCat = new Map<string, { name: string; items: Course[] }>();
  for (const c of courses) {
    const key = c.category?.slug ?? "otros";
    if (!byCat.has(key)) {
      byCat.set(key, { name: c.category?.name ?? "Otros cursos", items: [] });
      order.push(key);
    }
    byCat.get(key)!.items.push(c);
  }

  return (
    <Reveal as="div" stagger={0.08}>
      {order.map((key, i) => {
        const g = byCat.get(key)!;
        return (
          <CategoryGroup
            key={key}
            name={g.name}
            courses={g.items}
            defaultOpen={i === 0}
          />
        );
      })}
    </Reveal>
  );
}
