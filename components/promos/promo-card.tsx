"use client";

import { useState } from "react";
import Link from "next/link";
import type { Promo } from "@/types";
import { promoBadge, promoScopeLabel } from "@/lib/promos";
import { formatDateShort } from "@/lib/formatters";

/** Destino sugerido para aprovechar la promo. */
function promoHref(promo: Promo): string {
  if (promo.scope === "MODALITY") {
    const map: Record<string, string> = {
      ASYNC: "/formacion/cursos-asincronicos",
      LIVE: "/formacion/cursos-online-en-vivo",
      WEBINAR: "/formacion/webinars-gratuitos",
      WORKSHOP: "/formacion/talleres",
    };
    return map[promo.modality ?? "ASYNC"] ?? "/formacion";
  }
  return "/formacion";
}

export function PromoCard({ promo }: { promo: Promo }) {
  const [copied, setCopied] = useState(false);
  const isCoupon = promo.trigger === "COUPON";

  async function copy() {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="group flex flex-col border border-neutral-200 bg-neutral-0 transition-all duration-300 hover:-translate-y-1 hover:border-ink-900 hover:shadow-[0_14px_44px_-16px_rgba(15,23,42,0.22)]">
      <div className="relative overflow-hidden bg-ink-900 px-6 py-7">
        <span
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/25 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-300">
            {isCoupon ? "Cupón" : "Descuento automático"}
          </span>
          <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-neutral-0">
            {promoBadge(promo)}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-ink-900">
          {promo.title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-700">{promo.description}</p>

        <ul className="mt-5 space-y-2 border-t border-neutral-200 pt-5 text-xs text-neutral-500">
          <li className="flex items-center gap-2">
            <Dot /> Aplica a: {promoScopeLabel(promo)}
          </li>
          {promo.minQuantity != null && (
            <li className="flex items-center gap-2">
              <Dot /> Desde {promo.minQuantity} inscripciones
            </li>
          )}
          {promo.minAmount != null && (
            <li className="flex items-center gap-2">
              <Dot /> Compras desde ${promo.minAmount.toLocaleString("es-AR")}
            </li>
          )}
          {promo.endsAt && (
            <li className="flex items-center gap-2">
              <Dot /> Vigente hasta el {formatDateShort(promo.endsAt)}
            </li>
          )}
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {isCoupon ? (
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 border border-dashed border-ink-900 px-4 py-2.5 font-mono text-sm font-semibold tracking-wider text-ink-900 transition-colors hover:bg-ink-900 hover:text-neutral-0"
            >
              {copied ? "¡Copiado!" : promo.code}
              {!copied && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="9" y="9" width="12" height="12" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 bg-brand-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
              Se aplica solo en el carrito
            </span>
          )}
          <Link
            href={promoHref(promo)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 transition-colors hover:text-brand-600"
          >
            Ver cursos
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
              <line x1="4" y1="12" x2="19" y2="12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

function Dot() {
  return <span className="h-1 w-1 shrink-0 rounded-full bg-brand-500" aria-hidden />;
}
