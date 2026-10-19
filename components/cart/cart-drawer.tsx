"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CartItem, CartValidateResult, Promo } from "@/types";
import { CART_OPEN_EVENT, getCart, removeItem, setQuantity } from "@/lib/cart";
import { getPromos, validateCart } from "@/lib/api";
import { nextPromoHint, type PromoHint } from "@/lib/promos";
import { formatARS } from "@/lib/formatters";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { setScrollLocked } from "@/components/anim/smooth-scroll";
import { buttonClasses } from "@/components/ui/button";
import { ModalityThumb } from "@/components/catalog/modality-thumb";
import { QuantityStepper } from "@/components/catalog/add-to-cart-panel";

// Panel del carrito: en escritorio entra desde la derecha; en el teléfono sube
// desde abajo y se cierra arrastrándolo. Se abre con openCartDrawer().

const DESKTOP = "(min-width: 640px)";
const DRAG_CLOSE_PX = 110;

function lineKey(i: CartItem): string {
  return `${i.courseId}:${i.sessionId ?? "x"}`;
}

function hintText(h: PromoHint): string {
  const benefit =
    h.promo.kind === "PERCENT" ? `${h.promo.value}%` : formatARS(h.promo.value);
  if (h.missing === 0) return `${h.promo.title}: ${benefit} aplicado`;
  if (h.countsCourses) {
    return h.missing === 1
      ? `Sumá otro curso y ahorrás ${benefit} en el más económico`
      : `Sumá ${h.missing} cursos más y ahorrás ${benefit}`;
  }
  return `Sumá ${h.missing} ${h.missing === 1 ? "inscripción" : "inscripciones"} más y ahorrás ${benefit}`;
}

export function CartDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [pricing, setPricing] = useState<CartValidateResult | null>(null);

  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  const sync = useCallback(() => setItems(getCart().items), []);

  // Abrir desde cualquier lugar + mantener el contenido al día.
  useEffect(() => {
    sync();
    const onOpen = () => {
      returnFocus.current = document.activeElement as HTMLElement | null;
      sync();
      setOpen(true);
    };
    window.addEventListener(CART_OPEN_EVENT, onOpen);
    window.addEventListener("elevar-cart-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_OPEN_EVENT, onOpen);
      window.removeEventListener("elevar-cart-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  useEffect(() => {
    getPromos()
      .then(setPromos)
      .catch(() => setPromos([]));
  }, []);

  // Precios siempre por la misma vía que el carrito y el checkout.
  useEffect(() => {
    if (items.length === 0) {
      setPricing(null);
      return;
    }
    let cancelled = false;
    validateCart(items, getCart().coupon)
      .then((res) => !cancelled && setPricing(res))
      .catch(() => !cancelled && setPricing(null));
    return () => {
      cancelled = true;
    };
  }, [items]);

  // Navegar cierra el panel (p. ej. "Continuar al pago").
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const hint = items.length ? nextPromoHint(items, promos) : null;

  // ── Movimiento ───────────────────────────────────────────────────────────────
  const { contextSafe } = useGSAP(
    () => {
      gsap.set(root.current, { autoAlpha: 0 });
    },
    { scope: root }
  );

  // Entrada con dos capas (referencia: Codrops · Shopping Cart Animation, elegida
  // por Mateo, 2026-10-19): primero una franja naranja y 0,1 s después el panel
  // blanco, 1,4 s expo.inOut; los cursos llegan de a uno (cada 0,1 s, 1 s) y el
  // total crece de 0,9 a 1. Al cerrar, panel y franja salen en 1,0 s.
  const animateOpen = contextSafe(() => {
    const reduce = prefersReducedMotion();
    const desktop = window.matchMedia(DESKTOP).matches;
    // Con movimiento reducido el panel aparece en su lugar (sin desplazarse).
    const from = reduce
      ? { xPercent: 0, yPercent: 0 }
      : desktop
        ? { xPercent: 100, yPercent: 0 }
        : { xPercent: 0, yPercent: 100 };
    tl.current?.kill();
    tl.current = gsap
      .timeline()
      .set(root.current, { autoAlpha: 1 })
      .set(panel.current, { ...from, y: 0 })
      // En el teléfono la franja toma la altura real del panel (que crece con el contenido).
      .set(layer.current, { ...from, y: 0, autoAlpha: reduce ? 0 : 1, height: desktop ? "" : panel.current?.offsetHeight })
      .fromTo(overlay.current, { opacity: 0 }, { opacity: 1, duration: reduce ? 0.2 : 0.8, ease: "power2.out" }, 0)
      .to(layer.current, { xPercent: 0, yPercent: 0, duration: reduce ? 0.01 : 1.4, ease: "expo.inOut" }, 0)
      .to(panel.current, { xPercent: 0, yPercent: 0, duration: reduce ? 0.01 : 1.4, ease: "expo.inOut" }, reduce ? 0 : 0.1)
      // La franja queda tapada: se apaga para que no asome al arrastrar el panel.
      .set(layer.current, { autoAlpha: 0 })
      .fromTo(
        ".cd-row",
        desktop ? { opacity: 0, x: reduce ? 0 : 30, y: 0 } : { opacity: 0, x: 0, y: reduce ? 0 : 16 },
        { opacity: 1, x: 0, y: 0, duration: reduce ? 0.2 : 1, ease: "power2.out", stagger: reduce ? 0 : 0.1 },
        reduce ? 0 : 0.75
      )
      .fromTo(
        ".cd-total",
        { opacity: 0, scale: reduce ? 1 : 0.9 },
        { opacity: 1, scale: 1, duration: reduce ? 0.2 : 1, ease: "power2.out" },
        reduce ? 0 : 0.95
      );
  });

  const animateClose = contextSafe(() => {
    const reduce = prefersReducedMotion();
    const desktop = window.matchMedia(DESKTOP).matches;
    const out = desktop ? { xPercent: 100 } : { yPercent: 100 };
    tl.current?.kill();
    tl.current = gsap
      .timeline()
      // Si el panel se cerró arrastrándolo, la franja arranca a la misma altura.
      .set(layer.current, { xPercent: 0, yPercent: 0, y: Number(gsap.getProperty(panel.current, "y")) || 0, autoAlpha: reduce ? 0 : 1, height: desktop ? "" : panel.current?.offsetHeight })
      .to(panel.current, { ...out, y: 0, duration: reduce ? 0.01 : 1.0, ease: "expo.inOut" }, reduce ? 0.2 : 0)
      .to(layer.current, { ...out, y: 0, duration: reduce ? 0.01 : 1.0, ease: "expo.inOut" }, reduce ? 0.2 : 0.1)
      .to(overlay.current, { opacity: 0, duration: reduce ? 0.2 : 0.7, ease: "power2.inOut" }, reduce ? 0 : 0.35)
      .set(root.current, { autoAlpha: 0 });
  });

  const shown = useRef(false);
  useEffect(() => {
    if (open) {
      shown.current = true;
      setScrollLocked(true);
      animateOpen();
      closeBtn.current?.focus({ preventScroll: true });
    } else if (shown.current) {
      shown.current = false;
      setScrollLocked(false);
      animateClose();
      returnFocus.current?.focus?.({ preventScroll: true });
    }
    // animateOpen/animateClose son estables dentro del contexto de GSAP.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => setScrollLocked(false), []);

  // Barra de la promo: crece desde donde estaba hasta el avance nuevo.
  const progress = hint?.progress ?? 0;
  useGSAP(
    () => {
      if (!bar.current) return;
      gsap.to(bar.current, {
        scaleX: progress,
        duration: prefersReducedMotion() ? 0 : 1.1,
        ease: "power2.inOut",
        delay: open ? 0.35 : 0,
      });
    },
    { dependencies: [progress, open], scope: root }
  );

  // Esc cierra; Tab no sale del panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusables = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Arrastrar hacia abajo para cerrar (sólo teléfono, desde la manija/cabecera).
  const drag = useRef<{ startY: number; dy: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (window.matchMedia(DESKTOP).matches || e.pointerType === "mouse") return;
    drag.current = { startY: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dy = Math.max(0, e.clientY - drag.current.startY);
    drag.current.dy = dy;
    gsap.set(panel.current, { y: dy });
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const { dy } = drag.current;
    drag.current = null;
    if (dy > DRAG_CLOSE_PX) setOpen(false);
    else gsap.to(panel.current, { y: 0, duration: 0.5, ease: "power3.out" });
  };

  const units = items.reduce((acc, i) => acc + i.quantity, 0);
  const total = pricing?.total ?? "0";
  const discountTotal = parseFloat(pricing?.discount_total ?? "0");

  return (
    <div
      ref={root}
      className="invisible fixed inset-0 z-[70]"
      aria-hidden={!open}
    >
      <div
        ref={overlay}
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-ink-900/50"
        aria-hidden
      />

      {/* Franja naranja que entra antes que el panel (misma forma y lugar). */}
      <div
        ref={layer}
        aria-hidden
        className="invisible absolute inset-x-0 bottom-0 h-[88dvh] bg-brand-500 sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-[440px]"
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito"
        className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col border-t border-neutral-200 bg-neutral-0 shadow-[0_-20px_60px_-30px_rgba(15,23,42,0.45)] sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:border-l sm:border-t-0 sm:shadow-[-20px_0_60px_-30px_rgba(15,23,42,0.45)]"
      >
        {/* Cabecera (y manija para arrastrar en el teléfono) */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="shrink-0 touch-none border-b border-neutral-200 px-6 pb-4 pt-3 sm:touch-auto sm:pt-5"
        >
          <span className="mx-auto mb-3 block h-1 w-10 bg-neutral-300 sm:hidden" aria-hidden />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-brand-500" aria-hidden />
              <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-ink-900">
                Tu carrito
              </h2>
              {units > 0 && (
                <span className="text-xs text-neutral-500">
                  {units} {units === 1 ? "inscripción" : "inscripciones"}
                </span>
              )}
            </div>
            <button
              ref={closeBtn}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar carrito"
              className="-mr-2 grid h-11 w-11 place-items-center text-ink-800 transition-colors hover:text-brand-500"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-start gap-5 px-6 py-10">
            <p className="text-ink-700">Todavía no agregaste cursos.</p>
            <Link href="/formacion" className={buttonClasses({ variant: "primary", size: "md" })}>
              Explorar formación
            </Link>
          </div>
        ) : (
          <>
            {/* Promo más cercana */}
            {hint && (
              <div className="cd-row shrink-0 border-b border-neutral-200 px-6 py-4">
                <p
                  className={`text-sm font-medium ${
                    hint.missing === 0 ? "text-emerald-700" : "text-ink-900"
                  }`}
                  aria-live="polite"
                >
                  {hintText(hint)}
                </p>
                <span className="mt-3 block h-[3px] w-full bg-neutral-100" aria-hidden>
                  <span
                    ref={bar}
                    className={`block h-full w-full origin-left scale-x-0 ${
                      hint.missing === 0 ? "bg-emerald-600" : "bg-brand-500"
                    }`}
                  />
                </span>
              </div>
            )}

            {/* Cursos */}
            <ul data-lenis-prevent className="min-h-0 flex-1 divide-y divide-neutral-200 overflow-y-auto overscroll-contain">
              {items.map((item) => {
                const free = parseFloat(item.unitPrice) === 0;
                return (
                  <li key={lineKey(item)} className="cd-row flex items-start gap-4 px-6 py-5">
                    <ModalityThumb modality={item.modality} code={item.code} className="h-16 w-16 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-ink-900">{item.titleSnapshot}</p>
                      {item.sessionLabel && (
                        <p className="mt-1 text-xs text-neutral-500">{item.sessionLabel}</p>
                      )}
                      <div className="mt-3 flex items-center gap-4">
                        <QuantityStepper
                          size="sm"
                          value={item.quantity}
                          onChange={(q) => setQuantity(item.courseId, item.sessionId, q)}
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(item.courseId, item.sessionId)}
                          className="text-xs font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-red-600 hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                    <span className={`shrink-0 font-display text-base font-semibold ${free ? "text-brand-600" : "text-ink-900"}`}>
                      {free ? "Gratis" : formatARS(parseFloat(item.unitPrice) * item.quantity)}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Totales */}
            <div className="cd-total shrink-0 border-t border-neutral-200 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-medium text-ink-900">{pricing ? formatARS(pricing.subtotal) : "…"}</span>
              </div>
              {discountTotal > 0 && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-emerald-700">Descuentos</span>
                  <span className="font-medium text-emerald-700">−{formatARS(discountTotal)}</span>
                </div>
              )}
              <div className="mt-3 flex items-baseline justify-between border-t border-neutral-200 pt-3">
                <span className="font-semibold text-ink-900">Total</span>
                <span className="font-display text-2xl font-semibold text-ink-900">
                  {!pricing ? "…" : parseFloat(total) === 0 ? "Gratis" : formatARS(total)}
                </span>
              </div>
              <Link
                href="/checkout"
                className={buttonClasses({ variant: "primary", size: "lg", className: "mt-5 w-full" })}
              >
                Continuar al pago
              </Link>
              <Link
                href="/carrito"
                className="mt-3 block text-center text-xs font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-brand-600 hover:underline"
              >
                Ver carrito completo · cupón y participantes
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
