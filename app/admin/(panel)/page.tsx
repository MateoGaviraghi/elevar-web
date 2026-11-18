"use client";

import { useUsuario } from "@/components/admin/shell";
import { fechaDeHoy } from "@/lib/admin/formato";

// Inicio (05-PANTALLAS): en la etapa 2 queda vacío; los números llegan con las etapas 3, 5, 6 y 7.
export default function InicioPage() {
  const usuario = useUsuario();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Hola, {usuario.nombre}</h1>
        <p className="mt-1 text-sm text-neutral-500 first-letter:uppercase">{fechaDeHoy()}</p>
      </div>
      <section className="border border-neutral-200 bg-neutral-0 px-6 py-12 text-center">
        <p className="font-display text-lg font-semibold text-ink-900">Todo al día.</p>
        <p className="mt-1 text-sm text-neutral-700">No hay nada pendiente.</p>
      </section>
    </div>
  );
}
