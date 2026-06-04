"use client";

function maskedNumber(digits: string): string {
  const slots = Array.from({ length: 16 }, (_, i) => digits[i] ?? "•");
  return [
    slots.slice(0, 4).join(""),
    slots.slice(4, 8).join(""),
    slots.slice(8, 12).join(""),
    slots.slice(12, 16).join(""),
  ].join("  ");
}

export function detectBrand(digits: string): "visa" | "mastercard" | "amex" | "" {
  if (/^4/.test(digits)) return "visa";
  if (/^(5|2)/.test(digits)) return "mastercard";
  if (/^3/.test(digits)) return "amex";
  return "";
}

function BrandMark({ brand }: { brand: ReturnType<typeof detectBrand> }) {
  if (brand === "mastercard") {
    return (
      <div className="flex items-center" aria-hidden>
        <span className="h-7 w-7 rounded-full bg-[#EB001B]" />
        <span className="-ml-3 h-7 w-7 rounded-full bg-[#F79E1B]/90" />
      </div>
    );
  }
  if (brand === "visa") {
    return <span className="font-display text-xl font-bold italic tracking-tight text-neutral-0">VISA</span>;
  }
  if (brand === "amex") {
    return <span className="font-display text-sm font-bold tracking-tight text-neutral-0">AMEX</span>;
  }
  return <span className="font-display text-sm font-semibold tracking-widest text-neutral-0/70">ELEVAR</span>;
}

export function CardPreview({
  number,
  name,
  expiry,
  flipped,
  cvc,
}: {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
  flipped: boolean;
}) {
  const brand = detectBrand(number);

  return (
    <div className="[perspective:1400px]">
      <div
        className="relative aspect-[1.586/1] w-full max-w-[400px] transition-transform duration-700 ease-out"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* Frente */}
        <div
          className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-700 p-6 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.6)]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          {/* brillo decorativo */}
          <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-neutral-0/[0.07]" aria-hidden />

          <div className="flex items-start justify-between">
            {/* chip */}
            <div className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 ring-1 ring-amber-500/40" aria-hidden>
              <div className="mx-auto mt-1.5 h-6 w-8 rounded-sm border border-amber-600/30" />
            </div>
            <BrandMark brand={brand} />
          </div>

          <div className="whitespace-nowrap font-mono text-base tracking-[0.12em] text-neutral-0 sm:text-lg">
            {maskedNumber(number)}
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-neutral-0/50">Titular</p>
              <p className="truncate font-medium uppercase tracking-wide text-neutral-0">
                {name || "NOMBRE APELLIDO"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-neutral-0/50">Vence</p>
              <p className="font-medium tabular-nums text-neutral-0">{expiry || "MM/AA"}</p>
            </div>
          </div>
        </div>

        {/* Dorso */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 to-ink-800 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.6)]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="mt-5 h-10 w-full bg-black/80" />
          <div className="px-6 pt-5">
            <div className="flex items-center justify-end gap-3">
              <div className="flex h-9 flex-1 items-center justify-end rounded bg-neutral-0 px-3 font-mono text-sm tracking-widest text-ink-900">
                {cvc || "•••"}
              </div>
              <span className="text-[9px] uppercase tracking-widest text-neutral-0/50">CVC</span>
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-neutral-0/40">
              Tarjeta de demostración. Entorno de prueba; no ingreses datos reales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
