/**
 * Datos del comprobante de inscripción (2026-11-18). Los arma una sola vez a partir de la
 * orden, y los usan las dos salidas: la página (`components/order/comprobante.tsx`) y el PDF
 * (`components/order/comprobante-pdf.tsx`). Así lo que se ve y lo que se descarga es lo mismo.
 * Textos de «Qué sigue» tomados de las fichas de cada modalidad (lib/formacion-templates.ts).
 */
import type { Modality, Order } from "@/types";
import { CONTACT } from "@/lib/contact";

const TZ = "America/Argentina/Buenos_Aires";

const MODALIDAD: Record<Modality, string> = {
  ASYNC: "Curso asincrónico",
  LIVE: "Curso online en vivo",
  WEBINAR: "Webinar gratuito",
  EBOOK: "E-Book",
};

const METODO: Record<Order["payment_method"], string> = {
  MERCADOPAGO: "Mercado Pago",
  STRIPE: "Stripe",
  TRANSFER: "Transferencia bancaria",
};

const pesos = (n: number) =>
  `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  });

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

export interface LineaComprobante {
  codigo: string;
  titulo: string;
  modalidad: string;
  cuando: string;
  cantidad: number;
  unitario: string;
  importe: string;
  participantes: { nombre: string; correo: string }[];
}

export interface Comprobante {
  numero: string;
  estado: "PAGADO" | "PENDIENTE" | "NO PAGADO";
  emitido: string;
  comprador: { etiqueta: string; valor: string }[];
  emisor: string[];
  lineas: LineaComprobante[];
  subtotal: string;
  descuento: { etiqueta: string; importe: string } | null;
  total: string;
  pago: { etiqueta: string; valor: string }[];
  pasos: { titulo: string; texto: string }[];
  url: string;
  archivo: string;
}

export function numeroDeOrden(publicId: string): string {
  return publicId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function armarComprobante(order: Order, origen: string): Comprobante {
  const numero = numeroDeOrden(order.public_id);
  const pagada = order.status === "PAID" || order.status === "FULFILLED";
  const estado = pagada ? "PAGADO" : order.status === "PENDING" ? "PENDIENTE" : "NO PAGADO";
  const modalidades = new Set(order.items.map((i) => i.modality).filter(Boolean));
  // Una orden pagada con Stripe está en dólares (KAN-42).
  const monto = (n: number) =>
    order.currency === "USD"
      ? `US$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : pesos(n);

  const lineas: LineaComprobante[] = order.items.map((it) => {
    const unit = parseFloat(it.unit_price);
    const cuando = it.starts_at
      ? `${fechaLarga(it.starts_at)}, ${hora(it.starts_at)}${it.ends_at ? ` a ${hora(it.ends_at)}` : ""} h`
      : it.session_label ?? (it.modality === "ASYNC" ? "A tu ritmo, 90 días de acceso" : "");
    return {
      codigo: it.code ?? "",
      titulo: it.title_snapshot,
      modalidad: it.modality ? MODALIDAD[it.modality] : "",
      cuando,
      cantidad: it.quantity,
      unitario: monto(unit),
      importe: monto(unit * it.quantity),
      participantes: (it.attendees ?? [])
        .filter((a) => a.name || a.email)
        .map((a) => ({ nombre: a.name, correo: a.email })),
    };
  });

  const descuentoNum = parseFloat(order.discount_total || "0");
  const etiquetaDescuento = order.discounts?.[0]?.label ?? "Descuento";

  const pasos: Comprobante["pasos"] = [];
  if (modalidades.has("ASYNC") || modalidades.has("LIVE")) {
    pasos.push({
      titulo: "Te damos acceso en 24 horas",
      texto: `Dentro de las 24 h del pago te mandamos a ${order.buyer_email} el usuario y la contraseña de la plataforma de capacitación de ELEVAR.`,
    });
  }
  if (modalidades.has("LIVE")) {
    pasos.push({
      titulo: "El enlace del encuentro está en la plataforma",
      texto: "El día del curso entrás a la sala con el enlace que publicamos en la plataforma.",
    });
  }
  if (modalidades.has("ASYNC")) {
    pasos.push({
      titulo: "Tenés 90 días para cursar",
      texto: "Desde que recibís el acceso. Al terminar el ejercicio final se emite tu certificado.",
    });
  }
  pasos.push({
    titulo: "¿Alguna duda?",
    texto: `Escribinos a ${CONTACT.email} o por WhatsApp al ${CONTACT.phoneShort}, con tu número de orden #${numero}.`,
  });

  return {
    numero,
    estado,
    emitido: fechaCorta(order.paid_at ?? order.created_at),
    comprador: [
      { etiqueta: "Nombre", valor: order.buyer_name },
      ...(order.buyer_dni ? [{ etiqueta: "DNI", valor: order.buyer_dni }] : []),
      ...(order.buyer_company ? [{ etiqueta: "Empresa", valor: order.buyer_company }] : []),
      { etiqueta: "Correo", valor: order.buyer_email },
      ...(order.buyer_phone ? [{ etiqueta: "Teléfono", valor: order.buyer_phone }] : []),
    ],
    emisor: ["ELEVAR · Consultoría de calidad para laboratorios", CONTACT.address, CONTACT.email, `WhatsApp ${CONTACT.phoneShort}`],
    lineas,
    subtotal: monto(parseFloat(order.subtotal)),
    descuento: descuentoNum > 0 ? { etiqueta: etiquetaDescuento, importe: `− ${monto(descuentoNum)}` } : null,
    total: monto(parseFloat(order.total)),
    pago: [
      { etiqueta: "Medio de pago", valor: METODO[order.payment_method] ?? "Mercado Pago" },
      { etiqueta: "Estado", valor: pagada ? "Aprobado" : order.status === "PENDING" ? "Pendiente de acreditación" : "No se cobró" },
      ...(order.paid_at ? [{ etiqueta: "Fecha de pago", valor: fechaCorta(order.paid_at) }] : []),
      { etiqueta: "Moneda", valor: "Pesos argentinos (ARS)" },
    ],
    pasos,
    url: `${origen}/orden/${order.public_id}`,
    archivo: `ELEVAR-comprobante-${numero}.pdf`,
  };
}
