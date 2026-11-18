"use client";

import Link from "next/link";
import { Cargando, EstadoNoListo, Lista, useDatos } from "@/components/admin/datos";
import { useUsuario } from "@/components/admin/shell";
import { panel } from "@/lib/admin/api";
import { MODALIDAD, ORIGEN_CONSULTA, fechaDeHoy, fechaHora } from "@/lib/admin/formato";

// Inicio (05-PANTALLAS): lo que hay que atender hoy.
export default function InicioPage() {
  const usuario = useUsuario();
  const { estado, recargar } = useDatos(() => panel.inicio(), []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Hola, {usuario.nombre}</h1>
        <p className="mt-1 text-sm text-neutral-500 first-letter:uppercase">{fechaDeHoy()}</p>
      </div>

      {estado.tipo === "cargando" && <Cargando filas={3} />}
      {estado.tipo !== "listo" && estado.tipo !== "cargando" && <EstadoNoListo estado={estado} recargar={recargar} />}
      {estado.tipo === "listo" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Numero
              etiqueta="Consultas nuevas sin contestar"
              valor={estado.datos.consultas_nuevas}
              href="/admin/consultas"
            />
            <Numero
              etiqueta="Órdenes pagadas sin cumplir"
              valor={estado.datos.ordenes_sin_cumplir}
              href="/admin/ordenes"
            />
            {estado.datos.proxima_fecha ? (
              <Numero
                etiqueta={`Próxima fecha · ${MODALIDAD[estado.datos.proxima_fecha.modalidad]}`}
                valor={estado.datos.proxima_fecha.inscriptos}
                sufijo={estado.datos.proxima_fecha.cupo ? `de ${estado.datos.proxima_fecha.cupo}` : "inscriptos"}
                pie={`${estado.datos.proxima_fecha.curso} · ${fechaHora(estado.datos.proxima_fecha.inicio)}`}
                href={`/admin/inscripciones?fecha=${estado.datos.proxima_fecha.id}`}
              />
            ) : (
              <Numero etiqueta="Próxima fecha" valor="—" pie="No hay fechas programadas" href="/admin/cursos" />
            )}
          </div>

          <section className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-ink-900">Consultas nuevas más viejas</h2>
              <Link href="/admin/consultas" className="text-sm font-semibold text-brand-600 hover:underline">
                Ver todas
              </Link>
            </div>
            {estado.datos.consultas_viejas.length === 0 ? (
              <div className="border border-neutral-200 bg-neutral-0 px-6 py-12 text-center">
                <p className="font-display text-lg font-semibold text-ink-900">Todo al día.</p>
                <p className="mt-1 text-sm text-neutral-700">No hay nada pendiente.</p>
              </div>
            ) : (
              <Lista
                filas={estado.datos.consultas_viejas}
                clave={(c) => c.id}
                enlace={(c) => `/admin/consultas/${c.id}`}
                columnas={[
                  { titulo: "Nombre", celda: (c) => c.name, principal: true },
                  { titulo: "Empresa", celda: (c) => c.company || "—" },
                  { titulo: "Origen", celda: (c) => ORIGEN_CONSULTA[c.source] ?? c.source },
                  { titulo: "Recibida", celda: (c) => fechaHora(c.created_at) },
                ]}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Numero({ etiqueta, valor, sufijo, pie, href }: NumeroProps) {
  return (
    <Link
      href={href}
      className="block border border-neutral-200 bg-neutral-0 p-5 transition-colors hover:border-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{etiqueta}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-ink-900">
        {valor}
        {sufijo && <span className="ml-2 text-sm font-normal text-neutral-500">{sufijo}</span>}
      </p>
      {pie && <p className="mt-1 truncate text-sm text-neutral-700">{pie}</p>}
    </Link>
  );
}

interface NumeroProps {
  etiqueta: string;
  valor: number | string;
  sufijo?: string;
  pie?: string;
  href: string;
}
