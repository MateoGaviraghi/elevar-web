"use client";

import { useState, type FormEvent } from "react";
import { useErrorDeAccion } from "@/components/admin/datos";
import { numero } from "@/components/admin/inicio/graficos";
import { BotonFicha, CuadroIcono, Ic, Rotulo } from "@/components/admin/lista/Botones";
import { ChipPunto } from "@/components/admin/lista/Tabla";
import { ApiError, panel } from "@/lib/admin/api";
import { aCampoFecha, deCampoFecha } from "@/lib/admin/formato";
import type { EstadoFecha, Fecha } from "@/lib/admin/tipos";
import { pegar } from "@/lib/texto";

/**
 * Las fechas de un curso en vivo o webinar, dentro de su tarjeta (D-006, 2026-11-26). Agregar y editar se hace ahí
 * mismo; una fecha no se borra: se cancela, y como no se deshace pide confirmar (control 5 del plugin), con
 * cuántos inscriptos y compras tiene. «Ver inscriptos» lleva a esa fecha en Inscripciones.
 */

const ZONA = "America/Argentina/Cordoba";
const ESTADO: Record<EstadoFecha, { texto: string; tono: "ok" | "neutro" | "peligro" }> = {
  SCHEDULED: { texto: "Programada", tono: "ok" },
  CANCELLED: { texto: "Cancelada", tono: "peligro" },
  FINISHED: { texto: "Finalizada", tono: "neutro" },
};
const dia = (iso: string) => {
  const d = new Date(iso);
  const s = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, weekday: "short" }).format(d).replace(".", "");
  const f = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, day: "2-digit", month: "2-digit", year: "2-digit" }).format(d);
  return `${s.charAt(0).toUpperCase()}${s.slice(1)} ${f}`;
};
const hora = (iso: string) => new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

export function Fechas({ cursoId, webinar, fechas, onCambio }: { cursoId: number; webinar: boolean; fechas: Fecha[]; onCambio: (aviso: string) => Promise<void> }) {
  const [editando, setEditando] = useState<Fecha | "nueva" | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [ocupada, setOcupada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorDeAccion = useErrorDeAccion();
  const ahora = Date.now();
  const proximas = fechas.filter((f) => f.status === "SCHEDULED" && new Date(f.starts_at).getTime() >= ahora).length;

  const cancelar = async (f: Fecha) => {
    setOcupada(true);
    setError(null);
    try {
      await panel.cancelarFecha(f.id);
      setCancelando(null);
      await onCambio("Fecha cancelada.");
    } catch (e) {
      setError(errorDeAccion(e));
    } finally {
      setOcupada(false);
    }
  };

  return (
    <section data-entra data-escribe aria-labelledby="fechas-titulo" className="flex min-w-0 flex-col gap-3 rounded-[16px] border border-ink-200 bg-ink-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <CuadroIcono nombre="inscripciones" />
          <div className="min-w-0">
          <h3 id="fechas-titulo" className="font-display text-lg font-semibold leading-tight text-ink-900">Fechas</h3>
          <p className="text-xs text-neutral-700">{proximas === 0 ? pegar("Ninguna por venir: en el sitio no se puede comprar.") : proximas === 1 ? "1 por venir" : `${proximas} por venir`}</p>
          </div>
        </div>
        {editando === null && <BotonFicha variante="contorno" onClick={() => setEditando("nueva")} icono="mas">Agregar fecha</BotonFicha>}
      </div>
      {error && <p role="alert" className="rounded-[12px] border border-status-error/35 bg-status-error/10 px-3 py-2 text-sm text-status-error">{error}</p>}
      {editando !== null && (
        <FormFecha fecha={editando === "nueva" ? null : editando} onCancelar={() => setEditando(null)}
          onGuardar={async (datos) => {
            if (editando === "nueva") await panel.agregarFecha(cursoId, datos);
            else await panel.editarFecha(editando.id, datos);
            setEditando(null);
            await onCambio(editando === "nueva" ? "Fecha agregada." : "Fecha guardada.");
          }} />
      )}
      {fechas.length === 0 ? (
        editando === null && <p className="rounded-[12px] bg-neutral-0 px-4 py-6 text-center text-sm text-neutral-700 ring-1 ring-ink-100">{pegar("Sin fechas. Para dar el curso, agregale una.")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-ink-100 rounded-[12px] bg-neutral-0 ring-1 ring-ink-100">
          {fechas.map((f) => {
            const gente = webinar ? f.inscriptos : f.seats_taken;
            return (
              <li key={f.id} className="flex flex-col gap-2 px-3.5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-sub text-sm font-semibold tabular-nums text-ink-900">{dia(f.starts_at)} · {hora(f.starts_at)} a {hora(f.ends_at)}</p>
                    <p className="text-xs tabular-nums text-neutral-700">
                      {numero(gente)}{f.capacity !== null ? ` de ${numero(f.capacity)} lugares` : webinar ? " inscriptos · sin cupo" : " lugares · sin cupo"}
                      {!webinar && f.compras ? ` · ${f.compras} ${f.compras === 1 ? "compra" : "compras"}` : ""}
                    </p>
                  </div>
                  <ChipPunto texto={ESTADO[f.status].texto} tono={ESTADO[f.status].tono} />
                </div>
                {cancelando === f.id ? (
                  <div role="alertdialog" aria-label="Confirmar la cancelación" className="flex flex-col gap-2 rounded-[12px] bg-ink-900 p-3 text-neutral-0">
                    <p className="text-sm">
                      <b>¿Cancelar esta fecha?</b>{" "}
                      {f.inscriptos || f.compras
                        ? `Tiene ${f.inscriptos} inscriptos y ${f.compras} compras: queda cancelada, no se borra. Avisales por correo.`
                        : "Deja de mostrarse en el sitio. No se puede volver atrás."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <BotonFicha variante="claro" onClick={() => setCancelando(null)} deshabilitado={ocupada}>Volver</BotonFicha>
                      <BotonFicha variante="peligro" onClick={() => void cancelar(f)} deshabilitado={ocupada}>{ocupada ? "Cancelando…" : "Cancelar fecha"}</BotonFicha>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-x-1 gap-y-1">
                    <a href={`/admin/inscripciones?cuando=TODAS&ver=${f.id}`} className={ENLACE}><Ic nombre="persona" tam={18} />Ver inscriptos</a>
                    {f.status === "SCHEDULED" && editando === null && (
                      <>
                        <button type="button" onClick={() => setEditando(f)} className={ENLACE}><Ic nombre="editar" tam={18} />Editar</button>
                        <button type="button" onClick={() => setCancelando(f.id)} className={`${ENLACE} text-status-error`}>Cancelar fecha</button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const ENLACE = "inline-flex min-h-[36px] items-center gap-1.5 rounded-[8px] px-2 font-sub text-[13px] font-semibold text-ink-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [@media(hover:hover)]:hover:bg-ink-50";
const CAMPO = "min-h-[44px] w-full rounded-[10px] border border-ink-200 bg-neutral-0 px-3 text-base text-ink-900 outline-none focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 sm:text-sm";

function FormFecha({ fecha, onGuardar, onCancelar }: { fecha: Fecha | null; onGuardar: (d: Partial<Fecha>) => Promise<void>; onCancelar: () => void }) {
  const [inicio, setInicio] = useState(fecha ? aCampoFecha(fecha.starts_at) : "");
  const [fin, setFin] = useState(fecha ? aCampoFecha(fecha.ends_at) : "");
  const [cupo, setCupo] = useState(fecha?.capacity ? String(fecha.capacity) : "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const propios: Record<string, string> = {};
    if (!inicio) propios.starts_at = "Elegí el día y la hora de inicio.";
    if (!fin) propios.ends_at = "Elegí el día y la hora de fin.";
    if (Object.keys(propios).length) return setErrores(propios);
    setGuardando(true);
    setErrores({});
    try {
      await onGuardar({ starts_at: deCampoFecha(inicio), ends_at: deCampoFecha(fin), capacity: cupo ? Number(cupo) : null });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        setErrores(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, Array.isArray(v) ? v.join(" ") : String(v)])));
      } else {
        setErrores({ general: err instanceof ApiError && err.message ? err.message : "No se pudo guardar. Probá de nuevo." });
      }
      setGuardando(false);
    }
  }

  const campo = (id: string, etiqueta: string, input: React.ReactNode, ayuda?: string) => (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={`fecha-${id}`} className="font-sub text-xs font-semibold text-ink-900">{etiqueta}</label>
      {input}
      {errores[id] ? <p role="alert" className="text-sm text-status-error">{errores[id]}</p> : ayuda ? <p className="text-xs text-neutral-700">{ayuda}</p> : null}
    </div>
  );
  return (
    <form onSubmit={enviar} noValidate aria-label={fecha ? "Editar fecha" : "Nueva fecha"} className="flex flex-col gap-3 rounded-[14px] bg-neutral-0 p-3.5 ring-1 ring-ink-200">
      <Rotulo>{fecha ? "Editar fecha" : "Nueva fecha"} · hora de Argentina</Rotulo>
      <div className="grid gap-3 sm:grid-cols-2">
        {campo("starts_at", "Inicio", <input id="fecha-starts_at" type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} className={CAMPO} />)}
        {campo("ends_at", "Fin", <input id="fecha-ends_at" type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} className={CAMPO} />)}
        {campo("capacity", "Cupo", <input id="fecha-capacity" type="number" min={1} inputMode="numeric" value={cupo} onChange={(e) => setCupo(e.target.value)} className={CAMPO} />, "Vacío: sin límite.")}
      </div>
      {errores.general && <p role="alert" className="text-sm text-status-error">{errores.general}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={guardando}
          className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-brand-500 px-4 font-sub text-sm font-semibold text-neutral-0 outline-none transition-[transform,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.97] disabled:opacity-50 [@media(hover:hover)]:hover:bg-brand-600">
          {guardando ? "Guardando…" : "Guardar fecha"}
        </button>
        <BotonFicha variante="contorno" onClick={onCancelar} deshabilitado={guardando}>Cancelar</BotonFicha>
      </div>
    </form>
  );
}
