export type Modality = "ASYNC" | "LIVE" | "WEBINAR" | "WORKSHOP";

export type SessionStatus = "SCHEDULED" | "CANCELLED" | "FINISHED";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "FULFILLED";

/** Medios de pago contemplados en el alcance (PayPal queda sujeto a definición). */
export type PaymentMethod = "MERCADOPAGO" | "PAYPAL" | "TRANSFER";

export type Currency = "ARS" | "USD";

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface CourseSession {
  id: number;
  starts_at: string;
  ends_at: string;
  timezone: string;
  capacity: number | null;
  seats_available: number | null;
  status: SessionStatus;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  slug: string;
  summary: string;
  category: Category;
  modality: Modality;
  price: string;
  currency: string;
  cover_image: string | null;
  level: string;
  duration_hours: number | null;
  instructor_names: string;
  badge: string | null;
  is_featured: boolean;
  sessions: CourseSession[];
  description?: string;
  /** Publicado/oculto en el sitio público (se administra desde el panel). */
  is_published?: boolean;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Promociones y descuentos ──────────────────────────────────────────────────

export type PromoKind = "PERCENT" | "AMOUNT";

/**
 * AUTO  → se aplica sola cuando se cumplen las condiciones.
 * COUPON→ requiere que el usuario ingrese el código.
 */
export type PromoTrigger = "AUTO" | "COUPON";

export type PromoScope = "ALL" | "MODALITY" | "COURSE" | "CATEGORY";

export interface Promo {
  id: string;
  code: string;
  title: string;
  description: string;
  kind: PromoKind;
  /** Porcentaje (0-100) o monto fijo en ARS según `kind`. */
  value: number;
  trigger: PromoTrigger;
  scope: PromoScope;
  modality?: Modality | null;
  categorySlug?: string | null;
  courseIds?: number[];
  /** Cantidad mínima de unidades alcanzadas por la promo. */
  minQuantity?: number | null;
  /** Subtotal mínimo alcanzado por la promo (ARS). */
  minAmount?: number | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  /** Se destaca en la vista pública de promociones. */
  featured: boolean;
}

export interface DiscountLine {
  promoId: string;
  code: string;
  label: string;
  /** Monto descontado en ARS, positivo. */
  amount: number;
}

export interface PricingResult {
  subtotal: number;
  discounts: DiscountLine[];
  discountTotal: number;
  total: number;
}

// ── Carrito ───────────────────────────────────────────────────────────────────

/** Participante de una unidad comprada (una unidad = un asistente). */
export interface Attendee {
  name: string;
  email: string;
}

export interface CartItem {
  courseId: number;
  sessionId: number | null;
  titleSnapshot: string;
  unitPrice: string;
  currency: string;
  modality: Modality;
  coverImage?: string | null;
  code?: string;
  /** Etiqueta legible de la fecha elegida (cursos en vivo), p.ej. "17/06/2026, 15:25". */
  sessionLabel?: string;
  /** Unidades del mismo curso/fecha. */
  quantity: number;
  /** Datos de cada asistente cuando se compra más de una unidad. */
  attendees?: Attendee[];
}

// ── Validación / checkout ─────────────────────────────────────────────────────

export interface CartValidateItem {
  course_id: number;
  session_id: number | null;
  title: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  available: boolean;
  seats_available: number | null;
}

export interface CartValidateResult {
  valid: boolean;
  items: CartValidateItem[];
  subtotal: string;
  discounts: DiscountLine[];
  discount_total: string;
  total: string;
  /** Código de cupón inválido/no aplicable, si se envió uno. */
  coupon_error: string | null;
}

export interface CheckoutResult {
  order_public_id: string;
  init_point: string;
  mp_preference_id: string;
  subtotal: string;
  discount_total: string;
  total: string;
  currency: Currency;
  payment_method: PaymentMethod;
}

export interface OrderItem {
  course_id?: number;
  title_snapshot: string;
  unit_price: string;
  quantity: number;
  session_label?: string | null;
  attendees?: Attendee[];
}

export interface Order {
  public_id: string;
  status: OrderStatus;
  buyer_email: string;
  buyer_name: string;
  buyer_phone?: string;
  buyer_company?: string;
  subtotal: string;
  discount_total: string;
  discounts?: DiscountLine[];
  coupon_code?: string | null;
  total: string;
  currency: Currency;
  payment_method: PaymentMethod;
  /** Total en USD cuando se paga por PayPal. */
  total_usd?: string | null;
  created_at: string;
  paid_at: string | null;
  items: OrderItem[];
}

// ── Contactos / leads / webinars ──────────────────────────────────────────────

export type LeadSource = "CONTACTO" | "WEBINAR" | "COMPRA" | "COMUNIDAD";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message?: string;
  source: LeadSource;
  created_at: string;
}

export interface WebinarRegistration {
  id: string;
  course_id: number;
  course_title: string;
  session_id: number | null;
  session_label: string | null;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  created_at: string;
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export interface AdminSession {
  username: string;
  name: string;
  logged_at: string;
}
