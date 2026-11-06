"use client";

/**
 * Checkout. 2026-11-06: el rediseño con referencia Platzi fue rechazado ("toda esta sección
 * está horrible y super insulsa"); de tres prototipos (Pase, Conversación, Tinta) Mateo eligió
 * Pase. Acá quedan la carga y el carrito vacío; la página está en `pase.tsx` y la lógica en
 * `use-checkout.ts`.
 */
import Link from "next/link";
import { useCheckout } from "./use-checkout";
import { CheckoutShell, Skel } from "./piezas";
import { CheckoutPase } from "./pase";

export function CheckoutClient() {
  const co = useCheckout();

  if (!co.hydrated) {
    return (
      <CheckoutShell>
        <div className="mx-auto max-w-xl space-y-4 px-4 py-14" aria-busy="true" aria-label="Cargando el checkout">
          <Skel className="h-8 w-40" />
          <Skel className="h-12 w-full" />
          <Skel className="h-12 w-full" />
          <Skel className="h-14 w-full" />
        </div>
      </CheckoutShell>
    );
  }

  if (co.items.length === 0) {
    return (
      <CheckoutShell>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <p className="text-lg text-ink-700">Tu carrito está vacío.</p>
          <Link
            href="/formacion"
            className="mt-6 inline-flex items-center justify-center bg-brand-500 px-7 py-3.5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-600"
          >
            Explorar formación
          </Link>
        </div>
      </CheckoutShell>
    );
  }

  return <CheckoutPase co={co} />;
}
