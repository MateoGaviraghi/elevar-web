"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Promo } from "@/types";
import { getPromos } from "@/lib/api";
import { onCollectionChange } from "@/lib/local-db";
import { Container } from "@/components/ui/container";
import { PromoCard } from "@/components/promos/promo-card";
import { buttonClasses } from "@/components/ui/button";

const STEPS = [
  {
    title: "Elegí tus cursos",
    text: "Sumá al carrito las capacitaciones que necesite tu laboratorio, con la cantidad de inscripciones por curso.",
  },
  {
    title: "Los descuentos se aplican solos",
    text: "Las promos por equipo o por combinar cursos se calculan automáticamente sobre el total del carrito.",
  },
  {
    title: "Cargá tu cupón",
    text: "Si tenés un código de campaña, ingresalo en el carrito antes de pasar al pago y vas a ver el descuento al instante.",
  },
];

export function PromosClient() {
  const [promos, setPromos] = useState<Promo[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      getPromos()
        .then((p) => alive && setPromos(p))
        .catch(() => alive && setPromos([]));
    };
    load();
    const off = onCollectionChange((name) => name === "promos" && load());
    return () => {
      alive = false;
      off();
    };
  }, []);

  const autos = (promos ?? []).filter((p) => p.trigger === "AUTO");
  const cupones = (promos ?? []).filter((p) => p.trigger === "COUPON");

  return (
    <section className="bg-neutral-0 py-16 md:py-24">
      <Container>
        {promos === null ? (
          <p className="text-neutral-500">Cargando promociones…</p>
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-start gap-6 border border-neutral-200 p-10">
            <p className="text-lg text-ink-700">
              No hay promociones vigentes en este momento.
            </p>
            <Link href="/formacion" className={buttonClasses({ variant: "primary", size: "md" })}>
              Ver todos los cursos
            </Link>
          </div>
        ) : (
          <>
            {autos.length > 0 && (
              <>
                <Heading
                  eyebrow="Se aplican solas"
                  title="Descuentos automáticos"
                  desc="No necesitás ningún código: al armar el carrito, el descuento aparece en el resumen."
                />
                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {autos.map((p) => (
                    <PromoCard key={p.id} promo={p} />
                  ))}
                </div>
              </>
            )}

            {cupones.length > 0 && (
              <>
                <div className="mt-20">
                  <Heading
                    eyebrow="Códigos vigentes"
                    title="Cupones de descuento"
                    desc="Copiá el código y cargalo en el carrito antes de pasar al pago."
                  />
                </div>
                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {cupones.map((p) => (
                    <PromoCard key={p.id} promo={p} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Cómo funciona */}
        <div className="mt-20 border-t border-neutral-200 pt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
            Cómo se aplican
          </h2>
          <ol className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="font-display text-3xl font-semibold text-brand-500">
                  0{i + 1}
                </span>
                <h3 className="mt-3 font-display text-base font-semibold text-ink-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/formacion" className={buttonClasses({ variant: "primary", size: "md" })}>
              Explorar formación
            </Link>
            <Link href="/contacto" className={buttonClasses({ variant: "outline", size: "md" })}>
              Consultar por planes para empresas
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Heading({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-brand-500" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-700">{desc}</p>
    </div>
  );
}
