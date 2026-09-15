"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type {
  Attendee,
  CartItem,
  CartValidateResult,
  PaymentMethod,
} from "@/types";
import { getCart, clearCart, setAttendees as persistAttendees } from "@/lib/cart";
import { validateCart, checkout, simulatePayment, ApiError } from "@/lib/api";
import { arsToUsd, formatARS, formatUSD, USD_RATE } from "@/lib/formatters";
import { ModalityThumb } from "@/components/catalog/modality-thumb";
import { MercadoPagoLogo, CardBrands, MP_BLUE, MP_BLUE_DARK } from "./mercado-pago";
import { PayPalLogo, PAYPAL_BLUE, PAYPAL_YELLOW, PAYPAL_YELLOW_DARK } from "./paypal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * PayPal (USD) queda contemplado en el alcance pero su implementación efectiva
 * la confirma Elevar durante el proyecto: con esta bandera se muestra u oculta.
 */
const PAYPAL_ENABLED = process.env.NEXT_PUBLIC_PAYPAL_ENABLED !== "false";

function lineKey(courseId: number, sessionId: number | null) {
  return `${courseId}:${sessionId ?? "x"}`;
}

export function CheckoutClient() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [validation, setValidation] = useState<CartValidateResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [buyer, setBuyer] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
  });
  const [attendees, setAttendeesState] = useState<Record<string, Attendee[]>>({});
  const [method, setMethod] = useState<PaymentMethod>("MERCADOPAGO");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    const cart = getCart();
    setItems(cart.items);
    setCoupon(cart.coupon);
    setHydrated(true);
    setAttendeesState(
      Object.fromEntries(
        cart.items
          .filter((i) => i.quantity > 1)
          .map((i) => [
            lineKey(i.courseId, i.sessionId),
            fillAttendees(i.attendees, i.quantity),
          ])
      )
    );
    if (cart.items.length > 0) {
      validateCart(cart.items, cart.coupon)
        .then(setValidation)
        .catch(() => setValidation(null));
    }
  }, []);

  const validByKey = useMemo(() => {
    const m = new Map<string, CartValidateResult["items"][number]>();
    validation?.items.forEach((it) => m.set(lineKey(it.course_id, it.session_id), it));
    return m;
  }, [validation]);

  const subtotal = validation?.subtotal ?? null;
  const discountTotal = validation?.discount_total ?? "0";
  const discounts = validation?.discounts ?? [];
  const total = validation?.total ?? null;
  const isFreeOrder = total != null && parseFloat(total) === 0;
  const totalUsd = total != null ? arsToUsd(total) : null;
  const multiLines = items.filter((i) => i.quantity > 1);

  function set<K extends keyof typeof buyer>(k: K, v: string) {
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

  async function startPayment() {
    const e: Record<string, string> = {};
    if (!EMAIL_RE.test(buyer.email.trim())) e.email = "Ingresá un email válido.";
    if (!buyer.firstName.trim()) e.firstName = "Ingresá tu nombre.";
    if (!buyer.lastName.trim()) e.lastName = "Ingresá tu apellido.";
    // El teléfono es obligatorio: es el canal de contacto para pagos por fuera
    // de los medios automáticos (transferencia, factura a empresa).
    if (buyer.phone.replace(/\D/g, "").length < 8)
      e.phone = "Ingresá un teléfono de contacto.";

    multiLines.forEach((item) => {
      const key = lineKey(item.courseId, item.sessionId);
      (attendees[key] ?? []).forEach((a, i) => {
        if (!EMAIL_RE.test(a.email.trim())) {
          e[`att-${key}-${i}`] = "Email inválido.";
        }
      });
    });

    setErrors(e);
    if (Object.keys(e).length > 0) return;

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
          phone: buyer.phone.trim() || undefined,
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
      setPayError(
        err instanceof ApiError ? err.message : "No pudimos iniciar el pago. Probá de nuevo."
      );
      setProcessing(false);
    }
  }

  // ── Carrito vacío ───────────────────────────────────────────────────────────
  if (hydrated && items.length === 0) {
    return (
      <CheckoutShell>
        <div className="mx-auto max-w-md py-24 text-center">
          <p className="text-lg text-ink-700">Tu carrito está vacío.</p>
          <Link
            href="/formacion"
            className="mt-6 inline-flex items-center justify-center bg-brand-500 px-7 py-3.5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-600"
          >
            Explorar formación
          </Link>
        </div>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell>
      <Steps />

      <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-[1fr_400px]">
        {/* ── Columna formularios ── */}
        <div className="min-w-0 lg:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Section title="Contacto">
              <Field
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={buyer.email}
                onChange={(v) => set("email", v)}
                error={errors.email}
              />
              <p className="text-xs text-neutral-400">
                Ahí te enviamos la confirmación de compra y el acceso a los cursos.
              </p>
            </Section>

            <Section title="Datos del comprador">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre" autoComplete="given-name" value={buyer.firstName} onChange={(v) => set("firstName", v)} error={errors.firstName} />
                <Field label="Apellido" autoComplete="family-name" value={buyer.lastName} onChange={(v) => set("lastName", v)} error={errors.lastName} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Teléfono"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+54 9 …"
                  value={buyer.phone}
                  onChange={(v) => set("phone", v)}
                  error={errors.phone}
                />
                <Field
                  label="Laboratorio / empresa (opcional)"
                  autoComplete="organization"
                  value={buyer.company}
                  onChange={(v) => set("company", v)}
                />
              </div>
              <p className="text-xs leading-relaxed text-neutral-400">
                Usamos el teléfono y el correo únicamente para coordinar la inscripción o un pago
                por fuera de los medios automáticos (transferencia o factura a empresa).
              </p>
            </Section>

            {/* Participantes por curso con más de una unidad */}
            {multiLines.length > 0 && (
              <Section title="Participantes">
                <p className="-mt-1 text-xs leading-relaxed text-neutral-500">
                  Compraste más de una inscripción: indicá a quién corresponde cada una. A esos
                  correos llega el acceso y el certificado.
                </p>
                {multiLines.map((item) => {
                  const key = lineKey(item.courseId, item.sessionId);
                  const list = attendees[key] ?? [];
                  return (
                    <div key={key} className="border border-neutral-200 bg-neutral-0 p-5">
                      <p className="text-sm font-semibold leading-snug text-ink-900">
                        {item.titleSnapshot}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {item.quantity} inscripciones
                        {item.sessionLabel ? ` · ${item.sessionLabel}` : ""}
                      </p>
                      <div className="mt-4 space-y-3">
                        {list.map((a, i) => (
                          <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
                            <input
                              value={a.name}
                              onChange={(e) => updateAttendee(key, i, { name: e.target.value })}
                              placeholder={`Participante ${i + 1} — nombre`}
                              className="w-full rounded-none border border-neutral-300 bg-neutral-0 px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-500"
                            />
                            <div>
                              <input
                                type="email"
                                value={a.email}
                                onChange={(e) => updateAttendee(key, i, { email: e.target.value })}
                                placeholder="correo@laboratorio.com"
                                className={`w-full rounded-none border bg-neutral-0 px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-neutral-400 ${
                                  errors[`att-${key}-${i}`]
                                    ? "border-red-500"
                                    : "border-neutral-300 focus:border-brand-500"
                                }`}
                              />
                              {errors[`att-${key}-${i}`] && (
                                <span className="mt-1 block text-xs text-red-600">
                                  {errors[`att-${key}-${i}`]}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Section>
            )}

            {!isFreeOrder && (
              <Section title="Medio de pago">
                <PaymentOption
                  selected={method === "MERCADOPAGO"}
                  onSelect={() => setMethod("MERCADOPAGO")}
                  logo={<MercadoPagoLogo withWordmark={false} size={40} />}
                  title="Mercado Pago"
                  subtitle="Tarjeta de crédito o débito, efectivo o dinero en cuenta. Hasta 12 cuotas."
                  amount={total != null ? formatARS(total) : "…"}
                  amountNote="ARS"
                  accent={MP_BLUE}
                >
                  <CardBrands className="mt-2.5" />
                </PaymentOption>

                {PAYPAL_ENABLED && (
                  <PaymentOption
                    selected={method === "PAYPAL"}
                    onSelect={() => setMethod("PAYPAL")}
                    logo={<PayPalLogo withWordmark={false} size={36} />}
                    title="PayPal"
                    subtitle="Pago internacional en dólares estadounidenses, con tarjeta o saldo PayPal."
                    amount={totalUsd != null ? formatUSD(totalUsd) : "…"}
                    amountNote="USD"
                    accent={PAYPAL_BLUE}
                  >
                    <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
                      Conversión de referencia: USD 1 = {formatARS(USD_RATE)}. El importe final lo
                      define PayPal al momento del pago.
                    </p>
                  </PaymentOption>
                )}

                <div className="border border-neutral-200 bg-neutral-50 p-5">
                  <p className="text-sm font-semibold text-ink-900">
                    ¿Necesitás transferencia o factura a empresa?
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                    Completá tus datos y escribinos: coordinamos el pago por fuera de los medios
                    automáticos y confirmamos la inscripción manualmente.
                  </p>
                  <a
                    href="https://wa.me/5493446507779"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-brand-600 underline-offset-4 hover:underline"
                  >
                    Coordinar por WhatsApp →
                  </a>
                </div>
              </Section>
            )}

            {isFreeOrder && (
              <Section title="Confirmar inscripción">
                <p className="text-sm leading-relaxed text-ink-600">
                  Esta orden no tiene costo. Confirmá para completar tu inscripción y recibir el
                  acceso por email.
                </p>
              </Section>
            )}

            {payError && (
              <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {payError}
              </p>
            )}

            <div className="mt-8 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/carrito" className="inline-flex items-center justify-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-600 sm:justify-start">
                <Chevron /> Volver al carrito
              </Link>
              {isFreeOrder ? (
                <button
                  type="button"
                  onClick={startPayment}
                  disabled={processing || !validation}
                  className="inline-flex min-w-[220px] items-center justify-center gap-2 bg-brand-500 px-8 py-4 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-600 disabled:opacity-50"
                >
                  {processing ? <><Spinner /> Procesando…</> : "Confirmar inscripción"}
                </button>
              ) : method === "PAYPAL" ? (
                <button
                  type="button"
                  onClick={startPayment}
                  disabled={processing || !validation}
                  className="inline-flex min-w-[240px] items-center justify-center gap-2.5 px-8 py-4 text-sm font-semibold text-ink-900 transition-colors disabled:opacity-60"
                  style={{ background: PAYPAL_YELLOW }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = PAYPAL_YELLOW_DARK)}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = PAYPAL_YELLOW)}
                >
                  {processing ? (
                    <><Spinner /> Redirigiendo…</>
                  ) : (
                    <>
                      <PayPalLogo size={18} />
                      Pagar con PayPal
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startPayment}
                  disabled={processing || !validation}
                  className="inline-flex min-w-[240px] items-center justify-center gap-2.5 px-8 py-4 text-sm font-semibold text-neutral-0 transition-colors disabled:opacity-60"
                  style={{ background: MP_BLUE }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = MP_BLUE_DARK)}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = MP_BLUE)}
                >
                  {processing ? (
                    <><Spinner /> Redirigiendo…</>
                  ) : (
                    <>
                      <MercadoPagoLogo withWordmark={false} size={20} />
                      Pagar con Mercado Pago
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-400 sm:justify-end">
              <Lock /> Pago protegido · entorno de prueba (no ingreses datos reales)
            </p>
          </motion.div>
        </div>

        {/* ── Resumen ── */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="overflow-hidden border border-neutral-200 bg-neutral-0">
            <div className="flex items-center gap-3 bg-ink-900 px-6 py-4">
              <span className="h-px w-6 bg-brand-500" aria-hidden />
              <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-neutral-0">
                Tu orden
              </h2>
            </div>

            <ul className="divide-y divide-neutral-200 px-6">
              {items.map((item) => {
                const v = validByKey.get(lineKey(item.courseId, item.sessionId));
                const price = v?.unit_price ?? item.unitPrice;
                const free = parseFloat(price) === 0;
                const lineTotal = parseFloat(price) * item.quantity;
                return (
                  <li key={lineKey(item.courseId, item.sessionId)} className="flex items-start gap-3 py-4">
                    <div className="relative shrink-0">
                      <ModalityThumb modality={item.modality} code={item.code} className="h-14 w-14 rounded-md" />
                      {item.quantity > 1 && (
                        <span className="absolute -right-2 -top-2 grid h-5 min-w-[20px] place-items-center rounded-full bg-ink-900 px-1 text-[10px] font-bold text-neutral-0">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-ink-900">{item.titleSnapshot}</p>
                      {item.sessionLabel && <p className="mt-0.5 text-xs text-neutral-500">{item.sessionLabel}</p>}
                      {item.quantity > 1 && (
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {item.quantity} × {formatARS(price)}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${free ? "text-brand-600" : "text-ink-900"}`}>
                      {free ? "Gratis" : formatARS(lineTotal)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="space-y-3 border-t border-neutral-200 px-6 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-medium text-ink-900">{subtotal == null ? "…" : formatARS(subtotal)}</span>
              </div>

              {discounts.map((d) => (
                <div key={d.promoId} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 text-emerald-700">
                    {d.label}
                    <span className="ml-1 font-mono text-xs text-emerald-600">({d.code})</span>
                  </span>
                  <span className="shrink-0 font-medium text-emerald-700">−{formatARS(d.amount)}</span>
                </div>
              ))}

              {parseFloat(discountTotal) > 0 && (
                <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-3 text-sm">
                  <span className="text-neutral-500">Descuentos</span>
                  <span className="font-medium text-emerald-700">−{formatARS(discountTotal)}</span>
                </div>
              )}

              <div className="flex items-baseline justify-between border-t border-neutral-200 pt-3">
                <span className="font-semibold text-ink-900">Total</span>
                <span className={`font-display text-2xl font-semibold ${isFreeOrder ? "text-brand-600" : "text-ink-900"}`}>
                  {total == null ? "…" : isFreeOrder ? "Gratis" : formatARS(total)}
                </span>
              </div>

              {!isFreeOrder && method === "PAYPAL" && totalUsd != null && (
                <p className="text-right text-xs text-neutral-500">
                  Se cobra como <span className="font-semibold text-ink-900">{formatUSD(totalUsd)}</span> en PayPal
                </p>
              )}
            </div>

            <ul className="space-y-2 border-t border-neutral-200 bg-neutral-50 px-6 py-5 text-xs text-neutral-500">
              <li className="flex items-center gap-2"><Dot /> Acceso inmediato tras la confirmación</li>
              <li className="flex items-center gap-2"><Dot /> Certificado de participación</li>
              <li className="flex items-center gap-2"><Dot /> Comprobante y confirmación por correo</li>
            </ul>
          </div>
        </aside>
      </div>
    </CheckoutShell>
  );
}

function fillAttendees(attendees: Attendee[] | undefined, quantity: number): Attendee[] {
  const base = attendees ? [...attendees] : [];
  while (base.length < quantity) base.push({ name: "", email: "" });
  return base.slice(0, quantity);
}

/* ───────────── piezas ───────────── */

function PaymentOption({
  selected,
  onSelect,
  logo,
  title,
  subtitle,
  amount,
  amountNote,
  accent,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  logo: React.ReactNode;
  title: string;
  subtitle: string;
  amount: string;
  amountNote: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full border bg-neutral-0 text-left transition-colors ${
        selected ? "border-ink-900" : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 shrink-0">{logo}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{subtitle}</p>
            {children}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`grid h-5 w-5 place-items-center rounded-full ${selected ? "" : "border border-neutral-300"}`}
            style={selected ? { background: accent } : undefined}
            aria-hidden
          >
            {selected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </span>
          <span className="text-right">
            <span className="block text-sm font-semibold text-ink-900">{amount}</span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-neutral-400">
              {amountNote}
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Barra superior */}
      <header className="bg-ink-900">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-display text-lg font-bold tracking-tight text-neutral-0">
            ELEVAR
          </Link>
          <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-neutral-400">
            <Lock /> Compra segura
          </span>
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-brand-500 to-brand-600" />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">{children}</main>
    </div>
  );
}

function Steps() {
  const items = [
    { key: "cart", label: "Carrito", href: "/carrito", done: true },
    { key: "datos", label: "Datos", active: true },
    { key: "pago", label: "Pago" },
  ];
  return (
    <nav className="mx-auto flex max-w-5xl items-center gap-3 text-xs sm:text-sm" aria-label="Pasos">
      {items.map((it, i) => {
        const active = "active" in it && it.active;
        const content = (
          <span className={`inline-flex items-center gap-2 ${active ? "text-ink-900" : it.done ? "text-neutral-500" : "text-neutral-400"}`}>
            <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${active ? "bg-brand-500 text-neutral-0" : it.done ? "bg-ink-900 text-neutral-0" : "border border-neutral-300 text-neutral-400"}`}>
              {it.done ? "✓" : i + 1}
            </span>
            <span className={active ? "font-semibold" : "font-medium"}>{it.label}</span>
          </span>
        );
        return (
          <span key={it.key} className="flex items-center gap-3">
            {it.href && it.done ? <Link href={it.href}>{content}</Link> : content}
            {i < items.length - 1 && <span className="text-neutral-300" aria-hidden>›</span>}
          </span>
        );
      })}
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "text" | "email";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-none border bg-neutral-0 px-4 py-3 text-[15px] text-ink-900 outline-none transition-all placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-500/25 ${
          error ? "border-red-500 focus:border-red-500" : "border-neutral-300 focus:border-brand-500"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const Lock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const Dot = () => <span className="h-1 w-1 shrink-0 rounded-full bg-brand-500" aria-hidden />;
const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
