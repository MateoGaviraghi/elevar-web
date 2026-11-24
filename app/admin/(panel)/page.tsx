"use client";

import { Protagonista } from "@/components/admin/inicio/Protagonista";
import { EstadoNoListo, useDatos } from "@/components/admin/datos";
import { useUsuario } from "@/components/admin/shell";
import { panel } from "@/lib/admin/api";

/**
 * Inicio (05-PANTALLAS): lo que hay que hacer hoy, lo que viene y cómo va el negocio.
 * Elegido el 2026-11-24 sobre la versión A (ver docs/dashboard/DECISIONES.md).
 */
export default function InicioPage() {
  const usuario = useUsuario();
  const { estado, recargar } = useDatos(() => panel.inicio(), []);
  const nombre = usuario.nombre.split(" ")[0] || usuario.nombre;

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6">
      {estado.tipo === "cargando" && <Esqueleto />}
      {estado.tipo !== "listo" && estado.tipo !== "cargando" && <EstadoNoListo estado={estado} recargar={recargar} />}
      {estado.tipo === "listo" && (
        <Protagonista d={estado.datos} nombre={nombre} />
      )}
    </div>
  );
}

/** Cargando: la forma de los bloques, quieta y de su altura (sin brillo que corre). */
function Esqueleto() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12" aria-busy="true">
      <div className="h-[180px] rounded-[24px] bg-ink-900 lg:col-span-12" />
      <div className="h-[360px] rounded-[24px] bg-ink-100 lg:col-span-8" />
      <div className="h-[360px] rounded-[20px] bg-ink-100 lg:col-span-4" />
      <span className="sr-only">Cargando el inicio…</span>
    </div>
  );
}
