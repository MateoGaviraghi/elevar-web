// Marca de Stripe (KAN-42, 2026-11-19, pedido de Mateo: «con el logo de stripe como el de mp»).
// Archivos oficiales del kit de marca de Stripe (stripe.com/newsroom/brand-assets,
// Stripe_logo_kit.zip): wordmark violeta (Blurple) para fondo claro y blanco para fondo
// oscuro. Sus reglas: violeta o gris oscuro sobre claro, blanco sobre oscuro, sin otros colores.

export const STRIPE_ACCENT = "#635BFF";
export const STRIPE_ACCENT_DARK = "#4B45C6";

/** Wordmark oficial de Stripe. `blanco` para fondos oscuros (botón, tono oscuro). */
export function StripeLogo({ blanco = false, size = 28 }: { blanco?: boolean; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={blanco ? "/assets/pagos/stripe-blanco.svg" : "/assets/pagos/stripe.svg"}
      alt="Stripe"
      height={size}
      style={{ height: size, width: "auto" }}
      className="shrink-0"
    />
  );
}
