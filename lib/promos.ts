import type {
  CartItem,
  DiscountLine,
  PricingResult,
  Promo,
  PromoScope,
} from "@/types";
import { COURSES } from "@/lib/mock-catalog";

/**
 * Promociones semilla del mockup. En producción vienen del backend y se editan
 * desde el panel (/admin/promociones); acá viven en localStorage.
 */
export const PROMOS_SEED: Promo[] = [
  {
    id: "promo-equipo",
    code: "EQUIPO",
    title: "Descuento por equipo de trabajo",
    description:
      "Inscribí 3 o más personas en la misma compra y el 15% se descuenta solo en el carrito.",
    kind: "PERCENT",
    value: 15,
    trigger: "AUTO",
    scope: "ALL",
    minQuantity: 3,
    minAmount: null,
    startsAt: null,
    endsAt: null,
    active: true,
    featured: true,
  },
  {
    id: "promo-combo",
    code: "COMBO2",
    title: "Combiná dos capacitaciones",
    description:
      "Llevando dos cursos distintos en la misma compra, el segundo tiene 10% de descuento.",
    kind: "PERCENT",
    value: 10,
    trigger: "AUTO",
    scope: "ALL",
    minQuantity: 2,
    minAmount: null,
    startsAt: null,
    endsAt: null,
    active: true,
    featured: true,
  },
  {
    id: "promo-async20",
    code: "ASINCRONICO20",
    title: "20% en cursos asincrónicos",
    description:
      "Cupón de temporada para cursos asincrónicos: cargalo en el carrito antes de pagar.",
    kind: "PERCENT",
    value: 20,
    trigger: "COUPON",
    scope: "MODALITY",
    modality: "ASYNC",
    minQuantity: null,
    minAmount: null,
    startsAt: null,
    endsAt: null,
    active: true,
    featured: true,
  },
  {
    id: "promo-micro",
    code: "MICRO10",
    title: "10% en microbiología",
    description:
      "Descuento sobre toda la línea de cursos del laboratorio de microbiología.",
    kind: "PERCENT",
    value: 10,
    trigger: "COUPON",
    scope: "CATEGORY",
    categorySlug: "microbiologia",
    minQuantity: null,
    minAmount: null,
    startsAt: null,
    endsAt: null,
    active: true,
    featured: false,
  },
  {
    id: "promo-bienvenida",
    code: "BIENVENIDA",
    title: "$10.000 en tu primera compra",
    description:
      "Para quienes se capacitan por primera vez con Elevar, en compras desde $60.000.",
    kind: "AMOUNT",
    value: 10000,
    trigger: "COUPON",
    scope: "ALL",
    minQuantity: null,
    minAmount: 60000,
    startsAt: null,
    endsAt: null,
    active: true,
    featured: true,
  },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

function courseMatches(promo: Promo, item: CartItem): boolean {
  const scope: PromoScope = promo.scope;
  if (scope === "ALL") return true;
  if (scope === "MODALITY") return item.modality === promo.modality;
  if (scope === "COURSE") return (promo.courseIds ?? []).includes(item.courseId);
  if (scope === "CATEGORY") {
    const course = COURSES.find((c) => c.id === item.courseId);
    return course?.category?.slug === promo.categorySlug;
  }
  return false;
}

function withinDates(promo: Promo, now: Date): boolean {
  if (promo.startsAt && new Date(promo.startsAt) > now) return false;
  if (promo.endsAt && new Date(promo.endsAt) < now) return false;
  return true;
}

export function isPromoLive(promo: Promo, now: Date = new Date()): boolean {
  return promo.active && withinDates(promo, now);
}

/** Base alcanzada por la promo (suma de líneas que matchean) y sus unidades. */
function promoBase(promo: Promo, items: CartItem[]) {
  const matched = items.filter((i) => courseMatches(promo, i));
  const amount = matched.reduce(
    (acc, i) => acc + parseFloat(i.unitPrice) * i.quantity,
    0
  );
  const quantity = matched.reduce((acc, i) => acc + i.quantity, 0);
  const distinctCourses = new Set(matched.map((i) => i.courseId)).size;
  return { amount, quantity, distinctCourses, matched };
}

export function promoApplies(
  promo: Promo,
  items: CartItem[],
  now: Date = new Date()
): boolean {
  if (!isPromoLive(promo, now)) return false;
  const { amount, quantity, distinctCourses } = promoBase(promo, items);
  if (amount <= 0) return false;
  if (promo.minQuantity != null) {
    // "COMBO2" mira cursos distintos; el resto, unidades totales.
    const reference = promo.id === "promo-combo" ? distinctCourses : quantity;
    if (reference < promo.minQuantity) return false;
  }
  if (promo.minAmount != null && amount < promo.minAmount) return false;
  return true;
}

function discountFor(promo: Promo, items: CartItem[]): number {
  const { amount, matched } = promoBase(promo, items);
  if (promo.kind === "AMOUNT") return Math.min(promo.value, amount);

  // El combo descuenta sólo sobre la unidad más barata (el "segundo curso").
  if (promo.id === "promo-combo") {
    const cheapest = matched
      .map((i) => parseFloat(i.unitPrice))
      .filter((p) => p > 0)
      .sort((a, b) => a - b)[0];
    if (!cheapest) return 0;
    return (cheapest * promo.value) / 100;
  }

  return (amount * promo.value) / 100;
}

export interface PricingInput {
  items: CartItem[];
  promos: Promo[];
  couponCode?: string | null;
  now?: Date;
}

export interface PricingOutput extends PricingResult {
  /** Motivo por el cual el cupón ingresado no se pudo aplicar. */
  couponError: string | null;
  appliedCoupon: Promo | null;
}

/**
 * Calcula subtotal, descuentos y total. Se aplican todas las promos automáticas
 * vigentes y, como máximo, un cupón. Los porcentajes se calculan sobre el
 * subtotal alcanzado por cada promo (no se encadenan entre sí).
 */
export function computePricing({
  items,
  promos,
  couponCode,
  now = new Date(),
}: PricingInput): PricingOutput {
  const subtotal = items.reduce(
    (acc, i) => acc + parseFloat(i.unitPrice) * i.quantity,
    0
  );

  const discounts: DiscountLine[] = [];

  for (const promo of promos.filter((p) => p.trigger === "AUTO")) {
    if (!promoApplies(promo, items, now)) continue;
    const amount = round2(discountFor(promo, items));
    if (amount > 0) {
      discounts.push({
        promoId: promo.id,
        code: promo.code,
        label: promo.title,
        amount,
      });
    }
  }

  let couponError: string | null = null;
  let appliedCoupon: Promo | null = null;
  const code = (couponCode ?? "").trim().toUpperCase();

  if (code) {
    const promo = promos.find(
      (p) => p.trigger === "COUPON" && p.code.toUpperCase() === code
    );
    if (!promo) {
      couponError = "El cupón no existe o ya no está disponible.";
    } else if (!isPromoLive(promo, now)) {
      couponError = "El cupón venció o no está activo.";
    } else if (!promoApplies(promo, items, now)) {
      couponError = couponRequirement(promo);
    } else {
      const amount = round2(discountFor(promo, items));
      if (amount <= 0) {
        couponError = "El cupón no aplica a los cursos de tu carrito.";
      } else {
        appliedCoupon = promo;
        discounts.push({
          promoId: promo.id,
          code: promo.code,
          label: promo.title,
          amount,
        });
      }
    }
  }

  const discountTotal = Math.min(
    round2(discounts.reduce((acc, d) => acc + d.amount, 0)),
    subtotal
  );

  return {
    subtotal: round2(subtotal),
    discounts,
    discountTotal,
    total: round2(Math.max(subtotal - discountTotal, 0)),
    couponError,
    appliedCoupon,
  };
}

function couponRequirement(promo: Promo): string {
  if (promo.minAmount != null) {
    return `El cupón aplica en compras desde $${promo.minAmount.toLocaleString("es-AR")}.`;
  }
  if (promo.minQuantity != null) {
    return `El cupón aplica desde ${promo.minQuantity} inscripciones.`;
  }
  if (promo.scope === "MODALITY") {
    return "El cupón aplica sólo a cursos de otra modalidad.";
  }
  if (promo.scope === "CATEGORY") {
    return "El cupón aplica sólo a cursos de otra categoría.";
  }
  return "El cupón no aplica a los cursos de tu carrito.";
}

export function promoBadge(promo: Promo): string {
  return promo.kind === "PERCENT"
    ? `${promo.value}% OFF`
    : `$${promo.value.toLocaleString("es-AR")} OFF`;
}

export function promoScopeLabel(promo: Promo): string {
  switch (promo.scope) {
    case "MODALITY":
      return MODALITY_LABEL[promo.modality ?? "ASYNC"];
    case "CATEGORY":
      return `Categoría: ${promo.categorySlug}`;
    case "COURSE":
      return `${(promo.courseIds ?? []).length} curso(s) seleccionados`;
    default:
      return "Todos los cursos";
  }
}

const MODALITY_LABEL: Record<string, string> = {
  ASYNC: "Cursos asincrónicos",
  LIVE: "Cursos online en vivo",
  WEBINAR: "Webinars",
  WORKSHOP: "Talleres",
};
