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
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { confirmarPago, courseById, getOrder } from "@/lib/api";
import { clearCart, saveCart } from "@/lib/cart";
import { formatARS, formatDate, formatUSD } from "@/lib/formatters";
import { CONTACT } from "@/lib/contact";
import { pegar } from "@/lib/texto";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { enlaceGoogleCalendar } from "@/lib/calendario";
import { MODALIDAD } from "@/components/checkout/pase";
import { MercadoPagoLogo } from "@/components/checkout/mercado-pago";
import { StripeLogo } from "@/components/checkout/stripe";
import { STRIPE_ENABLED } from "@/lib/pagos";
import { PaseImpreso, type DatosPase } from "./pase-impreso";
import type { CartItem, Order, OrderItem, MedioDePago } from "@/types";

const METODO: Record<MedioDePago, string> = {
  MERCADOPAGO: "Mercado Pago",
  STRIPE: "Stripe",
  TRANSFER: "Transferencia",
};

const TZ = "America/Argentina/Buenos_Aires";
const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

/** Completa con el catálogo lo que las órdenes anteriores al rediseño no guardaron. */
async function completar(it: OrderItem): Promise<OrderItem> {
  if (it.code && it.modality) return it;
  const c = it.course_id != null ? await courseById(it.course_id).catch(() => undefined) : undefined;
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
    // Vuelta del pago: Mercado Pago trae payment_id y Stripe session_id (KAN-42). El estado
    // se confirma con el medio de pago antes de mostrar la orden; si se aprobó, se vacía el carrito.
    const q = new URLSearchParams(window.location.search);
    const paymentId = q.get("payment_id");
    const sessionId = q.get("session_id");
    const ids =
      sessionId && sessionId.startsWith("cs_")
        ? { session_id: sessionId }
        : paymentId && paymentId !== "null"
          ? { payment_id: paymentId }
          : null;
    const confirmar = ids
      ? confirmarPago(publicId, ids).then((s) => {
          if (s === "PAID") clearCart();
        })
      : Promise.resolve();
    confirmar
      .then(() => getOrder(publicId))
      .then(async (o) => ({ ...o, items: await Promise.all(o.items.map(completar)) }))
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

  // Pago en curso: el aviso de Mercado Pago puede llegar unos segundos después de la vuelta.
  // Se le vuelve a preguntar al servidor cada 5 segundos, hasta 2 minutos.
  const pendiente = order?.status === "PENDING";
  useEffect(() => {
    if (!pendiente) return;
    let vueltas = 0;
    const id = window.setInterval(() => {
      vueltas += 1;
      getOrder(publicId)
        .then(async (o) => {
          if (o.status === "PENDING") return;
          if (o.status === "PAID") clearCart();
          setOrder({ ...o, items: await Promise.all(o.items.map(completar)) });
        })
        .catch(() => undefined);
      if (vueltas >= 24) window.clearInterval(id);
    }, 5000);
    return () => window.clearInterval(id);
  }, [pendiente, publicId]);

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
  const router = useRouter();
  const pagada = order.status === "PAID" || order.status === "FULFILLED";
  // Rechazada o cancelada: la misma pantalla, con el sello «Sin cobrar» y las formas de
  // reintentar en lugar de los próximos pasos (2026-11-24, Mateo: «La 1» con las filas de la 3).
  const fallida = order.status === "FAILED" || order.status === "CANCELLED";
  const cancelada = order.status === "CANCELLED";
  const [rearmando, setRearmando] = useState<MedioDePago | null>(null);
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
${formatDate(order.paid_at).replace(", ", ", ")}` : ""}`;
  const total = gratis
    ? "Gratis"
    : order.currency === "USD"
      ? formatUSD(order.total)
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
    sello: pagada ? "Pagado" : fallida ? "Sin cobrar" : "Pendiente",
    selloTono: pagada ? "ok" : fallida ? "void" : "wait",
  };

  // Google Calendar con el evento ya cargado (sin DNI ni correo en el enlace).
  const agenda = first.starts_at
    ? enlaceGoogleCalendar({
        titulo: `ELEVAR · ${first.code ?? ""} ${first.title_snapshot}`.replace(/\s+/g, " ").trim(),
        inicio: first.starts_at,
        fin: first.ends_at ?? new Date(new Date(first.starts_at).getTime() + 2 * 3600e3).toISOString(),
        detalle: [
          `Orden #${orden}`,
          ...(first.modality ? [`Modalidad: ${MODALIDAD[first.modality]}`] : []),
          `Tu pase: ${window.location.origin}/orden/${order.public_id}`,
          `Consultas por WhatsApp: ${CONTACT.whatsappUrl}`,
        ].join("\n"),
      })
    : null;

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

  // Sin pagar: el texto depende del medio y de si el pago se rechazó (2026-11-19: una orden de
  // Stripe sin pagar decía «Mercado Pago todavía no acreditó el pago»).
  const textoSinPagar = cancelada
    ? "La orden se canceló y no se cobró nada. Si fue un error, la podés pagar de nuevo."
    : fallida
      ? `${order.payment_method === "STRIPE" ? "Stripe" : "Mercado Pago"} no aprobó la tarjeta. Podés pagar de nuevo con otra tarjeta u otro medio.`
      : order.payment_method === "STRIPE"
      ? "Todavía no se completó el pago con Stripe. Si lo cancelaste, podés volver a intentarlo desde el carrito."
      : "Mercado Pago todavía no acreditó el pago. Si pagaste en efectivo, puede tardar hasta 48 h.";

  // Reintentar: el carrito se vuelve a armar con los cursos de la orden (anda aunque el link se
  // abra en otro navegador) y el pago abre con ese medio ya elegido.
  async function reintentar(medio: MedioDePago) {
    setRearmando(medio);
    const items: CartItem[] = [];
    for (const it of order.items) {
      const c = it.course_id != null ? await courseById(it.course_id).catch(() => undefined) : undefined;
      if (!c) continue;
      items.push({
        courseId: c.id,
        sessionId: it.session_id ?? null,
        titleSnapshot: c.title,
        unitPrice: c.price,
        currency: "ARS",
        modality: c.modality,
        code: c.code,
        sessionLabel: it.session_label ?? undefined,
        quantity: it.quantity,
        attendees: it.attendees,
      });
    }
    if (items.length > 0) saveCart(items);
    router.push(items.length > 0 ? `/checkout?medio=${medio}` : "/formacion");
  }

  const reintentos = [
    { id: "MERCADOPAGO" as const, logo: (
        <span className="grid h-9 w-12 place-items-center rounded-full bg-neutral-0">
          <MercadoPagoLogo withWordmark={false} size={30} />
        </span>
      ), titulo: "Pagar con Mercado Pago", texto: "Otra tarjeta, débito, efectivo o dinero en cuenta.", accion: "Reintentar" },
    ...(STRIPE_ENABLED
      ? [{ id: "STRIPE" as const, logo: <StripeLogo blanco size={20} />, titulo: "Pagar en dólares con Stripe", texto: "Si estás fuera de Argentina.", accion: "Reintentar" }]
      : []),
  ];

  const pasos = [
    ...(first.starts_at && agenda
      ? [{ n: "01", titulo: "Agendá la fecha", texto: `${fecha(first.starts_at)}, ${hora(first.starts_at)} h.`, accion: "Agregar a Google Calendar", href: agenda }]
      : []),
    { n: first.starts_at ? "02" : "01", titulo: "Tu comprobante", texto: "Con el detalle de la compra, para ver o descargar en PDF.", accion: "Ver comprobante", interno: `/orden/${order.public_id}/comprobante` },
    { n: first.starts_at ? "03" : "02", titulo: "¿Dudas?", texto: "Te respondemos por WhatsApp.", accion: "Escribinos", href: CONTACT.whatsappUrl },
  ];

  return (
    <section ref={scope} className="relative min-h-screen overflow-hidden bg-ink-900 text-neutral-0">
      <style>{`@media print{@page{margin:12mm}body *{visibility:hidden!important}.im-pase,.im-pase *{visibility:visible!important}.im-pase{position:absolute;left:0;top:0;width:100%;max-width:520px}}`}</style>
      <Container className="grid gap-12 py-12 sm:py-16 lg:min-h-[calc(100vh-6.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(440px,42%)] lg:items-center lg:gap-16 lg:py-10">
        <div className="min-w-0">
          <p className="im-bajada flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.18em] text-neutral-0/70">
            <span className={`h-2 w-2 rounded-full ${pagada ? "bg-emerald-400" : fallida ? "bg-red-400" : "bg-amber-400"}`} aria-hidden />
            <span>
              <span className="whitespace-nowrap">Orden #{orden} ·</span>{" "}
              <span className="whitespace-nowrap">{pagada ? (gratis ? "Inscripción confirmada" : "Pago aprobado") : fallida ? "Pago no aprobado" : "Pago pendiente"}</span>
            </span>
          </p>
          <h1 className="mt-5 font-display font-semibold leading-[1.02] tracking-tight">
            <span className="block overflow-hidden pb-[0.08em]">
              {fallida ? (
                // Más largo que «¡Listo, Mateo!»: un escalón menos y el corte después de la coma.
                <span className="im-linea block text-[40px] sm:text-5xl xl:text-6xl">
                  <span className="whitespace-nowrap">{nombre},</span> <span className="whitespace-nowrap">el pago no pasó.</span>
                </span>
              ) : (
                <span className="im-linea block whitespace-nowrap text-[44px] sm:text-6xl xl:text-7xl">
                  {pagada ? "¡Listo" : "¡Gracias"}, {nombre}!
                </span>
              )}
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="im-linea mt-2 block text-balance text-[26px] leading-[1.1] text-brand-500 sm:whitespace-nowrap sm:text-4xl xl:text-5xl">{pagada ? pegar("Tu lugar está reservado.") : fallida ? pegar("No se cobró nada.") : pegar("Tu lugar te espera.")}</span>
            </span>
          </h1>
          <p className="im-bajada mt-6 text-pretty text-[17px] leading-relaxed text-neutral-0/75">
            {pagada
              ? pegar(`Este pase es tu comprobante de inscripción${first.code ? ` a ${first.code}` : ""}.`)
              : pegar(textoSinPagar)}
          </p>

          {/* En el teléfono el pase va después del título */}
          <div className="mt-10 lg:hidden">
            <PaseImpreso d={datos} />
          </div>

          {fallida ? (
            <ul className="mt-12 border-t border-neutral-0/15 lg:mt-14">
              {reintentos.map((r) => (
                <li key={r.id} className="im-paso border-b border-neutral-0/15">
                  <button
                    type="button"
                    onClick={() => reintentar(r.id)}
                    disabled={rearmando != null}
                    className="group grid w-full grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-4 py-5 text-left transition-[padding] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:pl-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 disabled:opacity-60"
                  >
                    <span className="flex h-10 items-center">{r.logo}</span>
                    <span className="min-w-0">
                      <span className="block font-display text-lg font-semibold">{r.titulo}</span>
                      <span className="block text-[15px] text-neutral-0/65">{pegar(r.texto)}</span>
                    </span>
                    <span className="flex items-center gap-2 justify-self-end whitespace-nowrap text-sm font-semibold text-neutral-0 transition-colors duration-500 group-hover:text-brand-500">
                      <span className="hidden sm:inline">{rearmando === r.id ? "Abriendo…" : r.accion}</span>
                      <Flecha />
                    </span>
                  </button>
                </li>
              ))}
              <li className="im-paso border-b border-neutral-0/15">
                <a
                  href={CONTACT.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Transferencia o factura a empresa: escribinos por WhatsApp"
                  className="group grid w-full grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-4 py-5 text-left transition-[padding] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:pl-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
                >
                  <span className="flex h-10 items-center text-neutral-0/80"><IconoWhatsApp /></span>
                  <span className="min-w-0">
                    <span className="block font-display text-lg font-semibold">{pegar("Transferencia o factura a empresa")}</span>
                    <span className="block text-[15px] text-neutral-0/65">{pegar("Lo coordinamos por WhatsApp.")}</span>
                  </span>
                  <span className="flex items-center gap-2 justify-self-end whitespace-nowrap text-sm font-semibold text-neutral-0 transition-colors duration-500 group-hover:text-brand-500">
                    <span className="hidden sm:inline">Escribinos</span>
                    <Flecha />
                  </span>
                </a>
              </li>
            </ul>
          ) : (
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
                  {"interno" in p && p.interno ? (
                    <Link href={p.interno} className={cls} aria-label={`${p.titulo}: ${p.accion}`}>
                      {contenido}
                    </Link>
                  ) : "href" in p && p.href ? (
                    <a href={p.href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={`${p.titulo} ${p.accion}`}>
                      {contenido}
                    </a>
                  ) : (
                    <span className={cls}>{contenido}</span>
                  )}
                </li>
              );
            })}
          </ol>
          )}

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

const Flecha = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** WhatsApp en línea, para la fila de transferencia o factura. */
const IconoWhatsApp = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.76-1.85-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
  </svg>
);
