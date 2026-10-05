import type { Course, CourseSession } from "@/types";
import { addItem, openCartDrawer } from "@/lib/cart";
import { formatDate } from "@/lib/formatters";

// Agregar un curso desde una tarjeta (carrusel, detalle rápido) sin pasar por la ficha.

const sessionBased = (c: Course) => c.modality === "LIVE" || c.modality === "WEBINAR";

/** Próxima fecha con cupo, para cursos en vivo y webinars. */
export function nextSession(course: Course): CourseSession | undefined {
  const now = Date.now();
  return (course.sessions ?? [])
    .filter((s) => s.status === "SCHEDULED" && new Date(s.starts_at).getTime() > now)
    .filter((s) => s.seats_available == null || s.seats_available > 0)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
}

/**
 * Se puede agregar directo si no hace falta elegir nada: asincrónicos y talleres,
 * o cursos en vivo con una fecha disponible. Los webinars gratuitos se inscriben
 * desde su ficha (formulario propio).
 */
export function canQuickAdd(course: Course): boolean {
  if (course.modality === "WEBINAR") return false;
  if (sessionBased(course)) return nextSession(course) != null;
  return true;
}

export function quickAddCourse(course: Course): void {
  if (!canQuickAdd(course)) return;
  const session = sessionBased(course) ? nextSession(course) : undefined;
  addItem({
    courseId: course.id,
    sessionId: session?.id ?? null,
    titleSnapshot: course.title,
    unitPrice: course.price,
    currency: course.currency,
    modality: course.modality,
    coverImage: course.cover_image,
    code: course.code,
    sessionLabel: session ? formatDate(session.starts_at) : undefined,
    quantity: 1,
  });
  openCartDrawer();
}
