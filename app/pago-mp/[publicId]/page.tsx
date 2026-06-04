"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, getOrder, simulatePayment } from "@/lib/api";
import { clearCart } from "@/lib/cart";
import { formatARS } from "@/lib/formatters";
import { CardPreview, detectBrand } from "@/components/checkout/card-preview";
import { MercadoPagoLogo, MP_BLUE, MP_BLUE_DARK } from "@/components/checkout/mercado-pago";
import type { Order } from "@/types";

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const fmtCardNumber = (s: string) => onlyDigits(s).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
function fmtExpiry(s: string) {
  const d = onlyDigits(s).slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** Cuotas sin interés, como las muestra Mercado Pago en Argentina. */
function cuotaOptions(total: number) {
  return [1, 3, 6, 9, 12].map((n) => ({
    n,
    per: total / n,
    label:
      n === 1
        ? `1 cuota de ${formatARS(total)}`
        : `${n} cuotas de ${formatARS(total / n)} sin interés`,
  }));
}

export default function PagoMercadoPagoPage({ params }: { params: { publicId: string } }) {
  const router = useRouter();
  const { publicId } = params;

  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [method, setMethod] = useState<"credit" | "debit">("credit");

  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "", dni: "" });
  const [installments, setInstallments] = useState(1);
  const [back, setBack] = useState(false);
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

  const total = order ? parseFloat(order.total) : 0;
  const cuotas = useMemo(() => cuotaOptions(total), [total]);
  const alreadyResolved = order != null && order.status !== "PENDING";

  function setField(k: keyof typeof card, v: string) {
    setCard((c) => ({ ...c, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  async function decide(outcome: "approved" | "rejected") {
    if (outcome === "approved") {
      const e: Record<string, string> = {};
      if (onlyDigits(card.number).length < 15) e.number = "Número incompleto.";
      if (!card.name.trim()) e.name = "Ingresá el titular.";
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = "MM/AA";
      if (onlyDigits(card.cvc).length < 3) e.cvc = "Inválido";
      if (onlyDigits(card.dni).length < 7) e.dni = "DNI inválido";
      setErrors(e);
      if (Object.keys(e).length > 0) return;
    }

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

  const brand = detectBrand(card.number);

  return (
    <div className="min-h-screen bg-[#ececec]">
      {/* Barra Mercado Pago */}
      <header className="bg-neutral-0 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <MercadoPagoLogo size={28} />
          <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <Lock /> Pago seguro
          </span>
        </div>
      </header>

      {/* Aviso de entorno de prueba */}
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2 text-xs text-amber-800 sm:px-6">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
          Estás en el entorno de prueba de Mercado Pago. No ingreses datos reales.
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-12">
        {state === "loading" ? (
          <p className="py-24 text-center text-sm text-neutral-500">Cargando el pago…</p>
        ) : state === "missing" || !order ? (
          <div className="mx-auto max-w-md rounded-lg bg-neutral-0 p-8 text-center shadow-sm">
            <p className="text-sm text-neutral-600">No encontramos esta orden.</p>
            <Link
              href="/formacion"
              className="mt-6 inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-neutral-0"
              style={{ background: MP_BLUE }}
            >
              Volver a Elevar
            </Link>
          </div>
        ) : alreadyResolved ? (
          <div className="mx-auto max-w-md rounded-lg bg-neutral-0 p-8 text-center shadow-sm">
            <p className="text-sm text-neutral-600">Esta orden ya fue procesada.</p>
            <Link
              href={`/orden/${publicId}`}
              className="mt-6 inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-neutral-0"
              style={{ background: MP_BLUE }}
            >
              Ver estado de la orden
            </Link>
          </div>
        ) : (
          <>
            {/* Monto */}
            <div className="mb-6 text-center">
              <p className="text-sm text-neutral-500">Vas a pagar a Elevar</p>
              <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-neutral-900">
                {formatARS(order.total)}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_360px]">
              {/* Formulario MP */}
              <div className="order-2 rounded-xl bg-neutral-0 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] sm:p-7 md:order-1">
                {/* Tabs medio de pago */}
                <div className="mb-6 flex gap-2">
                  {([["credit", "Tarjeta de crédito"], ["debit", "Tarjeta de débito"]] as const).map(
                    ([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setMethod(k)}
                        className="rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors"
                        style={
                          method === k
                            ? { background: MP_BLUE, borderColor: MP_BLUE, color: "#fff" }
                            : { borderColor: "#d4d4d4", color: "#525252" }
                        }
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>

                <div className="space-y-4">
                  <MpField label="Número de tarjeta" error={errors.number}>
                    <input
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={fmtCardNumber(card.number)}
                      onChange={(e) => setField("number", onlyDigits(e.target.value))}
                      onFocus={() => setBack(false)}
                      className={inputCls(errors.number)}
                    />
                  </MpField>

                  <MpField label="Nombre y apellido del titular" error={errors.name}>
                    <input
                      autoComplete="cc-name"
                      placeholder="Como figura en la tarjeta"
                      value={card.name}
                      onChange={(e) => setField("name", e.target.value)}
                      onFocus={() => setBack(false)}
                      className={inputCls(errors.name)}
                    />
                  </MpField>

                  <div className="grid grid-cols-2 gap-4">
                    <MpField label="Vencimiento" error={errors.expiry}>
                      <input
                        inputMode="numeric"
                        placeholder="MM/AA"
                        value={card.expiry}
                        onChange={(e) => setField("expiry", fmtExpiry(e.target.value))}
                        onFocus={() => setBack(false)}
                        className={inputCls(errors.expiry)}
                      />
                    </MpField>
                    <MpField label="Código de seguridad" error={errors.cvc}>
                      <input
                        inputMode="numeric"
                        placeholder="123"
                        value={card.cvc}
                        onChange={(e) => setField("cvc", onlyDigits(e.target.value).slice(0, 4))}
                        onFocus={() => setBack(true)}
                        onBlur={() => setBack(false)}
                        className={inputCls(errors.cvc)}
                      />
                    </MpField>
                  </div>

                  <MpField label="Documento del titular" error={errors.dni}>
                    <div className="flex">
                      <span className="inline-flex items-center border border-r-0 border-neutral-300 bg-neutral-50 px-3 text-xs font-semibold text-neutral-500">
                        DNI
                      </span>
                      <input
                        inputMode="numeric"
                        placeholder="12345678"
                        value={card.dni}
                        onChange={(e) => setField("dni", onlyDigits(e.target.value).slice(0, 8))}
                        className={inputCls(errors.dni)}
                      />
                    </div>
                  </MpField>

                  {/* Cuotas */}
                  {method === "credit" && (
                    <MpField label="¿En cuántas cuotas?">
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full appearance-none rounded-md border border-neutral-300 bg-neutral-0 bg-[length:18px] bg-[right_0.75rem_center] bg-no-repeat px-4 py-3 text-[15px] text-neutral-900 outline-none focus:border-[#009ee3]"
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                        }}
                      >
                        {cuotas.map((c) => (
                          <option key={c.n} value={c.n}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </MpField>
                  )}
                </div>

                {error && <p className="mt-4 text-xs font-medium text-red-600">{error}</p>}

                <button
                  type="button"
                  onClick={() => decide("approved")}
                  disabled={processing !== null}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold text-neutral-0 transition-colors disabled:opacity-60"
                  style={{ background: MP_BLUE }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = MP_BLUE_DARK)}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = MP_BLUE)}
                >
                  {processing === "approved" ? <><Spinner /> Procesando pago…</> : `Pagar ${formatARS(order.total)}`}
                </button>

                <button
                  type="button"
                  onClick={() => decide("rejected")}
                  disabled={processing !== null}
                  className="mt-3 w-full text-center text-xs font-medium text-neutral-400 underline-offset-4 transition-colors hover:text-neutral-600 hover:underline disabled:opacity-60"
                >
                  {processing === "rejected" ? "Procesando…" : "Simular pago rechazado"}
                </button>
              </div>

              {/* Tarjeta 3D + resumen */}
              <div className="order-1 md:order-2">
                <div className="rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 p-4">
                  <CardPreview number={card.number} name={card.name} expiry={card.expiry} cvc={card.cvc} flipped={back} />
                  {brand && (
                    <p className="mt-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">
                      {brand}
                    </p>
                  )}
                </div>
                {method === "credit" && installments > 1 && (
                  <p className="mt-4 rounded-lg bg-neutral-0 px-4 py-3 text-center text-xs text-neutral-600 shadow-sm">
                    {installments} cuotas de{" "}
                    <span className="font-semibold text-neutral-900">{formatARS(total / installments)}</span>
                    <br />
                    <span className="text-neutral-400">sin interés</span>
                  </p>
                )}
              </div>
            </div>

            <p className="mt-8 flex items-center justify-center gap-2 text-xs text-neutral-400">
              <Lock /> Tus datos están protegidos. Procesa Mercado Pago.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

/* piezas */

function inputCls(error?: string) {
  return `w-full rounded-md border bg-neutral-0 px-4 py-3 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-[#009ee3] ${
    error ? "border-red-400" : "border-neutral-300"
  }`;
}

function MpField({
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
