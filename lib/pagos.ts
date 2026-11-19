/**
 * Pagos desde el exterior con Stripe, en dólares (KAN-42, 2026-11-19). PayPal se dejó de lado.
 * Se muestra solo con NEXT_PUBLIC_STRIPE_ENABLED=true: hasta que el servidor tenga la clave de
 * Stripe, la opción no aparece en el checkout, ni en las fichas, ni en la política de privacidad.
 */
export const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";
