"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CursoFormulario } from "@/components/admin/curso-formulario";
import { Bloque, Estado, EstadoNoListo, Historial, Titulo, useDatos, useErrorDeAccion } from "@/components/admin/datos";
import { ConfirmDialog, adminButtonClasses, useToast } from "@/components/admin/ui";
import { ApiError, panel } from "@/lib/admin/api";
import { ESTADO_FECHA, MODALIDAD, aCampoFecha, deCampoFecha, fechaHora } from "@/lib/admin/formato";
import type { CursoDatos, CursoDetalle, Fecha } from "@/lib/admin/tipos";

function datosDe(c: CursoDetalle): CursoDatos {
  const { id: _id, category_nombre: _c, created_at: _a, updated_at: _u, fechas: _f, historial: _h, ...datos } = c;
  return datos;
}

export default function CursoPage() {
  const { id } = useParams<{ id: string }>();
  const curso = useDatos(() => panel.curso(id), [id]);
  const categorias = useDatos(() => panel.categorias(), []);
  const { toast, showToast } = useToast();
  const [version, setVersion] = useState(0);
  const volver = <Link href="/admin/cursos" className="text-sm font-semibold text-brand-600 hover:underline">Volver a cursos</Link>;

  if (curso.estado.tipo !== "listo" || categorias.estado.tipo !== "listo") {
    const estado = curso.estado.tipo !== "listo" ? curso.estado : categorias.estado;
    return (
      <div className="flex flex-col gap-6">
        <Titulo>Curso</Titulo>
        <EstadoNoListo estado={estado} recargar={curso.recargar} noEncontrado={{ texto: "No encontramos ese curso.", volver }} />
      </div>
    );
  }
  const c = curso.estado.datos;
  const conFechas = c.modality === "LIVE" || c.modality === "WEBINAR";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/cursos" className="text-sm text-neutral-700 hover:text-ink-900">← Cursos</Link>
      <Titulo
        bajada={`${c.code} · ${MODALIDAD[c.modality]} · ${c.category_nombre}`}
        acciones={c.is_published && <a href={`/cursos/${c.slug}`} target="_blank" rel="noopener noreferrer" className={adminButtonClasses("secondary")}>Ver en el sitio</a>}
      >
        {c.title}
      </Titulo>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CursoFormulario
            key={`${c.id}-${version}`}
            inicial={datosDe(c)}
            categorias={categorias.estado.datos}
            textoBoton="Guardar"
            onGuardar={async (datos) => {
              const actualizado = await panel.editarCurso(c.id, datos);
              curso.setEstado({ tipo: "listo", datos: actualizado });
              setVersion((v) => v + 1);
              showToast("Guardado");
            }}
          />
        </div>
        <div className="flex flex-col gap-6">
          {conFechas && (
            <Fechas
              cursoId={c.id}
              fechas={c.fechas}
              onCambio={async (aviso) => {
                curso.setEstado({ tipo: "listo", datos: await panel.curso(id) });
                showToast(aviso);
              }}
            />
          )}
          <Bloque titulo="Historial">
            <Historial eventos={c.historial} />
          </Bloque>
        </div>
      </div>
      {toast}
    </div>
  );
}

function Fechas({ cursoId, fechas, onCambio }: FechasProps) {
  const [editando, setEditando] = useState<Fecha | "nueva" | null>(null);
  const [cancelar, setCancelar] = useState<Fecha | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorDeAccion = useErrorDeAccion();

  async function confirmarCancelacion(f: Fecha) {
    setCancelar(null);
    setError(null);
    try {
      await panel.cancelarFecha(f.id);
      await onCambio("Fecha cancelada");
    } catch (e) {
      setError(errorDeAccion(e));
    }
  }

  return (
    <Bloque
      titulo="Fechas"
      acciones={editando === null && <button type="button" onClick={() => setEditando("nueva")} className={adminButtonClasses("secondary")}>Agregar fecha</button>}
    >
      {error && <p role="alert" className="mb-3 text-sm text-status-error">{error}</p>}
      {editando !== null && (
        <FormularioFecha
          fecha={editando === "nueva" ? null : editando}
          onCancelar={() => setEditando(null)}
          onGuardar={async (datos) => {
            if (editando === "nueva") await panel.agregarFecha(cursoId, datos);
            else await panel.editarFecha(editando.id, datos);
            setEditando(null);
            await onCambio(editando === "nueva" ? "Fecha agregada" : "Fecha guardada");
          }}
        />
      )}
      {fechas.length === 0 ? (
        <p className="text-sm text-neutral-500">Sin fechas. Para repetir el curso se le agrega una fecha nueva.</p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {fechas.map((f) => (
            <li key={f.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium tabular-nums text-ink-900">{fechaHora(f.starts_at)}</p>
                <Estado {...ESTADO_FECHA[f.status]} />
              </div>
              <p className="text-xs text-neutral-500">
                Hasta {fechaHora(f.ends_at)} · Cupo {f.capacity ?? "sin límite"} · Ocupados {f.seats_taken} · Inscriptos {f.inscriptos} · Compras {f.compras}
              </p>
              {f.status === "SCHEDULED" && (
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditando(f)} className="text-sm font-semibold text-ink-900 hover:underline">Editar</button>
                  <button type="button" onClick={() => setCancelar(f)} className="text-sm font-semibold text-status-error hover:underline">Cancelar fecha</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={cancelar !== null}
        title="¿Cancelar esta fecha?"
        description={
          cancelar && (cancelar.inscriptos || cancelar.compras)
            ? `Tiene ${cancelar.inscriptos} inscriptos y ${cancelar.compras} compras: la fecha no se borra, queda cancelada. Avisales por correo.`
            : "La fecha no se borra: queda cancelada y deja de mostrarse en el sitio."
        }
        confirmLabel="Cancelar fecha"
        onConfirm={() => cancelar && void confirmarCancelacion(cancelar)}
        onCancel={() => setCancelar(null)}
      />
    </Bloque>
  );
}

interface FechasProps {
  cursoId: number;
  fechas: Fecha[];
  onCambio: (aviso: string) => Promise<void>;
}

function FormularioFecha({ fecha, onGuardar, onCancelar }: FormularioFechaProps) {
  const [inicio, setInicio] = useState(fecha ? aCampoFecha(fecha.starts_at) : "");
  const [fin, setFin] = useState(fecha ? aCampoFecha(fecha.ends_at) : "");
  const [cupo, setCupo] = useState(fecha?.capacity ? String(fecha.capacity) : "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inicio || !fin) return setErrores({ starts_at: "Completá el inicio y el fin." });
    setGuardando(true);
    setErrores({});
    try {
      await onGuardar({ starts_at: deCampoFecha(inicio), ends_at: deCampoFecha(fin), capacity: cupo ? Number(cupo) : null });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        setErrores(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, Array.isArray(v) ? v.join(" ") : String(v)])));
      } else {
        setErrores({ starts_at: err instanceof ApiError ? err.message : "Algo falló. Reintentá." });
      }
      setGuardando(false);
    }
  }

  const campo = "min-h-[44px] w-full border border-neutral-200 bg-neutral-50 px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none";
  const mensaje = errores.starts_at || errores.ends_at || errores.capacity;
  return (
    <form onSubmit={enviar} className="mb-4 flex flex-col gap-3 border border-neutral-200 bg-neutral-50 p-4" noValidate>
      <p className="text-sm font-semibold text-ink-900">{fecha ? "Editar fecha" : "Nueva fecha"} <span className="font-normal text-neutral-500">(hora de Argentina)</span></p>
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Inicio
        <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} className={campo} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Fin
        <input type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} className={campo} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Cupo (vacío = sin límite)
        <input type="number" min={1} value={cupo} onChange={(e) => setCupo(e.target.value)} className={campo} />
      </label>
      {mensaje && <p role="alert" className="text-sm text-status-error">{mensaje}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={guardando} className={adminButtonClasses("primary")}>{guardando ? "Guardando…" : "Guardar fecha"}</button>
        <button type="button" onClick={onCancelar} className={adminButtonClasses("ghost")}>Cancelar</button>
      </div>
    </form>
  );
}

interface FormularioFechaProps {
  fecha: Fecha | null;
  onGuardar: (datos: Partial<Fecha>) => Promise<void>;
  onCancelar: () => void;
}
