"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Bloque, Dato, Estado, EstadoNoListo, Historial, Titulo, useDatos, useErrorDeAccion } from "@/components/admin/datos";
import { ConfirmDialog, adminButtonClasses, useToast } from "@/components/admin/ui";
import { panel } from "@/lib/admin/api";
import { ESTADO_CONSULTA, ORIGEN_CONSULTA, fechaHora } from "@/lib/admin/formato";
import type { EstadoConsulta } from "@/lib/admin/tipos";

export default function ConsultaPage() {
  const { id } = useParams<{ id: string }>();
  const { estado, recargar, setEstado } = useDatos(() => panel.consulta(id), [id]);
  const [confirmar, setConfirmar] = useState<EstadoConsulta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const errorDeAccion = useErrorDeAccion();
  const { toast, showToast } = useToast();
  const volver = <Link href="/admin/consultas" className="text-sm font-semibold text-brand-600 hover:underline">Volver a consultas</Link>;

  if (estado.tipo !== "listo") {
    return (
      <div className="flex flex-col gap-6">
        <Titulo>Consulta</Titulo>
        <EstadoNoListo estado={estado} recargar={recargar} noEncontrado={{ texto: "No encontramos esa consulta.", volver }} />
      </div>
    );
  }
  const c = estado.datos;
  const telefono = c.phone.replace(/\D/g, "");

  async function cambiar(nuevo: EstadoConsulta) {
    setConfirmar(null);
    setGuardando(true);
    setError(null);
    try {
      setEstado({ tipo: "listo", datos: await panel.cambiarEstadoConsulta(c.id, nuevo) });
      showToast("Guardado");
    } catch (e) {
      setError(errorDeAccion(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/consultas" className="text-sm text-neutral-700 hover:text-ink-900">← Consultas</Link>
      <Titulo bajada={`${c.company ? `${c.company} · ` : ""}Recibida el ${fechaHora(c.created_at)}`}>{c.name}</Titulo>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Bloque titulo="Contacto">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Dato etiqueta="Correo">{c.email}</Dato>
              <Dato etiqueta="Teléfono">{c.phone}</Dato>
              <Dato etiqueta="Origen">{ORIGEN_CONSULTA[c.source] ?? c.source}</Dato>
            </dl>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={`mailto:${c.email}`} className={adminButtonClasses("secondary")}>Escribir por correo</a>
              {telefono && (
                <a href={`https://wa.me/${telefono}`} target="_blank" rel="noopener noreferrer" className={adminButtonClasses("secondary")}>
                  Escribir por WhatsApp
                </a>
              )}
            </div>
          </Bloque>
          <Bloque titulo="Mensaje">
            {c.subject && <p className="text-sm font-semibold text-ink-900">{c.subject}</p>}
            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-900">{c.message || "Sin mensaje (inscripción a la comunidad)."}</p>
          </Bloque>
        </div>

        <div className="flex flex-col gap-6">
          <Bloque titulo="Estado">
            <Estado {...ESTADO_CONSULTA[c.status]} />
            {error && <p role="alert" className="mt-3 text-sm text-status-error">{error}</p>}
            <div className="mt-4 flex flex-col gap-2">
              {(["CONTACTED", "CLOSED", "NEW"] as EstadoConsulta[])
                .filter((e) => e !== c.status)
                .map((e) => (
                  <button key={e} type="button" disabled={guardando} onClick={() => setConfirmar(e)} className={adminButtonClasses(e === "CONTACTED" ? "primary" : "secondary")}>
                    {e === "NEW" ? "Volver a Nueva" : `Marcar como ${ESTADO_CONSULTA[e].texto.toLowerCase()}`}
                  </button>
                ))}
            </div>
          </Bloque>
          <Bloque titulo="Historial">
            <Historial eventos={c.historial} />
          </Bloque>
        </div>
      </div>

      <ConfirmDialog
        open={confirmar !== null}
        title={confirmar ? `¿Marcar la consulta como ${ESTADO_CONSULTA[confirmar].texto.toLowerCase()}?` : ""}
        description="El cambio queda en el historial y en la auditoría."
        confirmLabel={confirmar ? `Marcar como ${ESTADO_CONSULTA[confirmar].texto.toLowerCase()}` : ""}
        confirmTone="primary"
        onConfirm={() => confirmar && void cambiar(confirmar)}
        onCancel={() => setConfirmar(null)}
      />
      {toast}
    </div>
  );
}
