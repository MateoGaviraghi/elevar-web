import type {
  Attendee,
  Category,
  Course,
  Currency,
  Order,
  OrderItem,
  Paginated,
  PaymentMethod,
  Promo,
  CartItem,
  CartValidateResult,
  CheckoutResult,
  Lead,
  WebinarRegistration,
} from "@/types";
import { CATEGORIES, COURSES } from "@/lib/mock-catalog";
import {
  addLead,
  addWebinarRegistration,
  listCourses,
  listPromos,
} from "@/lib/content";
import { computePricing } from "@/lib/promos";
import { pegar, pegarOpt } from "@/lib/texto";
import { getStoredOrder, saveOrder, setOrderStatus } from "@/lib/orders-store";
import { arsToUsd } from "@/lib/formatters";
import { newId } from "@/lib/local-db";

// Mockup de Fase 0: el catálogo, las promociones y las órdenes son locales (sin
// backend). En el navegador leen la "base" de localStorage —así el panel de
// administración impacta en el sitio—; en el server usan los datos semilla.
// Las firmas quedan async para no tocar a quienes las consumen cuando llegue la API.

export class ApiError extends Error {
  code: string;
  status: number;
  fieldErrors: Record<string, string[]> | null;

  constructor(
    message: string,
    code: string,
    status: number,
    fieldErrors: Record<string, string[]> | null = null
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const isSessionBased = (m: Course["modality"]) => m === "LIVE" || m === "WEBINAR";
const money = (n: number) => n.toFixed(2);

function catalog(): Course[] {
  return typeof window === "undefined" ? COURSES : listCourses();
}

function promos(): Promo[] {
  return listPromos();
}

// ── Catálogo ──────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  return CATEGORIES;
}

export async function getCourses(params?: {
  modality?: string;
  category?: string;
  q?: string;
  featured?: boolean;
  page?: number;
}): Promise<Paginated<Course>> {
  let list = catalog().filter((c) => c.is_published !== false);
  if (params?.modality) list = list.filter((c) => c.modality === params.modality);
  if (params?.category) list = list.filter((c) => c.category?.slug === params.category);
  if (params?.featured !== undefined) list = list.filter((c) => c.is_featured === params.featured);
  if (params?.q) {
    const q = params.q.toLowerCase();
    list = list.filter(
      (c) => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }
  return { count: list.length, next: null, previous: null, results: list.map(paraMostrar) };
}

export async function getCourse(slug: string): Promise<Course> {
  const course = catalog().find((c) => c.slug === slug);
  if (!course) throw new ApiError("Curso no encontrado.", "NOT_FOUND", 404);
  return paraMostrar(course);
}

/** Textos del curso listos para mostrar, sin frases partidas en una palabra de enlace
 * (lib/texto.ts). Va a la salida, después de filtrar: la búsqueda y los slugs usan el texto
 * original. Los buscadores sobre cursos ya entregados comparan con `sinDuros()`. */
function paraMostrar(c: Course): Course {
  return {
    ...c,
    title: pegar(c.title),
    summary: pegar(c.summary),
    description: pegarOpt(c.description),
    lead: pegarOpt(c.lead),
    objectives: pegarOpt(c.objectives),
    syllabus: c.syllabus?.map(pegar),
    instructor: c.instructor ? { ...c.instructor, role: pegar(c.instructor.role) } : c.instructor,
  };
}

// ── Promociones ───────────────────────────────────────────────────────────────

export async function getPromos(params?: { featured?: boolean }): Promise<Promo[]> {
  const now = new Date();
  return promos().filter((p) => {
    if (!p.active) return false;
    if (p.startsAt && new Date(p.startsAt) > now) return false;
    if (p.endsAt && new Date(p.endsAt) < now) return false;
    if (params?.featured !== undefined && p.featured !== params.featured) return false;
    return true;
  });
}

// ── Carrito / checkout ────────────────────────────────────────────────────────

export async function validateCart(
  items: CartItem[],
  couponCode?: string | null
): Promise<CartValidateResult> {
  const list = catalog();
  const resultItems: CartValidateResult["items"] = [];

  // Una línea que ya no se puede comprar (curso borrado del catálogo, fecha que cambió o
  // pasó, sin cupo) no hace fallar todo el carrito: queda marcada y no suma al total
  // (2026-11-04: un CV45 viejo en el carrito dejaba el checkout cargando para siempre).
  const unavailable = (item: CartItem, reason: string) =>
    resultItems.push({
      course_id: item.courseId,
      session_id: item.sessionId,
      title: item.titleSnapshot,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: money(0),
      available: false,
      seats_available: null,
      unavailable_reason: reason,
    });

  items.forEach((item) => {
    const course = list.find((c) => c.id === item.courseId);
    if (!course) return unavailable(item, "Este curso ya no está disponible.");

    let session = null;
    if (isSessionBased(course.modality)) {
      session = (course.sessions ?? []).find((s) => s.id === item.sessionId) ?? null;
      if (!session) return unavailable(item, "Esta fecha ya no está disponible.");
    }

    let available = true;
    let reason: string | undefined;
    if (session) {
      if (session.status !== "SCHEDULED") {
        available = false;
        reason = "Esta fecha ya pasó.";
      }
      // Con cupo limitado, la cantidad pedida no puede superar las vacantes.
      else if (session.capacity != null && (session.seats_available ?? 0) < item.quantity) {
        available = false;
        reason = "No quedan vacantes suficientes.";
      }
    }

    const lineTotal = parseFloat(course.price) * item.quantity;

    resultItems.push({
      course_id: course.id,
      session_id: session?.id ?? null,
      title: course.title,
      unit_price: course.price,
      quantity: item.quantity,
      line_total: money(lineTotal),
      available,
      seats_available: session?.seats_available ?? null,
      ...(reason ? { unavailable_reason: reason } : {}),
    });
  });

  // El total sale solo de las líneas que se pueden comprar.
  const buyable = items.filter((_, i) => resultItems[i]?.available);
  const pricing = computePricing({ items: buyable, promos: promos(), couponCode });

  return {
    valid: resultItems.every((it) => it.available),
    items: resultItems,
    subtotal: money(pricing.subtotal),
    discounts: pricing.discounts,
    discount_total: money(pricing.discountTotal),
    total: money(pricing.total),
    coupon_error: pricing.couponError,
  };
}

export interface CheckoutPayload {
  buyer: {
    email: string;
    name: string;
    phone?: string;
    company?: string;
  };
  items: CartItem[];
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
}

export async function checkout(payload: CheckoutPayload): Promise<CheckoutResult> {
  const list = catalog();
  const orderItems: OrderItem[] = [];

  payload.items.forEach((item, i) => {
    const course = list.find((c) => c.id === item.courseId);
    if (!course) {
      throw new ApiError("Hay un curso inválido en el carrito.", "VALIDATION_ERROR", 400, {
        [`items.${i}.course_id`]: ["Curso no encontrado."],
      });
    }
    if (isSessionBased(course.modality) && item.sessionId == null) {
      throw new ApiError("Falta elegir una fecha/sesión.", "VALIDATION_ERROR", 400, {
        [`items.${i}.session_id`]: ["Elegí una fecha/sesión."],
      });
    }
    orderItems.push({
      course_id: course.id,
      title_snapshot: course.title,
      unit_price: course.price,
      quantity: item.quantity,
      session_label: item.sessionLabel ?? null,
      attendees: normalizeAttendees(item.attendees, item.quantity),
    });
  });

  const pricing = computePricing({
    items: payload.items,
    promos: promos(),
    couponCode: payload.couponCode,
  });

  const publicId = newId("ord").replace("ord-", "");
  const currency: Currency = payload.paymentMethod === "PAYPAL" ? "USD" : "ARS";

  const order: Order = {
    public_id: publicId,
    status: "PENDING",
    buyer_email: payload.buyer.email,
    buyer_name: payload.buyer.name,
    buyer_phone: payload.buyer.phone,
    buyer_company: payload.buyer.company,
    subtotal: money(pricing.subtotal),
    discount_total: money(pricing.discountTotal),
    discounts: pricing.discounts,
    coupon_code: pricing.appliedCoupon?.code ?? null,
    total: money(pricing.total),
    currency: "ARS",
    payment_method: payload.paymentMethod,
    total_usd: currency === "USD" ? arsToUsd(pricing.total).toFixed(2) : null,
    created_at: new Date().toISOString(),
    paid_at: null,
    items: orderItems,
  };
  saveOrder(order);

  // Todo comprador queda registrado como contacto (lo consulta el panel).
  addLead({
    name: payload.buyer.name,
    email: payload.buyer.email,
    phone: payload.buyer.phone,
    company: payload.buyer.company,
    subject: `Compra ${publicId.slice(0, 8).toUpperCase()}`,
    message: orderItems.map((i) => `${i.quantity}× ${i.title_snapshot}`).join(" · "),
    source: "COMPRA",
  });

  // Mercado Pago: página oficial (Checkout Pro) si el servidor tiene MP_ACCESS_TOKEN;
  // si no está configurado, la pantalla de prueba propia. PayPal sigue simulado.
  let initPoint =
    payload.paymentMethod === "PAYPAL" ? `/pago-paypal/${publicId}` : `/pago-mp/${publicId}`;
  if (payload.paymentMethod === "MERCADOPAGO") {
    const mp = await fetch("/api/mercadopago/orden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicId,
        email: payload.buyer.email,
        total: order.total,
        items: orderItems.map((i) => ({
          title: i.title_snapshot,
          unit_price: i.unit_price,
          quantity: i.quantity,
        })),
      }),
    }).catch(() => null);
    if (mp?.ok) {
      const { checkout_url } = (await mp.json()) as { checkout_url: string };
      initPoint = checkout_url;
    } else if (mp && mp.status !== 503) {
      throw new ApiError("No pudimos iniciar el pago con Mercado Pago. Probá de nuevo.", "MP_ERROR", 502);
    }
  }

  return {
    order_public_id: publicId,
    init_point: initPoint,
    mp_preference_id: `MOCK-${publicId}`,
    subtotal: order.subtotal,
    discount_total: order.discount_total,
    total: order.total,
    currency,
    payment_method: payload.paymentMethod,
  };
}

function normalizeAttendees(
  attendees: Attendee[] | undefined,
  quantity: number
): Attendee[] | undefined {
  if (!attendees || attendees.length === 0) return undefined;
  return attendees
    .slice(0, quantity)
    .filter((a) => a.email.trim() || a.name.trim())
    .map((a) => ({ name: a.name.trim(), email: a.email.trim() }));
}

export async function simulatePayment(payload: {
  order_public_id: string;
  outcome: "approved" | "rejected" | "pending";
}): Promise<{ status: string; order_public_id: string; order_status: Order["status"] }> {
  const map = {
    approved: "PAID",
    rejected: "FAILED",
    pending: "PENDING",
  } as const;
  const status = map[payload.outcome] as Order["status"];
  setOrderStatus(
    payload.order_public_id,
    status,
    payload.outcome === "approved" ? new Date().toISOString() : null
  );
  return {
    status: payload.outcome,
    order_public_id: payload.order_public_id,
    order_status: status,
  };
}

/**
 * Al volver de Mercado Pago con `payment_id`: consulta el pago en Mercado Pago (vía
 * /api/mercadopago/pago) y deja la orden con ese estado. Devuelve null si no se pudo.
 */
export async function confirmMercadoPago(
  publicId: string,
  paymentId: string
): Promise<Order["status"] | null> {
  const res = await fetch(`/api/mercadopago/pago/${encodeURIComponent(paymentId)}`).catch(() => null);
  if (!res?.ok) return null;
  const pago = (await res.json()) as { status: string; external_reference: string | null; date_approved: string | null };
  if (pago.external_reference !== publicId) return null;
  const status: Order["status"] =
    pago.status === "approved" ? "PAID" : pago.status === "rejected" || pago.status === "cancelled" ? "FAILED" : "PENDING";
  setOrderStatus(publicId, status, status === "PAID" ? pago.date_approved ?? new Date().toISOString() : null);
  return status;
}

export async function getOrder(publicId: string): Promise<Order> {
  const order = getStoredOrder(publicId);
  if (!order) throw new ApiError("Orden no encontrada.", "NOT_FOUND", 404);
  return order;
}

// ── Leads / webinars ──────────────────────────────────────────────────────────

export async function registerWebinar(payload: {
  course_id: number;
  course_title: string;
  session_id: number | null;
  session_label: string | null;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}): Promise<{ registered: boolean; registration: WebinarRegistration; message: string }> {
  const registration = addWebinarRegistration(payload);
  // La inscripción también alimenta la base de contactos del panel.
  addLead({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    company: payload.company,
    subject: `Webinar: ${payload.course_title}`,
    message: payload.session_label ?? "",
    source: "WEBINAR",
  });
  return {
    registered: true,
    registration,
    message: "Inscripción registrada. Te enviamos el acceso por correo.",
  };
}

export async function createLead(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
  company?: string;
  phone?: string;
}): Promise<{ submitted: boolean; lead: Lead; message: string }> {
  const lead = addLead({ ...payload, source: "CONTACTO" });
  return { submitted: true, lead, message: "Consulta enviada." };
}

export async function joinCommunity(payload: {
  name: string;
  email: string;
  phone: string;
}): Promise<{ joined: boolean }> {
  addLead({ ...payload, subject: "Comunidad de WhatsApp", source: "COMUNIDAD" });
  return { joined: true };
}
