"use client";

import { Suspense } from "react";
import { Protagonista } from "@/components/admin/inicio/Protagonista";
import { EstadoNoListo } from "@/components/admin/datos";
import { useDatosRecordados } from "@/components/admin/lista/memoria";
import { useUsuario } from "@/components/admin/shell";
import { panel } from "@/lib/admin/api";

/**
 * Inicio (05-PANTALLAS): lo que hay que hacer hoy, lo que viene y cómo va el negocio, en tres pestañas que
 * entran en la pantalla de la computadora. Elegido el 2026-11-24 sobre la versión A (ver docs/dashboard/DECISIONES.md).
 */
export default function InicioPage() {
  const usuario = useUsuario();
  const { estado, recargar } = useDatosRecordados(() => panel.inicio(), []);
  const nombre = usuario.nombre.split(" ")[0] || usuario.nombre;

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6">
      {estado.tipo === "cargando" && <Esqueleto />}
      {estado.tipo !== "listo" && estado.tipo !== "cargando" && <EstadoNoListo estado={estado} recargar={recargar} />}
      {estado.tipo === "listo" && (
        // La pestaña se lee de la dirección (?vista=): useSearchParams pide un Suspense alrededor.
        <Suspense fallback={<Esqueleto />}>
          <Protagonista d={estado.datos} nombre={nombre} />
        </Suspense>
      )}
    </div>
  );
}

/** Cargando: la forma de la banda, las pestañas y los bloques de «Hoy», quieta (sin brillo que corre). */
function Esqueleto() {
  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-4rem)]" aria-busy="true">
      <div className="h-[132px] shrink-0 rounded-[22px] bg-ink-900" />
      <div className="h-[50px] w-[340px] max-w-full shrink-0 rounded-full bg-ink-100" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((k) => <div key={k} className="h-[130px] rounded-[18px] bg-ink-100" />)}
      </div>
      <div className="grid min-h-[200px] flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="rounded-[18px] bg-ink-100 lg:col-span-7" />
        <div className="rounded-[18px] bg-ink-100 lg:col-span-5" />
      </div>
      <span className="sr-only">Cargando el inicio…</span>
    </div>
  );
}
