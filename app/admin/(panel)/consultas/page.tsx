"use client";

import { Suspense, useEffect, useState } from "react";
import { EstadoNoListo, Fichas, Lista, Paginacion, Titulo, Vacio, Estado, useDatos, useFiltros } from "@/components/admin/datos";
import { panel } from "@/lib/admin/api";
import { ESTADO_CONSULTA, ORIGEN_CONSULTA, fechaHora } from "@/lib/admin/formato";

const POR_DEFECTO = { estado: "NEW", origen: "", desde: "", hasta: "", q: "", por_pagina: "25" };

function hace(dias: number): string {
  const d = new Date(Date.now() - dias * 86_400_000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Cordoba" }).format(d);
}

function Consultas() {
  const { valores, cambiar, pagina, porPagina, limpiar, clave } = useFiltros(POR_DEFECTO);
  const [busqueda, setBusqueda] = useState(valores.q);
  const { estado, recargar } = useDatos(
    () => panel.consultas({ ...valores, por_pagina: undefined, page: pagina, page_size: porPagina }),
    [clave],
  );

  // La búsqueda se aplica cuando se deja de escribir (solo nombre o empresa: 07 §7).
  useEffect(() => {
    const t = setTimeout(() => busqueda !== valores.q && cambiar({ q: busqueda.trim() }), 400);
    return () => clearTimeout(t);
  }, [busqueda, valores.q, cambiar]);

  const hoy = hace(0);
  const rango = valores.desde === hoy ? "hoy" : valores.desde === hace(7) ? "7" : valores.desde === hace(30) ? "30" : valores.desde ? "otro" : "";
  const hayFiltros = clave.replace(/(^|&)(pagina|por_pagina)=[^&]*/g, "") !== "";

  return (
    <div className="flex flex-col gap-6">
      <Titulo bajada={estado.tipo === "listo" ? `${estado.datos.count} ${estado.datos.count === 1 ? "consulta" : "consultas"}` : " "}>
        Consultas
      </Titulo>

      <div className="flex flex-col gap-3 border border-neutral-200 bg-neutral-0 p-4">
        <Fichas
          etiqueta="Estado"
          valor={valores.estado}
          onCambiar={(v) => cambiar({ estado: v })}
          opciones={[
            { valor: "NEW", texto: "Nueva" },
            { valor: "CONTACTED", texto: "Contactada" },
            { valor: "CLOSED", texto: "Cerrada" },
            { valor: "TODAS", texto: "Todas" },
          ]}
        />
        <Fichas
          etiqueta="Origen"
          valor={valores.origen}
          onCambiar={(v) => cambiar({ origen: v })}
          opciones={[
            { valor: "", texto: "Todos" },
            { valor: "CONTACTO", texto: "Formulario" },
            { valor: "COMUNIDAD", texto: "Comunidad de WhatsApp" },
            { valor: "WEBINAR", texto: "Webinar" },
          ]}
        />
        <Fichas
          etiqueta="Fecha"
          valor={rango}
          onCambiar={(v) =>
            cambiar(
              v === "hoy" ? { desde: hoy, hasta: hoy } : v === "7" ? { desde: hace(7), hasta: "" } : v === "30" ? { desde: hace(30), hasta: "" } : { desde: "", hasta: "" },
            )
          }
          opciones={[
            { valor: "", texto: "Siempre" },
            { valor: "hoy", texto: "Hoy" },
            { valor: "7", texto: "7 días" },
            { valor: "30", texto: "30 días" },
          ]}
        />
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Buscar por nombre o empresa
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="min-h-[44px] border border-neutral-200 bg-neutral-50 px-3 text-sm normal-case tracking-normal text-ink-900 focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Desde
            <input type="date" value={valores.desde} onChange={(e) => cambiar({ desde: e.target.value })} className="min-h-[44px] border border-neutral-200 bg-neutral-50 px-3 text-sm text-ink-900" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Hasta
            <input type="date" value={valores.hasta} onChange={(e) => cambiar({ hasta: e.target.value })} className="min-h-[44px] border border-neutral-200 bg-neutral-50 px-3 text-sm text-ink-900" />
          </label>
          {hayFiltros && (
            <button type="button" onClick={() => { setBusqueda(""); limpiar(); }} className="min-h-[44px] px-2 text-sm font-semibold text-neutral-700 hover:text-ink-900">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {estado.tipo !== "listo" ? (
        <EstadoNoListo estado={estado} recargar={recargar} />
      ) : estado.datos.count === 0 ? (
        <Vacio
          titulo={hayFiltros ? "No hay consultas con estos filtros." : "Todavía no entró ninguna consulta."}
          accion={hayFiltros ? <button type="button" onClick={() => { setBusqueda(""); limpiar(); }} className="text-sm font-semibold text-brand-600 hover:underline">Limpiar filtros</button> : undefined}
        />
      ) : (
        <>
          <Lista
            filas={estado.datos.results}
            clave={(c) => c.id}
            enlace={(c) => `/admin/consultas/${c.id}`}
            columnas={[
              { titulo: "Recibida", celda: (c) => <span className="tabular-nums">{fechaHora(c.created_at)}</span> },
              { titulo: "Nombre", celda: (c) => c.name, principal: true },
              { titulo: "Empresa", celda: (c) => c.company || "—" },
              { titulo: "Origen", celda: (c) => ORIGEN_CONSULTA[c.source] ?? c.source },
              { titulo: "Asunto", celda: (c) => <span className="line-clamp-1 max-w-[16rem]">{c.subject || "—"}</span> },
              { titulo: "Estado", celda: (c) => <Estado {...ESTADO_CONSULTA[c.status]} /> },
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

export default function ConsultasPage() {
  return (
    <Suspense>
      <Consultas />
    </Suspense>
  );
}
