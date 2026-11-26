"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { numero } from "../inicio/graficos";
import { cambio } from "./Banda";

export const TAMANOS = [10, 25, 50] as const;

/**
 * El pie de toda tabla larga, como el del portal CESS: «Mostrando 1–25 de 188», cuántas por página como
 * segmentos (el resaltado se desliza, 0,25 s) y las páginas numeradas con «…» en el medio.
 */
export function Paginacion({ total, pagina, porPagina, onPagina: alPedir, onPorPagina }: PaginacionProps) {
  const onPagina = (n: number) => {
    cambio.direccion = n < pagina ? -1 : 1;
    alPedir(n);
  };
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);
  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <span className="text-sm text-neutral-700" aria-live="polite">
        Mostrando <b className="font-semibold tabular-nums text-ink-900">{numero(desde)}–{numero(hasta)}</b> de <b className="font-semibold tabular-nums text-ink-900">{numero(total)}</b>
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <Segmentos actual={porPagina} onCambiar={onPorPagina} />
        {paginas > 1 && (
          <div className="flex items-center gap-1">
            <Paso etiqueta="Página anterior" deshabilitado={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
              <path d="M12.5 5 7.5 10l5 5" />
            </Paso>
            {rango(pagina, paginas).map((n, i) =>
              n === null ? (
                <span key={`h${i}`} aria-hidden className="w-6 text-center text-sm text-neutral-500">…</span>
              ) : (
                <button key={n} type="button" onClick={() => onPagina(n)} aria-current={n === pagina ? "page" : undefined} aria-label={`Página ${n}`}
                  className={`hidden h-9 min-w-[2.25rem] place-items-center rounded-[10px] px-2 font-sub text-sm font-semibold tabular-nums outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 sm:grid ${
                    n === pagina ? "bg-ink-900 text-neutral-0" : "text-ink-900 [@media(hover:hover)]:hover:bg-ink-50"
                  }`}>
                  {n}
                </button>
              ),
            )}
            <span className="px-2 font-sub text-sm font-semibold tabular-nums text-ink-900 sm:hidden">{pagina} / {paginas}</span>
            <Paso etiqueta="Página siguiente" deshabilitado={pagina >= paginas} onClick={() => onPagina(pagina + 1)}>
              <path d="M7.5 5l5 5-5 5" />
            </Paso>
          </div>
        )}
      </div>
    </nav>
  );
}

interface PaginacionProps {
  total: number;
  pagina: number;
  porPagina: number;
  onPagina: (n: number) => void;
  onPorPagina: (n: number) => void;
}

function Segmentos({ actual, onCambiar }: { actual: number; onCambiar: (n: number) => void }) {
  const caja = useRef<HTMLDivElement>(null);
  const resalte = useRef<HTMLSpanElement>(null);
  const primera = useRef(true);
  useLayoutEffect(() => {
    const el = caja.current?.querySelector<HTMLElement>(`[data-n="${actual}"]`);
    if (!el || !resalte.current) return;
    const destino = { x: el.offsetLeft, width: el.offsetWidth, opacity: 1 };
    if (primera.current || prefersReducedMotion()) gsap.set(resalte.current, destino);
    else gsap.to(resalte.current, { ...destino, duration: 0.25, ease: "power3.out" });
    primera.current = false;
  }, [actual]);
  return (
    <div ref={caja} role="group" aria-label="Cuántas por página" className="relative hidden rounded-[12px] bg-ink-50 p-1 md:inline-flex">
      <span ref={resalte} aria-hidden className="absolute bottom-1 left-0 top-1 rounded-[9px] bg-ink-900 opacity-0" />
      {TAMANOS.map((n) => (
        <button key={n} type="button" data-n={n} onClick={() => n !== actual && onCambiar(n)} aria-pressed={n === actual}
          className={`relative z-[1] min-h-[32px] whitespace-nowrap rounded-[9px] px-3 text-[13px] font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 ${n === actual ? "text-neutral-0" : "text-ink-900/75 [@media(hover:hover)]:hover:text-ink-900"}`}>
          {n} por página
        </button>
      ))}
    </div>
  );
}

function Paso({ etiqueta, deshabilitado, onClick, children }: { etiqueta: string; deshabilitado: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={etiqueta} disabled={deshabilitado} onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-[10px] text-ink-900 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-30 [@media(hover:hover)]:enabled:hover:bg-ink-50">
      <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}

/** 1 … 4 5 6 … 20 */
function rango(actual: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const s = [...new Set([1, total, actual - 1, actual, actual + 1].filter((n) => n >= 1 && n <= total))].sort((a, b) => a - b);
  const r: (number | null)[] = [];
  s.forEach((n, i) => {
    if (i > 0 && n - s[i - 1]! > 1) r.push(null);
    r.push(n);
  });
  return r;
}
