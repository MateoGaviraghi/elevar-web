"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, getOrder, simulatePayment } from "@/lib/api";
import { clearCart } from "@/lib/cart";
import { formatUSD } from "@/lib/formatters";
import type { Order } from "@/types";

/**
 * Pago SIMULADO de Stripe (KAN-42), solo para probar en la compu: el backend lo acepta con
 * STRIPE_FAKE_MODE=1 y nunca en producción. En producción la persona va a la página real de
 * Stripe y vuelve a /orden/<id>?session_id=… Esta pantalla no imita la de Stripe a propósito.
 */
export default function PagoStripeSimuladoPage(props: { params: Promise<{ publicId: string }> }) {
  const { publicId } = use(props.params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [processing, setProcessing] = useState<null | "approved" | "rejected">(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrder(publicId)
      .then((o) => {
        if (cancelled) return;
        setOrder(o);
        setState("ready");
      })
      .catch(() => !cancelled && setState("missing"));
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  async function decide(outcome: "approved" | "rejected") {
    setProcessing(outcome);
    setError(null);
    try {
      await simulatePayment({ order_public_id: publicId, outcome });
      if (outcome === "approved") clearCart();
      router.push(`/orden/${publicId}?status=${outcome === "approved" ? "success" : "failure"}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo procesar el pago.");
      setProcessing(null);
    }
  }

  const resuelta = order != null && order.status !== "PENDING";

  return (
    <main className="grid min-h-screen place-items-center bg-neutral-100 px-5 py-16">
      <div className="w-full max-w-md border border-neutral-300 bg-neutral-0 p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Pago de prueba · Stripe</p>
        {state === "loading" && <p className="mt-6 text-sm text-neutral-700">Cargando la orden…</p>}
        {state === "missing" && (
          <p className="mt-6 text-sm text-neutral-700">
            No encontramos esta orden.{" "}
            <Link href="/carrito" className="font-semibold underline underline-offset-2">
              Volver al carrito
            </Link>
          </p>
        )}
        {state === "ready" && order && (
          <>
            <h1 className="mt-3 text-2xl font-semibold text-ink-900">{formatUSD(order.total)}</h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Esta pantalla simula el pago con tarjeta en dólares. No se cobra nada.
            </p>
            {resuelta ? (
              <p className="mt-6 text-sm text-neutral-700">
                Esta orden ya está resuelta.{" "}
                <Link href={`/orden/${publicId}`} className="font-semibold underline underline-offset-2">
                  Ver la orden
                </Link>
              </p>
            ) : (
              <div className="mt-8 grid gap-3">
                <button
                  type="button"
                  disabled={processing != null}
                  onClick={() => decide("approved")}
                  className="h-12 bg-[#635BFF] text-[15px] font-semibold text-neutral-0 transition-colors hover:bg-[#4B45C6] disabled:opacity-50"
                >
                  {processing === "approved" ? "Procesando…" : "Aprobar el pago"}
                </button>
                <button
                  type="button"
                  disabled={processing != null}
                  onClick={() => decide("rejected")}
                  className="h-12 border border-neutral-300 text-[15px] font-semibold text-ink-900 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                >
                  {processing === "rejected" ? "Procesando…" : "Rechazar el pago"}
                </button>
              </div>
            )}
            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          </>
        )}
      </div>
    </main>
  );
}
