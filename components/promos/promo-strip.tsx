"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Promo } from "@/types";
import { getPromos } from "@/lib/api";
import { promoBadge } from "@/lib/promos";
import { onCollectionChange } from "@/lib/local-db";
import { Container } from "@/components/ui/container";

/**
 * Franja con las promociones destacadas vigentes. Si no hay ninguna activa, no
 * ocupa espacio en la página.
 */
export function PromoStrip() {
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      getPromos({ featured: true })
        .then((p) => alive && setPromos(p))
        .catch(() => alive && setPromos([]));
    load();
    const off = onCollectionChange((name) => name === "promos" && load());
    return () => {
      alive = false;
      off();
    };
  }, []);

  if (promos.length === 0) return null;

  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-10">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-brand-500" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                Promociones vigentes
              </span>
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
              Capacitá a todo tu equipo por menos
            </h2>
          </div>
          <Link
            href="/promociones"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 transition-colors hover:text-brand-600"
          >
            Ver todas
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="4" y1="12" x2="19" y2="12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
          </Link>
        </div>

        <ul className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promos.slice(0, 3).map((p) => (
            <li key={p.id}>
              <Link
                href="/promociones"
                className="flex h-full items-start gap-4 border border-neutral-200 bg-neutral-0 p-5 transition-colors hover:border-ink-900"
              >
                <span className="shrink-0 bg-brand-500 px-2.5 py-1.5 font-display text-xs font-bold tracking-tight text-neutral-0">
                  {promoBadge(p)}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug text-ink-900">
                    {p.title}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-neutral-500">
                    {p.trigger === "COUPON" ? (
                      <>
                        Cupón <span className="font-mono font-semibold text-ink-900">{p.code}</span>
                      </>
                    ) : (
                      "Se aplica solo en el carrito"
                    )}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
