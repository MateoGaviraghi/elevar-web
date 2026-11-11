/**
 * Pase impreso (orden pagada, 2026-11-11; referencia elegida por Mateo: Framer · Receipt
 * Printer, "La 1"). El mismo pase naranja del checkout sale de una ranura, de arriba hacia
 * abajo, y recibe el sello. La animación la arma `order-status-client.tsx` con estas clases:
 * `im-ranura`, `im-papel`, `im-char`, `im-sello`.
 */
import { Anillos } from "@/components/checkout/piezas";
import { pegar, sinViuda } from "@/lib/texto";

export type DatosPase = {
  code: string;
  resto: number;
  titulo: string;
  lugares: number;
  filas: { label: string; value: string; ancho?: boolean }[];
  orden: string;
  pago: string;
  total: string;
  sello: string;
  selloTono: "ok" | "wait";
};

export function PaseImpreso({ d }: { d: DatosPase }) {
  return (
    <div className="im-pase relative mx-auto w-full max-w-[520px]">
      {/* El papel sale hacia arriba desde la ranura: lo que asoma primero es el encabezado. */}
      <div className="relative overflow-hidden pt-6">
        <div className="im-papel relative overflow-hidden bg-brand-500 text-neutral-0 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
          <Anillos className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 text-neutral-0/20 lg:-right-20 lg:-top-20 lg:h-96 lg:w-96" />
          <div className="relative p-6 lg:p-8">
            <div className="flex items-center justify-between text-[12px] font-medium text-neutral-0/80">
              <span>ELEVAR · Pase de inscripción</span>
              <span className="tabular-nums">
                {d.lugares} {d.lugares === 1 ? "lugar" : "lugares"}
              </span>
            </div>
            <p className="mt-4 font-display text-[64px] font-bold leading-[0.9] tracking-tight lg:text-[96px]">
              <span className="inline-flex overflow-hidden pb-[0.04em]" aria-label={d.code}>
                {[...d.code].map((c, i) => (
                  <span key={i} aria-hidden className="im-char inline-block">
                    {c}
                  </span>
                ))}
              </span>
              {d.resto > 0 && <span className="ml-2 align-top text-2xl font-semibold text-neutral-0/75">+{d.resto}</span>}
            </p>
            <p className="mt-3 line-clamp-2 text-[15px] font-medium leading-snug lg:text-base">{pegar(d.titulo)}</p>

            <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-neutral-0/25 pt-4 text-sm">
              {d.filas.map((f) => (
                <div key={f.label} className={`min-w-0 ${f.ancho ? "col-span-2" : ""}`}>
                  <dt className="text-[12px] text-neutral-0/70">{f.label}</dt>
                  <dd className="font-semibold [overflow-wrap:anywhere]">{sinViuda(pegar(f.value))}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Troquel: la línea punteada con dos muescas */}
          <div className="relative h-0 border-t-2 border-dashed border-neutral-0/35">
            <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-ink-900" />
            <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-ink-900" />
          </div>

          <div className="relative flex items-end justify-between gap-4 p-6 lg:px-8 lg:py-6">
            <div className="min-w-0 text-sm">
              <p className="whitespace-nowrap font-semibold tabular-nums tracking-wide">Orden #{d.orden}</p>
              <p className="mt-0.5 whitespace-pre-line text-neutral-0/75">{d.pago}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[12px] text-neutral-0/70">Total</p>
              <p className="font-display text-4xl font-bold tabular-nums tracking-tight lg:text-5xl">{d.total}</p>
            </div>
          </div>

          {/* El sello: cae al final de la impresión */}
          <div
            className={`im-sello pointer-events-none absolute right-5 top-[4.75rem] -rotate-[10deg] border-[3px] px-3 py-1 font-display text-lg font-bold uppercase tracking-[0.2em] outline outline-[1.5px] outline-offset-[3px] sm:text-2xl lg:right-8 lg:top-[4.5rem] lg:px-4 lg:py-1.5 lg:text-3xl ${
              d.selloTono === "ok" ? "border-ink-900 text-ink-900 outline-ink-900" : "border-dashed border-ink-900 text-ink-900 outline-transparent"
            }`}
          >
            {d.sello}
          </div>
        </div>
      </div>

      {/* La ranura de la impresora, debajo: el pase sale de acá hacia arriba */}
      <div className="im-ranura relative -mx-3 h-4 bg-ink-800 shadow-[0_18px_30px_-12px_rgba(0,0,0,0.7)] ring-1 ring-neutral-0/10 print:hidden">
        <span className="absolute inset-x-3 top-0 h-[3px] bg-black/60" />
      </div>
    </div>
  );
}
