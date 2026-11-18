"use client";

import { Suspense } from "react";
import { Estado, EstadoNoListo, Lista, Paginacion, Titulo, Vacio, useDatos, useFiltros } from "@/components/admin/datos";
import { adminButtonClasses } from "@/components/admin/ui";
import { panel } from "@/lib/admin/api";
import { ESTADO_FECHA, MODALIDAD, fechaHora } from "@/lib/admin/formato";

const POR_DEFECTO = { fecha: "", por_pagina: "25" };

function Inscripciones() {
  const { valores, cambiar, pagina, porPagina } = useFiltros(POR_DEFECTO);
  const fechas = useDatos(() => panel.fechasConInscripciones(), []);
  const elegida =
    fechas.estado.tipo === "listo"
      ? fechas.estado.datos.find((f) => String(f.id) === valores.fecha) ?? fechas.estado.datos[0]
      : undefined;
  const inscriptos = useDatos(
    () => (elegida ? panel.inscriptos(elegida.id, { page: pagina, page_size: porPagina }) : Promise.resolve(null)),
    [elegida?.id, pagina, porPagina],
  );

  return (
    <div className="flex flex-col gap-6">
      <Titulo
        acciones={
          elegida && elegida.inscriptos > 0 ? (
            // Un link común: el navegador descarga el CSV con la cookie; queda en la auditoría.
            <a href={panel.urlExportarInscriptos(elegida.id)} className={adminButtonClasses("secondary")}>
              Exportar CSV
            </a>
          ) : undefined
        }
      >
        Inscripciones
      </Titulo>

      {fechas.estado.tipo !== "listo" ? (
        <EstadoNoListo estado={fechas.estado} recargar={fechas.recargar} />
      ) : fechas.estado.datos.length === 0 ? (
        <Vacio titulo="Todavía no hay webinars ni cursos en vivo con fecha." />
      ) : (
        <>
          <div className="flex flex-col gap-4 border border-neutral-200 bg-neutral-0 p-4 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Webinar o curso en vivo
              <select
                value={elegida?.id ?? ""}
                onChange={(e) => cambiar({ fecha: e.target.value })}
                className="min-h-[44px] w-full border border-neutral-200 bg-neutral-50 px-3 text-sm normal-case tracking-normal text-ink-900"
              >
                {fechas.estado.datos.map((f) => (
                  <option key={f.id} value={f.id}>
                    {fechaHora(f.starts_at)} · {f.curso} ({MODALIDAD[f.modalidad]})
                  </option>
                ))}
              </select>
            </label>
            {elegida && (
              <dl className="flex flex-wrap gap-6 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Inscriptos</dt>
                  <dd className="font-display text-2xl font-semibold tabular-nums text-ink-900">{elegida.inscriptos}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Cupo</dt>
                  <dd className="font-display text-2xl font-semibold tabular-nums text-ink-900">{elegida.capacity ?? "Sin cupo"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Estado</dt>
                  <dd className="mt-1"><Estado {...ESTADO_FECHA[elegida.status]} /></dd>
                </div>
              </dl>
            )}
          </div>

          {inscriptos.estado.tipo !== "listo" ? (
            <EstadoNoListo estado={inscriptos.estado} recargar={inscriptos.recargar} />
          ) : !inscriptos.estado.datos || inscriptos.estado.datos.count === 0 ? (
            <Vacio titulo="Todavía no se anotó nadie a esta fecha." />
          ) : (
            <>
              <Lista
                filas={inscriptos.estado.datos.results}
                clave={(i) => i.id}
                columnas={[
                  { titulo: "Nombre", celda: (i) => i.name, principal: true },
                  { titulo: "Correo", celda: (i) => i.email },
                  { titulo: "Fecha de inscripción", celda: (i) => <span className="tabular-nums">{fechaHora(i.created_at)}</span> },
                ]}
              />
              <Paginacion
                pagina={pagina}
                porPagina={porPagina}
                total={inscriptos.estado.datos.count}
                onPagina={(p) => cambiar({ pagina: String(p) })}
                onPorPagina={(v) => cambiar({ por_pagina: v })}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function InscripcionesPage() {
  return (
    <Suspense>
      <Inscripciones />
    </Suspense>
  );
}
