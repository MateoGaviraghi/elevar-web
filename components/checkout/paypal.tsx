export const PAYPAL_BLUE = "#003087";
export const PAYPAL_LIGHT_BLUE = "#009cde";
export const PAYPAL_YELLOW = "#ffc439";
export const PAYPAL_YELLOW_DARK = "#f0b429";

/** Isotipo PayPal (doble "P") dibujado en SVG para no depender de assets externos. */
export function PayPalLogo({
  size = 28,
  withWordmark = true,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  if (!withWordmark) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <path
          fill={PAYPAL_LIGHT_BLUE}
          d="M8.9 21.2H5.6c-.3 0-.5-.3-.4-.6L8.1 3.5c.1-.4.4-.6.8-.6h5.7c2.9 0 4.8 1.5 4.4 4.5-.4 3.2-2.9 5-6.1 5h-2c-.4 0-.7.3-.8.7l-.8 7.4c-.1.4-.2.7-.4.7Z"
        />
        <path
          fill={PAYPAL_BLUE}
          d="M11.6 23.1H8.3c-.3 0-.5-.3-.4-.6l2.9-17.1c.1-.4.4-.6.8-.6h5.7c2.9 0 4.8 1.5 4.4 4.5-.4 3.2-2.9 5-6.1 5h-2c-.4 0-.7.3-.8.7l-.8 7.4c-.1.4-.2.7-.4.7Z"
          opacity="0.85"
        />
      </svg>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <path
          fill={PAYPAL_LIGHT_BLUE}
          d="M8.9 21.2H5.6c-.3 0-.5-.3-.4-.6L8.1 3.5c.1-.4.4-.6.8-.6h5.7c2.9 0 4.8 1.5 4.4 4.5-.4 3.2-2.9 5-6.1 5h-2c-.4 0-.7.3-.8.7l-.8 7.4c-.1.4-.2.7-.4.7Z"
        />
        <path
          fill={PAYPAL_BLUE}
          d="M11.6 23.1H8.3c-.3 0-.5-.3-.4-.6l2.9-17.1c.1-.4.4-.6.8-.6h5.7c2.9 0 4.8 1.5 4.4 4.5-.4 3.2-2.9 5-6.1 5h-2c-.4 0-.7.3-.8.7l-.8 7.4c-.1.4-.2.7-.4.7Z"
          opacity="0.85"
        />
      </svg>
      <span
        className="font-display text-[15px] font-bold tracking-tight"
        style={{ color: PAYPAL_BLUE }}
      >
        Pay<span style={{ color: PAYPAL_LIGHT_BLUE }}>Pal</span>
      </span>
    </span>
  );
}
