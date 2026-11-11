"use client";

/**
 * Página de la orden (rediseño 2026-11-11, referencia elegida por Mateo: Framer · Receipt
 * Printer). Fondo tinta como el lado del pase en el checkout; el pase naranja sale impreso
 * de una ranura y recibe el sello. Animación (GSAP, ~3,4 s):
 *   0,0 s  la ranura se dibuja de los bordes al centro (0,6 s)
 *   0,2 s  el título sube desde su máscara, línea por línea (1,2 s)
 *   0,5 s  el pase sale de la ranura hacia arriba (1,8 s, power2.inOut)
 *   1,3 s  las letras del código suben, una cada 0,07 s
 *   2,3 s  cae el sello (0,45 s) y el pase se sacude apenas
 *   2,6 s  los próximos pasos entran de a uno cada 0,1 s
 * Con movimiento reducido se ve el estado final.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { confirmMercadoPago, courseById, getOrder } from "@/lib/api";
import { clearCart } from "@/lib/cart";
import { formatARS, formatDate, formatUSD } from "@/lib/formatters";
import { CONTACT } from "@/lib/contact";
import { pegar } from "@/lib/texto";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { descargarIcs, eventoIcs } from "@/lib/calendario";
import { MODALIDAD } from "@/components/checkout/pase";
import { PaseImpreso, type DatosPase } from "./pase-impreso";
import type { Order, OrderItem, PaymentMethod } from "@/types";

const METODO: Record<PaymentMethod, string> = {
  MERCADOPAGO: "Mercado Pago",
  PAYPAL: "PayPal",
  TRANSFER: "Transferencia",
};

const TZ = "America/Argentina/Buenos_Aires";
const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

/** Completa con el catálogo lo que las órdenes anteriores al rediseño no guardaron. */
function completar(it: OrderItem): OrderItem {
  if (it.code && it.modality) return it;
  const c = it.course_id != null ? courseById(it.course_id) : undefined;
  if (!c) return it;
  const s = c.sessions[0];
  return {
    ...it,
    code: it.code ?? c.code,
    modality: it.modality ?? c.modality,
    starts_at: it.starts_at ?? (it.session_label && s ? s.starts_at : null),
    ends_at: it.ends_at ?? (it.session_label && s ? s.ends_at : null),
  };
}

export function OrderStatusClient({ publicId }: { publicId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let cancelled = false;
    // Vuelta de Mercado Pago (Checkout Pro): trae payment_id. El estado se confirma con
    // Mercado Pago antes de mostrar la orden; si se aprobó, se vacía el carrito.
    const paymentId = new URLSearchParams(window.location.search).get("payment_id");
    const confirmar =
      paymentId && paymentId !== "null"
        ? confirmMercadoPago(publicId, paymentId).then((s) => {
            if (s === "PAID") clearCart();
          })
        : Promise.resolve();
    confirmar
      .then(() => getOrder(publicId))
      .then((o) => {
        if (!cancelled) {
          setOrder({ ...o, items: o.items.map(completar) });
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
      <Fondo>
        <div className="flex min-h-[60vh] items-center">
          <p className="text-neutral-0/70">{pegar("Confirmando tu pago…")}</p>
        </div>
      </Fondo>
    );
  }

  if (state === "missing" || !order) {
    return (
      <Fondo>
        <div className="max-w-2xl py-24">
          <h1 className="text-balance font-display text-4xl font-semibold tracking-tight">No encontramos esta orden</h1>
          <p className="mt-4 text-[17px] text-neutral-0/75">
            {pegar("El enlace puede haber expirado o la orden se abrió en otro navegador.")}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/formacion" className={BTN_PRIMARIO}>Volver a formación</Link>
            <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className={BTN_LINEA}>
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </Fondo>
    );
  }

  if (order.status === "FAILED" || order.status === "CANCELLED") return <Fallida order={order} />;
  return <Confirmada order={order} />;
}

// Botones sobre tinta: relleno que sube al pasar el mouse (0,8 s), como los del sitio.
const BTN_BASE =
  "group relative isolate inline-flex h-12 items-center justify-center gap-2 overflow-hidden px-7 text-sm font-semibold tracking-wide transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-neutral-0 before:transition-transform before:duration-[800ms] before:ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-ink-900 hover:before:scale-y-100 motion-reduce:before:duration-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";
const BTN_PRIMARIO = `${BTN_BASE} bg-brand-500 text-neutral-0`;
const BTN_LINEA = `${BTN_BASE} border border-neutral-0/30 text-neutral-0`;

function Fondo({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-ink-900 text-neutral-0">
      <Container>{children}</Container>
    </section>
  );
}

function Confirmada({ order }: { order: Order }) {
  const scope = useRef<HTMLDivElement>(null);
  const pagada = order.status === "PAID" || order.status === "FULFILLED";
  const first = order.items[0];
  const resto = order.items.length - 1;
  const units = order.items.reduce((acc, i) => acc + i.quantity, 0);
  const pila = order.buyer_name.trim().split(/\s+/)[0] ?? "";
  const nombre = pila.charAt(0).toUpperCase() + pila.slice(1);
  const orden = order.public_id.slice(0, 8).toUpperCase();
  const gratis = parseFloat(order.total) === 0;

  const filas: DatosPase["filas"] = [
    { label: "Participante", value: order.buyer_name },
    ...(order.buyer_dni ? [{ label: "DNI", value: order.buyer_dni }] : []),
    ...(order.buyer_company ? [{ label: "Empresa", value: order.buyer_company }] : []),
    { label: "Correo", value: order.buyer_email, ancho: true },
    ...(first.starts_at
      ? [
          { label: "Fecha", value: fecha(first.starts_at) },
          { label: "Horario", value: first.ends_at ? `${hora(first.starts_at)} a ${hora(first.ends_at)} h` : `${hora(first.starts_at)} h` },
        ]
      : first.session_label
        ? [{ label: "Fecha", value: first.session_label }]
        : [{ label: "Acceso", value: "A tu ritmo, desde hoy" }]),
    ...(first.modality ? [{ label: "Modalidad", value: MODALIDAD[first.modality] }] : []),
  ];

  const pago = gratis
    ? "Inscripción sin costo"
    : `${METODO[order.payment_method]}${order.paid_at ? `
${formatDate(order.paid_at)}` : ""}`;
  const total = gratis
    ? "Gratis"
    : order.payment_method === "PAYPAL" && order.total_usd
      ? formatUSD(order.total_usd)
      : formatARS(order.total);

  const datos: DatosPase = {
    code: first.code ?? "ELEVAR",
    resto,
    titulo: first.title_snapshot,
    lugares: units,
    filas,
    orden,
    pago,
    total,
    sello: pagada ? "Pagado" : "Pendiente",
    selloTono: pagada ? "ok" : "wait",
  };

  function agendar() {
    if (!first.starts_at) return;
    const ics = eventoIcs({
      uid: `${order.public_id}-${first.course_id ?? 0}`,
      titulo: `ELEVAR · ${first.code ?? ""} ${first.title_snapshot}`.trim(),
      inicio: first.starts_at,
      fin: first.ends_at ?? new Date(new Date(first.starts_at).getTime() + 2 * 3600e3).toISOString(),
      detalle: `Orden #${orden}. Consultas: ${CONTACT.whatsappUrl}`,
      url: window.location.href.split("?")[0],
    });
    descargarIcs(`elevar-${(first.code ?? "curso").toLowerCase()}.ics`, ics);
  }

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline();
      tl.from(".im-ranura", { scaleX: 0, duration: 0.6, ease: "power3.inOut" }, 0)
        .from(".im-linea", { yPercent: 110, duration: 1.2, stagger: 0.12, ease: "expo.out" }, 0.2)
        .from(".im-bajada", { y: 18, autoAlpha: 0, duration: 1.0, ease: "power3.out" }, 0.6)
        .from(".im-papel", { yPercent: 102, duration: 1.8, ease: "power2.inOut" }, 0.5)
        .from(".im-char", { yPercent: 110, duration: 1.0, stagger: 0.07, ease: "expo.out" }, 1.3)
        .from(".im-sello", { scale: 2.4, rotate: -24, autoAlpha: 0, duration: 0.45, ease: "power4.in" }, 2.3)
        .to(".im-papel", { y: 3, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.inOut" }, 2.75)
        .from(".im-paso", { y: 24, autoAlpha: 0, duration: 1.0, stagger: 0.1, ease: "power3.out" }, 2.6);
    },
    { scope }
  );

  const pasos = [
    ...(first.starts_at
      ? [{ n: "01", titulo: "Agendá la fecha", texto: `${fecha(first.starts_at)}, ${hora(first.starts_at)} h.`, accion: "Agregar al calendario", onClick: agendar }]
      : []),
    { n: first.starts_at ? "02" : "01", titulo: "Guardá tu pase", texto: "Es tu comprobante de inscripción.", accion: "Imprimir o guardar PDF", onClick: () => window.print() },
    { n: first.starts_at ? "03" : "02", titulo: "¿Dudas?", texto: "Te respondemos por WhatsApp.", accion: "Escribinos", href: CONTACT.whatsappUrl },
  ];

  return (
    <section ref={scope} className="relative min-h-screen overflow-hidden bg-ink-900 text-neutral-0">
      <style>{`@media print{@page{margin:12mm}body *{visibility:hidden!important}.im-pase,.im-pase *{visibility:visible!important}.im-pase{position:absolute;left:0;top:0;width:100%;max-width:520px}}`}</style>
      <Container className="grid gap-12 py-12 sm:py-16 lg:min-h-[calc(100vh-6.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(440px,42%)] lg:items-center lg:gap-16 lg:py-10">
        <div className="min-w-0">
          <p className="im-bajada flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-neutral-0/70">
            <span className={`h-2 w-2 rounded-full ${pagada ? "bg-emerald-400" : "bg-amber-400"}`} aria-hidden />
            Orden #{orden} · {pagada ? (gratis ? "Inscripción confirmada" : "Pago aprobado") : "Pago pendiente"}
          </p>
          <h1 className="mt-5 font-display font-semibold leading-[1.02] tracking-tight">
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="im-linea block whitespace-nowrap text-[44px] sm:text-6xl xl:text-7xl">{pagada ? "¡Listo" : "¡Gracias"}, {nombre}!</span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="im-linea mt-2 block text-balance text-[26px] leading-[1.1] text-brand-500 sm:whitespace-nowrap sm:text-4xl xl:text-5xl">{pagada ? pegar("Tu lugar está reservado.") : pegar("Tu lugar te espera.")}</span>
            </span>
          </h1>
          <p className="im-bajada mt-6 max-w-[34rem] text-pretty text-[17px] leading-relaxed text-neutral-0/75">
            {pagada
              ? pegar(`Este pase es tu comprobante de inscripción${first.code ? ` a ${first.code}` : ""}.`)
              : pegar("Mercado Pago todavía no acreditó el pago. Si pagaste en efectivo, puede tardar hasta 48 h.")}
          </p>

          {/* En el teléfono el pase va después del título */}
          <div className="mt-10 lg:hidden">
            <PaseImpreso d={datos} />
          </div>

          <ol className="mt-12 border-t border-neutral-0/15 lg:mt-14">
            {pasos.map((p) => {
              const contenido = (
                <>
                  <span className="font-display text-sm font-semibold tabular-nums text-brand-500">{p.n}</span>
                  <span className="min-w-0">
                    <span className="block font-display text-lg font-semibold">{p.titulo}</span>
                    <span className="block text-[15px] text-neutral-0/65">{pegar(p.texto)}</span>
                  </span>
                  <span className="flex items-center gap-2 justify-self-end whitespace-nowrap text-sm font-semibold text-neutral-0 transition-colors duration-500 group-hover:text-brand-500">
                    <span className="hidden sm:inline">{p.accion}</span>
                    <Flecha />
                  </span>
                </>
              );
              const cls =
                "group grid w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-4 py-5 text-left transition-[padding] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:pl-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500";
              return (
                <li key={p.n} className="im-paso border-b border-neutral-0/15">
                  {"href" in p && p.href ? (
                    <a href={p.href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={`${p.titulo} ${p.accion}`}>
                      {contenido}
                    </a>
                  ) : (
                    <button type="button" onClick={p.onClick} className={cls} aria-label={`${p.titulo}: ${p.accion}`}>
                      {contenido}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="im-paso mt-10 flex flex-wrap gap-4">
            <Link href="/formacion" className={BTN_LINEA}>Volver a formación</Link>
          </div>
        </div>

        <div className="hidden lg:block">
          <PaseImpreso d={datos} />
        </div>
      </Container>
    </section>
  );
}

function Fallida({ order }: { order: Order }) {
  const orden = order.public_id.slice(0, 8).toUpperCase();
  const cancelada = order.status === "CANCELLED";
  return (
    <Fondo>
      <div className="max-w-2xl py-20 sm:py-28">
        <p className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-neutral-0/70">
          <span className="h-2 w-2 rounded-full bg-red-400" aria-hidden />
          Orden #{orden}
        </p>
        <h1 className="mt-5 text-balance font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
          {cancelada ? "La orden fue cancelada." : "El pago no se completó."}
        </h1>
        <p className="mt-6 text-pretty text-[17px] leading-relaxed text-neutral-0/75">
          {cancelada
            ? pegar("Esta orden ya no está activa. Si fue un error, volvé a iniciar la compra.")
            : pegar("No se cobró nada. Podés intentarlo de nuevo o coordinar otro medio de pago con nosotros.")}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/carrito" className={BTN_PRIMARIO}>Reintentar compra</Link>
          <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className={BTN_LINEA}>
            Coordinar por WhatsApp
          </a>
        </div>
      </div>
    </Fondo>
  );
}

const Flecha = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
