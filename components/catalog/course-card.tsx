import Link from "next/link";
import type { Course, Modality } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ModalityChip } from "@/components/ui/modality-chip";
import { formatARS } from "@/lib/formatters";

interface CourseCardProps {
  course: Course;
}

const GRADIENTS: Record<Modality, string> = {
  ASYNC: "from-ink-600 to-ink-900",
  LIVE: "from-emerald-600 to-emerald-800",
  WEBINAR: "from-brand-500 to-brand-700",
  WORKSHOP: "from-amber-500 to-amber-700",
};

function badgeLabel(badge: string): string {
  if (badge === "NUEVO") return "Nuevo";
  if (badge === "PROXIMO") return "Próximo";
  return badge;
}

export function CourseCard({ course }: CourseCardProps) {
  const isFree = parseFloat(course.price) === 0;

  return (
    <Link
      href={`/cursos/${course.slug}`}
      className="group flex flex-col overflow-hidden border border-neutral-200 bg-neutral-0 transition-all duration-300 hover:-translate-y-1 hover:border-ink-900 hover:shadow-[0_14px_44px_-16px_rgba(15,23,42,0.22)]"
    >
      {/* Banner branded por modalidad */}
      <div
        className={`relative aspect-[16/9] overflow-hidden bg-gradient-to-br ${GRADIENTS[course.modality]}`}
      >
        <svg
          className="absolute -right-6 -top-8 h-40 w-40 text-neutral-0/12 transition-transform duration-500 ease-out group-hover:scale-110"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden
        >
          <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="64" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="36" stroke="currentColor" strokeWidth="2" />
        </svg>

        {course.badge && (
          <div className="absolute left-4 top-4">
            <Badge tone="brand">{badgeLabel(course.badge)}</Badge>
          </div>
        )}

        <span className="absolute bottom-4 left-4 font-display text-2xl font-bold tracking-tight text-neutral-0/90">
          {course.code}
        </span>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col p-5">
        <ModalityChip modality={course.modality} className="self-start" />

        <h3 className="mt-3 font-display text-base font-semibold leading-snug text-ink-900 line-clamp-2 transition-colors group-hover:text-brand-600">
          {course.title}
        </h3>

        <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
          {isFree ? (
            <span className="font-semibold text-brand-600">Gratis</span>
          ) : (
            <span className="font-display text-lg font-semibold text-ink-800">
              {formatARS(course.price)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 transition-colors group-hover:text-brand-600">
            Ver curso
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 ease-out group-hover:translate-x-1"
              aria-hidden="true"
            >
              <line x1="4" y1="12" x2="19" y2="12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
