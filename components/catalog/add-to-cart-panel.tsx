"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { CartItem, Course, CourseSession, Promo } from "@/types";
import { addItem, openCartDrawer } from "@/lib/cart";
import { getPromos } from "@/lib/api";
import { promoBadge } from "@/lib/promos";
import { buttonClasses } from "@/components/ui/button";
import { formatARS, formatDate } from "@/lib/formatters";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { WebinarSignupModal } from "@/components/formacion/webinar-signup";

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
  // Tanto LIVE como WEBINAR se reservan contra una sesión/fecha.
  const sessionBased = isLive || isWebinar;

  const sessions = useMemo(
    () => (course.sessions ?? []).filter((s) => s.status === "SCHEDULED"),
    [course.sessions]
  );
  const firstSelectable = sessions.find((s) => s.seats_available == null || s.seats_available > 0);
  const [sessionId, setSessionId] = useState<number | null>(firstSelectable?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  // idle → "Agregando…" → "Agregado ✓" (y se abre el panel del carrito) → idle.
  const [status, setStatus] = useState<"idle" | "adding" | "added">("idle");
  const check = useRef<SVGPolylineElement>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const [webinarOpen, setWebinarOpen] = useState(false);
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    getPromos({ featured: true })
      .then(setPromos)
      .catch(() => setPromos([]));
  }, []);

  const noSessions = sessionBased && sessions.length === 0;
  const needsSession = sessionBased && sessions.length > 0;
  const canAdd = !noSessions && (!needsSession || sessionId != null);

  const chosenSession = needsSession ? sessions.find((s) => s.id === sessionId) : undefined;
  const maxQty = chosenSession?.seats_available ?? 20;

  // Promos que aplican a este curso, para anticipar el beneficio en la ficha.
  const relatedPromos = promos.filter(
    (p) =>
      p.scope === "ALL" ||
      (p.scope === "MODALITY" && p.modality === course.modality) ||
      (p.scope === "CATEGORY" && p.categorySlug === course.category?.slug) ||
      (p.scope === "COURSE" && (p.courseIds ?? []).includes(course.id))
  );

  const lineTotal = parseFloat(course.price) * quantity;

  function handleAdd() {
    if (!canAdd || status !== "idle") return;
    const item: CartItem = {
      courseId: course.id,
      sessionId: needsSession ? sessionId : null,
      titleSnapshot: course.title,
      unitPrice: course.price,
      currency: course.currency,
      modality: course.modality,
      coverImage: course.cover_image,
      code: course.code,
      sessionLabel: chosenSession ? formatDate(chosenSession.starts_at) : undefined,
      quantity,
      attendees:
        quantity > 1
          ? Array.from({ length: quantity }, () => ({ name: "", email: "" }))
          : undefined,
    };
    const reduce = prefersReducedMotion();
    setStatus("adding");
    timers.current.push(
      window.setTimeout(() => {
        addItem(item);
        setStatus("added");
        openCartDrawer();
      }, reduce ? 0 : 450),
      window.setTimeout(() => setStatus("idle"), reduce ? 2000 : 2800)
    );
  }

  // El tilde se dibuja al confirmar.
  useEffect(() => {
    if (status !== "added" || !check.current || prefersReducedMotion()) return;
    gsap.fromTo(
      check.current,
      { strokeDashoffset: 24 },
      { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" }
    );
  }, [status]);

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
              {course.currency} · por participante
            </span>
          </div>
        )}
      </div>

      {/* Selección de fecha (LIVE / WEBINAR) */}
      {sessionBased && (
        <div className="border-b border-neutral-200 p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            {isWebinar ? "Próximo encuentro" : "Próximas fechas"}
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
                    onClick={() => {
                      setSessionId(s.id);
                      setQuantity(1);
                    }}
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

      {/* Cantidad de inscripciones (no aplica a webinars gratuitos) */}
      {!isWebinar && !noSessions && (
        <div className="border-b border-neutral-200 p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Inscripciones
          </p>
          <div className="flex items-center justify-between gap-4">
            <QuantityStepper
              value={quantity}
              min={1}
              max={maxQty}
              onChange={(q) => {
                setQuantity(q);
              }}
            />
            {quantity > 1 && !isFree && (
              <span className="text-right text-sm text-neutral-500">
                Total{" "}
                <span className="font-display text-base font-semibold text-ink-900">
                  {formatARS(lineTotal)}
                </span>
              </span>
            )}
          </div>
          {quantity > 1 && (
            <p className="mt-3 text-xs leading-relaxed text-neutral-500">
              Vas a poder cargar el nombre y correo de cada participante en el carrito.
            </p>
          )}
        </div>
      )}

      {/* Promos aplicables */}
      {relatedPromos.length > 0 && !isFree && (
        <div className="border-b border-neutral-200 bg-brand-50/60 p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-700">
            Promociones vigentes
          </p>
          <ul className="space-y-2.5">
            {relatedPromos.slice(0, 2).map((p) => (
              <li key={p.id} className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-700">
                <span className="mt-px shrink-0 bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-neutral-0">
                  {promoBadge(p)}
                </span>
                <span>
                  {p.title}
                  {p.trigger === "COUPON" && (
                    <span className="ml-1 font-mono font-semibold text-ink-900">({p.code})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/promociones"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            Ver todas las promociones →
          </Link>
        </div>
      )}

      {/* CTA */}
      <div className="p-6">
        {isWebinar ? (
          <>
            <button
              type="button"
              onClick={() => setWebinarOpen(true)}
              disabled={noSessions}
              className={buttonClasses({ variant: "primary", size: "lg", className: "w-full" })}
            >
              {noSessions ? "Sin fechas disponibles" : "Inscribirme gratis"}
            </button>
            <WebinarSignupModal
              course={course}
              open={webinarOpen}
              onClose={() => setWebinarOpen(false)}
              sessionId={sessionId}
            />
          </>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            aria-live="polite"
            className={buttonClasses({
              variant: "primary",
              size: "lg",
              className: `w-full ${status === "added" ? "!bg-ink-900" : ""} ${status === "adding" ? "cursor-progress" : ""}`,
            })}
          >
            {noSessions ? (
              "Sin fechas disponibles"
            ) : status === "adding" ? (
              "Agregando…"
            ) : status === "added" ? (
              <span className="inline-flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline ref={check} points="20 6 9 17 4 12" strokeDasharray="24" />
                </svg>
                Agregado
              </span>
            ) : isFree ? (
              "Inscribirme gratis"
            ) : (
              "Agregar al carrito"
            )}
          </button>
        )}

        <ul className="mt-5 flex flex-col gap-2 text-xs text-neutral-500">
          {!isFree && (
            <li className="flex items-center gap-2">
              <Dot /> Pago con Mercado Pago (ARS) o PayPal (USD)
            </li>
          )}
          <li className="flex items-center gap-2">
            <Dot />{" "}
            {isLive
              ? "Clases en vivo con el disertante"
              : isFree
              ? "Acceso al encuentro online"
              : "Acceso al material del curso"}
          </li>
          <li className="flex items-center gap-2">
            <Dot /> Certificado de participación
          </li>
        </ul>
      </div>

    </div>
  );
}

export function QuantityStepper({
  value,
  min = 1,
  max = 50,
  onChange,
  size = "md",
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
}) {
  const btn =
    size === "sm"
      ? "h-9 w-9 text-base"
      : "h-11 w-11 text-lg";
  return (
    <div className="inline-flex items-center border border-neutral-300">
      <button
        type="button"
        aria-label="Quitar una inscripción"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${btn} grid place-items-center text-ink-900 transition-colors hover:bg-neutral-50 disabled:opacity-30`}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Cantidad de inscripciones"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className={`${size === "sm" ? "h-9 w-10" : "h-11 w-12"} border-x border-neutral-300 bg-neutral-0 text-center text-sm font-semibold text-ink-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
      />
      <button
        type="button"
        aria-label="Agregar una inscripción"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`${btn} grid place-items-center text-ink-900 transition-colors hover:bg-neutral-50 disabled:opacity-30`}
      >
        +
      </button>
    </div>
  );
}

function Dot() {
  return <span className="h-1 w-1 shrink-0 rounded-full bg-brand-500" aria-hidden />;
}
