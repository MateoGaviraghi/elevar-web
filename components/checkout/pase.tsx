"use client";

/**
 * Checkout · Pase (elegido por Mateo 2026-11-06: "queda pase"; referencias Supabase · ticket +
 * Codrops · Hoshi, entre Pase, Conversación y Tinta).
 * La orden es un pase de inscripción naranja con el código del curso gigante; mientras
 * completás tus datos, tu nombre, empresa y correo aparecen escritos en el pase.
 *
 * Correcciones de Mateo (2026-11-06): en escritorio datos y pago entran en una sola pantalla
 * usando todo el ancho de la izquierda, y el pase es más grande; los campos tienen caja y
 * título claro; en el teléfono primero se completan los datos (el pase va después, antes del
 * pago) y cada campo que tocás o completás sube la página hacia el siguiente.
 */
import { useRef } from "react";
import type { CartItem, Modality } from "@/types";
import { pegar } from "@/lib/texto";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import type { Checkout } from "./use-checkout";
import {
  Anillos,
  AvisosOrden,
  BoxField,
  CheckoutShell,
  Cupon,
  Descuentos,
  LineasOrden,
  Pago,
  Participantes,
  totalTexto,
  Vivo,
  VolverCarrito,
} from "./piezas";
import { PhoneInput } from "@/components/ui/phone-input";

export const MODALIDAD: Record<Modality, string> = { ASYNC: "Asincrónico", LIVE: "En vivo", WEBINAR: "Webinar", EBOOK: "E-Book" };

export function fechaDe(item: CartItem) {
  return item.sessionLabel ?? (item.modality === "ASYNC" || item.modality === "EBOOK" ? "A tu ritmo, desde hoy" : "A confirmar");
}

const esTelefono = () => typeof window !== "undefined" && window.innerWidth < 1024;

export function CheckoutPase({ co }: { co: Checkout }) {
  const scope = useRef<HTMLDivElement>(null);
  const datos = useRef<HTMLElement>(null);
  const pago = useRef<HTMLElement>(null);
  const ok = (k: "firstName" | "lastName" | "email" | "phone") => !co.erroresDe([k])[k];

  // Entrada (corrección de Mateo 2026-11-06: "más fluido, no tan rápido"), encadenada:
  // 0,0 s el formulario sube y se enfoca, de a un bloque cada 0,12 s (1,2 s cada uno);
  // 0,2 s el pase llega girado desde abajo y se asienta (1,8 s);
  // 0,9 s las letras del código suben desde su máscara, una cada 0,07 s (1,2 s);
  // 1,2 s los datos del pase y el total aparecen de a uno (1,0 s, cada 0,08 s).
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(".pase-in", { y: 32, autoAlpha: 0, filter: "blur(6px)", duration: 1.2, stagger: 0.12, ease: "power3.out", clearProps: "filter" }, 0)
        .from(".pase-card", { y: 140, rotate: -7, scale: 0.94, autoAlpha: 0, duration: 1.8, transformOrigin: "50% 100%" }, 0.2)
        .from(".pase-char", { yPercent: 110, duration: 1.2, stagger: 0.07 }, 0.9)
        .from(".pase-dato", { y: 14, autoAlpha: 0, duration: 1.0, stagger: 0.08, ease: "power3.out" }, 1.2);
    },
    { scope }
  );

  /** Sube la página hasta un elemento (deja 80 px arriba), solo en el teléfono. */
  function subirA(el: Element | null | undefined) {
    if (!el || !esTelefono()) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  // En el teléfono: al tocar un campo, la página lo sube; con "Siguiente" del teclado pasa al
  // próximo campo y, después del último, baja hasta el pago.
  function alEnfocar(e: React.FocusEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).tagName !== "INPUT") return;
    const paso = (e.target as HTMLElement).closest("[data-paso]");
    window.setTimeout(() => subirA(paso), 250);
  }
  function alTeclear(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter" || (e.target as HTMLElement).tagName !== "INPUT") return;
    e.preventDefault();
    const pasos = [...(datos.current?.querySelectorAll<HTMLElement>("[data-paso]") ?? [])];
    const i = pasos.findIndex((p) => p.contains(e.target as Node));
    const sig = pasos[i + 1]?.querySelector<HTMLInputElement>("input");
    if (sig) sig.focus();
    else {
      (e.target as HTMLInputElement).blur();
      subirA(pago.current);
    }
  }

  return (
    <CheckoutShell>
      <div ref={scope} className="grid grid-cols-1 lg:min-h-[calc(100vh-4rem-1px)] lg:grid-cols-[minmax(0,1fr)_minmax(500px,42%)]">
        {/* ── Datos y pago (izquierda en escritorio; primero en el teléfono) ── */}
        <div className="bg-neutral-0 lg:flex lg:flex-col lg:justify-center">
          <div className="mx-auto w-full max-w-xl px-4 pb-24 pt-6 sm:px-6 lg:max-w-[760px] lg:px-12 lg:py-8 [@media(min-width:1024px)_and_(max-height:820px)]:py-4">
            <VolverCarrito className="pase-in" />

            <section ref={datos} className="mt-5 scroll-mt-6 [@media(min-width:1024px)_and_(max-height:820px)]:mt-2" onFocus={alEnfocar} onKeyDown={alTeclear}>
              <h1 className="pase-in font-display text-3xl font-semibold tracking-tight text-ink-900">Tus datos</h1>
              <p className="pase-in mt-1.5 text-[15px] text-neutral-700 [@media(min-width:1024px)_and_(max-height:820px)]:hidden">{pegar("A tu correo llegan la confirmación y el acceso.")}</p>

              <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2 [@media(min-width:1024px)_and_(max-height:820px)]:mt-3 [@media(min-width:1024px)_and_(max-height:820px)]:gap-y-3">
                <div data-paso className="pase-in">
                  <BoxField label="Nombre" placeholder="Tu nombre" autoComplete="given-name" enterKeyHint="next" value={co.buyer.firstName} onChange={(v) => co.set("firstName", v)} error={co.errors.firstName} ok={ok("firstName")} />
                </div>
                <div data-paso className="pase-in">
                  <BoxField label="Apellido" placeholder="Tu apellido" autoComplete="family-name" enterKeyHint="next" value={co.buyer.lastName} onChange={(v) => co.set("lastName", v)} error={co.errors.lastName} ok={ok("lastName")} />
                </div>
                <div data-paso className="pase-in">
                  <BoxField label="Correo electrónico" placeholder="nombre@laboratorio.com" type="email" inputMode="email" autoComplete="email" enterKeyHint="next" value={co.buyer.email} onChange={(v) => co.set("email", v)} error={co.errors.email} ok={ok("email")} />
                </div>
                <div
                  data-paso
                  className="pase-in [&_label]:mb-1.5 [&_label]:text-sm [&_label]:font-semibold [&_label]:normal-case [&_label]:tracking-normal [&_label]:text-ink-900 [&>div>div]:h-12 [&>div>div]:border-neutral-500/50 [&>div>span]:text-neutral-700"
                >
                  <PhoneInput variant="box" label="Teléfono" pais={co.pais} onPais={co.setPais} local={co.buyer.phone} onLocal={(v) => co.set("phone", v)} error={co.errors.phone} />
                </div>
                <div data-paso className="pase-in sm:col-span-2">
                  <BoxField label="Laboratorio o empresa (opcional)" placeholder="Nombre del laboratorio" autoComplete="organization" enterKeyHint="done" value={co.buyer.company} onChange={(v) => co.set("company", v)} ok={co.buyer.company.trim().length > 0} />
                </div>
              </div>

              {co.multiLines.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">Participantes</h2>
                  <p className="mb-4 mt-1 text-sm text-neutral-700">{pegar("A cada correo le llegan el acceso y el certificado.")}</p>
                  <Participantes co={co} />
                </div>
              )}
            </section>

            {/* En el teléfono el pase va acá, ya con tus datos, antes del pago. */}
            <div className="-mx-4 mt-10 bg-ink-900 px-4 pb-6 pt-8 sm:-mx-6 sm:px-6 lg:hidden">
              <Pase co={co} />
              <Orden co={co} />
            </div>

            <section ref={pago} className="pase-in mt-10 scroll-mt-6 lg:mt-8 [@media(min-width:1024px)_and_(max-height:820px)]:mt-5">
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">
                {co.isFreeOrder ? "Confirmar inscripción" : "Medio de pago"}
              </h2>
              <div className="mt-3">
                <Pago
                  co={co}
                  compacto
                  onPay={async () => {
                    // Si falta un dato, la página vuelve a los campos para que se vea el error.
                    if (!(await co.startPayment())) datos.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
                  }}
                />
              </div>
            </section>

            <AvisosOrden co={co} />
          </div>
        </div>

        {/* ── El pase, grande (derecha, solo escritorio) ── */}
        <aside className="hidden bg-ink-900 lg:block">
          <div className="sticky top-0 flex min-h-[calc(100vh-4rem-1px)] flex-col justify-center px-10 py-10 xl:px-14">
            <div className="mx-auto w-full max-w-[560px]">
              <Pase co={co} grande />
              <Orden co={co} />
            </div>
          </div>
        </aside>
      </div>
    </CheckoutShell>
  );
}

function Pase({ co, grande = false }: { co: Checkout; grande?: boolean }) {
  const first = co.items[0];
  const resto = co.items.length - 1;
  const nombre = `${co.buyer.firstName} ${co.buyer.lastName}`.trim();
  return (
    <div className="pase-card relative overflow-hidden bg-brand-500 text-neutral-0 lg:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
      <Anillos className={`pointer-events-none absolute text-neutral-0/20 ${grande ? "-right-20 -top-20 h-96 w-96" : "-right-16 -top-16 h-72 w-72"}`} />
      <div className={`relative ${grande ? "p-9 xl:p-10" : "p-6"}`}>
        <div className="flex items-center justify-between text-[12px] font-medium text-neutral-0/80">
          <span>ELEVAR · Pase de inscripción</span>
          <span className="tabular-nums">
            {co.units} {co.units === 1 ? "lugar" : "lugares"}
          </span>
        </div>
        <p className={`mt-5 font-display font-bold leading-[0.9] tracking-tight ${grande ? "text-[104px] xl:text-[128px]" : "text-[64px]"}`}>
          <span className="inline-flex overflow-hidden pb-[0.04em]" aria-label={first.code ?? "ELEVAR"}>
            {[...(first.code ?? "ELEVAR")].map((c, i) => (
              <span key={i} aria-hidden className="pase-char inline-block">
                {c}
              </span>
            ))}
          </span>
          {resto > 0 && <span className="ml-2 align-top text-2xl font-semibold text-neutral-0/75">+{resto}</span>}
        </p>
        <p className={`pase-dato mt-4 line-clamp-2 font-medium leading-snug ${grande ? "text-lg" : "text-[15px]"}`}>{first.titleSnapshot}</p>

        <dl className={`pase-dato mt-6 grid grid-cols-[100px_minmax(0,1fr)] gap-x-4 border-t border-neutral-0/25 pt-5 ${grande ? "gap-y-3.5 text-[15px]" : "gap-y-3 text-sm"}`}>
          <dt className="text-neutral-0/70">Participante</dt>
          <dd className="font-semibold"><Vivo value={nombre} vacio="Tu nombre" /></dd>
          <dt className="text-neutral-0/70">Empresa</dt>
          <dd><Vivo value={co.buyer.company} vacio="Tu laboratorio" /></dd>
          <dt className="text-neutral-0/70">Correo</dt>
          <dd><Vivo value={co.buyer.email} vacio="tu@correo.com" /></dd>
          <dt className="text-neutral-0/70">Fecha</dt>
          <dd>{fechaDe(first)}</dd>
          <dt className="text-neutral-0/70">Modalidad</dt>
          <dd>{MODALIDAD[first.modality]}</dd>
        </dl>
      </div>

      {/* Troquel: la línea punteada con dos muescas */}
      <div className="relative h-0 border-t-2 border-dashed border-neutral-0/35">
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-ink-900" />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-ink-900" />
      </div>

      <div className={`pase-dato relative flex items-end justify-between gap-4 ${grande ? "px-9 py-7 xl:px-10" : "p-6"}`}>
        <span className="text-sm font-medium text-neutral-0/80">Total</span>
        <span className={`font-display font-bold tabular-nums tracking-tight ${grande ? "text-5xl xl:text-6xl" : "text-4xl"}`}>{totalTexto(co)}</span>
      </div>
    </div>
  );
}

/** Lo que acompaña al pase: líneas si hay más de un curso o uno caído, descuentos y cupón. */
function Orden({ co }: { co: Checkout }) {
  const conLineas = co.items.length > 1 || co.items.some((i) => co.validByKey.get(`${i.courseId}:${i.sessionId ?? "x"}`)?.available === false);
  return (
    <div className="pase-in mt-5 py-2 text-neutral-0">
      {conLineas && (
        <div className="mb-4 border-y border-neutral-0/10">
          <LineasOrden co={co} />
        </div>
      )}
      <div className="mb-3">
        <Descuentos co={co} />
      </div>
      <Cupon co={co} />
    </div>
  );
}
