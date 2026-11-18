"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { EstadoNoListo, Lista, Titulo, Vacio, useDatos, useFiltros } from "@/components/admin/datos";
import { adminButtonClasses } from "@/components/admin/ui";
import { cursorDe, panel } from "@/lib/admin/api";
import { ACCION, ENTIDAD, detalleDeEvento, fechaHora } from "@/lib/admin/formato";
import type { Evento } from "@/lib/admin/tipos";

const POR_DEFECTO = { accion: "", entidad: "", desde: "", hasta: "" };

function enlaceDe(e: Evento): string | null {
  if (e.entidad === "lead") return `/admin/consultas/${e.entidad_id}`;
  if (e.entidad === "order") return `/admin/ordenes/${e.entidad_id}`;
  if (e.entidad === "course") return `/admin/cursos/${e.entidad_id}`;
  return null;
}

function Auditoria() {
  const { valores, cambiar, limpiar, clave } = useFiltros(POR_DEFECTO);
  // Paginación por cursor (05-PANTALLAS): la pila guarda los cursores de las páginas anteriores.
  const [cursores, setCursores] = useState<(string | null)[]>([null]);
  const cursor = cursores[cursores.length - 1];
  const { estado, recargar } = useDatos(() => panel.auditoria(valores, cursor), [clave, cursor]);
  const hayFiltros = clave !== "";

  const filtro = (e: { valor: string; campo: keyof typeof POR_DEFECTO }) => {
    setCursores([null]);
    cambiar({ [e.campo]: e.valor });
  };

  return (
    <div className="flex flex-col gap-6">
      <Titulo bajada="Quién hizo qué, sobre qué y cuándo. Solo lectura.">Auditoría</Titulo>

      <div className="flex flex-wrap items-end gap-3 border border-neutral-200 bg-neutral-0 p-4">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Acción
          <select value={valores.accion} onChange={(e) => filtro({ campo: "accion", valor: e.target.value })} className="min-h-[44px] border border-neutral-200 bg-neutral-50 px-3 text-sm normal-case tracking-normal text-ink-900">
            <option value="">Todas</option>
            {Object.entries(ACCION).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[160px] flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Sobre
          <select value={valores.entidad} onChange={(e) => filtro({ campo: "entidad", valor: e.target.value })} className="min-h-[44px] border border-neutral-200 bg-neutral-50 px-3 text-sm normal-case tracking-normal text-ink-900">
            <option value="">Todo</option>
            {Object.entries(ENTIDAD).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Desde
          <input type="date" value={valores.desde} onChange={(e) => filtro({ campo: "desde", valor: e.target.value })} className="min-h-[44px] border border-neutral-200 bg-neutral-50 px-3 text-sm text-ink-900" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Hasta
          <input type="date" value={valores.hasta} onChange={(e) => filtro({ campo: "hasta", valor: e.target.value })} className="min-h-[44px] border border-neutral-200 bg-neutral-50 px-3 text-sm text-ink-900" />
        </label>
        {hayFiltros && (
          <button type="button" onClick={() => { setCursores([null]); limpiar(); }} className="min-h-[44px] px-2 text-sm font-semibold text-neutral-700 hover:text-ink-900">
            Limpiar filtros
          </button>
        )}
      </div>

      {estado.tipo !== "listo" ? (
        <EstadoNoListo estado={estado} recargar={recargar} />
      ) : estado.datos.results.length === 0 ? (
        <Vacio titulo={hayFiltros ? "No hay eventos con estos filtros." : "Todavía no hay eventos."} />
      ) : (
        <>
          <Lista
            filas={estado.datos.results}
            clave={(e) => e.id}
            columnas={[
              { titulo: "Fecha y hora", celda: (e) => <span className="tabular-nums">{fechaHora(e.created_at)}</span> },
              { titulo: "Persona", celda: (e) => e.persona },
              { titulo: "Acción", celda: (e) => ACCION[e.accion] ?? e.accion, principal: true },
              {
                titulo: "Sobre qué",
                celda: (e) => {
                  if (!e.entidad) return "—";
                  const texto = `${ENTIDAD[e.entidad] ?? e.entidad} ${e.entidad === "order" ? e.entidad_id.slice(0, 8) : e.entidad_id}`;
                  const href = enlaceDe(e);
                  return href ? <Link href={href} className="text-brand-600 hover:underline">{texto}</Link> : texto;
                },
              },
              { titulo: "Detalle", celda: (e) => detalleDeEvento(e.detalle) || "—" },
              { titulo: "IP", celda: (e) => <span className="font-mono text-xs">{e.ip ?? "—"}</span> },
            ]}
          />
          <nav aria-label="Páginas" className="flex justify-end gap-2">
            <button type="button" disabled={cursores.length === 1} onClick={() => setCursores((c) => c.slice(0, -1))} className={adminButtonClasses("secondary")}>
              Más nuevos
            </button>
            <button type="button" disabled={!estado.datos.next} onClick={() => setCursores((c) => [...c, cursorDe(estado.datos.next)])} className={adminButtonClasses("secondary")}>
              Más viejos
            </button>
          </nav>
        </>
      )}
    </div>
  );
}

export default function AuditoriaPage() {
  return (
    <Suspense>
      <Auditoria />
    </Suspense>
  );
}
