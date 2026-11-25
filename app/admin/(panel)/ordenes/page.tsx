"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EstadoNoListo, useDatos, useErrorDeAccion, type EstadoDatos } from "@/components/admin/datos";
import { numero } from "@/components/admin/inicio/graficos";
import { hace } from "@/components/admin/inicio/piezas";
import { Banda, CifraFiltro } from "@/components/admin/lista/Banda";
import { BarraFiltros, Buscador, Limpiar, Menu, Pastilla, type Opcion } from "@/components/admin/lista/BarraFiltros";
import { BotonAccion, BotonFicha, ChipOscuro, Ic, Rotulo } from "@/components/admin/lista/Botones";
import { DatoFicha, Ficha, useAviso } from "@/components/admin/lista/Ficha";
import { Paginacion, TAMANOS } from "@/components/admin/lista/Paginacion";
import { ChipPunto, Tabla, Vacia, type Columna } from "@/components/admin/lista/Tabla";
import { avisarContadores } from "@/components/admin/shell";
import { panel } from "@/lib/admin/api";
import { MEDIO_DE_PAGO, fechaHora, plata } from "@/lib/admin/formato";
import type { EstadoOrden, EventoHistorial, OrdenCifras, OrdenDetalle, OrdenFila } from "@/lib/admin/tipos";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Órdenes (2026-11-25), con la forma del portal CESS como Consultas (D-003, D-004): banda azul con cuatro cifras
 * que filtran y lo cobrado en el mes por moneda; la barra de filtros; la tabla en su tarjeta con la paginación
 * abajo; tocar una fila abre la tarjeta de la orden, que crece desde la fila (↑ ↓ recorren, Esc cierra).
 * La tarjeta: a la izquierda los cursos con sus participantes, el comprador y el pago; a la derecha «Dar acceso»
 * (pide confirmar: no se deshace), escribirle (correo propio o WhatsApp) y las notas internas.
 * Una orden devuelta en Mercado Pago o Stripe queda marcada «Devuelta» (su estado no cambia).
 */

const POR_DEFECTO = { estado: "PAID", medio: "", curso: "", fecha: "", q: "", pagina: "1", por: "10", ver: "", accion: "" };
type Clave = keyof typeof POR_DEFECTO;

const ESTADO: Record<EstadoOrden, { texto: string; tono: "nuevo" | "ok" | "neutro" | "marca" | "peligro" }> = {
  PAID: { texto: "Falta dar acceso", tono: "marca" },
  FULFILLED: { texto: "Cumplida", tono: "ok" },
  PENDING: { texto: "Pendiente de pago", tono: "nuevo" },
  FAILED: { texto: "Pago rechazado", tono: "peligro" },
  CANCELLED: { texto: "Cancelada", tono: "neutro" },
};
const ESTADOS: Opcion<string>[] = [
  { valor: "PAID", texto: "Falta dar acceso" },
  { valor: "FULFILLED", texto: "Cumplidas" },
  { valor: "SIN_COMPLETAR", texto: "Sin completar" },
  { valor: "PENDING", texto: "Pendientes de pago" },
  { valor: "FAILED", texto: "Pago rechazado" },
  { valor: "CANCELLED", texto: "Canceladas" },
  { valor: "DEVUELTAS", texto: "Devueltas" },
  { valor: "TODAS", texto: "Todas" },
];
const MEDIOS: Opcion<string>[] = [
  { valor: "", texto: "Todos" },
  { valor: "MERCADOPAGO", texto: "Mercado Pago" },
  { valor: "STRIPE", texto: "Stripe" },
];
const FECHAS: Opcion<string>[] = [
  { valor: "", texto: "Siempre" },
  { valor: "hoy", texto: "Hoy" },
  { valor: "7", texto: "Últimos 7 días" },
  { valor: "30", texto: "Últimos 30 días" },
  { valor: "90", texto: "Últimos 90 días" },
];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function diaAtras(dias: number): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Cordoba" }).format(new Date(Date.now() - dias * 86_400_000));
}
function rangoDe(fecha: string): { desde?: string; hasta?: string } {
  if (fecha === "hoy") return { desde: diaAtras(0), hasta: diaAtras(0) };
  if (["7", "30", "90"].includes(fecha)) return { desde: diaAtras(Number(fecha) - 1) };
  return {};
}

const iniciales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "·";
const primerNombre = (n: string) => n.trim().split(/\s+/)[0] ?? "";
const espera = (o: { status: EstadoOrden; refunded_at: string | null }) => o.status === "PAID" && !o.refunded_at;
/** Pagada hace más de 24 h y todavía sin acceso. */
const demorada = (o: { status: EstadoOrden; refunded_at: string | null; paid_at: string | null }) =>
  espera(o) && !!o.paid_at && Date.now() - new Date(o.paid_at).getTime() > 86_400_000;

function Ordenes() {
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
    if (Object.keys(cambios).some((k) => !["pagina", "por", "ver", "accion"].includes(k))) nuevos.delete("pagina");
    for (const [k, val] of Object.entries(cambios) as [Clave, string][]) {
      if (val === POR_DEFECTO[k]) nuevos.delete(k);
      else nuevos.set(k, val);
    }
    const texto = nuevos.toString();
    return texto ? `${pathname}?${texto}` : pathname;
  }, [params, pathname]);
  // La dirección cambia sin pedirle nada al servidor (15-MEMORY 2026-11-25: router.replace se sentía «tildado»).
  const ir = useCallback((cambios: Partial<Record<Clave, string>>) => window.history.replaceState(null, "", enlace(cambios)), [enlace]);

  const [version, setVersion] = useState(0);
  // Las que esperan el acceso van de la más vieja a la más nueva (primero la que más espera); el resto, al revés.
  const orden = v.estado === "PAID" ? "viejas" : "nuevas";
  const claveLista = [v.estado, v.medio, v.curso, v.fecha, v.q, pagina, por, version].join("|");
  const lista = useDatos(
    () => panel.ordenes({ estado: v.estado, medio: v.medio, curso: v.curso, q: v.q, orden, ...rangoDe(v.fecha), page: pagina, page_size: por }),
    [claveLista],
  );
  const cifras = useDatos(() => panel.ordenCifras(), [version]);
  const cursos = useDatos(() => panel.cursos({ page_size: 100 }), []);
  const { aviso, avisar } = useAviso();

  const filas = lista.estado.tipo === "listo" ? lista.estado.datos.results : [];
  const total = lista.estado.tipo === "listo" ? lista.estado.datos.count : 0;
  const hayFiltros = v.medio !== "" || v.curso !== "" || v.fecha !== "" || v.q !== "" || v.estado !== "PAID";
  const opcionesCurso: Opcion<string>[] = [
    { valor: "", texto: "Todos" },
    ...(cursos.estado.tipo === "listo" ? cursos.estado.datos.results.map((c) => ({ valor: String(c.id), texto: `${c.code} · ${c.title}` })) : []),
  ];

  /** Después de dar acceso: la fila se pliega si deja de entrar en el filtro, y todo se vuelve a pedir. */
  const cumplida = useCallback(async (o: OrdenDetalle) => {
    if (v.estado === "PAID" && !prefersReducedMotion()) {
      await gsap.to(`[data-fila="${o.public_id}"]`, { opacity: 0, x: 18, duration: 0.22, ease: "power2.in" });
    }
    setVersion((n) => n + 1);
    avisarContadores();
    avisar(`#${o.numero} de ${o.buyer_name}: cumplida.`);
  }, [avisar, v.estado]);

  const idx = filas.findIndex((f) => f.public_id === v.ver);
  const [mostrada, setMostrada] = useState(v.ver);
  if (v.ver && v.ver !== mostrada) setMostrada(v.ver);
  const cerrarFicha = useCallback(() => ir({ ver: "", accion: "" }), [ir]);
  const alSalir = useCallback(() => {
    const id = mostrada;
    setMostrada("");
    [...document.querySelectorAll<HTMLElement>(`[data-abrir="${id}"]`)].find((b) => b.offsetParent !== null)?.focus();
  }, [mostrada]);
  const filaDe = useCallback((id: string) => () => {
    const el = [...document.querySelectorAll<HTMLElement>(`[data-fila="${id}"]`)].find((f) => f.offsetParent !== null);
    return el?.getBoundingClientRect() ?? null;
  }, []);

  const columnas: Columna<OrdenFila>[] = [
    { titulo: "Comprador", celda: (o) => <Comprador o={o} />, ancho: "w-[30%]" },
    {
      titulo: "Orden", ocultar: "hidden md:table-cell", centro: true,
      celda: (o) => (
        <span className="block whitespace-nowrap">
          <span className="block font-mono text-sm font-semibold text-ink-900">#{o.numero}</span>
          <span className="block text-xs tabular-nums text-neutral-700">{fechaHora(o.created_at)}</span>
        </span>
      ),
    },
    {
      titulo: "Total", centro: true,
      celda: (o) => (
        <span className="block whitespace-nowrap">
          <span className={`block font-sub text-sm font-semibold tabular-nums ${o.refunded_at ? "text-neutral-500 line-through" : "text-ink-900"}`}>{plata(o.total, o.currency)}</span>
          <span className="block text-xs text-neutral-700">{MEDIO_DE_PAGO[o.payment_method] ?? o.payment_method}</span>
        </span>
      ),
    },
    { titulo: "Estado", celda: (o) => <EstadoFila o={o} />, centro: true, ocultar: "hidden lg:table-cell" },
    {
      titulo: "Acciones", centro: true,
      celda: (o) => espera(o)
        ? <BotonAccion icono="llave" variante="marca" onClick={() => ir({ ver: o.public_id, accion: "acceso" })} etiqueta={`Dar acceso a ${o.buyer_name}`}>Dar acceso</BotonAccion>
        : <BotonAccion icono="sobre" onClick={() => ir({ ver: o.public_id, accion: "escribir" })} etiqueta={`Escribirle a ${o.buyer_name}`}>Escribirle</BotonAccion>,
    },
  ];

  const pastillas: ReactNode[] = [];
  if (v.estado !== "PAID") pastillas.push(<Pastilla key="e" texto={`Estado: ${ESTADOS.find((o) => o.valor === v.estado)?.texto ?? v.estado}`} onQuitar={() => ir({ estado: "PAID" })} />);
  if (v.medio) pastillas.push(<Pastilla key="m" texto={`Medio: ${MEDIO_DE_PAGO[v.medio] ?? v.medio}`} onQuitar={() => ir({ medio: "" })} />);
  if (v.curso) pastillas.push(<Pastilla key="c" texto={`Curso: ${opcionesCurso.find((o) => o.valor === v.curso)?.texto.split(" · ")[0] ?? v.curso}`} onQuitar={() => ir({ curso: "" })} />);
  if (v.fecha) pastillas.push(<Pastilla key="f" texto={FECHAS.find((o) => o.valor === v.fecha)?.texto ?? v.fecha} onQuitar={() => ir({ fecha: "" })} />);
  if (v.q) pastillas.push(<Pastilla key="q" texto={`«${v.q}»`} onQuitar={() => ir({ q: "" })} />);
  const limpiar = () => ir({ estado: "PAID", medio: "", curso: "", fecha: "", q: "" });

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 lg:h-[calc(100dvh-4rem)]">
      <Banda sobre="Atender" titulo="Órdenes"
        contador={cifras.estado.tipo === "listo" ? `${numero(cifras.estado.datos.falta_acceso)} para dar acceso` : undefined}
        derecha={<Cobrado estado={cifras.estado} />}>
        <Cifras estado={cifras.estado} v={v} enlace={enlace} />
      </Banda>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <BarraFiltros pastillas={pastillas.length ? <>{pastillas}<Limpiar onLimpiar={limpiar} /></> : undefined}>
          <Buscador etiqueta="Buscar por nombre o número" valor={v.q} onCambiar={(q) => ir({ q })} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
            <Menu etiqueta="Estado" valor={v.estado} opciones={ESTADOS} porDefecto="PAID" onCambiar={(estado) => ir({ estado })} />
            <Menu etiqueta="Medio" valor={v.medio} opciones={MEDIOS} porDefecto="" onCambiar={(medio) => ir({ medio })} />
            <Menu etiqueta="Curso" valor={v.curso} opciones={opcionesCurso} porDefecto="" onCambiar={(curso) => ir({ curso })} />
            <Menu etiqueta="Fecha" valor={v.fecha} opciones={FECHAS} porDefecto="" onCambiar={(fecha) => ir({ fecha })} />
          </div>
        </BarraFiltros>

        {lista.estado.tipo !== "listo" && lista.estado.tipo !== "cargando" ? (
          <div className="min-h-0 flex-1 overflow-auto rounded-[18px] border border-ink-100 bg-neutral-0 p-4">
            <EstadoNoListo estado={lista.estado} recargar={lista.recargar} />
          </div>
        ) : (
          <Tabla etiqueta="Órdenes" filas={filas} columnas={columnas} clave={(o) => o.public_id} activa={v.ver || null}
            alAbrir={(o) => ir({ ver: o.public_id, accion: "" })} movil={(o) => <FilaMovil o={o} />} cargando={lista.estado.tipo === "cargando"}
            vacio={hayFiltros
              ? <Vacia titulo="No hay órdenes con estos filtros." texto="Probá con otro estado, otro medio u otra fecha." accion={<Limpiar onLimpiar={limpiar} />} />
              : <Vacia titulo="Todo al día." texto="No queda ninguna orden pagada esperando el acceso." />}
            pie={total > 0 ? <Paginacion total={total} pagina={pagina} porPagina={por} onPagina={(n) => ir({ pagina: String(n) })} onPorPagina={(n) => ir({ por: String(n), pagina: "1" })} /> : undefined} />
        )}
      </div>

      {mostrada && (
        <FichaOrden id={mostrada} abierta={!!v.ver} fila={filas.find((f) => f.public_id === mostrada)} origen={filaDe(mostrada)} onSalida={alSalir}
          version={version} accion={v.accion} onCerrar={cerrarFicha} onCumplida={cumplida} avisar={avisar}
          posicion={idx >= 0 ? `${idx + 1} de ${filas.length}` : undefined}
          onAnterior={idx > 0 ? () => ir({ ver: filas[idx - 1]!.public_id, accion: "" }) : undefined}
          onSiguiente={idx >= 0 && idx < filas.length - 1 ? () => ir({ ver: filas[idx + 1]!.public_id, accion: "" }) : undefined} />
      )}
      {aviso}
    </div>
  );
}

// --- La banda --------------------------------------------------------------------------------------------

function Cifras({ estado, v, enlace }: { estado: EstadoDatos<OrdenCifras>; v: typeof POR_DEFECTO; enlace: (c: Partial<Record<Clave, string>>) => string }) {
  if (estado.tipo !== "listo") {
    return <>{[0, 1, 2, 3].map((k) => <span key={k} aria-hidden className="h-16 rounded-[16px] bg-neutral-0/[0.06] ring-1 ring-neutral-0/10" />)}</>;
  }
  const d = estado.datos;
  const base = { pagina: "1", ver: "", accion: "", medio: "", curso: "" };
  const sinOtros = !v.medio && !v.curso;
  const elegida = (e: string) => sinOtros && v.estado === e;
  return (
    <>
      <CifraFiltro href={enlace({ ...base, estado: "PAID" })} icono="llave" nombre="Falta dar acceso" detalle="Pagaron y esperan el aula" valor={d.falta_acceso} elegida={elegida("PAID")}
        aviso={d.demoradas ? `${numero(d.demoradas)} hace más de 24 h` : undefined} />
      <CifraFiltro href={enlace({ ...base, estado: "SIN_COMPLETAR" })} icono="espera" nombre="Sin completar" detalle="No terminaron de pagar" valor={d.sin_completar} elegida={elegida("SIN_COMPLETAR")} />
      <CifraFiltro href={enlace({ ...base, estado: "FULFILLED" })} icono="inscripciones" nombre="Cumplidas" detalle="Ya tienen el acceso" valor={d.cumplidas} elegida={elegida("FULFILLED")} />
      <CifraFiltro href={enlace({ ...base, estado: "DEVUELTAS" })} icono="moneda" nombre="Devueltas" detalle="La plata volvió al comprador" valor={d.devueltas} elegida={elegida("DEVUELTAS")} />
    </>
  );
}

/** Lo cobrado en el mes, una línea por moneda: nunca se suman pesos con dólares. */
function Cobrado({ estado }: { estado: EstadoDatos<OrdenCifras> }) {
  if (estado.tipo !== "listo") return <span aria-hidden className="block h-11 w-56 rounded-[14px] bg-neutral-0/[0.06]" />;
  const filas = estado.datos.cobrado_mes;
  const mes = MESES[Number(new Intl.DateTimeFormat("en", { timeZone: "America/Argentina/Cordoba", month: "numeric" }).format(new Date())) - 1];
  return (
    <div className="flex flex-col gap-0.5 rounded-[14px] bg-neutral-0/[0.06] px-4 py-2 ring-1 ring-neutral-0/10 lg:items-end lg:text-right">
      <span className="font-sub text-[11px] font-semibold uppercase tracking-wider text-neutral-0/70">Cobrado en {mes}</span>
      <span className="flex flex-wrap items-baseline gap-x-3 font-sub text-lg font-bold tabular-nums lg:justify-end">
        {filas.length ? filas.map((f) => <span key={f.moneda}>{plata(f.suma, f.moneda)}</span>) : <span>{plata("0")}</span>}
      </span>
    </div>
  );
}

// --- Las celdas -------------------------------------------------------------------------------------------

function Comprador({ o }: { o: OrdenFila }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span aria-hidden className={`inline-grid h-9 w-9 shrink-0 place-items-center rounded-full font-sub text-xs font-semibold ${demorada(o) ? "bg-brand-500 text-neutral-0" : "bg-ink-50 text-ink-900 ring-1 ring-ink-100"}`}>
        {iniciales(o.buyer_name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink-900">{o.buyer_name}</span>
        <span className="block truncate text-xs text-neutral-700" title={o.cursos.join(" · ")}>{o.cursos.join(" · ") || "Sin cursos"}</span>
      </span>
    </span>
  );
}

function EstadoFila({ o }: { o: OrdenFila }) {
  if (o.refunded_at) return <ChipPunto texto="Devuelta" tono="peligro" />;
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <ChipPunto texto={ESTADO[o.status].texto} tono={ESTADO[o.status].tono} />
      {espera(o) && o.paid_at && <span className={`whitespace-nowrap font-sub text-xs font-semibold ${demorada(o) ? "text-status-error" : "text-brand-600"}`}>Pagó {hace(o.paid_at)}</span>}
    </span>
  );
}

function FilaMovil({ o }: { o: OrdenFila }) {
  return (
    <span className="flex flex-col gap-1.5">
      <Comprador o={o} />
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-12 text-xs text-neutral-700">
        {o.refunded_at ? <ChipPunto texto="Devuelta" tono="peligro" /> : <ChipPunto texto={ESTADO[o.status].texto} tono={ESTADO[o.status].tono} />}
        <span className="font-sub text-sm font-semibold text-ink-900">{plata(o.total, o.currency)}</span>
      </span>
      <span className="pl-12 text-xs text-neutral-700">
        <span className="font-mono">#{o.numero}</span> · {MEDIO_DE_PAGO[o.payment_method] ?? o.payment_method} · {hace(o.paid_at ?? o.created_at)}
      </span>
    </span>
  );
}

// --- La tarjeta de la orden ---------------------------------------------------------------------------------

interface FichaOrdenProps {
  id: string;
  abierta: boolean;
  fila?: OrdenFila;
  origen: () => DOMRect | null;
  onSalida: () => void;
  version: number;
  /** «acceso» o «escribir»: la tarjeta abre con esa parte a mano. */
  accion: string;
  posicion?: string;
  onCerrar: () => void;
  onAnterior?: () => void;
  onSiguiente?: () => void;
  onCumplida: (o: OrdenDetalle) => Promise<void>;
  avisar: (texto: string) => void;
}

function FichaOrden({ id, abierta, fila, origen, onSalida, version, accion, posicion, onCerrar, onAnterior, onSiguiente, onCumplida, avisar }: FichaOrdenProps) {
  const { estado, recargar, setEstado } = useDatos(() => panel.orden(id), [id, version]);
  const cuerpo = useRef<HTMLDivElement>(null);
  const o = estado.tipo === "listo" && estado.datos.public_id === id ? estado.datos : null;
  const cabeza = o ?? fila ?? null;

  useLayoutEffect(() => {
    const partes = cuerpo.current?.querySelectorAll<HTMLElement>("[data-entra]");
    if (!o || !partes?.length || prefersReducedMotion()) return;
    gsap.fromTo(partes, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power3.out", clearProps: "opacity,transform" });
  }, [o?.public_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const pie = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs text-neutral-700">{posicion ? `Orden ${posicion} de esta página` : " "}</span>
      {cabeza && <span className="font-mono text-xs text-neutral-700">#{cabeza.numero}</span>}
    </div>
  );

  return (
    <Ficha abierta={abierta} origen={origen} onSalida={onSalida} sobre="Orden" posicion={posicion} onCerrar={onCerrar} onAnterior={onAnterior} onSiguiente={onSiguiente} pie={pie}
      titulo={cabeza ? cabeza.buyer_name : "Orden"}
      chips={cabeza && (
        <>
          {cabeza.refunded_at
            ? <ChipOscuro punto="bg-status-error">Devuelta</ChipOscuro>
            : <ChipOscuro punto={cabeza.status === "PAID" ? "bg-brand-500" : cabeza.status === "FULFILLED" ? "bg-status-success" : cabeza.status === "FAILED" ? "bg-status-error" : "bg-status-warning"}>{ESTADO[cabeza.status].texto}</ChipOscuro>}
          <ChipOscuro>{plata(cabeza.total, cabeza.currency)}</ChipOscuro>
          <ChipOscuro>{MEDIO_DE_PAGO[cabeza.payment_method] ?? cabeza.payment_method}</ChipOscuro>
          <ChipOscuro>{cabeza.paid_at ? `Pagó ${hace(cabeza.paid_at)}` : `Creada ${hace(cabeza.created_at)}`}</ChipOscuro>
        </>
      )}>
      <div ref={cuerpo}>
        {!o && (estado.tipo === "cargando" || estado.tipo === "listo") ? (
          <div aria-busy="true" className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <span className="h-64 rounded-[16px] bg-ink-50" />
            <span className="h-64 rounded-[16px] bg-ink-50" />
          </div>
        ) : !o ? (
          <EstadoNoListo estado={estado} recargar={recargar} noEncontrado={{ texto: "No encontramos esa orden.", volver: <button type="button" onClick={onCerrar} className="text-sm font-semibold text-brand-600 underline">Volver a la lista</button> }} />
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-3">
              {o.refunded_at && (
                <p data-entra className="rounded-[14px] border border-status-error/35 bg-status-error/10 px-4 py-3 text-sm text-status-error">
                  <b>Devuelta el {fechaHora(o.refunded_at)}.</b> {MEDIO_DE_PAGO[o.payment_method] ?? o.payment_method} avisó que la plata volvió al comprador.
                  {o.status === "FULFILLED" ? " Ya tenía el acceso: revisá si hay que darlo de baja en el aula." : " No le des el acceso."}
                </p>
              )}
              <Cursos o={o} />
              <CompradorFicha o={o} avisar={avisar} />
              <Pago o={o} />
              <HistorialOrden eventos={o.historial} />
            </div>
            <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-0">
              {espera(o) && <DarAcceso key={o.public_id} o={o} enfocar={accion === "acceso"} onHecho={async (nueva) => { setEstado({ tipo: "listo", datos: nueva }); await onCumplida(nueva); }} />}
              {o.status === "FULFILLED" && !o.refunded_at && (
                <p data-entra className="flex items-center gap-3 rounded-[16px] border border-status-success/35 bg-status-success/10 px-4 py-3 text-sm text-ink-900">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-status-success/20"><Ic nombre="tilde" /></span>
                  <span><b>Acceso dado</b> el {fechaHora(o.fulfilled_at)}.</span>
                </p>
              )}
              <Escribirle key={`e-${o.public_id}`} o={o} enfocar={accion === "escribir"} />
              <Notas key={`n-${o.public_id}`} o={o} onGuardada={(nueva) => { setEstado({ tipo: "listo", datos: nueva }); avisar("Nota guardada."); }} />
            </div>
          </div>
        )}
      </div>
    </Ficha>
  );
}

function Cursos({ o }: { o: OrdenDetalle }) {
  return (
    <section data-entra aria-label="Cursos" className="rounded-[16px] border border-ink-200 bg-ink-50 p-4">
      <Rotulo>{o.items.length === 1 ? "Curso" : "Cursos"}</Rotulo>
      {o.items.length === 0 && <p className="mt-1 text-sm text-neutral-700">Esta orden no tiene cursos cargados.</p>}
      <ul className="mt-1 flex flex-col divide-y divide-ink-100">
        {o.items.map((i, n) => (
          <li key={n} className="flex flex-col gap-1.5 py-2.5 first:pt-1 last:pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="min-w-0 font-display text-base font-semibold text-ink-900">{i.title_snapshot}</p>
              <p className="font-sub text-sm font-semibold tabular-nums text-ink-900">{plata(i.total, o.currency)}</p>
            </div>
            <p className="text-xs text-neutral-700">
              {i.fecha ? `${fechaHora(i.fecha)} · ` : ""}{i.quantity} {i.quantity === 1 ? "lugar" : "lugares"} × {plata(i.unit_price, o.currency)}
            </p>
            {i.participantes.length > 0 && (
              <div className="mt-0.5 rounded-[12px] bg-neutral-0 p-2.5 ring-1 ring-ink-100">
                <p className="mb-1 font-sub text-[11px] font-semibold text-ink-500">Participantes</p>
                <ul className="flex flex-col gap-1">
                  {i.participantes.map((p, k) => (
                    <li key={k} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-semibold text-ink-900">{p.nombre || "Sin nombre"}</span>
                      {p.correo && <span className="text-neutral-700 [overflow-wrap:anywhere]">{p.correo}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
      <dl className="mt-3 flex flex-col gap-1 border-t border-ink-100 pt-3 text-sm">
        {o.discount_total !== "0.00" && (
          <div className="flex justify-between gap-3 text-neutral-700">
            <dt>Descuento{o.discount_label ? ` (${o.discount_label})` : ""}</dt>
            <dd className="tabular-nums">− {plata(o.discount_total, o.currency)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 font-semibold text-ink-900">
          <dt>Total</dt>
          <dd className={`tabular-nums ${o.refunded_at ? "line-through" : ""}`}>{plata(o.total, o.currency)}</dd>
        </div>
      </dl>
    </section>
  );
}

function CompradorFicha({ o, avisar }: { o: OrdenDetalle; avisar: (t: string) => void }) {
  const [dni, setDni] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [viendo, setViendo] = useState(false);
  const errorDeAccion = useErrorDeAccion();
  useEffect(() => setDni(null), [o.public_id]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(o.buyer_email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sin permiso para copiar: el correo queda a la vista */
    }
  };
  const verDni = async () => {
    setViendo(true);
    try {
      setDni((await panel.verDni(o.public_id)).dni);
      avisar("Queda registrado que viste el DNI.");
    } catch (e) {
      const m = errorDeAccion(e);
      if (m) avisar(m);
    } finally {
      setViendo(false);
    }
  };
  const boton = "min-h-[36px] rounded-[10px] border border-ink-100 px-3 text-xs font-semibold text-ink-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 [@media(hover:hover)]:hover:border-ink-900";

  return (
    <div data-entra className="flex flex-col gap-3">
      <DatoFicha icono={<Ic nombre="sobre" tam={20} />} etiqueta="Correo del comprador"
        accion={<button type="button" onClick={() => void copiar()} className={boton}>{copiado ? "Copiado" : "Copiar"}</button>}>
        <span className="[overflow-wrap:anywhere]">{o.buyer_email}</span>
      </DatoFicha>
      <div className="grid gap-3 sm:grid-cols-2">
        {o.buyer_phone && <DatoFicha icono={<Ic nombre="whatsapp" tam={20} />} etiqueta="Teléfono">{o.buyer_phone}</DatoFicha>}
        {o.buyer_company && <DatoFicha icono={<Ic nombre="persona" tam={20} />} etiqueta="Laboratorio o empresa">{o.buyer_company}</DatoFicha>}
        {o.dni_enmascarado && (
          <DatoFicha icono={<Ic nombre="tarjeta" tam={20} />} etiqueta="DNI"
            accion={!dni ? <button type="button" disabled={viendo} onClick={() => void verDni()} className={boton}>{viendo ? "…" : "Mostrar"}</button> : undefined}>
            <span className="font-mono">{dni ?? o.dni_enmascarado}</span>
          </DatoFicha>
        )}
      </div>
    </div>
  );
}

function Pago({ o }: { o: OrdenDetalle }) {
  const stripe = o.payment_method === "STRIPE";
  const id = stripe ? o.stripe_payment_intent_id : o.mp_payment_id;
  const filas: [string, ReactNode][] = [
    ["Medio", MEDIO_DE_PAGO[o.payment_method] ?? o.payment_method],
    [stripe ? "Pago en Stripe" : "Pago en Mercado Pago", id ? <span className="font-mono [overflow-wrap:anywhere]">{id}</span> : "—"],
    ...(!stripe && o.mp_status ? [["Estado en Mercado Pago", o.mp_status] as [string, ReactNode]] : []),
    ["Creada", fechaHora(o.created_at)],
    ["Pagada", o.paid_at ? fechaHora(o.paid_at) : "—"],
    ...(o.fulfilled_at ? [["Cumplida", fechaHora(o.fulfilled_at)] as [string, ReactNode]] : []),
  ];
  return (
    <section data-entra aria-label="Pago" className="rounded-[16px] border border-ink-100 p-4">
      <Rotulo>Pago</Rotulo>
      <dl className="mt-1.5 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        {filas.map(([k, val]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-neutral-700">{k}</dt>
            <dd className="text-sm font-semibold text-ink-900">{val}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Dar acceso: Laura crea el usuario en el aula y después la marca. Pide confirmar porque no se deshace. */
function DarAcceso({ o, enfocar, onHecho }: { o: OrdenDetalle; enfocar: boolean; onHecho: (o: OrdenDetalle) => Promise<void> }) {
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const caja = useRef<HTMLElement>(null);
  const errorDeAccion = useErrorDeAccion();
  const lugares = o.items.reduce((a, i) => a + i.quantity, 0);

  useEffect(() => {
    if (!enfocar || !caja.current) return;
    caja.current.scrollIntoView({ block: "nearest" });
    caja.current.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, [enfocar]);

  const marcar = async () => {
    setOcupado(true);
    setError(null);
    try {
      await onHecho(await panel.marcarCumplida(o.public_id));
    } catch (e) {
      setError(errorDeAccion(e));
      setConfirmando(false);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section ref={caja} data-entra aria-labelledby="acceso-titulo" className="flex flex-col gap-3 rounded-[18px] border-2 border-ink-900 bg-neutral-0 p-4">
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brand-500 text-neutral-0"><Ic nombre="llave" tam={20} /></span>
        <div className="min-w-0">
          <h3 id="acceso-titulo" className="font-display text-lg font-semibold leading-tight text-ink-900">Dar acceso al aula</h3>
          <p className="text-xs text-neutral-700">{lugares === 1 ? "1 lugar" : `${lugares} lugares`} · pagó {o.paid_at ? hace(o.paid_at) : ""}</p>
        </div>
      </header>
      <ol className="flex flex-col gap-1.5 text-sm text-ink-900">
        <li className="flex gap-2"><span className="font-sub font-bold text-brand-600">1</span>Creá el usuario en el aula virtual para {lugares === 1 ? "la persona" : "cada participante"}.</li>
        <li className="flex gap-2"><span className="font-sub font-bold text-brand-600">2</span>Marcá la orden: pasa a cumplida y queda en el historial.</li>
      </ol>
      {error && <p role="alert" className="rounded-[10px] bg-status-error/10 px-3 py-2 text-sm text-status-error">{error}</p>}
      {confirmando ? (
        <div className="flex flex-col gap-2 rounded-[14px] bg-ink-900 p-3 text-neutral-0" role="alertdialog" aria-label="Confirmar el acceso">
          <p className="text-sm">¿Ya le diste el acceso? La orden pasa a cumplida y no se puede deshacer desde el panel.</p>
          <div className="flex flex-wrap gap-2">
            <BotonFicha onClick={() => void marcar()} deshabilitado={ocupado}>{ocupado ? "Marcando…" : "Sí, ya tiene el acceso"}</BotonFicha>
            <BotonFicha variante="claro" onClick={() => setConfirmando(false)} deshabilitado={ocupado}>Volver</BotonFicha>
          </div>
        </div>
      ) : (
        <BotonFicha onClick={() => setConfirmando(true)} icono="tilde">Ya le di el acceso</BotonFicha>
      )}
    </section>
  );
}

/** Escribirle al comprador desde el correo propio o por WhatsApp (Mateo: solo abrir, no enviar desde el panel). */
function Escribirle({ o, enfocar }: { o: OrdenDetalle; enfocar: boolean }) {
  const caja = useRef<HTMLElement>(null);
  const telefono = o.buyer_phone.replace(/\D/g, "");
  const curso = o.items[0]?.title_snapshot ?? "tu curso";
  const asunto = o.status === "PAID" || o.status === "FULFILLED" ? `Tu inscripción a ${curso}` : "Tu compra en ELEVAR";
  const cuerpo = `Hola ${primerNombre(o.buyer_name)},\n\n`;

  useEffect(() => {
    if (!enfocar || !caja.current) return;
    caja.current.scrollIntoView({ block: "nearest" });
    caja.current.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true });
  }, [enfocar]);

  return (
    <section ref={caja} data-entra aria-labelledby="escribir-titulo" className="flex flex-col gap-3 rounded-[16px] border border-ink-100 p-4">
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-ink-900 text-neutral-0"><Ic nombre="sobre" tam={20} /></span>
        <div className="min-w-0">
          <h3 id="escribir-titulo" className="font-display text-lg font-semibold leading-tight text-ink-900">Escribirle</h3>
          <p className="truncate text-xs text-neutral-700">Desde tu correo o por WhatsApp</p>
        </div>
      </header>
      <div className={`grid gap-2 ${telefono ? "sm:grid-cols-2" : ""}`}>
        <BotonFicha variante="contorno" href={`mailto:${o.buyer_email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`} icono="abrir">Abrir en mi correo</BotonFicha>
        {telefono && <BotonFicha variante="contorno" href={`https://wa.me/${telefono}?text=${encodeURIComponent(cuerpo)}`} externo icono="whatsapp">Mandar por WhatsApp</BotonFicha>}
      </div>
    </section>
  );
}

function Notas({ o, onGuardada }: { o: OrdenDetalle; onGuardada: (o: OrdenDetalle) => void }) {
  const [nota, setNota] = useState(o.admin_notes);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorDeAccion = useErrorDeAccion();
  const guardar = async () => {
    setOcupado(true);
    setError(null);
    try {
      onGuardada(await panel.guardarNota(o.public_id, nota));
    } catch (e) {
      setError(errorDeAccion(e));
    } finally {
      setOcupado(false);
    }
  };
  return (
    <section data-entra aria-labelledby="notas-titulo" className="flex flex-col gap-2 rounded-[16px] border border-ink-100 p-4">
      <label htmlFor={`nota-${o.public_id}`} id="notas-titulo" className="flex items-baseline justify-between font-sub text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        Notas internas <span className="font-normal normal-case tracking-normal text-neutral-500">Solo las ve ELEVAR</span>
      </label>
      <textarea id={`nota-${o.public_id}`} value={nota} onChange={(e) => setNota(e.target.value)} maxLength={5000} rows={3}
        className="min-h-[84px] resize-y rounded-[12px] border border-ink-100 bg-ink-50/60 p-3 text-base leading-relaxed text-ink-900 outline-none focus:border-ink-900 focus:bg-neutral-0 sm:text-sm" />
      {error && <p role="alert" className="rounded-[10px] bg-status-error/10 px-3 py-2 text-sm text-status-error">{error}</p>}
      <div className="flex justify-end">
        <BotonFicha variante="contorno" onClick={() => void guardar()} deshabilitado={ocupado || nota === o.admin_notes} icono="nota">{ocupado ? "Guardando…" : "Guardar nota"}</BotonFicha>
      </div>
    </section>
  );
}

const TEXTO_EVENTO: Record<string, string> = {
  "orden.cumplida": "Le dio el acceso: la orden pasó a cumplida",
  "orden.devuelta": "Se devolvió el pago",
  "orden.nota": "Cambió la nota interna",
  "orden.ver_dni": "Vio el DNI",
};

function HistorialOrden({ eventos }: { eventos: EventoHistorial[] }) {
  if (!eventos.length) return null;
  return (
    <section data-entra aria-label="Historial" className="rounded-[16px] border border-ink-100 p-4">
      <Rotulo>Historial</Rotulo>
      <ol className="mt-2 flex flex-col gap-2.5">
        {eventos.map((e, k) => (
          <li key={k} className="flex gap-3 text-sm">
            <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.accion === "orden.cumplida" ? "bg-status-success" : e.accion === "orden.devuelta" ? "bg-status-error" : "bg-ink-200"}`} />
            <div className="min-w-0 flex-1">
              <p className="text-ink-900">{TEXTO_EVENTO[e.accion] ?? e.accion}</p>
              <p className="text-xs text-neutral-700">{e.persona} · {fechaHora(e.fecha)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function OrdenesPage() {
  return (
    <Suspense>
      <Ordenes />
    </Suspense>
  );
}
