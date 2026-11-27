"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState, type ReactNode } from "react";
import { EstadoNoListo, type EstadoDatos } from "@/components/admin/datos";
import { tonoPunto } from "@/components/admin/cuenta/VistaCuenta";
import { Icono } from "@/components/admin/iconos";
import { numero } from "@/components/admin/inicio/graficos";
import { hace } from "@/components/admin/inicio/piezas";
import { Banda, CifraFiltro } from "@/components/admin/lista/Banda";
import { BarraFiltros, Buscador, Limpiar, Menu, Pastilla, type Opcion } from "@/components/admin/lista/BarraFiltros";
import { BotonFicha, ChipOscuro, Rotulo } from "@/components/admin/lista/Botones";
import { DatoFicha, Ficha } from "@/components/admin/lista/Ficha";
import { useDatosRecordados } from "@/components/admin/lista/memoria";
import { Paginacion, TAMANOS } from "@/components/admin/lista/Paginacion";
import { Tabla, Vacia, type Columna } from "@/components/admin/lista/Tabla";
import { panel } from "@/lib/admin/api";
import { ACCION, ENTIDAD, detalleEnPalabras, fechaHora } from "@/lib/admin/formato";
import type { AuditoriaCifras, Evento } from "@/lib/admin/tipos";

/**
 * Auditoría con la forma del portal CESS (D-009; 2026-11-26, Mateo: «falta auditoría»), como Consultas,
 * Órdenes, Inscripciones y Cursos: banda azul con cuatro cifras que filtran (Ingresos, Fallidos, Cursos y
 * fechas, Consultas y órdenes), la barra de filtros, la tabla en su tarjeta con la paginación de 10 en 10, y
 * al tocar una fila la tarjeta crece desde ella con el detalle en palabras, la IP y el link a lo que se tocó.
 * Solo lectura: un evento no se cambia ni se borra.
 */

const POR_DEFECTO = { grupo: "", accion: "", entidad: "", fecha: "", q: "", pagina: "1", por: "10", ver: "" };
type Clave = keyof typeof POR_DEFECTO;

const ACCIONES: Opcion<string>[] = [{ valor: "", texto: "Todas" }, ...Object.entries(ACCION).map(([valor, texto]) => ({ valor, texto }))];
const SOBRE: Opcion<string>[] = [
  { valor: "", texto: "Todo" },
  { valor: "lead", texto: "Consultas" },
  { valor: "order", texto: "Órdenes" },
  { valor: "course", texto: "Cursos" },
  { valor: "course_session", texto: "Fechas" },
  { valor: "user", texto: "Usuarios" },
];
const FECHAS: Opcion<string>[] = [
  { valor: "", texto: "Siempre" },
  { valor: "hoy", texto: "Hoy" },
  { valor: "7", texto: "Últimos 7 días" },
  { valor: "30", texto: "Últimos 30 días" },
  { valor: "90", texto: "Últimos 90 días" },
];
const GRUPOS: Record<string, string> = { INGRESOS: "Ingresos", FALLIDOS: "Fallidos", CURSOS: "Cursos y fechas", ATENCION: "Consultas y órdenes" };

function diaAtras(dias: number): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Cordoba" }).format(new Date(Date.now() - dias * 86_400_000));
}
function rangoDe(fecha: string): { desde?: string; hasta?: string } {
  if (fecha === "hoy") return { desde: diaAtras(0), hasta: diaAtras(0) };
  if (["7", "30", "90"].includes(fecha)) return { desde: diaAtras(Number(fecha) - 1) };
  return {};
}

/** Adónde lleva lo que se tocó: la consulta, la orden o el curso abiertos en su pantalla. */
function enlaceDe(e: Evento): string | null {
  if (!e.entidad_id) return null;
  if (e.entidad === "lead") return `/admin/consultas?estado=TODAS&consulta=${e.entidad_id}`;
  if (e.entidad === "order") return `/admin/ordenes?estado=TODAS&ver=${e.entidad_id}`;
  if (e.entidad === "course") return `/admin/cursos?ver=${e.entidad_id}`;
  if (e.entidad === "course_session" && typeof e.detalle.curso === "number") return `/admin/cursos?ver=${e.detalle.curso}`;
  return null;
}
function sobreQue(e: Evento): string {
  if (!e.entidad) return "—";
  const nombre = ENTIDAD[e.entidad] ?? e.entidad;
  if (e.entidad === "user" || e.entidad === "permiso") return nombre;
  return `${nombre} ${e.entidad === "order" ? e.entidad_id.slice(0, 8) : `n.º ${e.entidad_id}`}`;
}
const iniciales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "·";

function Auditoria() {
  const params = useSearchParams();
  const pathname = usePathname();
  const v = useMemo(() => {
    const r = { ...POR_DEFECTO };
    for (const k of Object.keys(POR_DEFECTO) as Clave[]) r[k] = params.get(k) ?? POR_DEFECTO[k];
    return r;
  }, [params]);
  const pagina = Math.max(1, Number.parseInt(v.pagina, 10) || 1);
  const por = (TAMANOS as readonly number[]).includes(Number(v.por)) ? Number(v.por) : 10;

  const enlace = useCallback((cambios: Partial<Record<Clave, string>>) => {
    const nuevos = new URLSearchParams(params.toString());
    if (Object.keys(cambios).some((k) => !["pagina", "por", "ver"].includes(k))) nuevos.delete("pagina");
    for (const [k, val] of Object.entries(cambios) as [Clave, string][]) {
      if (val === POR_DEFECTO[k]) nuevos.delete(k);
      else nuevos.set(k, val);
    }
    const texto = nuevos.toString();
    return texto ? `${pathname}?${texto}` : pathname;
  }, [params, pathname]);
  const ir = useCallback((cambios: Partial<Record<Clave, string>>) => window.history.replaceState(null, "", enlace(cambios)), [enlace]);

  const lista = useDatosRecordados(
    () => panel.auditoria({ grupo: v.grupo, accion: v.accion, entidad: v.entidad, q: v.q, ...rangoDe(v.fecha), page: pagina, page_size: por }),
    [v.grupo, v.accion, v.entidad, v.fecha, v.q, pagina, por],
  );
  const cifras = useDatosRecordados(() => panel.auditoriaCifras(), []);
  const filas = lista.estado.tipo === "listo" ? lista.estado.datos.results : [];
  const total = lista.estado.tipo === "listo" ? lista.estado.datos.count : 0;
  const hayFiltros = v.grupo !== "" || v.accion !== "" || v.entidad !== "" || v.fecha !== "" || v.q !== "";

  const idx = filas.findIndex((f) => String(f.id) === v.ver);
  const [mostrado, setMostrado] = useState(v.ver);
  if (v.ver && v.ver !== mostrado) setMostrado(v.ver);
  const [guardado, setGuardado] = useState<Evento | null>(null);
  const evento = filas.find((f) => String(f.id) === mostrado) ?? (guardado && String(guardado.id) === mostrado ? guardado : null);
  if (evento && evento !== guardado) setGuardado(evento);
  const filaDe = useCallback((id: string) => () => {
    const el = [...document.querySelectorAll<HTMLElement>(`[data-fila="${id}"]`)].find((f) => f.offsetParent !== null);
    return el?.getBoundingClientRect() ?? null;
  }, []);
  const alSalir = useCallback(() => {
    const id = mostrado;
    setMostrado("");
    [...document.querySelectorAll<HTMLElement>(`[data-abrir="${id}"]`)].find((b) => b.offsetParent !== null)?.focus();
  }, [mostrado]);

  const columnas: Columna<Evento>[] = [
    { titulo: "Quién", celda: (e) => <Persona e={e} />, ancho: "w-[22%]" },
    { titulo: "Qué hizo", celda: (e) => <Accion e={e} /> },
    { titulo: "Sobre qué", celda: (e) => <span className="whitespace-nowrap text-sm text-ink-900">{sobreQue(e)}</span>, ocultar: "hidden md:table-cell", centro: true },
    {
      titulo: "Cuándo", centro: true, ocultar: "hidden lg:table-cell",
      celda: (e) => (
        <span className="block whitespace-nowrap">
          <span className="block font-sub text-sm font-semibold text-ink-900">{hace(e.created_at)}</span>
          <span className="block text-xs tabular-nums text-neutral-700">{fechaHora(e.created_at)}</span>
        </span>
      ),
    },
  ];

  const pastillas: ReactNode[] = [];
  if (v.grupo) pastillas.push(<Pastilla key="g" texto={GRUPOS[v.grupo] ?? v.grupo} onQuitar={() => ir({ grupo: "" })} />);
  if (v.accion) pastillas.push(<Pastilla key="a" texto={`Acción: ${ACCION[v.accion] ?? v.accion}`} onQuitar={() => ir({ accion: "" })} />);
  if (v.entidad) pastillas.push(<Pastilla key="e" texto={`Sobre: ${SOBRE.find((o) => o.valor === v.entidad)?.texto ?? v.entidad}`} onQuitar={() => ir({ entidad: "" })} />);
  if (v.fecha) pastillas.push(<Pastilla key="f" texto={FECHAS.find((o) => o.valor === v.fecha)?.texto ?? v.fecha} onQuitar={() => ir({ fecha: "" })} />);
  if (v.q) pastillas.push(<Pastilla key="q" texto={`«${v.q}»`} onQuitar={() => ir({ q: "" })} />);
  const limpiar = () => ir({ grupo: "", accion: "", entidad: "", fecha: "", q: "" });

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 lg:h-[calc(100dvh-4rem)]">
      <Banda sobre="Administración" titulo="Auditoría" bajada="Quién hizo qué, sobre qué y cuándo. Solo lectura: nada se cambia ni se borra."
        contador={cifras.estado.tipo === "listo" ? `${numero(cifras.estado.datos.hoy)} hoy` : undefined}>
        <Cifras estado={cifras.estado} grupo={v.grupo} enlace={enlace} />
      </Banda>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <BarraFiltros pastillas={pastillas.length ? <>{pastillas}<Limpiar onLimpiar={limpiar} /></> : undefined}>
          <Buscador etiqueta="Buscar por persona o número" valor={v.q} onCambiar={(q) => ir({ q })} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
            <Menu etiqueta="Acción" valor={v.accion} opciones={ACCIONES} porDefecto="" onCambiar={(accion) => ir({ accion })} />
            <Menu etiqueta="Sobre" valor={v.entidad} opciones={SOBRE} porDefecto="" onCambiar={(entidad) => ir({ entidad })} />
            <Menu etiqueta="Fecha" valor={v.fecha} opciones={FECHAS} porDefecto="" onCambiar={(fecha) => ir({ fecha })} />
          </div>
        </BarraFiltros>

        {lista.estado.tipo !== "listo" && lista.estado.tipo !== "cargando" ? (
          <div className="min-h-0 flex-1 overflow-auto rounded-[18px] border border-ink-100 bg-neutral-0 p-4">
            <EstadoNoListo estado={lista.estado} recargar={lista.recargar} />
          </div>
        ) : (
          <Tabla etiqueta="Auditoría" filas={filas} columnas={columnas} clave={(e) => e.id} activa={v.ver ? Number(v.ver) : null}
            alAbrir={(e) => ir({ ver: String(e.id) })} movil={(e) => <FilaMovil e={e} />} cargando={lista.estado.tipo === "cargando"}
            vacio={hayFiltros
              ? <Vacia titulo="No hay movimientos con estos filtros." texto="Probá con otra acción u otra fecha." accion={<Limpiar onLimpiar={limpiar} />} />
              : <Vacia titulo="Todavía no hay movimientos." />}
            pie={total > 0 ? <Paginacion total={total} pagina={pagina} porPagina={por} onPagina={(n) => ir({ pagina: String(n) })} onPorPagina={(n) => ir({ por: String(n), pagina: "1" })} /> : undefined} />
        )}
      </div>

      {mostrado && evento && (
        <FichaEvento e={evento} abierta={!!v.ver} origen={filaDe(mostrado)} onSalida={alSalir} onCerrar={() => ir({ ver: "" })}
          posicion={idx >= 0 ? `${idx + 1} de ${filas.length}` : undefined}
          onAnterior={idx > 0 ? () => ir({ ver: String(filas[idx - 1]!.id) }) : undefined}
          onSiguiente={idx >= 0 && idx < filas.length - 1 ? () => ir({ ver: String(filas[idx + 1]!.id) }) : undefined} />
      )}
    </div>
  );
}

function Cifras({ estado, grupo, enlace }: { estado: EstadoDatos<AuditoriaCifras>; grupo: string; enlace: (c: Partial<Record<Clave, string>>) => string }) {
  if (estado.tipo !== "listo") {
    return <>{[0, 1, 2, 3].map((k) => <span key={k} aria-hidden className="h-16 rounded-[16px] bg-neutral-0/[0.06] ring-1 ring-neutral-0/10" />)}</>;
  }
  const d = estado.datos;
  const base = { pagina: "1", ver: "", accion: "" };
  // Tocar la cifra elegida la suelta y vuelve a mostrar todo.
  const a = (g: string) => enlace({ ...base, grupo: grupo === g ? "" : g });
  return (
    <>
      <CifraFiltro href={a("INGRESOS")} icono="persona" nombre="Ingresos" detalle="Entradas al panel" valor={d.ingresos} elegida={grupo === "INGRESOS"} />
      <CifraFiltro href={a("FALLIDOS")} icono="alerta" nombre="Fallidos" detalle="Clave o código mal" valor={d.fallidos} elegida={grupo === "FALLIDOS"} />
      <CifraFiltro href={a("CURSOS")} icono="cursos" nombre="Cursos y fechas" detalle="Altas y cambios" valor={d.cursos} elegida={grupo === "CURSOS"} />
      <CifraFiltro href={a("ATENCION")} icono="consultas" nombre="Consultas y órdenes" detalle="Respuestas y accesos" valor={d.atencion} elegida={grupo === "ATENCION"} />
    </>
  );
}

function Persona({ e }: { e: Evento }) {
  const sistema = e.persona === "Sistema";
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span aria-hidden className={`inline-grid h-9 w-9 shrink-0 place-items-center rounded-full font-sub text-xs font-semibold ${sistema ? "bg-ink-900 text-neutral-0" : "bg-ink-50 text-ink-900 ring-1 ring-ink-100"}`}>
        {sistema ? <Icono nombre="escudo" tam={18} acento="#F79268" /> : iniciales(e.persona)}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink-900">{e.persona}</span>
        <span className="block truncate text-xs text-neutral-700">{sistema ? "Sin sesión o automático" : "Usuario del panel"}</span>
      </span>
    </span>
  );
}

function Accion({ e }: { e: Evento }) {
  const detalle = detalleEnPalabras(e.accion, e.detalle);
  return (
    <span className="flex min-w-0 items-start gap-2.5">
      <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tonoPunto(e.accion)}`} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink-900">{ACCION[e.accion] ?? e.accion}</span>
        {detalle.length > 0 && <span className="block max-w-[420px] truncate text-xs text-neutral-700">{detalle.join(" · ")}</span>}
      </span>
    </span>
  );
}

function FilaMovil({ e }: { e: Evento }) {
  return (
    <span className="flex flex-col gap-1.5">
      <Accion e={e} />
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-[18px] text-xs text-neutral-700">
        <span className="font-semibold text-ink-900">{e.persona}</span>
        {e.entidad && <><span aria-hidden>·</span><span>{sobreQue(e)}</span></>}
        <span aria-hidden>·</span>
        <span>{hace(e.created_at)}</span>
      </span>
    </span>
  );
}

function FichaEvento({ e, abierta, origen, onSalida, onCerrar, posicion, onAnterior, onSiguiente }: {
  e: Evento; abierta: boolean; origen: () => DOMRect | null; onSalida: () => void; onCerrar: () => void;
  posicion?: string; onAnterior?: () => void; onSiguiente?: () => void;
}) {
  const detalle = detalleEnPalabras(e.accion, e.detalle);
  const href = enlaceDe(e);
  return (
    <Ficha abierta={abierta} sobre="Auditoría" posicion={posicion} titulo={ACCION[e.accion] ?? e.accion} onCerrar={onCerrar} onSalida={onSalida} origen={origen}
      onAnterior={onAnterior} onSiguiente={onSiguiente}
      chips={<><ChipOscuro>{e.persona}</ChipOscuro><ChipOscuro>{fechaHora(e.created_at)}</ChipOscuro></>}
      pie={href ? <div className="flex justify-end"><BotonFicha href={href} icono="abrir">Abrir {ENTIDAD[e.entidad]?.toLowerCase() ?? ""}</BotonFicha></div> : undefined}>
      <div className="grid gap-3 lg:grid-cols-2">
        <div data-cascada className="flex flex-col gap-3">
          <DatoFicha icono={<Icono nombre="persona" tam={22} />} etiqueta="Quién" destacado>{e.persona}</DatoFicha>
          <DatoFicha icono={<Icono nombre="reloj" tam={22} />} etiqueta="Cuándo">{fechaHora(e.created_at)} · {hace(e.created_at)}</DatoFicha>
          <DatoFicha icono={<Icono nombre="auditoria" tam={22} />} etiqueta="Sobre qué">{sobreQue(e)}</DatoFicha>
          <DatoFicha icono={<Icono nombre="pantalla" tam={22} />} etiqueta="Desde la IP"><span className="font-mono text-[13px]">{e.ip ?? "Sin dato"}</span></DatoFicha>
        </div>
        <section data-cascada aria-label="Detalle" className="rounded-[16px] border border-ink-100 p-4">
          <Rotulo>Detalle</Rotulo>
          {detalle.length ? (
            <ul className="mt-2 flex flex-col gap-2">
              {detalle.map((l) => (
                <li key={l} className="flex gap-2.5 text-sm text-ink-900">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {l}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-neutral-700">Sin más datos.</p>
          )}
          <p className="mt-4 text-xs text-neutral-700">Evento n.º {e.id}. Los eventos de auditoría no se pueden cambiar ni borrar.</p>
        </section>
      </div>
    </Ficha>
  );
}

export default function AuditoriaPage() {
  return (
    <Suspense>
      <Auditoria />
    </Suspense>
  );
}
