"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Bloque, Dato, Estado, EstadoNoListo, Historial, Titulo, useDatos, useErrorDeAccion } from "@/components/admin/datos";
import { ConfirmDialog, adminButtonClasses, useToast } from "@/components/admin/ui";
import { panel } from "@/lib/admin/api";
import { ESTADO_ORDEN, MEDIO_DE_PAGO, fechaHora, plata } from "@/lib/admin/formato";

export default function OrdenPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const { estado, recargar, setEstado } = useDatos(() => panel.orden(publicId), [publicId]);
  const [dni, setDni] = useState<string | null>(null);
  const [nota, setNota] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorDeAccion = useErrorDeAccion();
  const { toast, showToast } = useToast();
  const volver = <Link href="/admin/ordenes" className="text-sm font-semibold text-brand-600 hover:underline">Volver a órdenes</Link>;

  if (estado.tipo !== "listo") {
    return (
      <div className="flex flex-col gap-6">
        <Titulo>Orden</Titulo>
        <EstadoNoListo estado={estado} recargar={recargar} noEncontrado={{ texto: "No encontramos esa orden.", volver }} />
      </div>
    );
  }
  const o = estado.datos;
  const notaActual = nota ?? o.admin_notes;

  async function accion(hacer: () => Promise<void>, aviso: string) {
    setOcupado(true);
    setError(null);
    try {
      await hacer();
      showToast(aviso);
    } catch (e) {
      setError(errorDeAccion(e));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/ordenes" className="text-sm text-neutral-700 hover:text-ink-900">← Órdenes</Link>
      <Titulo
        bajada={<span className="font-mono">{o.public_id}</span>}
        acciones={
          o.status === "PAID" && (
            <button type="button" disabled={ocupado} onClick={() => setConfirmar(true)} className={adminButtonClasses("primary")}>
              Marcar como cumplida
            </button>
          )
        }
      >
        Orden de {o.buyer_name}
      </Titulo>
      {error && <p role="alert" className="border border-status-error/40 bg-status-error/10 px-4 py-3 text-sm text-status-error">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Bloque titulo="Estado">
            <div className="mb-4"><Estado {...ESTADO_ORDEN[o.status]} /></div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Dato etiqueta="Creada">{fechaHora(o.created_at)}</Dato>
              <Dato etiqueta="Pagada">{fechaHora(o.paid_at)}</Dato>
              <Dato etiqueta="Cumplida">{fechaHora(o.fulfilled_at)}</Dato>
            </dl>
          </Bloque>

          <Bloque titulo="Comprador">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Dato etiqueta="Nombre">{o.buyer_name}</Dato>
              <Dato etiqueta="Correo">{o.buyer_email}</Dato>
              <Dato etiqueta="Teléfono">{o.buyer_phone}</Dato>
              <Dato etiqueta="Laboratorio o empresa">{o.buyer_company}</Dato>
              <Dato etiqueta="DNI">
                <span className="inline-flex flex-wrap items-center gap-3">
                  <span className="font-mono">{dni ?? o.dni_enmascarado}</span>
                  {!dni && o.dni_enmascarado && (
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => void accion(async () => setDni((await panel.verDni(o.public_id)).dni), "Queda registrado que viste el DNI")}
                      className="text-sm font-semibold text-brand-600 hover:underline"
                    >
                      Mostrar
                    </button>
                  )}
                </span>
              </Dato>
            </dl>
          </Bloque>

          <Bloque titulo="Cursos">
            <ul className="divide-y divide-neutral-200">
              {o.items.map((i, n) => (
                <li key={n} className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900">{i.title_snapshot}</p>
                    <p className="text-xs text-neutral-500">
                      {i.fecha ? `Fecha: ${fechaHora(i.fecha)} · ` : ""}
                      {i.quantity} × {plata(i.unit_price, o.currency)}
                      {i.participantes ? ` · ${i.participantes} participantes` : ""}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums text-ink-900">{plata(i.total, o.currency)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 flex flex-col gap-1 border-t border-neutral-200 pt-4 text-sm">
              {o.discount_total !== "0.00" && (
                <div className="flex justify-between text-neutral-700">
                  <dt>Descuento{o.discount_label ? ` (${o.discount_label})` : ""}</dt>
                  <dd className="tabular-nums">− {plata(o.discount_total, o.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between font-semibold text-ink-900">
                <dt>Total</dt>
                <dd className="tabular-nums">{plata(o.total, o.currency)}</dd>
              </div>
            </dl>
          </Bloque>

          <Bloque titulo="Pago">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Dato etiqueta="Medio">{MEDIO_DE_PAGO[o.payment_method] ?? o.payment_method}</Dato>
              <Dato etiqueta="Pago en Mercado Pago">{o.mp_payment_id}</Dato>
              <Dato etiqueta="Estado en Mercado Pago">{o.mp_status}</Dato>
            </dl>
          </Bloque>
        </div>

        <div className="flex flex-col gap-6">
          <Bloque titulo="Notas internas">
            <label htmlFor="nota" className="sr-only">Notas internas</label>
            <textarea
              id="nota"
              rows={5}
              value={notaActual}
              onChange={(e) => setNota(e.target.value)}
              className="w-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={ocupado || notaActual === o.admin_notes}
              onClick={() =>
                void accion(async () => {
                  setEstado({ tipo: "listo", datos: await panel.guardarNota(o.public_id, notaActual) });
                  setNota(null);
                }, "Guardado")
              }
              className={`mt-3 ${adminButtonClasses("secondary")}`}
            >
              {ocupado ? "Guardando…" : "Guardar nota"}
            </button>
          </Bloque>
          <Bloque titulo="Historial">
            <Historial eventos={o.historial} />
          </Bloque>
        </div>
      </div>

      <ConfirmDialog
        open={confirmar}
        title="¿Ya le diste acceso al aula virtual?"
        description="La orden pasa a Cumplida y queda en la auditoría. No se puede deshacer desde el panel."
        confirmLabel="Marcar como cumplida"
        confirmTone="primary"
        onConfirm={() => {
          setConfirmar(false);
          void accion(async () => setEstado({ tipo: "listo", datos: await panel.marcarCumplida(o.public_id) }), "Orden cumplida");
        }}
        onCancel={() => setConfirmar(false)}
      />
      {toast}
    </div>
  );
}
