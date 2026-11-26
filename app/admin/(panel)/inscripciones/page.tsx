"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EstadoNoListo, useErrorDeAccion, type EstadoDatos } from "@/components/admin/datos";
import { useDatosRecordados } from "@/components/admin/lista/memoria";
import { numero } from "@/components/admin/inicio/graficos";
import { SCROLL_FINO, hace } from "@/components/admin/inicio/piezas";
import { Banda, CifraFiltro } from "@/components/admin/lista/Banda";
import { BarraFiltros, Buscador, Limpiar, Menu, Pastilla, type Opcion } from "@/components/admin/lista/BarraFiltros";
import { BotonAccion, BotonFicha, ChipOscuro, CuadroIcono, Rotulo } from "@/components/admin/lista/Botones";
import { Ficha, useAviso } from "@/components/admin/lista/Ficha";
import { Paginacion, TAMANOS } from "@/components/admin/lista/Paginacion";
import { ChipPunto, Tabla, Vacia, type Columna } from "@/components/admin/lista/Tabla";
import { panel } from "@/lib/admin/api";
import { MODALIDAD, fechaHora } from "@/lib/admin/formato";
import type { EstadoFecha, FechaInscripciones, InscripcionCifras, PersonaInscripta } from "@/lib/admin/tipos";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { pegar } from "@/lib/texto";

/**
 * Inscripciones (2026-11-25), con la forma del portal CESS como Consultas y Órdenes (D-003, D-004, D-005): cada fila
 * es una fecha de un webinar o de un curso en vivo; la banda tiene cuatro cifras que filtran (Próximas, Esta semana,
 * Llenas, Pasadas) y cuántas personas vienen a lo que viene. Tocar una fila abre la tarjeta de la fecha, que crece
 * desde la fila (↑ ↓ recorren, Esc cierra): quién viene, con buscador; el cupo; exportar la lista y copiar los correos.
 * En un curso en vivo, quien viene sale de las órdenes pagadas de esa fecha (sus participantes, o el comprador si no
 * los cargó); en un webinar, de los que se anotaron.
 */

const POR_DEFECTO = { cuando: "PROXIMAS", tipo: "", curso: "", q: "", pagina: "1", por: "10", ver: "" };
type Clave = keyof typeof POR_DEFECTO;

const CUANDO: Opcion<string>[] = [
  { valor: "PROXIMAS", texto: "Próximas" },
  { valor: "SEMANA", texto: "Esta semana" },
  { valor: "LLENAS", texto: "Llenas" },
  { valor: "PASADAS", texto: "Pasadas" },
  { valor: "TODAS", texto: "Todas" },
];
const TIPOS: Opcion<string>[] = [
  { valor: "", texto: "Todos" },
  { valor: "WEBINAR", texto: "Webinar" },
  { valor: "LIVE", texto: "En vivo" },
];
const ESTADO: Record<EstadoFecha, { texto: string; tono: "ok" | "neutro" | "peligro"; punto: string }> = {
  SCHEDULED: { texto: "Programada", tono: "ok", punto: "bg-status-success" },
  CANCELLED: { texto: "Cancelada", tono: "peligro", punto: "bg-status-error" },
  FINISHED: { texto: "Finalizada", tono: "neutro", punto: "bg-neutral-0/60" },
};
const ZONA = "America/Argentina/Cordoba";
const MAX_A_LA_VISTA = 200;

const iniciales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "·";
const diaArg = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: ZONA }).format(d);
/** «jue 27/11» y «13:51», en hora de Argentina. */
function dia(iso: string): string {
  const d = new Date(iso);
  const semana = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, weekday: "short" }).format(d).replace(".", "");
  const fecha = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, day: "2-digit", month: "2-digit" }).format(d);
  return `${semana} ${fecha}`;
}
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const hora = (iso: string) => new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
/** «hoy», «mañana», «en 3 días» o «hace 2 días», contando días de Argentina. */
function cuanto(iso: string): string {
  const a = new Date(`${diaArg(new Date(iso))}T00:00:00Z`).getTime();
  const b = new Date(`${diaArg(new Date())}T00:00:00Z`).getTime();
  const dias = Math.round((a - b) / 86_400_000);
  if (dias === 0) return new Date(iso).getTime() >= Date.now() ? "hoy" : "fue hoy";
  if (dias === 1) return "mañana";
  if (dias === -1) return "ayer";
  return dias > 0 ? `en ${dias} días` : `hace ${-dias} días`;
}
const llena = (f: FechaInscripciones) => f.capacity !== null && f.inscriptos >= f.capacity;
const vivo = (f: FechaInscripciones) => f.modalidad === "LIVE";

function Inscripciones() {
  const params = useSearchParams();
  const pathname = usePathname();
  const v = useMemo(() => {
    const r = { ...POR_DEFECTO };
    for (const k of Object.keys(POR_DEFECTO) as Clave[]) r[k] = params.get(k) ?? POR_DEFECTO[k];
    // El Inicio lleva a `?fecha=<id>` («Ver los inscriptos» de la próxima fecha): abre esa tarjeta.
    if (!r.ver && params.get("fecha")) r.ver = params.get("fecha")!;
    return r;
  }, [params]);
  const pagina = Math.max(1, Number.parseInt(v.pagina, 10) || 1);
  const por = (TAMANOS as readonly number[]).includes(Number(v.por)) ? Number(v.por) : 10;

  const enlace = useCallback((cambios: Partial<Record<Clave, string>>) => {
    const nuevos = new URLSearchParams(params.toString());
    nuevos.delete("fecha");
    if (Object.keys(cambios).some((k) => !["pagina", "por", "ver"].includes(k))) nuevos.delete("pagina");
    for (const [k, val] of Object.entries(cambios) as [Clave, string][]) {
      if (val === POR_DEFECTO[k]) nuevos.delete(k);
      else nuevos.set(k, val);
    }
    const texto = nuevos.toString();
    return texto ? `${pathname}?${texto}` : pathname;
  }, [params, pathname]);
  // La dirección cambia sin pedirle nada al servidor (15-MEMORY 2026-11-25: router.replace se sentía «tildado»).
  const ir = useCallback((cambios: Partial<Record<Clave, string>>) => window.history.replaceState(null, "", enlace(cambios)), [enlace]);

  const claveLista = [v.cuando, v.tipo, v.curso, v.q, pagina, por].join("|");
  const lista = useDatosRecordados(
    () => panel.fechasInscripciones({ cuando: v.cuando, tipo: v.tipo, curso: v.curso, q: v.q, page: pagina, page_size: por }),
    [claveLista],
  );
  const cifras = useDatosRecordados(() => panel.inscripcionCifras(), []);
  const cursos = useDatosRecordados(() => panel.cursos({ page_size: 100 }), []);
  const { aviso, avisar } = useAviso();

  const filas = lista.estado.tipo === "listo" ? lista.estado.datos.results : [];
  const total = lista.estado.tipo === "listo" ? lista.estado.datos.count : 0;
  const hayFiltros = v.tipo !== "" || v.curso !== "" || v.q !== "" || v.cuando !== "PROXIMAS";
  const opcionesCurso: Opcion<string>[] = [
    { valor: "", texto: "Todos" },
    ...(cursos.estado.tipo === "listo"
      ? cursos.estado.datos.results.filter((c) => c.modality === "LIVE" || c.modality === "WEBINAR").map((c) => ({ valor: String(c.id), texto: `${c.code} · ${c.title}` }))
      : []),
  ];

  const ver = Number.parseInt(v.ver, 10) || 0;
  const idx = filas.findIndex((f) => f.id === ver);
  const [mostrada, setMostrada] = useState(ver);
  if (ver && ver !== mostrada) setMostrada(ver);
  const cerrarFicha = useCallback(() => ir({ ver: "" }), [ir]);
  const alSalir = useCallback(() => {
    const id = mostrada;
    setMostrada(0);
    [...document.querySelectorAll<HTMLElement>(`[data-abrir="${id}"]`)].find((b) => b.offsetParent !== null)?.focus();
  }, [mostrada]);
  const filaDe = useCallback((id: number) => () => {
    const el = [...document.querySelectorAll<HTMLElement>(`[data-fila="${id}"]`)].find((f) => f.offsetParent !== null);
    return el?.getBoundingClientRect() ?? null;
  }, []);

  const columnas: Columna<FechaInscripciones>[] = [
    { titulo: "Fecha", celda: (f) => <Cuando f={f} />, ancho: "w-[16%]" },
    { titulo: "Webinar o curso", celda: (f) => <Curso f={f} />, ancho: "w-[40%]" },
    { titulo: "Inscriptos", celda: (f) => <Cupo f={f} />, centro: true },
    { titulo: "Estado", celda: (f) => <ChipPunto texto={ESTADO[f.status].texto} tono={ESTADO[f.status].tono} />, centro: true, ocultar: "hidden lg:table-cell" },
    {
      titulo: "Acciones", centro: true,
      celda: (f) => <BotonAccion icono="persona" onClick={() => ir({ ver: String(f.id) })} etiqueta={`Ver quién viene a ${f.curso}, ${dia(f.starts_at)}`}>Ver inscriptos</BotonAccion>,
    },
  ];

  const pastillas: ReactNode[] = [];
  if (v.cuando !== "PROXIMAS") pastillas.push(<Pastilla key="w" texto={CUANDO.find((o) => o.valor === v.cuando)?.texto ?? v.cuando} onQuitar={() => ir({ cuando: "PROXIMAS" })} />);
  if (v.tipo) pastillas.push(<Pastilla key="t" texto={`Tipo: ${MODALIDAD[v.tipo] ?? v.tipo}`} onQuitar={() => ir({ tipo: "" })} />);
  if (v.curso) pastillas.push(<Pastilla key="c" texto={`Curso: ${opcionesCurso.find((o) => o.valor === v.curso)?.texto.split(" · ")[0] ?? v.curso}`} onQuitar={() => ir({ curso: "" })} />);
  if (v.q) pastillas.push(<Pastilla key="q" texto={`«${v.q}»`} onQuitar={() => ir({ q: "" })} />);
  const limpiar = () => ir({ cuando: "PROXIMAS", tipo: "", curso: "", q: "" });

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 lg:h-[calc(100dvh-4rem)]">
      <Banda sobre="Atender" titulo="Inscripciones"
        contador={cifras.estado.tipo === "listo" ? `${numero(cifras.estado.datos.proximas)} ${cifras.estado.datos.proximas === 1 ? "fecha por venir" : "fechas por venir"}` : undefined}
        derecha={<Vienen estado={cifras.estado} />}>
        <Cifras estado={cifras.estado} v={v} enlace={enlace} />
      </Banda>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <BarraFiltros pastillas={pastillas.length ? <>{pastillas}<Limpiar onLimpiar={limpiar} /></> : undefined}>
          <Buscador etiqueta="Buscar por curso o persona" valor={v.q} onCambiar={(q) => ir({ q })} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
            <Menu etiqueta="Cuándo" valor={v.cuando} opciones={CUANDO} porDefecto="PROXIMAS" onCambiar={(cuando) => ir({ cuando })} />
            <Menu etiqueta="Tipo" valor={v.tipo} opciones={TIPOS} porDefecto="" onCambiar={(tipo) => ir({ tipo })} />
            <Menu etiqueta="Curso" valor={v.curso} opciones={opcionesCurso} porDefecto="" onCambiar={(curso) => ir({ curso })} />
          </div>
        </BarraFiltros>

        {lista.estado.tipo !== "listo" && lista.estado.tipo !== "cargando" ? (
          <div className="min-h-0 flex-1 overflow-auto rounded-[18px] border border-ink-100 bg-neutral-0 p-4">
            <EstadoNoListo estado={lista.estado} recargar={lista.recargar} />
          </div>
        ) : (
          <Tabla etiqueta="Fechas con inscripciones" filas={filas} columnas={columnas} clave={(f) => f.id} activa={ver || null}
            alAbrir={(f) => ir({ ver: String(f.id) })} movil={(f) => <FilaMovil f={f} />} cargando={lista.estado.tipo === "cargando"}
            vacio={hayFiltros
              ? <Vacia titulo="No hay fechas con estos filtros." texto={pegar("Probá con otro tipo, otro curso u otro momento.")} accion={<Limpiar onLimpiar={limpiar} />} />
              : <Vacia titulo="No hay fechas por venir." texto={pegar("Cuando cargues un webinar o un curso en vivo con fecha en Cursos, aparece acá.")} />}
            pie={total > 0 ? <Paginacion total={total} pagina={pagina} porPagina={por} onPagina={(n) => ir({ pagina: String(n) })} onPorPagina={(n) => ir({ por: String(n), pagina: "1" })} /> : undefined} />
        )}
      </div>

      {mostrada > 0 && (
        <FichaFecha id={mostrada} abierta={!!ver} fila={filas.find((f) => f.id === mostrada)} origen={filaDe(mostrada)} onSalida={alSalir}
          onCerrar={cerrarFicha} avisar={avisar}
          posicion={idx >= 0 ? `${idx + 1} de ${filas.length}` : undefined}
          onAnterior={idx > 0 ? () => ir({ ver: String(filas[idx - 1]!.id) }) : undefined}
          onSiguiente={idx >= 0 && idx < filas.length - 1 ? () => ir({ ver: String(filas[idx + 1]!.id) }) : undefined} />
      )}
      {aviso}
    </div>
  );
}

// --- La banda --------------------------------------------------------------------------------------------

function Cifras({ estado, v, enlace }: { estado: EstadoDatos<InscripcionCifras>; v: typeof POR_DEFECTO; enlace: (c: Partial<Record<Clave, string>>) => string }) {
  if (estado.tipo !== "listo") {
    return <>{[0, 1, 2, 3].map((k) => <span key={k} aria-hidden className="h-16 rounded-[16px] bg-neutral-0/[0.06] ring-1 ring-neutral-0/10" />)}</>;
  }
  const d = estado.datos;
  const base = { pagina: "1", ver: "", tipo: "", curso: "", q: "" };
  const sinOtros = !v.tipo && !v.curso && !v.q;
  const elegida = (c: string) => sinOtros && v.cuando === c;
  return (
    <>
      <CifraFiltro href={enlace({ ...base, cuando: "PROXIMAS" })} icono="inscripciones" nombre="Próximas" detalle="Webinars y cursos por venir" valor={d.proximas} elegida={elegida("PROXIMAS")} />
      <CifraFiltro href={enlace({ ...base, cuando: "SEMANA" })} icono="reloj" nombre="Esta semana" detalle="En los próximos 7 días" valor={d.semana} elegida={elegida("SEMANA")} />
      <CifraFiltro href={enlace({ ...base, cuando: "LLENAS" })} icono="personas" nombre="Llenas" detalle="Sin lugar en el cupo" valor={d.llenas} elegida={elegida("LLENAS")} />
      <CifraFiltro href={enlace({ ...base, cuando: "PASADAS" })} icono="actividad" nombre="Pasadas" detalle="Ya se dieron" valor={d.pasadas} elegida={elegida("PASADAS")} />
    </>
  );
}

function Vienen({ estado }: { estado: EstadoDatos<InscripcionCifras> }) {
  if (estado.tipo !== "listo") return <span aria-hidden className="block h-11 w-56 rounded-[14px] bg-neutral-0/[0.06]" />;
  const n = estado.datos.personas_proximas;
  return (
    <div className="flex flex-col gap-0.5 rounded-[14px] bg-neutral-0/[0.06] px-4 py-2 ring-1 ring-neutral-0/10 lg:items-end lg:text-right">
      <span className="font-sub text-[11px] font-semibold uppercase tracking-wider text-neutral-0/70">Vienen a lo próximo</span>
      <span className="font-sub text-lg font-bold tabular-nums">{numero(n)} {n === 1 ? "persona" : "personas"}</span>
    </div>
  );
}

// --- Las celdas -------------------------------------------------------------------------------------------

function Cuando({ f }: { f: FechaInscripciones }) {
  const pasada = new Date(f.starts_at).getTime() < Date.now();
  return (
    <span className="block whitespace-nowrap">
      <span className="block font-sub text-sm font-semibold capitalize text-ink-900">{dia(f.starts_at)} · {hora(f.starts_at)}</span>
      <span className={`block text-xs ${pasada ? "text-neutral-700" : "font-semibold text-brand-600"}`}>{cuanto(f.starts_at)}</span>
    </span>
  );
}

function Curso({ f }: { f: FechaInscripciones }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span aria-hidden className={`inline-grid h-9 w-9 shrink-0 place-items-center rounded-full font-sub text-[11px] font-semibold ${vivo(f) ? "bg-brand-500 text-neutral-0" : "bg-ink-50 text-ink-900 ring-1 ring-ink-100"}`}>
        {vivo(f) ? "VIVO" : "WEB"}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink-900" title={f.curso}>{f.curso}</span>
        <span className="block truncate text-xs text-neutral-700">{f.codigo} · {MODALIDAD[f.modalidad] ?? f.modalidad}</span>
      </span>
    </span>
  );
}

/** «47 de 60» con una barra; sin cupo, solo el número. */
function Cupo({ f }: { f: FechaInscripciones }) {
  const lleno = llena(f);
  const parte = f.capacity ? Math.min(1, f.inscriptos / f.capacity) : 0;
  return (
    <span className="inline-flex w-28 flex-col items-center gap-1">
      <span className="whitespace-nowrap font-sub text-sm tabular-nums text-ink-900">
        <b className="font-semibold">{numero(f.inscriptos)}</b>
        {f.capacity !== null ? <span className="text-neutral-700"> de {numero(f.capacity)}</span> : <span className="text-neutral-700"> · sin cupo</span>}
      </span>
      {f.capacity !== null && (
        <span aria-hidden className="block h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <span className={`block h-full rounded-full ${lleno ? "bg-status-error" : "bg-brand-500"}`} style={{ width: `${Math.max(parte * 100, f.inscriptos ? 4 : 0)}%` }} />
        </span>
      )}
    </span>
  );
}

function FilaMovil({ f }: { f: FechaInscripciones }) {
  return (
    <span className="flex flex-col gap-1.5">
      <Curso f={f} />
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 text-xs text-neutral-700">
        <span className="font-sub text-sm font-semibold capitalize text-ink-900">{dia(f.starts_at)} · {hora(f.starts_at)}</span>
        <span>{cuanto(f.starts_at)}</span>
      </span>
      <span className="flex items-center gap-3 pl-12">
        <Cupo f={f} />
        {f.status !== "SCHEDULED" && <ChipPunto texto={ESTADO[f.status].texto} tono={ESTADO[f.status].tono} />}
      </span>
    </span>
  );
}

// --- La tarjeta de la fecha ---------------------------------------------------------------------------------

interface FichaFechaProps {
  id: number;
  abierta: boolean;
  fila?: FechaInscripciones;
  origen: () => DOMRect | null;
  onSalida: () => void;
  posicion?: string;
  onCerrar: () => void;
  onAnterior?: () => void;
  onSiguiente?: () => void;
  avisar: (texto: string) => void;
}

function FichaFecha({ id, abierta, fila, origen, onSalida, posicion, onCerrar, onAnterior, onSiguiente, avisar }: FichaFechaProps) {
  const { estado, recargar } = useDatosRecordados(() => panel.personasDeFecha(id), [id]);
  const cuerpo = useRef<HTMLDivElement>(null);
  const d = estado.tipo === "listo" && estado.datos.fecha.id === id ? estado.datos : null;
  const cabeza = d?.fecha ?? fila ?? null;

  useLayoutEffect(() => {
    const partes = cuerpo.current?.querySelectorAll<HTMLElement>("[data-entra]");
    if (!d || !partes?.length || prefersReducedMotion()) return;
    gsap.fromTo(partes, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power3.out", clearProps: "opacity,transform" });
  }, [d?.fecha.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const pie = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs text-neutral-700">{posicion ? `Fecha ${posicion} de esta página` : " "}</span>
      {cabeza && <span className="font-mono text-xs text-neutral-700">{cabeza.codigo}</span>}
    </div>
  );

  return (
    <Ficha abierta={abierta} origen={origen} onSalida={onSalida} sobre={cabeza ? MODALIDAD[cabeza.modalidad] ?? "Fecha" : "Fecha"} posicion={posicion}
      onCerrar={onCerrar} onAnterior={onAnterior} onSiguiente={onSiguiente} pie={pie}
      titulo={cabeza ? cabeza.curso : "Fecha"}
      chips={cabeza && (
        <>
          <ChipOscuro punto={ESTADO[cabeza.status].punto}>{ESTADO[cabeza.status].texto}</ChipOscuro>
          <ChipOscuro>{mayuscula(dia(cabeza.starts_at))} · {hora(cabeza.starts_at)} a {hora(cabeza.ends_at)}</ChipOscuro>
          <ChipOscuro>{cuanto(cabeza.starts_at)}</ChipOscuro>
          <ChipOscuro punto={llena(cabeza) ? "bg-status-error" : undefined}>
            {numero(cabeza.inscriptos)}{cabeza.capacity !== null ? ` de ${numero(cabeza.capacity)} lugares` : cabeza.inscriptos === 1 ? " inscripto" : " inscriptos"}
          </ChipOscuro>
        </>
      )}>
      <div ref={cuerpo}>
        {!d && (estado.tipo === "cargando" || estado.tipo === "listo") ? (
          <div aria-busy="true" className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <span className="h-72 rounded-[16px] bg-ink-50" />
            <span className="h-72 rounded-[16px] bg-ink-50" />
          </div>
        ) : !d ? (
          <EstadoNoListo estado={estado} recargar={recargar} noEncontrado={{ texto: "No encontramos esa fecha.", volver: <button type="button" onClick={onCerrar} className="text-sm font-semibold text-brand-600 underline">Volver a la lista</button> }} />
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Personas key={d.fecha.id} f={d.fecha} personas={d.personas} />
            <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-0">
              {d.fecha.status === "CANCELLED" && (
                <p data-entra className="rounded-[14px] border border-status-error/35 bg-status-error/10 px-4 py-3 text-sm text-status-error">
                  <b>Esta fecha está cancelada.</b> Si hay gente anotada, avisales y ofreceles otra.
                </p>
              )}
              <CupoFicha f={d.fecha} />
              <Llevar key={`l-${d.fecha.id}`} f={d.fecha} hay={d.personas.length > 0} avisar={avisar} />
            </div>
          </div>
        )}
      </div>
    </Ficha>
  );
}

/** Quién viene, con un buscador por nombre o correo (busca en la tarjeta: el correo no viaja en la dirección). */
function Personas({ f, personas }: { f: FechaInscripciones; personas: PersonaInscripta[] }) {
  const [q, setQ] = useState("");
  const texto = q.trim().toLowerCase();
  const halladas = texto ? personas.filter((p) => p.nombre.toLowerCase().includes(texto) || p.correo.toLowerCase().includes(texto)) : personas;
  const visibles = halladas.slice(0, MAX_A_LA_VISTA);
  const titulo = vivo(f) ? "Participantes" : "Inscriptos";

  return (
    <section data-entra aria-label={titulo} className="flex min-w-0 flex-col gap-3 rounded-[16px] border border-ink-200 bg-ink-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Rotulo>{titulo} · {numero(personas.length)}</Rotulo>
        {personas.length > 6 && (
          <label className="relative block w-full sm:w-64">
            <span className="sr-only">Buscar en esta fecha por nombre o correo</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre o correo"
              className="min-h-[40px] w-full rounded-[10px] border border-ink-100 bg-neutral-0 px-3 text-base text-ink-900 outline-none placeholder:text-neutral-500 focus:border-ink-900 sm:text-sm" />
          </label>
        )}
      </div>
      {vivo(f) && <p className="-mt-1 text-xs text-neutral-700">Salen de las órdenes pagadas de esta fecha. Las devueltas no cuentan.</p>}
      {personas.length === 0 ? (
        <p className="rounded-[12px] bg-neutral-0 px-4 py-6 text-center text-sm text-neutral-700 ring-1 ring-ink-100">
          {vivo(f) ? "Todavía no hay órdenes pagadas para esta fecha." : "Todavía no se anotó nadie."}
        </p>
      ) : halladas.length === 0 ? (
        <p className="rounded-[12px] bg-neutral-0 px-4 py-6 text-center text-sm text-neutral-700 ring-1 ring-ink-100">Nadie coincide con «{q}».</p>
      ) : (
        <ul className={`flex max-h-[min(52dvh,460px)] flex-col divide-y divide-ink-100 rounded-[12px] bg-neutral-0 ring-1 ring-ink-100 ${SCROLL_FINO}`}>
          {visibles.map((p, k) => <Persona key={`${p.correo}-${p.orden ?? ""}-${k}`} p={p} />)}
        </ul>
      )}
      {halladas.length > visibles.length && (
        <p className="text-xs text-neutral-700">Se ven {numero(visibles.length)} de {numero(halladas.length)}. Buscá para encontrar al resto, o exportá la lista.</p>
      )}
    </section>
  );
}

function Persona({ p }: { p: PersonaInscripta }) {
  return (
    <li className="flex items-start gap-3 px-3 py-2.5 sm:items-center">
      <span aria-hidden className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-50 font-sub text-[11px] font-semibold text-ink-900 ring-1 ring-ink-100">{iniciales(p.nombre)}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span className="min-w-0">
          <span className="block font-semibold text-ink-900 [overflow-wrap:anywhere]">{p.nombre || "Sin nombre"}</span>
          {p.comprador && (
            <span className="mt-0.5 inline-block rounded-full bg-brand-500/10 px-2 py-0.5 font-sub text-[11px] font-semibold text-brand-600">
              Comprador · {p.sin_nombre === 1 ? "1 lugar sin nombre" : `${p.sin_nombre} lugares sin nombre`}
            </span>
          )}
          <span className="block text-sm text-neutral-700 [overflow-wrap:anywhere]">{p.correo}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5 sm:text-right">
          {p.orden ? (
            <a href={`/admin/ordenes?estado=TODAS&ver=${p.orden}`} className="rounded-[6px] font-mono text-xs font-semibold text-ink-900 underline decoration-ink-200 underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [@media(hover:hover)]:hover:decoration-ink-900"
              aria-label={`Ver la orden #${p.numero}`}>#{p.numero}</a>
          ) : null}
          <span className="whitespace-nowrap text-xs text-neutral-700" title={fechaHora(p.fecha)}>{p.orden ? "pagó" : "se anotó"} {hace(p.fecha)}</span>
        </span>
      </span>
    </li>
  );
}

function CupoFicha({ f }: { f: FechaInscripciones }) {
  const quedan = f.capacity !== null ? Math.max(0, f.capacity - f.inscriptos) : null;
  return (
    <section data-entra aria-label="Cupo" className="flex flex-col gap-3 rounded-[16px] border border-ink-100 p-4">
      <Rotulo>Cupo</Rotulo>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-3xl font-semibold tabular-nums leading-none text-ink-900">
          {numero(f.inscriptos)}
          {f.capacity !== null && <span className="text-lg text-neutral-700"> / {numero(f.capacity)}</span>}
        </p>
        <p className={`text-right font-sub text-sm font-semibold ${quedan === 0 ? "text-status-error" : "text-ink-900"}`}>
          {quedan === null ? "Sin cupo" : quedan === 0 ? "No quedan lugares" : quedan === 1 ? "Queda 1 lugar" : `Quedan ${numero(quedan)} lugares`}
        </p>
      </div>
      {f.capacity !== null && (
        <span aria-hidden className="block h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <span className={`block h-full rounded-full ${llena(f) ? "bg-status-error" : "bg-brand-500"}`} style={{ width: `${Math.max(Math.min(1, f.inscriptos / f.capacity) * 100, f.inscriptos ? 3 : 0)}%` }} />
        </span>
      )}
      <p className="text-xs text-neutral-700">{vivo(f) ? "Cuenta los lugares pagos de las órdenes." : "Cuenta a los que se anotaron en el sitio."}</p>
    </section>
  );
}

/** Llevarse la lista: el PDF (con correos y WhatsApp que se tocan) o los correos copiados para pegar en copia oculta.
 *  Los dos quedan en la auditoría. El PDF reemplaza al CSV (2026-11-25). */
function Llevar({ f, hay, avisar }: { f: FechaInscripciones; hay: boolean; avisar: (t: string) => void }) {
  const [copiando, setCopiando] = useState(false);
  const [armando, setArmando] = useState(false);
  const bajarPdf = async () => {
    setArmando(true);
    try {
      const [{ fecha, personas }, { descargarListaPdf }] = await Promise.all([panel.pdfDeFecha(f.id), import("@/components/admin/inscripciones/ListaPdf")]);
      await descargarListaPdf(fecha, personas);
      avisar("PDF descargado.");
    } catch (e) {
      avisar(errorDeAccion(e) ?? "No se pudo armar el PDF. Probá de nuevo.");
    } finally {
      setArmando(false);
    }
  };
  const errorDeAccion = useErrorDeAccion();
  const copiar = async () => {
    setCopiando(true);
    try {
      const { correos } = await panel.correosDeFecha(f.id);
      await navigator.clipboard.writeText(correos.join(", "));
      avisar(pegar(`${correos.length === 1 ? "Copiado 1 correo" : `Copiados ${numero(correos.length)} correos`} para pegar en CCO.`));
    } catch (e) {
      avisar(errorDeAccion(e) ?? "No se pudo copiar. Probá con «Descargar la lista».");
    } finally {
      setCopiando(false);
    }
  };
  return (
    <section data-entra data-escribe aria-labelledby="llevar-titulo" className="flex flex-col gap-3 rounded-[16px] border border-ink-100 p-4">
      <header className="flex items-center gap-3">
        <CuadroIcono nombre="personas" />
        <div className="min-w-0">
          <h3 id="llevar-titulo" className="font-display text-lg font-semibold leading-tight text-ink-900">Llevarte la lista</h3>
          <p className="text-xs text-neutral-700">Para mandar el enlace o pasar asistencia</p>
        </div>
      </header>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <BotonFicha onClick={() => void copiar()} deshabilitado={!hay || copiando} icono="copiar">{copiando ? "Copiando…" : "Copiar correos"}</BotonFicha>
        <BotonFicha variante="contorno" onClick={() => void bajarPdf()} deshabilitado={!hay || armando} icono="descargar">{armando ? "Armando el PDF…" : "Descargar PDF"}</BotonFicha>
      </div>
      <p className="text-xs text-neutral-700">El PDF trae correos y WhatsApp que se tocan. Queda registrado en la auditoría quién copió o descargó la lista.</p>
    </section>
  );
}

export default function InscripcionesPage() {
  return (
    <Suspense>
      <Inscripciones />
    </Suspense>
  );
}
