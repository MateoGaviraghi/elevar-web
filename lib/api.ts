import type {
  Category,
  Course,
  Paginated,
  CartValidateResult,
  CheckoutResult,
  Order,
  OrderItem,
} from "@/types";
import { CATEGORIES, COURSES } from "@/lib/mock-catalog";
import { getStoredOrder, saveOrder, setOrderStatus } from "@/lib/orders-store";

// Mockup de Fase 0: TODO el catálogo y las órdenes son estáticos/locales (sin backend).
// El front abre y funciona sin Docker ni API. Mantiene las firmas async para no tocar
// a los que consumen estas funciones.

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
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `mock-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

// ── Catálogo (estático) ───────────────────────────────────────────────────────

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
  let list = COURSES.slice();
  if (params?.modality) list = list.filter((c) => c.modality === params.modality);
  if (params?.category) list = list.filter((c) => c.category?.slug === params.category);
  if (params?.featured !== undefined) list = list.filter((c) => c.is_featured === params.featured);
  if (params?.q) {
    const q = params.q.toLowerCase();
    list = list.filter(
      (c) => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }
  return { count: list.length, next: null, previous: null, results: list };
}

export async function getCourse(slug: string): Promise<Course> {
  const course = COURSES.find((c) => c.slug === slug);
  if (!course) throw new ApiError("Curso no encontrado.", "NOT_FOUND", 404);
  return course;
}

// ── Carrito / checkout (local) ────────────────────────────────────────────────

export async function validateCart(
  items: { course_id: number; session_id: number | null }[]
): Promise<CartValidateResult> {
  const resultItems: CartValidateResult["items"] = [];
  let total = 0;

  items.forEach((item, i) => {
    const course = COURSES.find((c) => c.id === item.course_id);
    if (!course) {
      throw new ApiError("Hay un curso inválido en el carrito.", "VALIDATION_ERROR", 400, {
        [`items.${i}.course_id`]: ["Curso no encontrado o no disponible."],
      });
    }

    let session = null;
    if (isSessionBased(course.modality)) {
      if (item.session_id == null) {
        throw new ApiError("Falta elegir una fecha/sesión.", "VALIDATION_ERROR", 400, {
          [`items.${i}.session_id`]: ["Elegí una fecha/sesión."],
        });
      }
      session = (course.sessions ?? []).find((s) => s.id === item.session_id) ?? null;
      if (!session) {
        throw new ApiError("Sesión inválida.", "VALIDATION_ERROR", 400, {
          [`items.${i}.session_id`]: ["Sesión inválida."],
        });
      }
    }

    let available = true;
    if (session) {
      if (session.status !== "SCHEDULED") available = false;
      else if (session.capacity != null && (session.seats_available ?? 0) <= 0) available = false;
    }

    resultItems.push({
      course_id: course.id,
      session_id: session?.id ?? null,
      title: course.title,
      unit_price: course.price,
      available,
      seats_available: session?.seats_available ?? null,
    });
    total += parseFloat(course.price);
  });

  return {
    valid: resultItems.every((it) => it.available),
    items: resultItems,
    subtotal: money(total),
  };
}

export async function checkout(payload: {
  buyer: { email: string; name: string; phone?: string };
  items: { course_id: number; session_id: number | null }[];
}): Promise<CheckoutResult> {
  const orderItems: OrderItem[] = [];
  let subtotal = 0;

  payload.items.forEach((item, i) => {
    const course = COURSES.find((c) => c.id === item.course_id);
    if (!course) {
      throw new ApiError("Hay un curso inválido en el carrito.", "VALIDATION_ERROR", 400, {
        [`items.${i}.course_id`]: ["Curso no encontrado."],
      });
    }
    if (isSessionBased(course.modality) && item.session_id == null) {
      throw new ApiError("Falta elegir una fecha/sesión.", "VALIDATION_ERROR", 400, {
        [`items.${i}.session_id`]: ["Elegí una fecha/sesión."],
      });
    }
    orderItems.push({ title_snapshot: course.title, unit_price: course.price, quantity: 1 });
    subtotal += parseFloat(course.price);
  });

  const publicId = newId();
  const total = money(subtotal);
  saveOrder({
    public_id: publicId,
    status: "PENDING",
    buyer_email: payload.buyer.email,
    buyer_name: payload.buyer.name,
    total,
    currency: "ARS",
    paid_at: null,
    items: orderItems,
  });

  return {
    order_public_id: publicId,
    // En producción esto es la init_point real de Mercado Pago (Checkout Pro).
    // En el mockup apunta a la pantalla simulada de Mercado Pago.
    init_point: `/pago-mp/${publicId}`,
    mp_preference_id: `MOCK-${publicId}`,
    subtotal: total,
    total,
    currency: "ARS",
  };
}

export async function simulatePayment(payload: {
  order_public_id: string;
  outcome: "approved" | "rejected";
}): Promise<{ status: string; order_public_id: string; order_status: Order["status"] }> {
  const approved = payload.outcome === "approved";
  const status: Order["status"] = approved ? "PAID" : "FAILED";
  setOrderStatus(payload.order_public_id, status, approved ? new Date().toISOString() : null);
  return {
    status: approved ? "paid" : "failed",
    order_public_id: payload.order_public_id,
    order_status: status,
  };
}

export async function getOrder(publicId: string): Promise<Order> {
  const order = getStoredOrder(publicId);
  if (!order) throw new ApiError("Orden no encontrada.", "NOT_FOUND", 404);
  return order;
}

// ── Leads / webinars (mockup: no-op exitoso) ──────────────────────────────────

export async function registerWebinar(
  sessionId: number,
  _body: { email: string; name: string }
): Promise<{ registered: boolean; session_id: number; message: string }> {
  return { registered: true, session_id: sessionId, message: "Inscripción registrada." };
}

export async function createLead(_payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
  company?: string;
  phone?: string;
}): Promise<{ submitted: boolean; message: string }> {
  return { submitted: true, message: "Consulta enviada." };
}
