import type { Course, CourseSession } from "@/types";
import { addItem } from "@/lib/cart";
import { flyToCart } from "@/components/cart/fly-to-cart";
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

/**
 * Agrega el curso volando desde `from` (la tapa de la tarjeta o el botón) hasta
 * la bolsa del header; se suma al carrito al llegar y el carrito queda cerrado.
 * `card` es la tarjeta entera: sus hermanas se apagan mientras vuela.
 */
export function quickAddCourse(course: Course, from: HTMLElement | null = null, card: HTMLElement | null = null): void {
  if (!canQuickAdd(course)) return;
  const session = sessionBased(course) ? nextSession(course) : undefined;
  const add = () => addItem({
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
  flyToCart({ from, code: course.code, modality: course.modality, card, onLand: add });
}
