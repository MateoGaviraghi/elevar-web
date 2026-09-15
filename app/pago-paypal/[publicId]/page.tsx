"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, getOrder, simulatePayment } from "@/lib/api";
import { clearCart } from "@/lib/cart";
import { arsToUsd, formatARS, formatUSD, USD_RATE } from "@/lib/formatters";
import { PayPalLogo, PAYPAL_BLUE, PAYPAL_YELLOW, PAYPAL_YELLOW_DARK } from "@/components/checkout/paypal";
import type { Order } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pantalla simulada de PayPal (Fase 0). En producción el usuario sale del sitio
 * hacia el checkout real de PayPal y vuelve por la URL de retorno; el estado de
 * la operación lo confirma el webhook.
 */
export default function PagoPayPalPage({ params }: { params: { publicId: string } }) {
  const router = useRouter();
  const { publicId } = params;

  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [step, setStep] = useState<"login" | "review">("login");
  const [creds, setCreds] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const totalArs = order ? parseFloat(order.total) : 0;
  const totalUsd = order ? Number(order.total_usd ?? arsToUsd(order.total)) : 0;
  const alreadyResolved = order != null && order.status !== "PENDING";

  function login() {
    const e: Record<string, string> = {};
    if (!EMAIL_RE.test(creds.email.trim())) e.email = "Ingresá un correo válido.";
    if (creds.password.length < 4) e.password = "Ingresá tu contraseña.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep("review");
  }

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

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <header className="bg-neutral-0 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <PayPalLogo size={26} />
          <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <Lock /> Pago seguro
          </span>
        </div>
      </header>

      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-2 text-xs text-amber-800 sm:px-6">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
          Entorno de prueba (sandbox) de PayPal. No ingreses datos reales.
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 md:py-12">
        {state === "loading" ? (
          <p className="py-24 text-center text-sm text-neutral-500">Cargando el pago…</p>
        ) : state === "missing" || !order ? (
          <Panel>
            <p className="text-center text-sm text-neutral-600">No encontramos esta orden.</p>
            <Link
              href="/formacion"
              className="mx-auto mt-6 flex w-fit items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-neutral-0"
              style={{ background: PAYPAL_BLUE }}
            >
              Volver a Elevar
            </Link>
          </Panel>
        ) : alreadyResolved ? (
          <Panel>
            <p className="text-center text-sm text-neutral-600">Esta orden ya fue procesada.</p>
            <Link
              href={`/orden/${publicId}`}
              className="mx-auto mt-6 flex w-fit items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-neutral-0"
              style={{ background: PAYPAL_BLUE }}
            >
              Ver estado de la orden
            </Link>
          </Panel>
        ) : (
          <>
            <div className="mb-6 text-center">
              <p className="text-sm text-neutral-500">Pagás a Elevar Consultoría</p>
              <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-neutral-900">
                {formatUSD(totalUsd)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                ≈ {formatARS(totalArs)} · USD 1 = {formatARS(USD_RATE)}
              </p>
            </div>

            <Panel>
              {step === "login" ? (
                <>
                  <h1 className="text-center font-display text-lg font-semibold tracking-tight text-neutral-900">
                    Iniciá sesión en PayPal
                  </h1>
                  <div className="mt-6 space-y-4">
                    <PpField label="Correo electrónico" error={errors.email}>
                      <input
                        type="email"
                        value={creds.email}
                        onChange={(e) => {
                          setCreds((c) => ({ ...c, email: e.target.value }));
                          setErrors((x) => ({ ...x, email: "" }));
                        }}
                        className={inputCls(errors.email)}
                      />
                    </PpField>
                    <PpField label="Contraseña" error={errors.password}>
                      <input
                        type="password"
                        value={creds.password}
                        onChange={(e) => {
                          setCreds((c) => ({ ...c, password: e.target.value }));
                          setErrors((x) => ({ ...x, password: "" }));
                        }}
                        className={inputCls(errors.password)}
                      />
                    </PpField>
                  </div>

                  <button
                    type="button"
                    onClick={login}
                    className="mt-6 w-full rounded-full px-6 py-3.5 text-sm font-semibold text-neutral-0 transition-opacity hover:opacity-90"
                    style={{ background: PAYPAL_BLUE }}
                  >
                    Iniciar sesión
                  </button>

                  <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
                    <span className="h-px flex-1 bg-neutral-200" /> o <span className="h-px flex-1 bg-neutral-200" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep("review")}
                    className="w-full rounded-full border border-neutral-300 px-6 py-3.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
                  >
                    Pagar con tarjeta de débito o crédito
                  </button>
                </>
              ) : (
                <>
                  <h1 className="font-display text-lg font-semibold tracking-tight text-neutral-900">
                    Revisá tu pago
                  </h1>

                  <ul className="mt-5 divide-y divide-neutral-200 border-y border-neutral-200">
                    {order.items.map((it, i) => (
                      <li key={i} className="flex items-start justify-between gap-4 py-3">
                        <span className="min-w-0 text-sm text-neutral-700">
                          {it.quantity > 1 && (
                            <span className="mr-1.5 font-semibold text-neutral-900">
                              {it.quantity}×
                            </span>
                          )}
                          {it.title_snapshot}
                        </span>
                        <span className="shrink-0 text-sm text-neutral-600">
                          {formatUSD(arsToUsd(parseFloat(it.unit_price) * it.quantity))}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {parseFloat(order.discount_total) > 0 && (
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-emerald-700">Descuentos</span>
                      <span className="font-medium text-emerald-700">
                        −{formatUSD(arsToUsd(order.discount_total))}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex items-baseline justify-between border-t border-neutral-200 pt-4">
                    <span className="font-semibold text-neutral-900">Total</span>
                    <span className="font-display text-2xl font-semibold text-neutral-900">
                      {formatUSD(totalUsd)}
                    </span>
                  </div>

                  {error && <p className="mt-4 text-xs font-medium text-red-600">{error}</p>}

                  <button
                    type="button"
                    onClick={() => decide("approved")}
                    disabled={processing !== null}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-ink-900 transition-colors disabled:opacity-60"
                    style={{ background: PAYPAL_YELLOW }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.background = PAYPAL_YELLOW_DARK)}
                    onMouseLeave={(ev) => (ev.currentTarget.style.background = PAYPAL_YELLOW)}
                  >
                    {processing === "approved" ? (
                      <><Spinner /> Procesando pago…</>
                    ) : (
                      <>
                        <PayPalLogo size={18} /> Pagar ahora
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => decide("rejected")}
                    disabled={processing !== null}
                    className="mt-3 w-full text-center text-xs font-medium text-neutral-400 underline-offset-4 transition-colors hover:text-neutral-600 hover:underline disabled:opacity-60"
                  >
                    {processing === "rejected" ? "Procesando…" : "Simular pago rechazado / cancelar"}
                  </button>
                </>
              )}
            </Panel>

            <p className="mt-8 flex items-center justify-center gap-2 text-xs text-neutral-400">
              <Lock /> Tus datos están protegidos. Procesa PayPal.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-neutral-0 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] sm:p-8">
      {children}
    </div>
  );
}

function inputCls(error?: string) {
  return `w-full rounded-md border bg-neutral-0 px-4 py-3 text-[15px] text-neutral-900 outline-none transition-colors focus:border-[#009cde] ${
    error ? "border-red-400" : "border-neutral-300"
  }`;
}

function PpField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-600">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

const Lock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
