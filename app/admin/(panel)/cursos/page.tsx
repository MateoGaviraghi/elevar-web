"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Estado, EstadoNoListo, Fichas, Lista, Paginacion, Titulo, Vacio, useDatos, useFiltros } from "@/components/admin/datos";
import { adminButtonClasses } from "@/components/admin/ui";
import { panel } from "@/lib/admin/api";
import { MODALIDAD, fechaHora, plata } from "@/lib/admin/formato";

const POR_DEFECTO = { modalidad: "", publicado: "", con_fecha: "", q: "", por_pagina: "25" };

function Cursos() {
  const { valores, cambiar, pagina, porPagina, limpiar, clave } = useFiltros(POR_DEFECTO);
  const [busqueda, setBusqueda] = useState(valores.q);
  const { estado, recargar } = useDatos(
    () => panel.cursos({ ...valores, por_pagina: undefined, page: pagina, page_size: porPagina }),
    [clave],
  );
  useEffect(() => {
    const t = setTimeout(() => busqueda !== valores.q && cambiar({ q: busqueda.trim() }), 400);
    return () => clearTimeout(t);
  }, [busqueda, valores.q, cambiar]);
  const hayFiltros = clave.replace(/(^|&)(pagina|por_pagina)=[^&]*/g, "") !== "";

  return (
    <div className="flex flex-col gap-6">
      <Titulo
        bajada={estado.tipo === "listo" ? `${estado.datos.count} cursos` : " "}
        acciones={<Link href="/admin/cursos/nuevo" className={adminButtonClasses("primary")}>Nuevo curso</Link>}
      >
        Cursos
      </Titulo>

      <div className="flex flex-col gap-3 border border-neutral-200 bg-neutral-0 p-4">
        <Fichas
          etiqueta="Modalidad"
          valor={valores.modalidad}
          onCambiar={(v) => cambiar({ modalidad: v })}
          opciones={[{ valor: "", texto: "Todas" }, ...Object.entries(MODALIDAD).map(([valor, texto]) => ({ valor, texto }))]}
        />
        <Fichas
          etiqueta="Publicado"
          valor={valores.publicado}
          onCambiar={(v) => cambiar({ publicado: v })}
          opciones={[{ valor: "", texto: "Todos" }, { valor: "si", texto: "Sí" }, { valor: "no", texto: "No" }]}
        />
        <Fichas
          etiqueta="Fecha próxima"
          valor={valores.con_fecha}
          onCambiar={(v) => cambiar({ con_fecha: v })}
          opciones={[{ valor: "", texto: "Todos" }, { valor: "si", texto: "Con fecha próxima" }]}
        />
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Buscar por título o código
            <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="min-h-[44px] border border-neutral-200 bg-neutral-50 px-3 text-sm normal-case tracking-normal text-ink-900 focus:border-brand-500 focus:outline-none" />
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
        <Vacio titulo={hayFiltros ? "No hay cursos con estos filtros." : "Todavía no hay cursos cargados."} />
      ) : (
        <>
          <Lista
            filas={estado.datos.results}
            clave={(c) => c.id}
            enlace={(c) => `/admin/cursos/${c.id}`}
            columnas={[
              { titulo: "Código", celda: (c) => <span className="font-mono">{c.code}</span> },
              { titulo: "Título", celda: (c) => <span className="line-clamp-2 max-w-[22rem]">{c.title}</span>, principal: true },
              { titulo: "Modalidad", celda: (c) => MODALIDAD[c.modality] ?? c.modality },
              { titulo: "Precio", celda: (c) => plata(c.price, c.currency), derecha: true },
              { titulo: "Próxima fecha", celda: (c) => (c.proxima_fecha ? fechaHora(c.proxima_fecha) : "—") },
              { titulo: "Publicado", celda: (c) => <Estado texto={c.is_published ? "Sí" : "No"} tono={c.is_published ? "ok" : "neutral"} /> },
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

export default function CursosPage() {
  return (
    <Suspense>
      <Cursos />
    </Suspense>
  );
}
