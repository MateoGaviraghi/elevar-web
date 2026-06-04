"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CartItem, Course, CourseSession } from "@/types";
import { addItem } from "@/lib/cart";
import { buttonClasses } from "@/components/ui/button";
import { formatARS, formatDate } from "@/lib/formatters";

function seatsLabel(s: CourseSession): { text: string; soldOut: boolean; low: boolean } {
  if (s.seats_available == null) return { text: "Inscripción abierta", soldOut: false, low: false };
  if (s.seats_available <= 0) return { text: "Agotado", soldOut: true, low: false };
  if (s.seats_available <= 5)
    return { text: `Últimos ${s.seats_available} cupos`, soldOut: false, low: true };
  return { text: `${s.seats_available} cupos disponibles`, soldOut: false, low: false };
}

export function AddToCartPanel({ course }: { course: Course }) {
  const isFree = parseFloat(course.price) === 0;
  const isLive = course.modality === "LIVE";
  const isWebinar = course.modality === "WEBINAR";
  // Tanto LIVE como WEBINAR se reservan contra una sesión/fecha (el backend la exige).
  const sessionBased = isLive || isWebinar;

  const sessions = useMemo(
    () => (course.sessions ?? []).filter((s) => s.status === "SCHEDULED"),
    [course.sessions]
  );
  const firstSelectable = sessions.find((s) => s.seats_available == null || s.seats_available > 0);
  const [sessionId, setSessionId] = useState<number | null>(firstSelectable?.id ?? null);
  const [added, setAdded] = useState(false);

  const noSessions = sessionBased && sessions.length === 0;
  const needsSession = sessionBased && sessions.length > 0;
  const canAdd = !noSessions && (!needsSession || sessionId != null);

  const ctaLabel = isFree ? "Inscribirme gratis" : "Agregar al carrito";
  const sessionHeading = isWebinar ? "Próximo encuentro" : "Próximas fechas";

  function handleAdd() {
    if (!canAdd) return;
    const chosen = needsSession ? sessions.find((s) => s.id === sessionId) : undefined;
    const item: CartItem = {
      courseId: course.id,
      sessionId: needsSession ? sessionId : null,
      titleSnapshot: course.title,
      unitPrice: course.price,
      currency: course.currency,
      modality: course.modality,
      coverImage: course.cover_image,
      code: course.code,
      sessionLabel: chosen ? formatDate(chosen.starts_at) : undefined,
    };
    addItem(item);
    setAdded(true);
  }

  return (
    <div className="border border-neutral-200 bg-neutral-0">
      {/* Precio */}
      <div className="border-b border-neutral-200 p-6">
        {isFree ? (
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold text-brand-600">Gratis</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold text-ink-900">
              {formatARS(course.price)}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              {course.currency} · pago único
            </span>
          </div>
        )}
      </div>

      {/* Selección de fecha (LIVE / WEBINAR) */}
      {sessionBased && (
        <div className="border-b border-neutral-200 p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            {sessionHeading}
          </p>
          {noSessions ? (
            <p className="text-sm text-neutral-500">
              Sin fechas programadas por el momento. Escribinos para conocer el próximo dictado.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sessions.map((s) => {
                const { text, soldOut, low } = seatsLabel(s);
                const selected = sessionId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() => setSessionId(s.id)}
                    className={`flex items-center justify-between gap-3 border px-4 py-3 text-left transition-colors ${
                      soldOut
                        ? "cursor-not-allowed border-neutral-200 opacity-50"
                        : selected
                        ? "border-ink-900 bg-ink-900/[0.03]"
                        : "border-neutral-200 hover:border-ink-400"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink-900">
                        {formatDate(s.starts_at)}
                      </span>
                      <span
                        className={`text-xs ${
                          low ? "text-brand-600" : soldOut ? "text-neutral-400" : "text-neutral-500"
                        }`}
                      >
                        {text}
                      </span>
                    </span>
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                        selected ? "border-ink-900" : "border-neutral-300"
                      }`}
                      aria-hidden
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-ink-900" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="p-6">
        {added ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Agregado al carrito
            </div>
            <Link href="/carrito" className={buttonClasses({ variant: "primary", size: "md", className: "w-full" })}>
              Ir al carrito
            </Link>
            <Link href="/formacion" className={buttonClasses({ variant: "link", className: "justify-center" })}>
              Seguir viendo cursos
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className={buttonClasses({ variant: "primary", size: "lg", className: "w-full" })}
          >
            {noSessions ? "Sin fechas disponibles" : ctaLabel}
          </button>
        )}

        <ul className="mt-5 flex flex-col gap-2 text-xs text-neutral-500">
          {!isFree && (
            <li className="flex items-center gap-2">
              <Dot /> Pago seguro con Mercado Pago
            </li>
          )}
          <li className="flex items-center gap-2">
            <Dot /> {isLive ? "Clases en vivo con el disertante" : isFree ? "Acceso al encuentro online" : "Acceso al material del curso"}
          </li>
          <li className="flex items-center gap-2">
            <Dot /> Certificado de participación
          </li>
        </ul>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="h-1 w-1 shrink-0 rounded-full bg-brand-500" aria-hidden />;
}
