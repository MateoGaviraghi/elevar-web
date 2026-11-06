"use client";

/**
 * Lógica del checkout (carrito, validación, cupón, datos, participantes y pago), separada
 * del dibujo para que las variantes del prototipo (2026-11-06) usen exactamente la misma.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Attendee, CartItem, CartValidateResult, PaymentMethod } from "@/types";
import {
  getCart,
  clearCart,
  removeItem,
  setAttendees as persistAttendees,
  setCoupon as persistCoupon,
} from "@/lib/cart";
import { validateCart, checkout, simulatePayment, ApiError } from "@/lib/api";
import { arsToUsd } from "@/lib/formatters";
import { PAIS_INICIAL, telefonoCompleto, telefonoValido, type Pais } from "@/lib/paises";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * PayPal (USD) queda contemplado en el alcance pero su implementación efectiva
 * la confirma Elevar durante el proyecto: con esta bandera se muestra u oculta.
 */
export const PAYPAL_ENABLED = process.env.NEXT_PUBLIC_PAYPAL_ENABLED !== "false";

export function lineKey(courseId: number, sessionId: number | null) {
  return `${courseId}:${sessionId ?? "x"}`;
}

export type Buyer = { email: string; firstName: string; lastName: string; phone: string; company: string };

export function useCheckout() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [validation, setValidation] = useState<CartValidateResult | null>(null);
  const [validationError, setValidationError] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [buyer, setBuyer] = useState<Buyer>({ email: "", firstName: "", lastName: "", phone: "", company: "" });
  const [pais, setPais] = useState<Pais>(PAIS_INICIAL);
  const [attendees, setAttendeesState] = useState<Record<string, Attendee[]>>({});
  const [method, setMethod] = useState<PaymentMethod>("MERCADOPAGO");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [couponDraft, setCouponDraft] = useState("");

  useEffect(() => {
    const cart = getCart();
    setItems(cart.items);
    setCoupon(cart.coupon);
    setHydrated(true);
    setAttendeesState(
      Object.fromEntries(
        cart.items
          .filter((i) => i.quantity > 1)
          .map((i) => [lineKey(i.courseId, i.sessionId), fillAttendees(i.attendees, i.quantity)])
      )
    );
    if (cart.items.length > 0) revalidate(cart.items, cart.coupon);
  }, []);

  // Si el total no se puede calcular, se avisa: nunca un total gris para siempre.
  function revalidate(list: CartItem[], code: string | null) {
    setValidationError(false);
    validateCart(list, code)
      .then(setValidation)
      .catch(() => {
        setValidation(null);
        setValidationError(true);
      });
  }

  // Quita del carrito una línea que ya no se puede comprar y recalcula.
  function quitar(item: CartItem) {
    removeItem(item.courseId, item.sessionId);
    const rest = items.filter((i) => lineKey(i.courseId, i.sessionId) !== lineKey(item.courseId, item.sessionId));
    setItems(rest);
    if (rest.length > 0) revalidate(rest, coupon);
  }

  function aplicarCupon() {
    const code = couponDraft.trim().toUpperCase();
    if (!code) return;
    persistCoupon(code);
    setCoupon(code);
    revalidate(items, code);
  }

  function quitarCupon() {
    persistCoupon(null);
    setCoupon(null);
    setCouponDraft("");
    revalidate(items, null);
  }

  const validByKey = useMemo(() => {
    const m = new Map<string, CartValidateResult["items"][number]>();
    validation?.items.forEach((it) => m.set(lineKey(it.course_id, it.session_id), it));
    return m;
  }, [validation]);

  const total = validation?.total ?? null;
  const isFreeOrder = total != null && parseFloat(total) === 0;
  const multiLines = items.filter((i) => i.quantity > 1);

  function set<K extends keyof Buyer>(k: K, v: string) {
    setBuyer((b) => ({ ...b, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  function updateAttendee(key: string, index: number, patch: Partial<Attendee>) {
    setAttendeesState((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).map((a, i) => (i === index ? { ...a, ...patch } : a)),
    }));
    setErrors((e) => ({ ...e, [`att-${key}-${index}`]: "" }));
  }

  /** Errores de un grupo de campos, sin tocar el estado (para avanzar de a una pregunta). */
  function erroresDe(campos: (keyof Buyer | "participantes")[]) {
    const e: Record<string, string> = {};
    if (campos.includes("firstName") && !buyer.firstName.trim()) e.firstName = "Ingresá tu nombre.";
    if (campos.includes("lastName") && !buyer.lastName.trim()) e.lastName = "Ingresá tu apellido.";
    if (campos.includes("email") && !EMAIL_RE.test(buyer.email.trim())) e.email = "Ingresá un correo válido.";
    // El teléfono es obligatorio: es el canal de contacto para pagos por fuera
    // de los medios automáticos (transferencia, factura a empresa).
    if (campos.includes("phone") && !telefonoValido(buyer.phone)) e.phone = "Ingresá un teléfono de contacto con código de área.";
    if (campos.includes("participantes")) {
      multiLines.forEach((item) => {
        const key = lineKey(item.courseId, item.sessionId);
        (attendees[key] ?? []).forEach((a, i) => {
          if (!EMAIL_RE.test(a.email.trim())) e[`att-${key}-${i}`] = "Correo inválido.";
        });
      });
    }
    return e;
  }

  function validar(campos: (keyof Buyer | "participantes")[]) {
    const e = erroresDe(campos);
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  }

  const TODOS: (keyof Buyer | "participantes")[] = ["firstName", "lastName", "email", "phone", "participantes"];
  const validarDatos = () => validar(TODOS);

  async function startPayment(): Promise<boolean> {
    if (!validarDatos()) return false;

    // Los participantes cargados acá también quedan en el carrito.
    const itemsWithAttendees = items.map((item) => {
      const key = lineKey(item.courseId, item.sessionId);
      if (item.quantity <= 1) return item;
      const list = attendees[key] ?? [];
      persistAttendees(item.courseId, item.sessionId, list);
      return { ...item, attendees: list };
    });

    setProcessing(true);
    setPayError(null);
    try {
      const order = await checkout({
        buyer: {
          email: buyer.email.trim(),
          name: `${buyer.firstName.trim()} ${buyer.lastName.trim()}`.trim(),
          phone: telefonoCompleto(pais, buyer.phone),
          company: buyer.company.trim() || undefined,
        },
        items: itemsWithAttendees,
        couponCode: coupon,
        paymentMethod: isFreeOrder ? "MERCADOPAGO" : method,
      });

      if (isFreeOrder) {
        // Las inscripciones sin costo no pasan por la pasarela.
        await simulatePayment({ order_public_id: order.order_public_id, outcome: "approved" });
        clearCart();
        router.push(`/orden/${order.order_public_id}?status=success`);
      } else {
        // Checkout Pro / PayPal: se redirige al proveedor. El carrito se limpia
        // al confirmarse el pago.
        router.push(order.init_point);
      }
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : "No pudimos iniciar el pago. Probá de nuevo.");
      setProcessing(false);
    }
    return true;
  }

  return {
    items,
    coupon,
    couponDraft,
    setCouponDraft,
    couponError: validation?.coupon_error ?? null,
    aplicarCupon,
    quitarCupon,
    validation,
    validationError,
    hydrated,
    validByKey,
    quitar,
    subtotal: validation?.subtotal ?? null,
    discounts: validation?.discounts ?? [],
    total,
    totalUsd: total != null ? arsToUsd(total) : null,
    isFreeOrder,
    blocked: !validation || !validation.valid,
    units: items.reduce((acc, i) => acc + i.quantity, 0),
    multiLines,
    buyer,
    set,
    pais,
    setPais,
    attendees,
    updateAttendee,
    method,
    setMethod,
    errors,
    erroresDe,
    validar,
    validarDatos,
    processing,
    payError,
    startPayment,
  };
}

export type Checkout = ReturnType<typeof useCheckout>;

function fillAttendees(attendees: Attendee[] | undefined, quantity: number): Attendee[] {
  const base = attendees ? [...attendees] : [];
  while (base.length < quantity) base.push({ name: "", email: "" });
  return base.slice(0, quantity);
}
