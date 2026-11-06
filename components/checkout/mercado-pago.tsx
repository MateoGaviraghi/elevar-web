// Marca de Mercado Pago (2026-11-06, pedido de Mateo: "usá el logo real de Mercado Pago").
// Archivos oficiales tomados del sitio de Mercado Pago (http2.mlstatic.com, navegación de
// mercadopago.com.ar): el isotipo (óvalo celeste con el apretón de manos) y el logo completo.

export const MP_BLUE = "#009ee3";
export const MP_BLUE_DARK = "#008fcc";

/** Logo oficial: con wordmark, el logo completo; sin wordmark, el isotipo. */
export function MercadoPagoLogo({
  withWordmark = true,
  size = 28,
}: {
  withWordmark?: boolean;
  size?: number;
}) {
  if (withWordmark) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/assets/pagos/mercado-pago-logo.png" alt="Mercado Pago" height={size} style={{ height: size, width: "auto" }} className="shrink-0" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/assets/pagos/mercado-pago.svg" alt="" aria-hidden width={size} height={size} style={{ width: size, height: size }} className="shrink-0 object-contain" />;
}

/** Fila de medios de pago aceptados (chips monocromáticos sobrios). */
export function CardBrands({ className = "" }: { className?: string }) {
  const brands = ["VISA", "Mastercard", "Amex", "Naranja"];
  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className}`} aria-hidden>
      {brands.map((b) => (
        <span
          key={b}
          className="rounded border border-neutral-200 bg-neutral-0 px-1.5 py-0.5 text-[10px] font-semibold tracking-tight text-neutral-500"
        >
          {b}
        </span>
      ))}
    </span>
  );
}
