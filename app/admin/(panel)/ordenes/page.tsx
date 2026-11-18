"use client";

import { Suspense } from "react";
import { Estado, EstadoNoListo, Fichas, Lista, Paginacion, Titulo, Vacio, useDatos, useFiltros } from "@/components/admin/datos";
import { panel } from "@/lib/admin/api";
import { ESTADO_ORDEN, fechaHora, plata } from "@/lib/admin/formato";

const POR_DEFECTO = { estado: "PAID", desde: "", hasta: "", curso: "", por_pagina: "25" };

function Ordenes() {
  const { valores, cambiar, pagina, porPagina, limpiar, clave } = useFiltros(POR_DEFECTO);
  const { estado, recargar } = useDatos(
    () => panel.ordenes({ ...valores, por_pagina: undefined, page: pagina, page_size: porPagina }),
    [clave],
  );
  const cursos = useDatos(() => panel.cursos({ page_size: 100 }), []);
  const hayFiltros = clave.replace(/(^|&)(pagina|por_pagina)=[^&]*/g, "") !== "";

  return (
    <div className="flex flex-col gap-6">
      <Titulo
        bajada={
          estado.tipo === "listo"
            ? [
                `${estado.datos.totales.cantidad} ${estado.datos.totales.cantidad === 1 ? "orden" : "órdenes"}`,
                ...estado.datos.totales.por_moneda.map((m) => plata(m.suma, m.moneda)),
              ].join(" · ")
            : " "
        }
      >
        Órdenes
      </Titulo>

      <div className="flex flex-col gap-3 border border-neutral-200 bg-neutral-0 p-4">
        <Fichas
          etiqueta="Estado"
          valor={valores.estado}
          onCambiar={(v) => cambiar({ estado: v })}
          opciones={[
            { valor: "PAID", texto: "Pagada" },
            { valor: "FULFILLED", texto: "Cumplida" },
            { valor: "PENDING", texto: "Pendiente" },
            { valor: "FAILED", texto: "Fallida" },
            { valor: "CANCELLED", texto: "Cancelada" },
            { valor: "TODAS", texto: "Todas" },
          ]}
        />
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Desde
            <input type="date" value={valores.desde} onChange={(e) => cambiar({ desde: e.target.value })} className="min-h-[44px] border border-neutral-200 bg-neutral-50 px-3 text-sm text-ink-900" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Hasta
            <input type="date" value={valores.hasta} onChange={(e) => cambiar({ hasta: e.target.value })} className="min-h-[44px] border border-neutral-200 bg-neutral-50 px-3 text-sm text-ink-900" />
          </label>
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Curso
            <select value={valores.curso} onChange={(e) => cambiar({ curso: e.target.value })} className="min-h-[44px] border border-neutral-200 bg-neutral-50 px-3 text-sm normal-case tracking-normal text-ink-900">
              <option value="">Todos</option>
              {cursos.estado.tipo === "listo" &&
                cursos.estado.datos.results.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                ))}
            </select>
          </label>
          {hayFiltros && (
            <button type="button" onClick={limpiar} className="min-h-[44px] px-2 text-sm font-semibold text-neutral-700 hover:text-ink-900">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {estado.tipo !== "listo" ? (
        <EstadoNoListo estado={estado} recargar={recargar} />
      ) : estado.datos.count === 0 ? (
        <Vacio titulo={hayFiltros ? "No hay órdenes con estos filtros." : "No hay órdenes pagadas pendientes de cumplir."} />
      ) : (
        <>
          <Lista
            filas={estado.datos.results}
            clave={(o) => o.public_id}
            enlace={(o) => `/admin/ordenes/${o.public_id}`}
            columnas={[
              { titulo: "Fecha", celda: (o) => <span className="tabular-nums">{fechaHora(o.created_at)}</span> },
              { titulo: "Orden", celda: (o) => <span className="font-mono">{o.public_id.slice(0, 8)}</span> },
              { titulo: "Comprador", celda: (o) => o.buyer_name, principal: true },
              { titulo: "Curso", celda: (o) => <span className="line-clamp-2 max-w-[18rem]">{o.cursos.join(", ")}</span> },
              { titulo: "Total", celda: (o) => plata(o.total, o.currency), derecha: true },
              { titulo: "Estado", celda: (o) => <Estado {...ESTADO_ORDEN[o.status]} /> },
            ]}
          />
          <Paginacion
            pagina={pagina}
            porPagina={porPagina}
            total={estado.datos.count}
            onPagina={(p) => cambiar({ pagina: String(p) })}
            onPorPagina={(v) => cambiar({ por_pagina: v })}
          />
        </>
      )}
    </div>
  );
}

export default function OrdenesPage() {
  return (
    <Suspense>
      <Ordenes />
    </Suspense>
  );
}
