"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { getOrder } from "@/lib/api";
import { formatARS, formatDate } from "@/lib/formatters";
import type { Order, OrderStatus } from "@/types";

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
    desc: () => "Estamos esperando la confirmación del pago. Te avisaremos por email apenas se acredite.",
  },
  FAILED: {
    tone: "bad",
    title: "El pago no se completó",
    desc: () => "No se pudo procesar el pago. Podés intentarlo nuevamente desde el catálogo.",
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
              Resumen
            </h2>
            <ul className="mt-4 divide-y divide-neutral-200">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-start justify-between gap-4 py-3">
                  <span className="text-sm text-ink-800">{it.title_snapshot}</span>
                  <span className="shrink-0 text-sm font-medium text-ink-900">
                    {parseFloat(it.unit_price) === 0 ? "Gratis" : formatARS(it.unit_price)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-baseline justify-between p-6">
            <span className="font-semibold text-ink-900">Total</span>
            <span className="font-display text-xl font-semibold text-ink-900">
              {parseFloat(order.total) === 0 ? "Gratis" : formatARS(order.total)}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-x-12 sm:grid-cols-2">
          <Row label="Comprador" value={order.buyer_name} />
          <Row label="Email" value={order.buyer_email} />
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
