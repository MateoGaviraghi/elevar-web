"use client";

/**
 * Piezas del checkout (2026-11-06): campo de línea
 * con el trazo naranja que se dibuja al enfocar (referencia Codrops · Hoshi), medios de pago,
 * botón de pago, cupón, participantes, avisos e íconos. Cada pieza acepta tono claro u oscuro.
 */
import { useEffect, useRef } from "react";
import Link from "next/link";
import type { PaymentMethod } from "@/types";
import { formatARS, formatUSD, USD_RATE } from "@/lib/formatters";
import { CONTACT } from "@/lib/contact";
import { pegar } from "@/lib/texto";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { MercadoPagoLogo, CardBrands, MP_BLUE, MP_BLUE_DARK } from "./mercado-pago";
import { PayPalLogo, PAYPAL_BLUE, PAYPAL_YELLOW, PAYPAL_YELLOW_DARK } from "./paypal";
import { lineKey, PAYPAL_ENABLED, type Checkout } from "./use-checkout";

export type Tono = "claro" | "oscuro";

/* ───────────── campos ───────────── */

/** Campo de línea: sin caja, el título arriba y una línea que se pinta de naranja al enfocar. */
export function LineField({
  label,
  value,
  onChange,
  error,
  tono = "claro",
  big = false,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  inputRef,
  onEnter,
  ariaLabel,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  tono?: Tono;
  big?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "text" | "email";
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onEnter?: () => void;
  ariaLabel?: string;
}) {
  const dark = tono === "oscuro";
  return (
    <label className="group block">
      {label && (
        <span
          className={`block text-[13px] font-medium transition-colors ${
            dark ? "text-neutral-0/60 group-focus-within:text-brand-300" : "text-neutral-700 group-focus-within:text-brand-600"
          }`}
        >
          {label}
        </span>
      )}
      <span className={`relative block border-b ${error ? "border-red-500" : dark ? "border-neutral-0/25" : "border-neutral-200"}`}>
        <input
          ref={inputRef}
          type={type}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          aria-label={ariaLabel}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) {
              e.preventDefault();
              onEnter();
            }
          }}
          className={`w-full bg-transparent outline-none ${
            big ? "pb-3 pt-2 font-display text-[28px] font-medium tracking-tight sm:text-[40px]" : "pb-2.5 pt-2 text-[17px]"
          } ${dark ? "text-neutral-0 placeholder:text-neutral-0/25" : "text-ink-900 placeholder:text-neutral-500"}`}
        />
        <span
          aria-hidden
          className="absolute inset-x-0 -bottom-px h-0.5 origin-left scale-x-0 bg-brand-500 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-focus-within:scale-x-100"
        />
      </span>
      {error && <span className={`mt-1.5 block text-xs ${dark ? "text-brand-300" : "text-red-600"}`}>{error}</span>}
    </label>
  );
}

/**
 * Campo con caja (corrección de Mateo 2026-11-06: con la línea sola "es muy difícil comprender
 * cada campo"): título claro arriba, caja con borde visible, ejemplo adentro, borde y halo
 * naranja al escribir y un tilde cuando el dato está completo.
 */
export function BoxField({
  label,
  value,
  onChange,
  error,
  ok,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  enterKeyHint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  ok?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "text" | "email";
  placeholder?: string;
  enterKeyHint?: "next" | "done";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-900">{label}</span>
      <span className="relative block">
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          enterKeyHint={enterKeyHint}
          onChange={(e) => onChange(e.target.value)}
          className={`h-12 w-full border bg-neutral-0 pl-4 pr-10 text-[15px] text-ink-900 outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-neutral-500 focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(233,78,27,0.15)] ${
            error ? "border-red-500" : "border-neutral-500/50 hover:border-neutral-700"
          }`}
        />
        {ok && !error && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
            <Check className="text-emerald-600" />
          </span>
        )}
      </span>
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

/** Participantes de las líneas con más de una inscripción. */
export function Participantes({ co, tono = "claro" }: { co: Checkout; tono?: Tono }) {
  const dark = tono === "oscuro";
  if (co.multiLines.length === 0) return null;
  return (
    <div className="space-y-8">
      {co.multiLines.map((item) => {
        const key = lineKey(item.courseId, item.sessionId);
        const list = co.attendees[key] ?? [];
        return (
          <div key={key}>
            <p className={`text-sm font-semibold leading-snug ${dark ? "text-neutral-0" : "text-ink-900"}`}>{item.titleSnapshot}</p>
            <p className={`mt-0.5 text-xs ${dark ? "text-neutral-0/55" : "text-neutral-700"}`}>
              {item.quantity} inscripciones{item.sessionLabel ? ` · ${item.sessionLabel}` : ""}
            </p>
            <div className="mt-2 space-y-4">
              {list.map((a, i) => (
                <div key={i} className="grid gap-x-6 gap-y-4 sm:grid-cols-[1fr_1.2fr]">
                  <LineField
                    tono={tono}
                    value={a.name}
                    onChange={(v) => co.updateAttendee(key, i, { name: v })}
                    placeholder={`Participante ${i + 1}: nombre`}
                    ariaLabel={`Participante ${i + 1}: nombre`}
                  />
                  <LineField
                    tono={tono}
                    type="email"
                    value={a.email}
                    onChange={(v) => co.updateAttendee(key, i, { email: v })}
                    placeholder="correo@laboratorio.com"
                    ariaLabel={`Participante ${i + 1}: correo`}
                    error={co.errors[`att-${key}-${i}`]}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────── pago ───────────── */

/** Medios de pago, transferencia por WhatsApp, errores y el botón de pagar. */
export function Pago({ co, tono = "claro", onPay, compacto = false }: { co: Checkout; tono?: Tono; onPay?: () => void; compacto?: boolean }) {
  const dark = tono === "oscuro";
  // Compacto: las dos opciones lado a lado y la nota de PayPal abajo, para que todo entre en una pantalla.
  const notaPaypal = (
    <p className={`mt-2 text-[11px] leading-relaxed ${dark ? "text-neutral-0/55" : "text-neutral-700"}`}>
      <span className="block">Conversión de referencia: USD 1 = {formatARS(USD_RATE)}.</span>
      <span className="block">{pegar("El importe final lo define PayPal.")}</span>
    </p>
  );
  return (
    <div>
      {co.isFreeOrder ? (
        <p className={`text-sm leading-relaxed ${dark ? "text-neutral-0/70" : "text-neutral-700"}`}>
          {pegar("Esta orden no tiene costo. Confirmá para completar tu inscripción y recibir el acceso por correo.")}
        </p>
      ) : (
        <>
          <div role="radiogroup" aria-label="Medio de pago" className={compacto ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
            <PaymentOption
              tono={tono}
              compacto={compacto}
              selected={co.method === "MERCADOPAGO"}
              onSelect={() => co.setMethod("MERCADOPAGO")}
              logo={<MercadoPagoLogo size={compacto ? 30 : 34} />}
              title="Mercado Pago"
              ocultarTitulo
              subtitle={compacto ? "Tarjeta, efectivo o dinero en cuenta. Hasta 12 cuotas." : "Tarjeta de crédito o débito, efectivo o dinero en cuenta. Hasta 12 cuotas."}
              amount={co.total != null ? formatARS(co.total) : "…"}
              accent={MP_BLUE}
            >
              {!compacto && <CardBrands className="mt-2.5" />}
            </PaymentOption>
            {PAYPAL_ENABLED && (
              <PaymentOption
                tono={tono}
                compacto={compacto}
                selected={co.method === "PAYPAL"}
                onSelect={() => co.setMethod("PAYPAL")}
                logo={<PayPalLogo withWordmark={false} size={32} />}
                title="PayPal"
                subtitle={compacto ? "En dólares, con tarjeta o saldo PayPal." : "Pago internacional en dólares, con tarjeta o saldo PayPal."}
                amount={co.totalUsd != null ? formatUSD(co.totalUsd) : "…"}
                accent={PAYPAL_BLUE}
              >
                {!compacto && notaPaypal}
              </PaymentOption>
            )}
          </div>
          {compacto && co.method === "PAYPAL" && notaPaypal}
          <p className={`${compacto ? "mt-3" : "mt-4"} text-sm ${dark ? "text-neutral-0/65" : "text-neutral-700"}`}>
            ¿Transferencia o factura a empresa?{" "}
            <a
              href={CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`whitespace-nowrap font-semibold underline underline-offset-4 transition-colors ${
                dark ? "text-neutral-0 hover:text-brand-300" : "text-ink-900 hover:text-brand-600"
              }`}
            >
              Coordinalo por WhatsApp
            </a>
          </p>
        </>
      )}

      {co.payError && <Aviso tono={tono}>{co.payError}</Aviso>}

      <PayButton
        compacto={compacto}
        free={co.isFreeOrder}
        method={co.method}
        processing={co.processing}
        disabled={co.processing || co.blocked}
        onClick={onPay ?? (() => void co.startPayment())}
      />
      <p className={`${compacto ? "mt-3" : "mt-4"} flex items-center justify-center gap-2 text-xs ${dark ? "text-neutral-0/55" : "text-neutral-700"}`}>
        <Lock /> Pago protegido · entorno de prueba
      </p>
    </div>
  );
}

function PaymentOption({
  tono,
  compacto = false,
  ocultarTitulo = false,
  selected,
  onSelect,
  logo,
  title,
  subtitle,
  amount,
  accent,
  children,
}: {
  tono: Tono;
  compacto?: boolean;
  ocultarTitulo?: boolean;
  selected: boolean;
  onSelect: () => void;
  logo: React.ReactNode;
  title: string;
  subtitle: string;
  amount: string;
  accent: string;
  children?: React.ReactNode;
}) {
  const dark = tono === "oscuro";
  return (
    <button
      type="button"
      role="radio"
      onClick={onSelect}
      aria-checked={selected}
      className={`relative flex w-full items-start ${compacto ? "gap-3 p-4" : "gap-4 p-5"} border text-left transition-colors duration-300 ${
        dark
          ? selected
            ? "border-brand-500 bg-neutral-0/[0.06]"
            : "border-neutral-0/15 hover:border-neutral-0/35"
          : selected
            ? "border-brand-500 bg-brand-50/40"
            : "border-neutral-200 hover:border-neutral-500"
      }`}
    >
      <span
        className="mt-1 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors"
        style={{ borderColor: selected ? accent : dark ? "rgba(255,255,255,0.3)" : "#E5EAEE" }}
        aria-hidden
      >
        {selected && <span className="h-2 w-2 rounded-full" style={{ background: accent }} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            {logo}
            <span className={ocultarTitulo ? "sr-only" : `text-[15px] font-semibold ${dark ? "text-neutral-0" : "text-ink-900"}`}>{title}</span>
          </span>
          <span className={`shrink-0 text-sm font-semibold tabular-nums ${dark ? "text-neutral-0" : "text-ink-900"}`}>{amount}</span>
        </span>
        <span className={`mt-1.5 block text-xs leading-relaxed ${dark ? "text-neutral-0/60" : "text-neutral-700"}`}>{pegar(subtitle)}</span>
        {children}
      </span>
    </button>
  );
}

function PayButton({
  compacto = false,
  free,
  method,
  processing,
  disabled,
  onClick,
}: {
  compacto?: boolean;
  free: boolean;
  method: PaymentMethod;
  processing: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const base =
    `${compacto ? "mt-5" : "mt-8"} flex h-14 w-full items-center justify-center gap-2.5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50`;
  if (free) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={`${base} bg-brand-500 text-neutral-0 hover:bg-brand-600`}>
        {processing ? <><Spinner /> Procesando…</> : "Confirmar inscripción"}
      </button>
    );
  }
  const paypal = method === "PAYPAL";
  const [bg, hover] = paypal ? [PAYPAL_YELLOW, PAYPAL_YELLOW_DARK] : [MP_BLUE, MP_BLUE_DARK];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${paypal ? "text-ink-900" : "text-neutral-0"}`}
      style={{ background: bg }}
      onMouseEnter={(ev) => (ev.currentTarget.style.background = hover)}
      onMouseLeave={(ev) => (ev.currentTarget.style.background = bg)}
    >
      {processing ? (
        <><Spinner /> Redirigiendo…</>
      ) : paypal ? (
        <><PayPalLogo size={18} /> Pagar con PayPal</>
      ) : (
        <><span className="grid h-7 w-9 place-items-center rounded-full bg-neutral-0"><MercadoPagoLogo withWordmark={false} size={26} /></span> Pagar con Mercado Pago</>
      )}
    </button>
  );
}

/* ───────────── orden ───────────── */

/** Cupón (el mismo que se aplica en el carrito). */
export function Cupon({ co, tono = "oscuro" }: { co: Checkout; tono?: Tono }) {
  const dark = tono === "oscuro";
  const ref = useRef<HTMLDetailsElement>(null);
  if (co.coupon && !co.couponError) {
    return (
      <p className="flex items-center justify-between gap-3 text-sm">
        <span className={dark ? "text-neutral-0/70" : "text-neutral-700"}>
          Cupón <span className={`font-mono font-semibold ${dark ? "text-neutral-0" : "text-ink-900"}`}>{co.coupon}</span> aplicado
        </span>
        <button type="button" onClick={co.quitarCupon} className={`text-xs font-semibold underline underline-offset-2 ${dark ? "text-neutral-0/70 hover:text-neutral-0" : "text-neutral-700 hover:text-ink-900"}`}>
          Quitar
        </button>
      </p>
    );
  }
  return (
    <details ref={ref} open={!!co.couponError} className="group/cupon">
      <summary
        className={`cursor-pointer list-none text-sm font-medium underline underline-offset-4 transition-colors [&::-webkit-details-marker]:hidden ${
          dark ? "text-neutral-0 hover:text-brand-300" : "text-ink-900 hover:text-brand-600"
        }`}
      >
        ¿Tenés un cupón?
      </summary>
      <div className="mt-3 flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <LineField
            tono={tono}
            value={co.couponDraft}
            onChange={co.setCouponDraft}
            onEnter={co.aplicarCupon}
            placeholder="Código del cupón"
            ariaLabel="Código del cupón"
          />
        </div>
        <button
          type="button"
          onClick={co.aplicarCupon}
          className={`h-10 shrink-0 px-5 text-sm font-semibold transition-colors ${dark ? "bg-neutral-0 text-ink-900 hover:bg-neutral-200" : "bg-ink-900 text-neutral-0 hover:bg-ink-700"}`}
        >
          Aplicar
        </button>
      </div>
      {co.couponError && <p className={`mt-2 text-xs ${dark ? "text-brand-300" : "text-red-600"}`}>{co.couponError}</p>}
    </details>
  );
}

/** Líneas de la orden con su precio; la que ya no se puede comprar, con su motivo y "Quitar". */
export function LineasOrden({ co, tono = "oscuro" }: { co: Checkout; tono?: Tono }) {
  const dark = tono === "oscuro";
  return (
    <ul className={`divide-y ${dark ? "divide-neutral-0/10" : "divide-neutral-200"}`}>
      {co.items.map((item) => {
        const v = co.validByKey.get(lineKey(item.courseId, item.sessionId));
        const price = v?.unit_price ?? item.unitPrice;
        const free = parseFloat(price) === 0;
        const gone = v != null && !v.available;
        return (
          <li key={lineKey(item.courseId, item.sessionId)} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className={`text-sm leading-snug ${gone ? "opacity-50" : ""} ${dark ? "text-neutral-0" : "text-ink-900"}`}>
                {item.quantity > 1 && <span className="mr-1 font-semibold">{item.quantity}×</span>}
                {item.titleSnapshot}
              </p>
              {gone && (
                <p className={`mt-1 flex flex-wrap items-center gap-x-3 text-xs font-medium ${dark ? "text-brand-300" : "text-brand-600"}`}>
                  {v.unavailable_reason ?? "Ya no está disponible."}
                  <button type="button" onClick={() => co.quitar(item)} className="font-semibold underline underline-offset-2">
                    Quitar
                  </button>
                </p>
              )}
            </div>
            <span className={`shrink-0 text-sm font-semibold tabular-nums ${gone ? "line-through opacity-40" : ""} ${dark ? "text-neutral-0" : "text-ink-900"}`}>
              {free ? "Gratis" : formatARS(parseFloat(price) * item.quantity)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Subtotal y descuentos, solo si los hay. */
export function Descuentos({ co, tono = "oscuro" }: { co: Checkout; tono?: Tono }) {
  const dark = tono === "oscuro";
  if (!(co.discounts.length > 0 || (co.subtotal != null && co.subtotal !== co.total))) return null;
  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex justify-between">
        <span className={dark ? "text-neutral-0/60" : "text-neutral-700"}>Subtotal</span>
        <span className="tabular-nums">{co.subtotal != null ? formatARS(co.subtotal) : "—"}</span>
      </div>
      {co.discounts.map((d) => (
        <div key={d.promoId} className={`flex justify-between gap-3 ${dark ? "text-emerald-300" : "text-emerald-700"}`}>
          <span className="min-w-0">{d.label}</span>
          <span className="shrink-0 tabular-nums">−{formatARS(d.amount)}</span>
        </div>
      ))}
    </div>
  );
}

export function totalTexto(co: Checkout) {
  if (co.total == null) return co.validationError ? "—" : "…";
  return co.isFreeOrder ? "Gratis" : formatARS(co.total);
}

/** Avisos de la orden: curso que ya no está y total que no se pudo calcular. */
export function AvisosOrden({ co, tono = "claro" }: { co: Checkout; tono?: Tono }) {
  return (
    <>
      {co.validation && !co.validation.valid && (
        <Aviso tono={tono}>
          <span className="block">{pegar("Hay un curso en tu orden que ya no está disponible.")}</span>
          <span className="block">{pegar("Quitalo desde la orden para poder pagar.")}</span>
        </Aviso>
      )}
      {co.validationError && (
        <Aviso tono={tono}>
          No pudimos calcular el total.{" "}
          <Link href="/carrito" className="underline underline-offset-2">
            Volvé al carrito
          </Link>{" "}
          y revisá los cursos.
        </Aviso>
      )}
    </>
  );
}

function Aviso({ tono, children }: { tono: Tono; children: React.ReactNode }) {
  return (
    <p
      className={`mt-6 border px-4 py-3 text-sm font-medium ${
        tono === "oscuro" ? "border-brand-500/50 bg-brand-500/10 text-brand-200" : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {children}
    </p>
  );
}

/** Un valor que aparece con un pequeño ascenso cuando pasa de vacío a escrito. */
export function Vivo({ value, vacio, className = "" }: { value: string; vacio: string; className?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const lleno = value.trim().length > 0;
  const antes = useRef(lleno);
  useEffect(() => {
    if (lleno && !antes.current && el.current && !prefersReducedMotion()) {
      gsap.fromTo(el.current, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out" });
    }
    antes.current = lleno;
  }, [lleno]);
  return (
    <span className={`block overflow-hidden ${className}`}>
      <span ref={el} className={`block truncate ${lleno ? "" : "opacity-40"}`}>
        {lleno ? value : vacio}
      </span>
    </span>
  );
}

/* ───────────── marco ───────────── */

export function CheckoutShell({ children, tono = "claro" }: { children: React.ReactNode; tono?: Tono }) {
  return (
    <div className={`min-h-screen ${tono === "oscuro" ? "bg-ink-900" : "bg-neutral-0"}`}>
      <header className="border-b border-neutral-0/10 bg-ink-900">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-12">
          <Link href="/" className="font-display text-lg font-bold tracking-tight text-neutral-0">
            ELEVAR
          </Link>
          <span className="flex items-center gap-2 text-xs font-medium text-neutral-0/60">
            <Lock /> Compra segura
          </span>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function VolverCarrito({ tono = "claro", className = "" }: { tono?: Tono; className?: string }) {
  return (
    <Link
      href="/carrito"
      className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
        tono === "oscuro" ? "text-neutral-0/60 hover:text-brand-300" : "text-neutral-700 hover:text-brand-600"
      } ${className}`}
    >
      <Chevron /> Volver al carrito
    </Link>
  );
}

/** Caja gris de carga. */
export function Skel({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return <span className={`inline-block animate-pulse align-middle ${dark ? "bg-neutral-0/10" : "bg-neutral-200"} ${className}`} aria-hidden />;
}

/* ───────────── íconos ───────────── */

export const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
export const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
export const Lock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
export const Check = ({ className = "text-brand-300" }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`mt-0.5 shrink-0 ${className}`}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/** Los anillos concéntricos de las miniaturas del sitio, como marca de agua. */
export const Anillos = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden>
    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1" />
    <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1" />
    <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="1" />
  </svg>
);
