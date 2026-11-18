"use client";

/**
 * Comprobante de inscripción (2026-11-18, Mateo: «una sub página que se vea el pdf y poder
 * descargarlo»). Se ve como una hoja A4 sobre fondo gris, con una barra arriba para volver a
 * la orden y descargar el PDF. El PDF se arma en el navegador con @react-pdf/renderer, que se
 * carga recién al tocar «Descargar PDF», con los mismos datos (lib/comprobante.ts).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrder } from "@/lib/api";
import { armarComprobante, type Comprobante as Datos } from "@/lib/comprobante";
import { LOGO_ARCS, LOGO_BARS, LOGO_ORANGE } from "@/components/brand/logo-geometry";
import { pegar } from "@/lib/texto";

export function Comprobante({ publicId }: { publicId: string }) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "no">("cargando");
  const [bajando, setBajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    getOrder(publicId)
      .then((o) => {
        if (cancelado) return;
        setDatos(armarComprobante(o, window.location.origin));
        setEstado("listo");
      })
      .catch(() => !cancelado && setEstado("no"));
    return () => {
      cancelado = true;
    };
  }, [publicId]);

  async function descargar() {
    if (!datos) return;
    setBajando(true);
    setError(null);
    try {
      const { descargarComprobante } = await import("./comprobante-pdf");
      await descargarComprobante(datos);
    } catch {
      setError("No pudimos armar el PDF. Probá de nuevo.");
    } finally {
      setBajando(false);
    }
  }

  return (
    <section className="min-h-screen bg-neutral-200/60 pb-16">
      {/* Barra superior: volver y descargar */}
      <div className="sticky top-0 z-30 border-b border-neutral-200 bg-neutral-0/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[860px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={`/orden/${publicId}`}
            className="flex min-h-11 items-center gap-2 text-sm font-semibold text-neutral-700 transition-colors hover:text-ink-900"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            <span className="hidden sm:inline">Volver a tu orden</span>
            <span className="sm:hidden">Volver</span>
          </Link>
          {datos && (
            <p className="hidden font-display text-sm font-semibold text-ink-900 sm:block">
              Comprobante <span className="tabular-nums">#{datos.numero}</span>
            </p>
          )}
          <button
            type="button"
            onClick={descargar}
            disabled={!datos || bajando}
            className="flex min-h-11 items-center gap-2 bg-ink-900 px-5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
            </svg>
            {bajando ? "Preparando…" : "Descargar PDF"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mx-auto max-w-[860px] px-4 pb-3 text-sm text-status-error sm:px-6">
            {error}
          </p>
        )}
      </div>

      <div className="mx-auto mt-6 max-w-[860px] px-3 sm:mt-10 sm:px-6">
        {estado === "cargando" && <Hoja><Esqueleto /></Hoja>}
        {estado === "no" && (
          <Hoja>
            <div className="py-16 text-center">
              <h1 className="font-display text-2xl font-semibold text-ink-900">No encontramos esta orden.</h1>
              <p className="mt-3 text-neutral-700">{pegar("Revisá el enlace que te llegó por correo o escribinos por WhatsApp.")}</p>
            </div>
          </Hoja>
        )}
        {estado === "listo" && datos && <Hoja><Documento d={datos} /></Hoja>}
      </div>
    </section>
  );
}

function Hoja({ children }: { children: React.ReactNode }) {
  return (
    <article className="relative overflow-hidden border border-neutral-200 bg-neutral-0 shadow-[0_24px_60px_-24px_rgba(11,30,51,0.25)]">
      <div className="h-1.5 bg-brand-500" aria-hidden />
      <div className="px-5 py-8 sm:px-12 sm:py-12">{children}</div>
    </article>
  );
}

const ETIQUETA = "text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500";

function Documento({ d }: { d: Datos }) {
  const tono =
    d.estado === "PAGADO"
      ? "bg-status-success/10 text-status-success"
      : d.estado === "PENDIENTE"
        ? "bg-status-warning/10 text-status-warning"
        : "bg-status-error/10 text-status-error";

  return (
    <>
      {/* Encabezado */}
      <header className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Isotipo className="h-12 w-auto" />
          <div>
            <p className="font-display text-2xl font-bold tracking-[0.08em] text-ink-900">ELEVAR</p>
            <p className="text-xs text-neutral-500">Consultoría de calidad para laboratorios</p>
          </div>
        </div>
        <div className="sm:text-right">
          <p className={ETIQUETA}>Comprobante de inscripción</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tabular-nums tracking-tight text-ink-900">#{d.numero}</h1>
          <p className="mt-1 text-sm text-neutral-700">Emitido el {d.emitido} h</p>
          <span className={`mt-3 inline-flex items-center gap-2 px-3 py-1 text-xs font-bold tracking-[0.12em] ${tono}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            {d.estado}
          </span>
        </div>
      </header>

      {/* Participante y emisor */}
      <div className="mt-10 grid gap-8 border-y border-neutral-200 py-8 sm:grid-cols-2">
        <div>
          <p className={ETIQUETA}>Participante</p>
          <dl className="mt-3 space-y-1.5 text-sm">
            {d.comprador.map((f) => (
              <div key={f.etiqueta} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2">
                <dt className="text-neutral-500">{f.etiqueta}</dt>
                <dd className="break-words font-medium text-ink-900">{f.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <p className={ETIQUETA}>Emitido por</p>
          <div className="mt-3 space-y-1.5 text-sm text-neutral-700">
            {d.emisor.map((l, i) => (
              <p key={l} className={i === 0 ? "font-semibold text-ink-900" : ""}>{l}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Detalle */}
      <div className="mt-10">
        <p className={ETIQUETA}>Detalle de la inscripción</p>
        <div className="mt-4 hidden grid-cols-[minmax(0,1fr)_4rem_7rem_7.5rem] gap-4 border-b border-ink-900 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 sm:grid">
          <span>Curso</span>
          <span className="text-right">Cant.</span>
          <span className="text-right">Precio</span>
          <span className="text-right">Importe</span>
        </div>
        <ul>
          {d.lineas.map((l, i) => (
            <li key={i} className="border-b border-neutral-200 py-5 sm:grid sm:grid-cols-[minmax(0,1fr)_4rem_7rem_7.5rem] sm:gap-4">
              <div className="min-w-0">
                {l.codigo && (
                  <span className="inline-block bg-brand-50 px-2 py-0.5 font-display text-xs font-bold tracking-wider text-brand-700">
                    {l.codigo}
                  </span>
                )}
                <p className="mt-2 text-pretty font-semibold leading-snug text-ink-900">{pegar(l.titulo)}</p>
                <p className="mt-1 text-sm text-neutral-700">{[l.modalidad, l.cuando].filter(Boolean).join(" · ")}</p>
                {l.participantes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-neutral-500">Participantes</p>
                    <ol className="mt-1 space-y-0.5 text-sm text-neutral-700">
                      {l.participantes.map((p, j) => (
                        <li key={j} className="break-words">
                          {j + 1}. {p.nombre}
                          {p.correo ? <span className="text-neutral-500"> · {p.correo}</span> : null}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
              <div className="mt-3 flex justify-between text-sm sm:mt-0 sm:block sm:text-right">
                <span className="text-neutral-500 sm:hidden">Cantidad</span>
                <span className="tabular-nums text-ink-900">{l.cantidad}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm sm:mt-0 sm:block sm:text-right">
                <span className="text-neutral-500 sm:hidden">Precio</span>
                <span className="tabular-nums text-ink-900">{l.unitario}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm font-semibold sm:mt-0 sm:block sm:text-right">
                <span className="text-neutral-500 sm:hidden">Importe</span>
                <span className="tabular-nums text-ink-900">{l.importe}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* Totales */}
        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-700">Subtotal</dt>
              <dd className="tabular-nums text-ink-900">{d.subtotal}</dd>
            </div>
            {d.descuento && (
              <div className="flex justify-between">
                <dt className="text-neutral-700">{d.descuento.etiqueta}</dt>
                <dd className="tabular-nums text-status-success">{d.descuento.importe}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-ink-900 pt-3">
              <dt className="font-semibold text-ink-900">Total</dt>
              <dd className="font-display text-3xl font-semibold tabular-nums tracking-tight text-ink-900">{d.total}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Pago */}
      <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 bg-neutral-50 px-5 py-5 sm:grid-cols-4">
        {d.pago.map((p) => (
          <div key={p.etiqueta}>
            <p className={ETIQUETA}>{p.etiqueta}</p>
            <p className="mt-1 text-sm font-medium text-ink-900">{p.valor}</p>
          </div>
        ))}
      </div>

      {/* Qué sigue */}
      <div className="mt-10">
        <p className={ETIQUETA}>Qué sigue</p>
        <ol className="mt-4 grid gap-5 sm:grid-cols-2">
          {d.pasos.map((p, i) => (
            <li key={p.titulo} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
              <span className="font-display text-sm font-semibold tabular-nums text-brand-600">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="font-semibold text-ink-900">{pegar(p.titulo)}</p>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-neutral-700">{pegar(p.texto)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Pie */}
      <footer className="mt-12 border-t border-neutral-200 pt-5 text-xs leading-relaxed text-neutral-500">
        <p>{pegar("Este comprobante acredita tu inscripción. No reemplaza a la factura.")}</p>
        <p className="mt-1 break-all">Versión online: {d.url}</p>
      </footer>
    </>
  );
}

function Esqueleto() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Cargando el comprobante">
      <div className="h-12 w-48 bg-neutral-200" />
      <div className="h-32 bg-neutral-200" />
      <div className="h-24 bg-neutral-200" />
      <div className="h-16 w-1/2 bg-neutral-200" />
    </div>
  );
}

/** Isotipo de ELEVAR (3 barras y 2 arcos), de la geometría del logo. */
export function Isotipo({ className }: { className?: string }) {
  return (
    <svg viewBox="150 0 372 985" className={className} role="img" aria-label="ELEVAR">
      {LOGO_BARS.map((b) => (
        <path key={b.id} d={b.d} fill={LOGO_ORANGE} />
      ))}
      {LOGO_ARCS.map((a) => (
        <path key={a.id} d={a.d} fill={LOGO_ORANGE} />
      ))}
    </svg>
  );
}
