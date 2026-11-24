"use client";

// Piezas de la lista del blog (/blog).
import Link from "next/link";
import { pegar } from "@/lib/texto";
import type { Capsula } from "./datos";

export const BAJADA = "Notas breves sobre calidad, metrología y la norma ISO/IEC 17025 para el día a día del laboratorio.";

/** Categoría · fecha · minutos (cada parte entera, nunca partida). */
export function Meta({ c, claro = false }: { c: Capsula; claro?: boolean }) {
  const partes = ["Cápsula informativa", c.fecha, `${c.minutos} min de lectura`];
  return (
    <p className={`flex flex-wrap items-center gap-x-2 text-[13px] tracking-wide ${claro ? "text-neutral-300" : "text-ink-600"}`}>
      {partes.map((t, i) => (
        <span key={t} className="inline-flex items-center gap-x-2 whitespace-nowrap">
          {i > 0 && <span aria-hidden className={`h-1 w-1 rounded-full ${claro ? "bg-brand-400" : "bg-brand-500"}`} />}
          <span className={i === 0 ? `font-semibold ${claro ? "text-brand-400" : "text-brand-500"}` : ""}>{t}</span>
        </span>
      ))}
    </p>
  );
}

/** Flecha que baja en diagonal, la misma del encabezado de la lista de cursos. */
export function Flecha({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 6l12 12M18 8v10H8" />
    </svg>
  );
}

export { Link, pegar };
