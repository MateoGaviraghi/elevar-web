"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Attendee, CartItem, CartValidateResult } from "@/types";
import {
  getCart,
  removeItem,
  setAttendees,
  setCoupon,
  setQuantity,
} from "@/lib/cart";
import { validateCart } from "@/lib/api";
import { Container } from "@/components/ui/container";
import { ModalityChip } from "@/components/ui/modality-chip";
import { ModalityThumb } from "@/components/catalog/modality-thumb";
import { QuantityStepper } from "@/components/catalog/add-to-cart-panel";
import { buttonClasses } from "@/components/ui/button";
import { formatARS } from "@/lib/formatters";

function lineKey(courseId: number, sessionId: number | null): string {
  return `${courseId}:${sessionId ?? "x"}`;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCouponState] = useState<string | null>(null);
  const [couponDraft, setCouponDraft] = useState("");
  const [validation, setValidation] = useState<CartValidateResult | null>(null);
  const [validating, setValidating] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const sync = useCallback(() => {
    const cart = getCart();
    setItems(cart.items);
    setCouponState(cart.coupon);
  }, []);

  useEffect(() => {
    sync();
    setHydrated(true);
  }, [sync]);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) {
      setValidation(null);
      setValidating(false);
      return;
    }
    let cancelled = false;
    setValidating(true);
    validateCart(items, coupon)
      .then((res) => !cancelled && setValidation(res))
      .catch(() => !cancelled && setValidation(null))
      .finally(() => !cancelled && setValidating(false));
    return () => {
      cancelled = true;
    };
  }, [items, coupon, hydrated]);

  const validByKey = useMemo(() => {
    const map = new Map<string, CartValidateResult["items"][number]>();
    validation?.items.forEach((it) => map.set(lineKey(it.course_id, it.session_id), it));
    return map;
  }, [validation]);

  const allAvailable = validation ? validation.valid : true;
  const subtotal = validation?.subtotal ?? "0";
  const discountTotal = validation?.discount_total ?? "0";
  const total = validation?.total ?? "0";
  const discounts = validation?.discounts ?? [];
  const couponError = validation?.coupon_error ?? null;
  const isEmpty = hydrated && items.length === 0;
  const units = items.reduce((acc, i) => acc + i.quantity, 0);

  function handleRemove(item: CartItem) {
    removeItem(item.courseId, item.sessionId);
    sync();
  }

  function handleQuantity(item: CartItem, quantity: number) {
    setQuantity(item.courseId, item.sessionId, quantity);
    sync();
  }

  function handleAttendees(item: CartItem, attendees: Attendee[]) {
    setAttendees(item.courseId, item.sessionId, attendees);
    sync();
  }

  function applyCoupon() {
    setCoupon(couponDraft);
    setCouponDraft("");
    sync();
  }

  function clearCoupon() {
    setCoupon(null);
    sync();
  }

  return (
    <>
      <section className="border-b border-neutral-200 bg-neutral-0">
        <Container className="py-12 md:py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Carrito
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl">
            Tu carrito
          </h1>
          {!isEmpty && hydrated && (
            <p className="mt-3 text-sm text-neutral-500">
              {units} {units === 1 ? "inscripción" : "inscripciones"} en {items.length}{" "}
              {items.length === 1 ? "curso" : "cursos"}
            </p>
          )}
        </Container>
      </section>

      <section className="bg-neutral-0 py-12 md:py-16">
        <Container>
          {!hydrated ? (
            <p className="text-neutral-500">Cargando…</p>
          ) : isEmpty ? (
            <div className="flex flex-col items-start gap-6 py-12">
              <p className="text-lg text-ink-700">Todavía no agregaste cursos.</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/formacion" className={buttonClasses({ variant: "primary", size: "md" })}>
                  Explorar formación
                </Link>
                <Link href="/promociones" className={buttonClasses({ variant: "outline", size: "md" })}>
                  Ver promociones
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
              {/* Lista de ítems */}
              <div className="min-w-0">
                <ul className="divide-y divide-neutral-200 border border-neutral-200 bg-neutral-0">
                  {items.map((item) => {
                    const v = validByKey.get(lineKey(item.courseId, item.sessionId));
                    const price = v?.unit_price ?? item.unitPrice;
                    const unavailable = v ? !v.available : false;
                    const isFree = parseFloat(price) === 0;
                    const lineTotal = parseFloat(price) * item.quantity;
                    const maxQty = v?.seats_available ?? 20;
                    return (
                      <li key={lineKey(item.courseId, item.sessionId)} className="p-5">
                        <div className="flex items-start gap-4 sm:gap-5">
                          <ModalityThumb
                            modality={item.modality}
                            code={item.code}
                            className="h-20 w-20"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              <ModalityChip modality={item.modality} />
                              {item.sessionLabel && (
                                <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                  </svg>
                                  {item.sessionLabel}
                                </span>
                              )}
                            </div>
                            <p className="text-[15px] font-medium leading-snug text-ink-900">
                              {item.titleSnapshot}
                            </p>
                            {!isFree && (
                              <p className="mt-1 text-xs text-neutral-500">
                                {formatARS(price)} por participante
                              </p>
                            )}
                            {unavailable && (
                              <p className="mt-2 text-xs font-semibold text-red-600">
                                {v?.seats_available != null && v.seats_available > 0
                                  ? `Sólo quedan ${v.seats_available} cupos para esta fecha.`
                                  : "Sin disponibilidad. Quitá este ítem para continuar."}
                              </p>
                            )}

                            <div className="mt-4 flex flex-wrap items-center gap-4">
                              <QuantityStepper
                                size="sm"
                                value={item.quantity}
                                max={Math.max(1, maxQty)}
                                onChange={(q) => handleQuantity(item, q)}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemove(item)}
                                className="text-xs font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-red-600 hover:underline"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <span
                              className={`font-display text-lg font-semibold ${
                                isFree ? "text-brand-600" : "text-ink-900"
                              }`}
                            >
                              {isFree ? "Gratis" : formatARS(lineTotal)}
                            </span>
                          </div>
                        </div>

                        {item.quantity > 1 && (
                          <AttendeesEditor
                            item={item}
                            onChange={(attendees) => handleAttendees(item, attendees)}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href="/formacion"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-600"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="11 18 5 12 11 6" />
                  </svg>
                  Seguir agregando cursos
                </Link>
              </div>

              {/* Resumen */}
              <div className="lg:sticky lg:top-28 lg:self-start">
                <div className="overflow-hidden border border-neutral-200 bg-neutral-0 shadow-[0_16px_50px_-20px_rgba(15,23,42,0.25)]">
                  <div className="flex items-center gap-3 bg-ink-900 px-6 py-5">
                    <span className="h-px w-6 bg-brand-500" aria-hidden />
                    <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-neutral-0">
                      Resumen
                    </h2>
                  </div>

                  {/* Cupón */}
                  <div className="border-b border-neutral-200 p-6">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Cupón de descuento
                    </label>
                    {coupon && !couponError ? (
                      <div className="flex items-center justify-between gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-emerald-700">
                          {coupon}
                        </span>
                        <button
                          type="button"
                          onClick={clearCoupon}
                          className="text-xs font-medium text-emerald-700 underline-offset-4 hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <div className="flex">
                        <input
                          value={couponDraft}
                          onChange={(e) => setCouponDraft(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                          placeholder="Ingresá tu código"
                          className="min-w-0 flex-1 rounded-none border border-neutral-300 bg-neutral-0 px-4 py-3 text-sm uppercase tracking-wider text-ink-900 outline-none transition-colors placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 focus:border-brand-500"
                        />
                        <button
                          type="button"
                          onClick={applyCoupon}
                          className="shrink-0 bg-ink-900 px-5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-ink-800"
                        >
                          Aplicar
                        </button>
                      </div>
                    )}
                    {coupon && couponError && (
                      <p className="mt-2 text-xs font-medium text-red-600">{couponError}</p>
                    )}
                    <Link
                      href="/promociones"
                      className="mt-3 inline-block text-xs font-medium text-brand-600 underline-offset-4 hover:underline"
                    >
                      Ver promociones vigentes
                    </Link>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Subtotal</span>
                      <span className="font-medium text-ink-900">
                        {validating ? "…" : formatARS(subtotal)}
                      </span>
                    </div>

                    {discounts.map((d) => (
                      <div
                        key={d.promoId}
                        className="mt-3 flex items-start justify-between gap-4 text-sm"
                      >
                        <span className="min-w-0 text-emerald-700">
                          {d.label}
                          <span className="ml-1 font-mono text-xs text-emerald-600">({d.code})</span>
                        </span>
                        <span className="shrink-0 font-medium text-emerald-700">
                          −{formatARS(d.amount)}
                        </span>
                      </div>
                    ))}

                    {parseFloat(discountTotal) > 0 && (
                      <div className="mt-3 flex items-center justify-between border-t border-dashed border-neutral-200 pt-3 text-sm">
                        <span className="text-neutral-500">Descuentos</span>
                        <span className="font-medium text-emerald-700">
                          −{formatARS(discountTotal)}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 flex items-baseline justify-between border-t border-neutral-200 pt-4">
                      <span className="font-semibold text-ink-900">Total</span>
                      <span
                        className={`font-display text-2xl font-semibold ${
                          parseFloat(total) === 0 ? "text-brand-600" : "text-ink-900"
                        }`}
                      >
                        {validating ? "…" : parseFloat(total) === 0 ? "Gratis" : formatARS(total)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 p-6">
                    {allAvailable ? (
                      <Link
                        href="/checkout"
                        className={buttonClasses({ variant: "primary", size: "lg", className: "w-full" })}
                      >
                        Continuar al pago
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className={buttonClasses({ variant: "primary", size: "lg", className: "w-full" })}
                      >
                        Revisá los ítems sin cupo
                      </button>
                    )}
                    <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Pago protegido · Mercado Pago o PayPal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

/**
 * Detalle de participantes cuando se compran varias unidades del mismo curso:
 * cada inscripción lleva su nombre y correo (ahí llega el acceso).
 */
function AttendeesEditor({
  item,
  onChange,
}: {
  item: CartItem;
  onChange: (attendees: Attendee[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const attendees: Attendee[] = useMemo(() => {
    const base = item.attendees ? [...item.attendees] : [];
    while (base.length < item.quantity) base.push({ name: "", email: "" });
    return base.slice(0, item.quantity);
  }, [item.attendees, item.quantity]);

  const completed = attendees.filter((a) => a.email.trim()).length;

  function update(index: number, patch: Partial<Attendee>) {
    onChange(attendees.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  return (
    <div className="mt-5 border-t border-dashed border-neutral-200 pt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Participantes ({completed}/{item.quantity} cargados)
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs leading-relaxed text-neutral-500">
            Cargá el correo de cada participante: ahí enviamos el acceso y el certificado. Si
            preferís, podés completarlos después en el paso de pago.
          </p>
          {attendees.map((a, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
              <input
                value={a.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder={`Participante ${i + 1} — nombre`}
                className="w-full rounded-none border border-neutral-300 bg-neutral-0 px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-500"
              />
              <input
                type="email"
                value={a.email}
                onChange={(e) => update(i, { email: e.target.value })}
                placeholder="correo@laboratorio.com"
                className="w-full rounded-none border border-neutral-300 bg-neutral-0 px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
