// Marca y helpers de Mercado Pago para el mockup del flujo de pago (Checkout Pro).
// No es el logo oficial: es una representación para mostrarle al cliente cómo se
// vería la integración real con Mercado Pago.

export const MP_BLUE = "#009ee3";
export const MP_BLUE_DARK = "#008fcc";

/** Glifo de apretón de manos sobre círculo azul MP + wordmark. */
export function MercadoPagoLogo({
  withWordmark = true,
  size = 28,
}: {
  withWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="grid shrink-0 place-items-center rounded-full text-neutral-0"
        style={{ background: MP_BLUE, width: size, height: size }}
        aria-hidden
      >
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m11 17 2 2a1 1 0 1 0 3-3" />
          <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
          <path d="m21 3 1 11h-2" />
          <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
          <path d="M3 4h8" />
        </svg>
      </span>
      {withWordmark && (
        <span className="font-display font-semibold tracking-tight" style={{ color: MP_BLUE }}>
          Mercado Pago
        </span>
      )}
    </span>
  );
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
