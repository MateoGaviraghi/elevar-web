"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CartItem, CartValidateResult } from "@/types";
import { getCart, removeItem } from "@/lib/cart";
import { validateCart } from "@/lib/api";
import { Container } from "@/components/ui/container";
import { ModalityChip } from "@/components/ui/modality-chip";
import { ModalityThumb } from "@/components/catalog/modality-thumb";
import { buttonClasses } from "@/components/ui/button";
import { formatARS } from "@/lib/formatters";

function lineKey(courseId: number, sessionId: number | null): string {
  return `${courseId}:${sessionId ?? "x"}`;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [validation, setValidation] = useState<CartValidateResult | null>(null);
  const [validating, setValidating] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(getCart().items);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) {
      setValidation(null);
      setValidating(false);
      return;
    }
    let cancelled = false;
    setValidating(true);
    validateCart(items.map((i) => ({ course_id: i.courseId, session_id: i.sessionId })))
      .then((res) => !cancelled && setValidation(res))
      .catch(() => !cancelled && setValidation(null))
      .finally(() => !cancelled && setValidating(false));
    return () => {
      cancelled = true;
    };
  }, [items, hydrated]);

  const validByKey = useMemo(() => {
    const map = new Map<string, CartValidateResult["items"][number]>();
    validation?.items.forEach((it) => map.set(lineKey(it.course_id, it.session_id), it));
    return map;
  }, [validation]);

  const allAvailable = validation ? validation.valid : true;
  const subtotal = validation?.subtotal ?? "0";
  const isEmpty = hydrated && items.length === 0;

  function handleRemove(item: CartItem) {
    removeItem(item.courseId, item.sessionId);
    setItems(getCart().items);
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
        </Container>
      </section>

      <section className="bg-neutral-0 py-12 md:py-16">
        <Container>
          {!hydrated ? (
            <p className="text-neutral-500">Cargando…</p>
          ) : isEmpty ? (
            <div className="flex flex-col items-start gap-6 py-12">
              <p className="text-lg text-ink-700">Todavía no agregaste cursos.</p>
              <Link href="/formacion" className={buttonClasses({ variant: "primary", size: "md" })}>
                Explorar formación
              </Link>
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
                    return (
                      <li
                        key={lineKey(item.courseId, item.sessionId)}
                        className="flex items-start gap-4 p-5 sm:gap-5"
                      >
                        <ModalityThumb modality={item.modality} code={item.code} className="h-20 w-20" />
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
                          {unavailable && (
                            <p className="mt-2 text-xs font-semibold text-red-600">
                              Sin disponibilidad. Quitá este ítem para continuar.
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemove(item)}
                            className="mt-3 text-xs font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-red-600 hover:underline"
                          >
                            Quitar
                          </button>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={`font-display text-lg font-semibold ${isFree ? "text-brand-600" : "text-ink-900"}`}>
                            {isFree ? "Gratis" : formatARS(price)}
                          </span>
                        </div>
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
                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Subtotal</span>
                      <span className="font-medium text-ink-900">
                        {validating ? "…" : formatARS(subtotal)}
                      </span>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between border-t border-neutral-200 pt-4">
                      <span className="font-semibold text-ink-900">Total</span>
                      <span className={`font-display text-2xl font-semibold ${parseFloat(subtotal) === 0 ? "text-brand-600" : "text-ink-900"}`}>
                        {validating ? "…" : parseFloat(subtotal) === 0 ? "Gratis" : formatARS(subtotal)}
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
                        Revisá los ítems sin stock
                      </button>
                    )}
                    <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Pago protegido
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
