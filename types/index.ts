export type Modality = "ASYNC" | "LIVE" | "WEBINAR" | "WORKSHOP";

export type SessionStatus = "SCHEDULED" | "CANCELLED" | "FINISHED";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "FULFILLED";

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
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CartValidateItem {
  course_id: number;
  session_id: number | null;
  title: string;
  unit_price: string;
  available: boolean;
  seats_available: number | null;
}

export interface CartValidateResult {
  valid: boolean;
  items: CartValidateItem[];
  subtotal: string;
}

export interface CheckoutResult {
  order_public_id: string;
  init_point: string;
  mp_preference_id: string;
  subtotal: string;
  total: string;
  currency: string;
}

export interface OrderItem {
  title_snapshot: string;
  unit_price: string;
  quantity: number;
}

export interface Order {
  public_id: string;
  status: OrderStatus;
  buyer_email: string;
  buyer_name: string;
  total: string;
  currency: string;
  paid_at: string | null;
  items: OrderItem[];
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
}
