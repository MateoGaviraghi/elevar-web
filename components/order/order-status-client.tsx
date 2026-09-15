"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { getOrder } from "@/lib/api";
import { formatARS, formatDate, formatUSD } from "@/lib/formatters";
import type { Order, OrderStatus, PaymentMethod } from "@/types";

const STATUS_UI: Record<
  OrderStatus,
  { tone: "ok" | "wait" | "bad"; title: string; desc: (o: Order) => string }
> = {
  PAID: {
    tone: "ok",
    title: "¡Pago confirmado!",
    desc: (o) => `Te enviamos la confirmación y los datos de acceso a ${o.buyer_email}.`,
  },
  FULFILLED: {
    tone: "ok",
    title: "Inscripción confirmada",
    desc: (o) => `Te enviamos los datos de acceso a ${o.buyer_email}.`,
  },
  PENDING: {
    tone: "wait",
    title: "Pago pendiente",
    desc: () =>
      "Estamos esperando la confirmación del pago. Te avisamos por email apenas se acredite; si pagaste en efectivo puede demorar hasta 48 h.",
  },
  FAILED: {
    tone: "bad",
    title: "El pago no se completó",
    desc: () =>
      "No se pudo procesar el pago. Podés intentarlo nuevamente o coordinar una transferencia con nosotros.",
  },
  CANCELLED: {
    tone: "bad",
    title: "La orden fue cancelada",
    desc: () => "Esta orden ya no está activa. Si fue un error, escribinos o volvé a iniciar la compra.",
  },
};

const TONE_CLASSES: Record<"ok" | "wait" | "bad", { ring: string; text: string; dot: string }> = {
  ok: { ring: "border-emerald-200 bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  wait: { ring: "border-amber-200 bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  bad: { ring: "border-red-200 bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  MERCADOPAGO: "Mercado Pago (ARS)",
  PAYPAL: "PayPal (USD)",
  TRANSFER: "Transferencia bancaria",
};

export function OrderStatusClient({ publicId }: { publicId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let cancelled = false;
    getOrder(publicId)
      .then((o) => {
        if (!cancelled) {
          setOrder(o);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  if (state === "loading") {
    return (
      <section className="bg-neutral-0 py-24">
        <Container className="max-w-2xl">
          <p className="text-neutral-500">Cargando tu orden…</p>
        </Container>
      </section>
    );
  }

  if (state === "missing" || !order) {
    return (
      <section className="bg-neutral-0 py-24">
        <Container className="max-w-2xl">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
            No encontramos esta orden
          </h1>
          <p className="mt-3 text-[15px] text-ink-700">
            El enlace puede haber expirado o la orden no existe.
          </p>
          <Link
            href="/formacion"
            className={buttonClasses({ variant: "primary", size: "md", className: "mt-8" })}
          >
            Volver a formación
          </Link>
        </Container>
      </section>
    );
  }

  const ui = STATUS_UI[order.status] ?? STATUS_UI.PENDING;
  const tone = TONE_CLASSES[ui.tone];
  const shortId = order.public_id.slice(0, 8).toUpperCase();
  const units = order.items.reduce((acc, i) => acc + i.quantity, 0);
  const attendees = order.items.flatMap((i) =>
    (i.attendees ?? []).filter((a) => a.email).map((a) => ({ ...a, course: i.title_snapshot }))
  );

  return (
    <section className="bg-neutral-0 py-16 md:py-24">
      <Container className="max-w-2xl">
        <div className={`border ${tone.ring} p-6 md:p-8`}>
          <div className="mb-3 flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} aria-hidden />
            <span className={`text-xs font-semibold uppercase tracking-widest ${tone.text}`}>
              Orden #{shortId}
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 md:text-3xl">
            {ui.title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{ui.desc(order)}</p>
        </div>

        <div className="mt-8 border border-neutral-200">
          <div className="border-b border-neutral-200 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Resumen · {units} {units === 1 ? "inscripción" : "inscripciones"}
            </h2>
            <ul className="mt-4 divide-y divide-neutral-200">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-start justify-between gap-4 py-3">
                  <span className="min-w-0 text-sm text-ink-800">
                    {it.quantity > 1 && (
                      <span className="mr-1.5 font-semibold text-ink-900">{it.quantity}×</span>
                    )}
                    {it.title_snapshot}
                    {it.session_label && (
                      <span className="mt-0.5 block text-xs text-neutral-500">
                        {it.session_label}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-medium text-ink-900">
                    {parseFloat(it.unit_price) === 0
                      ? "Gratis"
                      : formatARS(parseFloat(it.unit_price) * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-medium text-ink-900">{formatARS(order.subtotal)}</span>
            </div>

            {(order.discounts ?? []).map((d) => (
              <div key={d.promoId} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0 text-emerald-700">
                  {d.label}
                  <span className="ml-1 font-mono text-xs text-emerald-600">({d.code})</span>
                </span>
                <span className="shrink-0 font-medium text-emerald-700">
                  −{formatARS(d.amount)}
                </span>
              </div>
            ))}

            <div className="flex items-baseline justify-between border-t border-neutral-200 pt-3">
              <span className="font-semibold text-ink-900">Total</span>
              <span className="text-right">
                <span className="block font-display text-xl font-semibold text-ink-900">
                  {parseFloat(order.total) === 0 ? "Gratis" : formatARS(order.total)}
                </span>
                {order.payment_method === "PAYPAL" && order.total_usd && (
                  <span className="block text-xs text-neutral-500">
                    cobrado como {formatUSD(order.total_usd)}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Participantes cargados en la compra */}
        {attendees.length > 0 && (
          <div className="mt-8 border border-neutral-200 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Participantes
            </h2>
            <ul className="mt-4 divide-y divide-neutral-200">
              {attendees.map((a, i) => (
                <li key={i} className="flex items-start justify-between gap-4 py-3">
                  <span className="min-w-0 text-sm text-ink-800">
                    {a.name || "Sin nombre"}
                    <span className="mt-0.5 block text-xs text-neutral-500">{a.course}</span>
                  </span>
                  <span className="shrink-0 text-sm text-neutral-600">{a.email}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <dl className="mt-6 grid grid-cols-1 gap-x-12 sm:grid-cols-2">
          <Row label="Comprador" value={order.buyer_name} />
          <Row label="Email" value={order.buyer_email} />
          {order.buyer_phone && <Row label="Teléfono" value={order.buyer_phone} />}
          <Row label="Medio de pago" value={METHOD_LABEL[order.payment_method]} />
          {order.paid_at && <Row label="Fecha de pago" value={formatDate(order.paid_at)} />}
        </dl>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/formacion" className={buttonClasses({ variant: "outline", size: "md" })}>
            Volver a formación
          </Link>
          {(order.status === "FAILED" || order.status === "CANCELLED") && (
            <Link href="/carrito" className={buttonClasses({ variant: "primary", size: "md" })}>
              Reintentar compra
            </Link>
          )}
          {order.status === "FAILED" && (
            <a
              href="https://wa.me/5493446507779"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "ghost", size: "md" })}
            >
              Coordinar otro medio de pago
            </a>
          )}
        </div>
      </Container>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-neutral-200 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}
