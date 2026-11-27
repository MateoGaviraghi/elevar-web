"use client";

import { useState } from "react";
import { useErrorDeAccion } from "@/components/admin/datos";
import { BotonFicha, CuadroIcono, Rotulo } from "@/components/admin/lista/Botones";
import { panel } from "@/lib/admin/api";
import { MEDIO_DE_PAGO, fechaHora, plata } from "@/lib/admin/formato";
import type { AvisoCobro, OrdenDetalle, TipoAviso } from "@/lib/admin/tipos";

/**
 * Avisos de cobro e inscripción (2026-11-27, `docs/dashboard/ALERTAS.md`). El servidor decide qué es un aviso y
 * su nivel (`panel/services/avisos.py`); acá solo se dice en palabras y se ofrecen sus acciones: copiar el número
 * del pago para buscarlo en Mercado Pago o Stripe, reenviar la confirmación, resolver con una nota o posponer.
 * Ningún aviso muestra el correo ni el teléfono: se ven al abrir la orden.
 */

export const TIPO_AVISO: Record<TipoAviso, { nombre: string; icono: string }> = {
  MONTO_DISTINTO: { nombre: "Pagó otro monto", icono: "moneda" },
  SIN_LUGAR: { nombre: "Pagó sin lugar", icono: "personas" },
  CONFIRMACION_FALLIDA: { nombre: "No le llegó la confirmación", icono: "sobre" },
  ALERTA_FALLIDA: { nombre: "No llegó el aviso de venta", icono: "sobre" },
  PAGO_SIN_ORDEN: { nombre: "Pago sin orden", icono: "alerta" },
  DEVOLUCION_PARCIAL: { nombre: "Devolución parcial", icono: "devuelta" },
  DEVOLUCION_OTRO_PAGO: { nombre: "Devolución de otro pago", icono: "devuelta" },
  LUGARES_SIN_NOMBRE: { nombre: "Lugares sin nombre", icono: "persona" },
};

const texto = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const medio = (a: AvisoCobro) => (a.medio ? MEDIO_DE_PAGO[a.medio] ?? a.medio : "El medio de pago");

/** Qué pasó, en una oración. */
export function fraseAviso(a: AvisoCobro): string {
  const d = a.detalle;
  switch (a.tipo) {
    case "MONTO_DISTINTO":
      return `${medio(a)} aprobó ${d.cobrado ? plata(texto(d.cobrado), texto(d.moneda_cobrada) || "ARS") : "un monto distinto"} y la orden es de ${plata(texto(d.total), texto(d.moneda) || "ARS")}. No se marcó pagada.`;
    case "SIN_LUGAR":
      return `Pagó ${d.lugares === 1 ? "1 lugar" : `${texto(d.lugares)} lugares`} de ${texto(d.curso)} (${fechaHora(texto(d.inicio))}) y la fecha ya estaba llena. Hay que reubicarlo o devolverle la plata.`;
    case "CONFIRMACION_FALLIDA":
      return "El mail de compra confirmada no salió. La orden está pagada.";
    case "ALERTA_FALLIDA":
      return "El mail de venta a ELEVAR no salió. La orden está pagada: solo faltó el aviso.";
    case "PAGO_SIN_ORDEN":
      return d.estado === "approved" || d.estado === "paid"
        ? `${medio(a)} avisó de un pago aprobado que no es de ninguna orden.`
        : `${medio(a)} avisó de una devolución de un pago que no es de ninguna orden.`;
    case "DEVOLUCION_PARCIAL":
      return `Se devolvió una parte del pago${d.devuelto ? ` (${plata(texto(d.devuelto), texto(d.moneda) || "ARS")})` : ""}. La orden sigue como pagada.`;
    case "DEVOLUCION_OTRO_PAGO":
      return "Se devolvió un pago de esta orden que no es el que la pagó. La orden no se marcó devuelta.";
    case "LUGARES_SIN_NOMBRE":
      return `Faltan ${texto(d.faltan)} de ${texto(d.lugares)} nombres para ${texto(d.curso)}, que empieza el ${fechaHora(texto(d.inicio))}.`;
  }
}

interface AccionesProps {
  a: AvisoCobro;
  avisar: (t: string) => void;
  /** Después de resolver, posponer o reenviar: la pantalla vuelve a pedir lo que muestra. */
  onCambio: (orden?: OrdenDetalle) => void;
}

function Acciones({ a, avisar, onCambio }: AccionesProps) {
  const [resolviendo, setResolviendo] = useState(false);
  const [nota, setNota] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const errorDeAccion = useErrorDeAccion();

  const correr = async (fn: () => Promise<OrdenDetalle | void>, hecho: string) => {
    setOcupado(true);
    setError(null);
    try {
      const orden = await fn();
      avisar(hecho);
      onCambio(orden ?? undefined);
    } catch (e) {
      setError(errorDeAccion(e));
    } finally {
      setOcupado(false);
    }
  };
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(a.pago);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sin permiso para copiar: el número queda a la vista */
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {a.pago && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-700">
          <span>Pago en {medio(a)}:</span>
          <span className="font-mono text-ink-900 [overflow-wrap:anywhere]">{a.pago}</span>
          <button type="button" onClick={() => void copiar()}
            className="min-h-[32px] rounded-[10px] border border-ink-100 px-2.5 font-sub text-xs font-semibold text-ink-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [@media(hover:hover)]:hover:border-ink-900">
            {copiado ? "Copiado" : "Copiar el número"}
          </button>
        </p>
      )}
      {error && <p role="alert" className="rounded-[10px] bg-status-error/10 px-3 py-2 text-sm text-status-error">{error}</p>}
      {resolviendo ? (
        <div className="flex flex-col gap-2 rounded-[14px] bg-ink-900 p-3 text-neutral-0">
          <label htmlFor={`resolver-${a.clave}`} className="text-sm">¿Qué hiciste? Queda en el historial.</label>
          <textarea id={`resolver-${a.clave}`} value={nota} onChange={(e) => setNota(e.target.value)} maxLength={2000} rows={2} autoFocus
            className="min-h-[64px] resize-y rounded-[10px] bg-neutral-0 p-2.5 text-base text-ink-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:text-sm" />
          <div className="flex flex-wrap gap-2">
            <BotonFicha onClick={() => void correr(() => panel.resolverAviso(a.id!, nota), "Aviso resuelto.")} deshabilitado={ocupado || nota.trim().length < 3} icono="tilde">
              {ocupado ? "Guardando…" : "Marcar resuelto"}
            </BotonFicha>
            <BotonFicha variante="claro" onClick={() => setResolviendo(false)} deshabilitado={ocupado}>Volver</BotonFicha>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {a.se_reenvia && a.orden && (
            <BotonFicha onClick={() => void correr(() => panel.reenviarConfirmacion(a.orden!), "Confirmación reenviada.")} deshabilitado={ocupado} icono="enviar">
              {ocupado ? "Enviando…" : "Reenviar la confirmación"}
            </BotonFicha>
          )}
          {a.se_resuelve && a.id !== null && (
            <>
              <BotonFicha variante={a.se_reenvia ? "contorno" : "principal"} onClick={() => setResolviendo(true)} icono="tilde">Resolver</BotonFicha>
              {!a.pospuesto_hasta && (
                <BotonFicha variante="contorno" onClick={() => void correr(() => panel.posponerAviso(a.id!), "Pospuesto 7 días.")} deshabilitado={ocupado} icono="reloj">Posponer 7 días</BotonFicha>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Un aviso con su ícono, qué pasó y sus acciones. */
export function FilaAviso({ a, avisar, onCambio, conOrden = false }: AccionesProps & { conOrden?: boolean }) {
  const grave = a.nivel === "grave";
  return (
    <li data-escribe className="flex flex-col gap-2.5 py-3 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <CuadroIcono nombre={TIPO_AVISO[a.tipo].icono} tono={grave ? "marca" : "suave"} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-display text-base font-semibold text-ink-900">{TIPO_AVISO[a.tipo].nombre}</span>
            <span className={`font-sub text-[11px] font-semibold uppercase tracking-wider ${grave ? "text-status-error" : "text-ink-500"}`}>{grave ? "Urgente" : "Para mirar"}</span>
          </p>
          <p className="mt-0.5 text-sm text-ink-900">{fraseAviso(a)}</p>
          <p className="mt-0.5 text-xs text-neutral-700">
            {conOrden && a.numero ? <><span className="font-mono">#{a.numero}</span>{a.quien ? ` · ${a.quien}` : ""} · </> : ""}
            {a.id === null ? "Se calcula solo: se va cuando se completan los nombres o pasa la fecha" : `Desde el ${fechaHora(a.creado)}`}
            {a.pospuesto_hasta ? ` · Pospuesto hasta el ${fechaHora(a.pospuesto_hasta)}` : ""}
          </p>
        </div>
      </div>
      <div className="sm:pl-14"><Acciones a={a} avisar={avisar} onCambio={onCambio} /></div>
    </li>
  );
}

/** El bloque «A revisar» arriba de la tarjeta de la orden. */
export function AvisosOrden({ avisos, avisar, onCambio }: { avisos: AvisoCobro[] } & Omit<AccionesProps, "a">) {
  if (!avisos.length) return null;
  const grave = avisos.some((a) => a.nivel === "grave");
  return (
    <section data-entra aria-label="A revisar" className={`rounded-[16px] border-2 p-4 ${grave ? "border-brand-500 bg-brand-50/60" : "border-ink-200 bg-neutral-0"}`}>
      <Rotulo>A revisar</Rotulo>
      <ul className="mt-2 flex flex-col divide-y divide-ink-100">
        {avisos.map((a) => <FilaAviso key={a.clave} a={a} avisar={avisar} onCambio={onCambio} />)}
      </ul>
    </section>
  );
}
