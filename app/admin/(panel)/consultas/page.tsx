"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EstadoNoListo, useErrorDeAccion, type EstadoDatos } from "@/components/admin/datos";
import { useDatosRecordados } from "@/components/admin/lista/memoria";
import { Barras, Filas, numero } from "@/components/admin/inicio/graficos";
import { Conclusion, Encabezado, Lienzo, SCROLL_FINO, SI_ALCANZA, Tarjeta, hace } from "@/components/admin/inicio/piezas";
import { Banda, CifraFiltro, Pestanas } from "@/components/admin/lista/Banda";
import { BarraFiltros, Buscador, Limpiar, Menu, Pastilla, type Opcion } from "@/components/admin/lista/BarraFiltros";
import { Icono } from "@/components/admin/iconos";
import { BotonAccion, BotonFicha, ChipOscuro, CuadroIcono, Ic } from "@/components/admin/lista/Botones";
import { DatoFicha, Ficha, useAviso } from "@/components/admin/lista/Ficha";
import { Paginacion, TAMANOS } from "@/components/admin/lista/Paginacion";
import { ChipPunto, Tabla, Vacia, type Columna } from "@/components/admin/lista/Tabla";
import { ApiError, panel } from "@/lib/admin/api";
import { ORIGEN_CONSULTA, fechaHora } from "@/lib/admin/formato";
import type { ConsultaCifras, ConsultaDetalle, ConsultaFila, EstadoConsulta, EventoHistorial } from "@/lib/admin/tipos";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { pegar } from "@/lib/texto";

/**
 * Consultas (2026-11-24), con la forma del portal CESS (Mateo: «mantené el diseño como el del portal… las
 * cards, los filtros, la paginación»): banda azul con cuatro cifras que filtran y las pestañas Lista · Cuándo
 * llegan; la barra de filtros; la tabla en su tarjeta con la paginación abajo; tocar una fila abre la tarjeta
 * de la consulta al centro (↑ ↓ recorren, Esc cierra). Todo queda en la dirección. En la computadora la
 * pantalla entra sin scroll: la tabla corre por dentro.
 *
 * Segunda pasada (2026-11-25, correcciones de Mateo): la tarjeta de la consulta a dos columnas, con
 * «Contestar» (enviar desde el panel, abrir en el correo o mandar por WhatsApp); acciones con texto; columnas
 * centradas como en el portal; de 10 en 10; «Cuándo llegan» con una frase, tres cifras y dos gráficos de barras.
 */

const POR_DEFECTO = { estado: "NEW", origen: "", fecha: "", q: "", orden: "nuevas", pagina: "1", por: "10", vista: "lista", consulta: "", contestar: "" };
type Clave = keyof typeof POR_DEFECTO;

const VISTAS = [
  { id: "lista", texto: "Lista" },
  { id: "cuando", texto: "Cuándo llegan" },
] as const;
type Vista = (typeof VISTAS)[number]["id"];

const ESTADO: Record<EstadoConsulta, { texto: string; tono: "nuevo" | "ok" | "neutro" }> = {
  NEW: { texto: "Sin contestar", tono: "nuevo" },
  CONTACTED: { texto: "Contactada", tono: "ok" },
  CLOSED: { texto: "Cerrada", tono: "neutro" },
};
const ESTADOS: Opcion<string>[] = [
  { valor: "NEW", texto: "Sin contestar" },
  { valor: "CONTACTED", texto: "Contactadas" },
  { valor: "CLOSED", texto: "Cerradas" },
  { valor: "TODAS", texto: "Todas" },
];
const ORIGENES: Opcion<string>[] = [
  { valor: "", texto: "Todos" },
  { valor: "CONTACTO", texto: "Formulario" },
  { valor: "COMUNIDAD", texto: "Comunidad de WhatsApp" },
  { valor: "WEBINAR", texto: "Webinar" },
  { valor: "ARREPENTIMIENTO", texto: "Arrepentimiento" },
];
const FECHAS: Opcion<string>[] = [
  { valor: "", texto: "Siempre" },
  { valor: "hoy", texto: "Hoy" },
  { valor: "7", texto: "Últimos 7 días" },
  { valor: "30", texto: "Últimos 30 días" },
  { valor: "90", texto: "Últimos 90 días" },
];
const ORDENES: Opcion<string>[] = [
  { valor: "nuevas", texto: "Más nuevas" },
  { valor: "viejas", texto: "Más viejas" },
];

/** Un día de Argentina, `dias` atrás, como AAAA-MM-DD. */
function diaAtras(dias: number): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Argentina/Cordoba" }).format(new Date(Date.now() - dias * 86_400_000));
}
function rangoDe(fecha: string): { desde?: string; hasta?: string } {
  if (fecha === "hoy") return { desde: diaAtras(0), hasta: diaAtras(0) };
  if (["7", "30", "90"].includes(fecha)) return { desde: diaAtras(Number(fecha) - 1) };
  return {};
}

/** Lo que falta para contestar un arrepentimiento, o cuánto hace que venció. */
function plazo(vence: string, ahora = Date.now()): { texto: string; vencido: boolean } {
  const ms = new Date(vence).getTime() - ahora;
  if (ms <= 0) return { texto: `Venció ${hace(vence, ahora)}`, vencido: true };
  const h = ms / 3_600_000;
  return { texto: h < 1 ? "Queda menos de 1 h" : `Quedan ${Math.floor(h)} h`, vencido: false };
}

const iniciales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "·";
const primerNombre = (n: string) => n.trim().split(/\s+/)[0] ?? "";

function Consultas() {
  const params = useSearchParams();
  const pathname = usePathname();
  const v = useMemo(() => {
    const r = { ...POR_DEFECTO };
    for (const k of Object.keys(POR_DEFECTO) as Clave[]) r[k] = params.get(k) ?? POR_DEFECTO[k];
    return r;
  }, [params]);
  const pagina = Math.max(1, Number.parseInt(v.pagina, 10) || 1);
  const por = (TAMANOS as readonly number[]).includes(Number(v.por)) ? Number(v.por) : 10;
  const vista: Vista = v.vista === "cuando" ? "cuando" : "lista";

  /** La dirección con estos cambios; los valores por defecto no se escriben. Cambiar un filtro vuelve a la página 1. */
  const enlace = useCallback((cambios: Partial<Record<Clave, string>>) => {
    const nuevos = new URLSearchParams(params.toString());
    const filtra = Object.keys(cambios).some((k) => !["pagina", "por", "consulta", "vista", "contestar"].includes(k));
    if (filtra) nuevos.delete("pagina");
    for (const [k, val] of Object.entries(cambios) as [Clave, string][]) {
      if (val === POR_DEFECTO[k]) nuevos.delete(k);
      else nuevos.set(k, val);
    }
    const texto = nuevos.toString();
    return texto ? `${pathname}?${texto}` : pathname;
  }, [params, pathname]);
  // Cambia la dirección al instante, sin pedirle nada al servidor (2026-11-25: con router.replace cada clic
  // esperaba un pedido al servidor antes de abrir la tarjeta y se sentía «tildado»). Next lee el cambio.
  const ir = useCallback((cambios: Partial<Record<Clave, string>>) => window.history.replaceState(null, "", enlace(cambios)), [enlace]);

  // Cambia después de marcar o contestar una consulta: vuelve a pedir la lista, las cifras y la tarjeta.
  const [version, setVersion] = useState(0);
  const claveLista = [v.estado, v.origen, v.fecha, v.q, v.orden, pagina, por, version].join("|");
  const lista = useDatosRecordados(
    () => panel.consultas({ estado: v.estado, origen: v.origen, q: v.q, orden: v.orden, ...rangoDe(v.fecha), page: pagina, page_size: por }),
    [claveLista],
  );
  const cifras = useDatosRecordados(() => panel.consultaCifras(), [version]);
  const { aviso, avisar } = useAviso();
  const errorDeAccion = useErrorDeAccion();

  const filas = lista.estado.tipo === "listo" ? lista.estado.datos.results : [];
  const total = lista.estado.tipo === "listo" ? lista.estado.datos.count : 0;
  const hayFiltros = v.origen !== "" || v.fecha !== "" || v.q !== "" || v.estado !== "NEW";

  /** Marca la consulta; si deja de entrar en el filtro, su fila se pliega antes de recargar. Con «Deshacer». */
  const cambiar = useCallback(async (c: { id: number; name: string; status: EstadoConsulta }, nuevo: EstadoConsulta) => {
    const antes = c.status;
    try {
      await panel.cambiarEstadoConsulta(c.id, nuevo);
      if (v.estado !== "TODAS" && nuevo !== v.estado && !prefersReducedMotion()) {
        await gsap.to(`[data-fila="${c.id}"]`, { opacity: 0, x: 18, duration: 0.22, ease: "power2.in" });
      }
      setVersion((n) => n + 1);
      avisar(`${c.name}: ${ESTADO[nuevo].texto.toLowerCase()}.`, async () => {
        try {
          await panel.cambiarEstadoConsulta(c.id, antes);
          setVersion((n) => n + 1);
          avisar(`${c.name} volvió a ${ESTADO[antes].texto.toLowerCase()}.`);
        } catch (e) {
          const m = errorDeAccion(e);
          if (m) avisar(m);
        }
      });
    } catch (e) {
      const m = errorDeAccion(e);
      if (m) avisar(m);
    }
  }, [avisar, errorDeAccion, v.estado]);

  // La tarjeta abierta (?consulta=) y su lugar en la página, para recorrer con ↑ ↓.
  const idx = filas.findIndex((f) => String(f.id) === v.consulta);
  // La que se ve: la de la dirección, o la que se está cerrando (sigue montada hasta volver a su fila).
  const [mostrada, setMostrada] = useState(v.consulta);
  if (v.consulta && v.consulta !== mostrada) setMostrada(v.consulta);
  const cerrarFicha = useCallback(() => ir({ consulta: "", contestar: "" }), [ir]);
  const alSalir = useCallback(() => {
    const id = mostrada;
    setMostrada("");
    [...document.querySelectorAll<HTMLElement>(`[data-abrir="${id}"]`)].find((b) => b.offsetParent !== null)?.focus();
  }, [mostrada]);
  /** El rectángulo de la fila de esa consulta (la de la tabla o la del celular, la que se vea). */
  const filaDe = useCallback((id: string) => () => {
    const el = [...document.querySelectorAll<HTMLElement>(`[data-fila="${id}"]`)].find((f) => f.offsetParent !== null);
    return el?.getBoundingClientRect() ?? null;
  }, []);

  const columnas: Columna<ConsultaFila>[] = [
    { titulo: "Persona", celda: (c) => <Persona c={c} />, ancho: "w-[32%]" },
    { titulo: "Origen", celda: (c) => <Origen c={c} />, ocultar: "hidden md:table-cell", centro: true },
    {
      titulo: "Recibida", ocultar: "hidden lg:table-cell", centro: true,
      celda: (c) => (
        <span className="block whitespace-nowrap">
          <span className="block font-sub text-sm font-semibold text-ink-900">{hace(c.created_at)}</span>
          <span className="block text-xs tabular-nums text-neutral-700">{fechaHora(c.created_at)}</span>
        </span>
      ),
    },
    { titulo: "Estado", celda: (c) => <EstadoFila c={c} />, centro: true },
    {
      titulo: "Acciones", centro: true,
      celda: (c) => (
        <span className="inline-flex items-center justify-center gap-2">
          <BotonAccion icono="sobre" onClick={() => ir({ consulta: String(c.id), contestar: "1" })} etiqueta={`Contestar a ${c.name}`}>Contestar</BotonAccion>
          {c.status === "NEW" && (
            <BotonAccion icono="tilde" variante="suave" onClick={() => void cambiar(c, "CONTACTED")} etiqueta={`Marcar contactada a ${c.name}`}>Contactada</BotonAccion>
          )}
        </span>
      ),
    },
  ];

  const pastillas: ReactNode[] = [];
  if (v.estado !== "NEW") pastillas.push(<Pastilla key="e" texto={`Estado: ${ESTADOS.find((o) => o.valor === v.estado)?.texto ?? v.estado}`} onQuitar={() => ir({ estado: "NEW" })} />);
  if (v.origen) pastillas.push(<Pastilla key="o" texto={`Origen: ${ORIGEN_CONSULTA[v.origen] ?? v.origen}`} onQuitar={() => ir({ origen: "" })} />);
  if (v.fecha) pastillas.push(<Pastilla key="f" texto={FECHAS.find((o) => o.valor === v.fecha)?.texto ?? v.fecha} onQuitar={() => ir({ fecha: "" })} />);
  if (v.q) pastillas.push(<Pastilla key="q" texto={`«${v.q}»`} onQuitar={() => ir({ q: "" })} />);
  const limpiar = () => ir({ estado: "NEW", origen: "", fecha: "", q: "" });

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 lg:h-[calc(100dvh-4rem)]">
      <Banda sobre="Atender" titulo="Consultas"
        contador={cifras.estado.tipo === "listo" ? `${numero(cifras.estado.datos.sin_contestar)} sin contestar` : undefined}
        derecha={<Pestanas etiqueta="Vistas de consultas" vistas={VISTAS} vista={vista} elegir={(x) => ir({ vista: x })} />}>
        <Cifras estado={cifras.estado} v={v} enlace={enlace} />
      </Banda>

      {vista === "lista" ? (
        <div id="vista-lista" role="tabpanel" aria-labelledby="pestana-lista" className="flex min-h-0 flex-1 flex-col gap-3">
          <BarraFiltros pastillas={pastillas.length ? <>{pastillas}<Limpiar onLimpiar={limpiar} /></> : undefined}>
            <Buscador etiqueta="Buscar por nombre o empresa" valor={v.q} onCambiar={(q) => ir({ q })} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
              <Menu etiqueta="Estado" valor={v.estado} opciones={ESTADOS} porDefecto="NEW" onCambiar={(estado) => ir({ estado })} />
              <Menu etiqueta="Origen" valor={v.origen} opciones={ORIGENES} porDefecto="" onCambiar={(origen) => ir({ origen })} />
              <Menu etiqueta="Fecha" valor={v.fecha} opciones={FECHAS} porDefecto="" onCambiar={(fecha) => ir({ fecha })} />
              <Menu etiqueta="Ordenar" valor={v.orden} opciones={ORDENES} onCambiar={(orden) => ir({ orden })} />
            </div>
          </BarraFiltros>

          {lista.estado.tipo !== "listo" && lista.estado.tipo !== "cargando" ? (
            <div className="min-h-0 flex-1 overflow-auto rounded-[18px] border border-ink-100 bg-neutral-0 p-4">
              <EstadoNoListo estado={lista.estado} recargar={lista.recargar} />
            </div>
          ) : (
            <Tabla etiqueta="Consultas" filas={filas} columnas={columnas} clave={(c) => c.id} activa={v.consulta ? Number(v.consulta) : null}
              alAbrir={(c) => ir({ consulta: String(c.id), contestar: "" })} movil={(c) => <FilaMovil c={c} />} cargando={lista.estado.tipo === "cargando"}
              vacio={hayFiltros
                ? <Vacia titulo="No hay consultas con estos filtros." texto="Probá con otro estado u otra fecha." accion={<Limpiar onLimpiar={limpiar} />} />
                : <Vacia titulo="Todo al día." texto="No queda ninguna consulta sin contestar." />}
              pie={total > 0 ? <Paginacion total={total} pagina={pagina} porPagina={por} onPagina={(n) => ir({ pagina: String(n) })} onPorPagina={(n) => ir({ por: String(n), pagina: "1" })} /> : undefined} />
          )}
        </div>
      ) : (
        <div id="vista-cuando" role="tabpanel" aria-labelledby="pestana-cuando" className="flex min-h-0 flex-1 flex-col gap-3">
          <CuandoLlegan estado={cifras.estado} recargar={cifras.recargar} />
        </div>
      )}

      {mostrada && (
        <FichaConsulta id={mostrada} abierta={!!v.consulta} fila={filas.find((f) => String(f.id) === mostrada)} origen={filaDe(mostrada)} onSalida={alSalir}
          version={version} contestar={v.contestar === "1"} onCerrar={cerrarFicha} onCambiar={cambiar}
          onEnviada={(texto) => { setVersion((n) => n + 1); avisar(texto); }}
          posicion={idx >= 0 ? `${idx + 1} de ${filas.length}` : undefined}
          onAnterior={idx > 0 ? () => ir({ consulta: String(filas[idx - 1]!.id), contestar: "" }) : undefined}
          onSiguiente={idx >= 0 && idx < filas.length - 1 ? () => ir({ consulta: String(filas[idx + 1]!.id), contestar: "" }) : undefined} />
      )}
      {aviso}
    </div>
  );
}

// --- La banda: las cuatro cifras que filtran ---------------------------------------------------------

function Cifras({ estado, v, enlace }: { estado: EstadoDatos<ConsultaCifras>; v: typeof POR_DEFECTO; enlace: (c: Partial<Record<Clave, string>>) => string }) {
  if (estado.tipo !== "listo") {
    return <>{[0, 1, 2, 3].map((k) => <span key={k} aria-hidden className="h-16 rounded-[16px] bg-neutral-0/[0.06] ring-1 ring-neutral-0/10" />)}</>;
  }
  const d = estado.datos;
  const base = { pagina: "1", consulta: "", vista: "lista" };
  const elegida = v.estado === "NEW" && v.origen === "ARREPENTIMIENTO" ? "arr" : v.estado === "NEW" && !v.origen ? "sin" : v.estado === "CONTACTED" && !v.origen ? "con" : v.estado === "CLOSED" && !v.origen ? "cer" : "";
  return (
    <>
      <CifraFiltro href={enlace({ ...base, estado: "NEW", origen: "" })} icono="espera" nombre="Sin contestar" detalle="Esperan respuesta" valor={d.sin_contestar} elegida={elegida === "sin"} />
      <CifraFiltro href={enlace({ ...base, estado: "NEW", origen: "ARREPENTIMIENTO" })} icono="reloj" nombre="Arrepentimiento" detalle="Plazo de 24 h" valor={d.arrepentimiento} elegida={elegida === "arr"}
        aviso={d.vencidos ? `${numero(d.vencidos)} ${d.vencidos === 1 ? "vencido" : "vencidos"}` : undefined} />
      <CifraFiltro href={enlace({ ...base, estado: "CONTACTED", origen: "" })} icono="responder" nombre="Contactadas" detalle="Ya les escribiste" valor={d.contactadas} elegida={elegida === "con"} />
      <CifraFiltro href={enlace({ ...base, estado: "CLOSED", origen: "" })} icono="auditoria" nombre="Cerradas" detalle="Terminadas" valor={d.cerradas} elegida={elegida === "cer"} />
    </>
  );
}

// --- Las celdas ---------------------------------------------------------------------------------------

function Persona({ c }: { c: ConsultaFila }) {
  const arr = c.source === "ARREPENTIMIENTO";
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span aria-hidden className={`inline-grid h-9 w-9 shrink-0 place-items-center rounded-full font-sub text-xs font-semibold ${arr && c.status === "NEW" ? "bg-brand-500 text-neutral-0" : "bg-ink-50 text-ink-900 ring-1 ring-ink-100"}`}>
        {iniciales(c.name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink-900">{c.name}</span>
        <span className="block truncate text-xs text-neutral-700">{c.company || "Sin empresa"}</span>
      </span>
    </span>
  );
}

function Origen({ c }: { c: ConsultaFila }) {
  const arr = c.source === "ARREPENTIMIENTO";
  return (
    <span className={`inline-flex min-h-[26px] items-center whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold ${arr ? "border-brand-200 bg-brand-50 text-brand-700" : "border-ink-100 bg-neutral-0 text-ink-900"}`}>
      {ORIGEN_CONSULTA[c.source] ?? c.source}
    </span>
  );
}

function EstadoFila({ c }: { c: ConsultaFila }) {
  const p = c.vence && c.status === "NEW" ? plazo(c.vence) : null;
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <ChipPunto texto={ESTADO[c.status].texto} tono={ESTADO[c.status].tono} />
      {p && <span className={`whitespace-nowrap font-sub text-xs font-semibold ${p.vencido ? "text-status-error" : "text-brand-600"}`}>{p.texto}</span>}
    </span>
  );
}

function FilaMovil({ c }: { c: ConsultaFila }) {
  const p = c.vence && c.status === "NEW" ? plazo(c.vence) : null;
  return (
    <span className="flex flex-col gap-1.5">
      <Persona c={c} />
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-12 text-xs text-neutral-700">
        <ChipPunto texto={ESTADO[c.status].texto} tono={ESTADO[c.status].tono} />
        <span>{ORIGEN_CONSULTA[c.source] ?? c.source}</span>
        <span aria-hidden>·</span>
        <span>{hace(c.created_at)}</span>
        {p && <span className={`font-semibold ${p.vencido ? "text-status-error" : "text-brand-600"}`}>· {p.texto}</span>}
      </span>
    </span>
  );
}

// --- La tarjeta de la consulta -------------------------------------------------------------------------

function FichaConsulta({ id, abierta, fila, origen, onSalida, version, contestar, posicion, onCerrar, onAnterior, onSiguiente, onCambiar, onEnviada }: FichaConsultaProps) {
  const { estado, recargar } = useDatosRecordados(() => panel.consulta(id), [id, version]);
  const cuerpo = useRef<HTMLDivElement>(null);
  const [guardando, setGuardando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [sucio, setSucio] = useState(false);
  const [pregunta, setPregunta] = useState<null | (() => void)>(null);
  // Lo que se muestra es siempre de esta consulta: mientras llega la nueva (↑ ↓), no queda la anterior.
  const c = estado.tipo === "listo" && String(estado.datos.id) === id ? estado.datos : null;
  const cabeza = c ?? fila ?? null;
  const p = cabeza?.vence && cabeza.status === "NEW" ? plazo(cabeza.vence) : null;

  // Al pasar a otra consulta se olvida lo de la anterior.
  useEffect(() => {
    setSucio(false);
    setPregunta(null);
    setCopiado(false);
  }, [id]);

  // Cuando llega el contenido, sus bloques entran uno detrás de otro (0,3 s cada uno, 0,05 s entre ellos).
  useLayoutEffect(() => {
    const partes = cuerpo.current?.querySelectorAll<HTMLElement>("[data-entra]");
    if (!c || !partes?.length || prefersReducedMotion()) return;
    gsap.fromTo(partes, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power3.out", clearProps: "opacity,transform" });
  }, [c?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si hay un mensaje escrito sin mandar, se pregunta antes de cerrar o de pasar a otra consulta.
  const cuidar = (accion?: () => void) => (accion ? () => (sucio ? setPregunta(() => accion) : accion()) : undefined);

  const marcar = async (nuevo: EstadoConsulta) => {
    if (!c) return;
    setGuardando(true);
    await onCambiar(c, nuevo);
    setGuardando(false);
  };
  const copiar = async () => {
    if (!c) return;
    try {
      await navigator.clipboard.writeText(c.email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sin permiso para copiar: el correo queda a la vista */
    }
  };

  const pie = c && (pregunta ? (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" role="alertdialog" aria-label="Mensaje sin enviar">
      <p className="text-sm font-semibold text-ink-900">Tenés un mensaje escrito sin mandar. ¿Lo descartás?</p>
      <div className="flex gap-2">
        <BotonFicha variante="contorno" onClick={() => setPregunta(null)}>Seguir escribiendo</BotonFicha>
        <BotonFicha variante="peligro" onClick={() => { const a = pregunta; setPregunta(null); setSucio(false); a(); }}>Descartar</BotonFicha>
      </div>
    </div>
  ) : (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs text-neutral-700">{posicion ? `Consulta ${posicion} de esta página` : " "}</span>
      <div className="flex flex-wrap gap-2">
        {c.status === "NEW" && <BotonFicha variante="contorno" onClick={() => void marcar("CLOSED")} deshabilitado={guardando}>Cerrar sin contestar</BotonFicha>}
        {c.status === "NEW" && <BotonFicha variante="contorno" onClick={() => void marcar("CONTACTED")} deshabilitado={guardando}>Marcar contactada</BotonFicha>}
        {c.status === "CONTACTED" && <BotonFicha variante="contorno" onClick={() => void marcar("NEW")} deshabilitado={guardando}>Volver a sin contestar</BotonFicha>}
        {c.status === "CONTACTED" && <BotonFicha variante="contorno" onClick={() => void marcar("CLOSED")} deshabilitado={guardando}>Marcar cerrada</BotonFicha>}
        {c.status === "CLOSED" && <BotonFicha variante="contorno" onClick={() => void marcar("NEW")} deshabilitado={guardando}>Volver a sin contestar</BotonFicha>}
      </div>
    </div>
  ));

  return (
    <Ficha abierta={abierta} origen={origen} onSalida={onSalida} sobre="Consulta" posicion={posicion} onCerrar={cuidar(onCerrar)!} onAnterior={cuidar(onAnterior)} onSiguiente={cuidar(onSiguiente)} pie={pie}
      titulo={cabeza ? cabeza.name : "Consulta"}
      chips={cabeza && (
        <>
          <ChipOscuro punto={cabeza.status === "NEW" ? "bg-status-warning" : cabeza.status === "CONTACTED" ? "bg-status-success" : "bg-ink-200"}>{ESTADO[cabeza.status].texto}</ChipOscuro>
          <ChipOscuro>{ORIGEN_CONSULTA[cabeza.source] ?? cabeza.source}</ChipOscuro>
          <ChipOscuro>Recibida {hace(cabeza.created_at)}</ChipOscuro>
          {p && <ChipOscuro punto={p.vencido ? "bg-status-error" : "bg-brand-500"}>{p.texto}</ChipOscuro>}
        </>
      )}>
      <div ref={cuerpo}>
      {!c && (estado.tipo === "cargando" || estado.tipo === "listo") ? (
        <div aria-busy="true" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <span className="h-64 rounded-[16px] bg-ink-50" />
          <span className="h-64 rounded-[16px] bg-ink-50" />
        </div>
      ) : !c ? (
        <EstadoNoListo estado={estado} recargar={recargar} noEncontrado={{ texto: "No encontramos esa consulta.", volver: <button type="button" onClick={onCerrar} className="text-sm font-semibold text-brand-600 underline">Volver a la lista</button> }} />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="flex min-w-0 flex-col gap-3">
            {c.source === "ARREPENTIMIENTO" && c.status === "NEW" && (
              <p className={`rounded-[14px] border px-4 py-3 text-sm ${p?.vencido ? "border-status-error/35 bg-status-error/10 text-status-error" : "border-brand-200 bg-brand-50 text-brand-700"}`}>
                <b>Pedido de arrepentimiento.</b> Se contesta por el mismo medio dentro de las 24 h de recibido (Res. 424/2020). {p?.texto}.
              </p>
            )}
            <section data-entra aria-label="Lo que escribió" className="rounded-[16px] border border-ink-200 bg-ink-50 p-4">
              <p className="font-sub text-[11px] font-semibold uppercase tracking-wider text-ink-500">Lo que escribió</p>
              {c.subject && <p className="mt-1 font-display text-base font-semibold text-ink-900">{c.subject}</p>}
              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-900">{c.message || "No dejó mensaje: se anotó en la comunidad de WhatsApp."}</p>
              <p className="mt-2 text-xs text-neutral-700">{fechaHora(c.created_at)}</p>
            </section>
            <div data-entra><DatoFicha icono={<Ic nombre="sobre" tam={24} />} etiqueta="Correo"
              accion={<button type="button" onClick={() => void copiar()} className="min-h-[36px] rounded-[10px] border border-ink-100 px-3 text-xs font-semibold text-ink-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [@media(hover:hover)]:hover:border-ink-900">{copiado ? "Copiado" : "Copiar"}</button>}>
              <span className="[overflow-wrap:anywhere]">{c.email}</span>
            </DatoFicha></div>
            {(c.phone || c.company) && (
              <div data-entra className={`grid gap-3 ${c.phone && c.company ? "sm:grid-cols-2" : ""}`}>
                {c.phone && <DatoFicha icono={<Ic nombre="whatsapp" tam={24} />} etiqueta="Teléfono">{c.phone}</DatoFicha>}
                {c.company && <DatoFicha icono={<Ic nombre="empresa" tam={24} />} etiqueta="Empresa">{c.company}</DatoFicha>}
              </div>
            )}
            <HistorialConsulta eventos={c.historial} />
          </div>
          <Contestar key={c.id} c={c} enfocar={contestar} onSucio={setSucio} onEnviada={(t) => { setSucio(false); onEnviada(t); }} />
        </div>
      )}
      </div>
    </Ficha>
  );
}

interface FichaConsultaProps {
  id: string;
  abierta: boolean;
  /** La fila de la lista, si está en esta página: con ella la cabecera se ve sin esperar al servidor. */
  fila?: ConsultaFila;
  origen: () => DOMRect | null;
  onSalida: () => void;
  version: number;
  contestar: boolean;
  posicion?: string;
  onCerrar: () => void;
  onAnterior?: () => void;
  onSiguiente?: () => void;
  onCambiar: (c: { id: number; name: string; status: EstadoConsulta }, nuevo: EstadoConsulta) => Promise<void>;
  onEnviada: (texto: string) => void;
}

/**
 * Contestar (2026-11-25, Mateo: «que puedas escribir el mensaje, editarlo por acá… las dos»): asunto y mensaje
 * editables, y tres salidas: enviar desde el panel (pide confirmar: un correo no se deshace), abrir el correo
 * propio con todo puesto, o WhatsApp con el mismo texto. Una clave por intento: un doble click no manda dos.
 */
function Contestar({ c, enfocar, onSucio, onEnviada }: { c: ConsultaDetalle; enfocar: boolean; onSucio: (s: boolean) => void; onEnviada: (texto: string) => void }) {
  const inicio = `Hola ${primerNombre(c.name)},\n\n`;
  const [asunto, setAsunto] = useState("Tu consulta a ELEVAR");
  const [mensaje, setMensaje] = useState(inicio);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clave = useRef(crypto.randomUUID());
  const area = useRef<HTMLTextAreaElement>(null);
  const errorDeAccion = useErrorDeAccion();
  const telefono = c.phone.replace(/\D/g, "");
  const listo = mensaje.trim().length > inicio.trim().length && asunto.trim().length > 0;

  useEffect(() => {
    if (!enfocar || !area.current) return;
    const el = area.current;
    el.focus({ preventScroll: true });
    el.setSelectionRange(el.value.length, el.value.length);
    el.scrollIntoView({ block: "nearest" });
  }, [enfocar]);
  useEffect(() => onSucio(mensaje.trim() !== inicio.trim()), [mensaje, inicio, onSucio]);

  const enviar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await panel.responderConsulta(c.id, asunto.trim(), mensaje.trim(), clave.current);
      clave.current = crypto.randomUUID();
      setMensaje(inicio);
      setConfirmando(false);
      onEnviada(`Correo enviado a ${c.email}.`);
    } catch (e) {
      setConfirmando(false);
      setError(e instanceof ApiError && e.code === "VALIDATION_ERROR" ? "Revisá el asunto (una sola línea, hasta 150 letras) y el mensaje (hasta 5.000)." : errorDeAccion(e));
    } finally {
      setEnviando(false);
    }
  };

  const mailto = `mailto:${c.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
  const whatsapp = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  return (
    <section data-entra data-escribe aria-labelledby="contestar-titulo" className="flex min-w-0 flex-col gap-3 rounded-[18px] border-2 border-ink-900 bg-neutral-0 p-4 lg:sticky lg:top-0">
      <header className="flex items-center gap-3">
        <CuadroIcono nombre="enviar" />
        <div className="min-w-0">
          <h3 id="contestar-titulo" className="font-display text-lg font-semibold leading-tight text-ink-900">Contestar</h3>
          <p className="truncate text-xs text-neutral-700">Para <b className="font-semibold text-ink-900">{c.email}</b></p>
        </div>
      </header>
      <label className="flex flex-col gap-1">
        <span className="font-sub text-[11px] font-semibold uppercase tracking-wider text-ink-500">Asunto</span>
        <input value={asunto} onChange={(e) => setAsunto(e.target.value.replace(/[\r\n]/g, " "))} maxLength={150}
          className="min-h-[44px] rounded-[12px] border border-ink-100 bg-ink-50/60 px-3 text-base text-ink-900 outline-none focus:border-ink-900 focus:bg-neutral-0 sm:text-sm" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="flex items-baseline justify-between font-sub text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          Mensaje <span className="font-normal normal-case tracking-normal text-neutral-500">{numero(mensaje.length)} / 5.000</span>
        </span>
        <textarea ref={area} value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={5000} rows={6}
          className="min-h-[132px] resize-y rounded-[12px] border border-ink-100 bg-ink-50/60 p-3 text-base leading-relaxed text-ink-900 outline-none focus:border-ink-900 focus:bg-neutral-0 sm:text-sm" />
      </label>
      {error && <p role="alert" className="rounded-[10px] bg-status-error/10 px-3 py-2 text-sm text-status-error">{error}</p>}
      {confirmando ? (
        <div className="flex flex-col gap-2 rounded-[14px] bg-ink-900 p-3 text-neutral-0" role="alertdialog" aria-label="Confirmar el envío">
          <p className="text-sm">¿Enviar este correo a <b className="[overflow-wrap:anywhere]">{c.email}</b>? Una vez enviado no se puede deshacer.</p>
          <div className="flex flex-wrap gap-2">
            <BotonFicha onClick={() => void enviar()} deshabilitado={enviando}>{enviando ? "Enviando…" : "Sí, enviar"}</BotonFicha>
            <BotonFicha variante="claro" onClick={() => setConfirmando(false)} deshabilitado={enviando}>Volver</BotonFicha>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <BotonFicha onClick={() => setConfirmando(true)} deshabilitado={!listo} icono="enviar">Enviar desde el panel</BotonFicha>
          <div className="grid gap-2 sm:grid-cols-2">
            <BotonFicha variante="contorno" href={listo ? mailto : `mailto:${c.email}`} icono="abrir">Abrir en mi correo</BotonFicha>
            {telefono ? <BotonFicha variante="contorno" href={whatsapp} externo icono="whatsapp">Mandar por WhatsApp</BotonFicha> : <span />}
          </div>
          <p className="text-xs text-neutral-700">Desde el panel sale de ELEVAR y la respuesta de la persona llega a info@elevar.com.ar. Queda en el historial y la consulta pasa a contactada.</p>
        </div>
      )}
    </section>
  );
}

/** Lo que pasó con la consulta: los cambios de estado y los correos mandados desde el panel (con su texto). */
function HistorialConsulta({ eventos }: { eventos: EventoHistorial[] }) {
  if (!eventos.length) return null;
  return (
    <section data-entra aria-label="Historial" className="rounded-[16px] border border-ink-100 p-4">
      <p className="mb-2 font-sub text-[11px] font-semibold uppercase tracking-wider text-ink-500">Historial</p>
      <ol className="flex flex-col gap-2.5">
        {eventos.map((e, k) => {
          const d = e.detalle as { status?: string[]; asunto?: string; mensaje?: string };
          return (
            <li key={k} className="flex gap-3 text-sm">
              <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.accion === "consulta.respuesta" ? "bg-brand-500" : "bg-ink-200"}`} />
              <div className="min-w-0 flex-1">
                {e.accion === "consulta.respuesta" ? (
                  <details className="group">
                    <summary className="cursor-pointer list-none font-semibold text-ink-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                      Le escribió por correo: «{d.asunto}» <span className="font-normal text-brand-600 underline group-open:hidden">ver</span>
                    </summary>
                    <p className="mt-1 whitespace-pre-wrap break-words rounded-[10px] bg-ink-50 p-2.5 text-[13px] text-ink-900">{d.mensaje}</p>
                  </details>
                ) : e.accion === "consulta.estado" && d.status ? (
                  <p className="text-ink-900">{ESTADO[d.status[0] as EstadoConsulta]?.texto ?? d.status[0]} → <b>{ESTADO[d.status[1] as EstadoConsulta]?.texto ?? d.status[1]}</b></p>
                ) : (
                  <p className="text-ink-900">{e.accion}</p>
                )}
                <p className="text-xs text-neutral-700">{e.persona} · {fechaHora(e.fecha)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// --- Cuándo llegan ------------------------------------------------------------------------------------

const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function CuandoLlegan({ estado, recargar }: { estado: EstadoDatos<ConsultaCifras>; recargar: () => void }) {
  if (estado.tipo === "cargando") return <span aria-busy="true" className="min-h-[300px] flex-1 rounded-[18px] bg-neutral-0" />;
  if (estado.tipo !== "listo") return <div className="rounded-[18px] bg-neutral-0 p-4"><EstadoNoListo estado={estado} recargar={recargar} /></div>;
  const { por_hora: celdas, dias_mapa } = estado.datos;
  const total = celdas.reduce((a, c) => a + c.n, 0);
  if (total === 0) return <Tarjeta className="flex-1"><Vacia titulo="Todavía no entraron consultas en estos días." /></Tarjeta>;

  const porHora = Array.from({ length: 24 }, (_, h) => celdas.filter((c) => c.hora === h).reduce((a, c) => a + c.n, 0));
  const porDia = DIAS.map((_, i) => celdas.filter((c) => c.dia === i + 1).reduce((a, c) => a + c.n, 0));
  // Las horas sin ninguna consulta al principio y al final no se muestran.
  const desde = Math.max(0, porHora.findIndex((n) => n > 0));
  const hasta = 23 - [...porHora].reverse().findIndex((n) => n > 0);
  const horas = porHora.slice(desde, hasta + 1);
  const horaTop = porHora.indexOf(Math.max(...porHora));
  const diaTop = porDia.indexOf(Math.max(...porDia));
  // La franja de tres horas seguidas con más consultas, para la frase.
  let franja = desde;
  for (let h = desde; h <= Math.max(desde, hasta - 2); h++) if (suma3(porHora, h) > suma3(porHora, franja)) franja = h;
  const manana = porHora.slice(0, 13).reduce((a, n) => a + n, 0);
  const finde = porDia[5]! + porDia[6]!;

  return (
    <>
      <Tarjeta tono="azul" className={`shrink-0 !gap-1 px-5 py-3.5 ${SI_ALCANZA}`}>
        <p className="font-sub text-[11px] font-semibold uppercase tracking-wider text-neutral-0/70">En los últimos {dias_mapa} días entraron {numero(total)} consultas</p>
        <p className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          {pegar(`Llegan sobre todo los ${DIAS[diaTop]}${diaTop >= 5 ? "s" : ""}, entre las ${franja} y las ${franja + 3} h.`)}
        </p>
      </Tarjeta>
      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <Dato3 icono="reloj" etiqueta="La hora con más" valor={`${horaTop} h`} detalle={`${numero(porHora[horaTop]!)} consultas entraron a esa hora`} />
        <Dato3 icono="grafico" etiqueta="El día con más" valor={mayuscula(DIAS[diaTop]!)} detalle={`${numero(porDia[diaTop]!)} de ${numero(total)} (${Math.round((porDia[diaTop]! / total) * 100)} %)`} />
        <Dato3 icono="sol" etiqueta="A la mañana" valor={`${Math.round((manana / total) * 100)} %`} detalle={`Llegan antes de las 13 h · el fin de semana, ${Math.round((finde / total) * 100)} %`} />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
        <Tarjeta className="lg:col-span-7" aria-labelledby="horas-titulo">
          <Encabezado id="horas-titulo" icono="reloj" etiqueta="Por hora" titulo="¿A qué hora llegan?" chico
            paraQue="Cuántas consultas entraron en cada hora del día, sumando los últimos 90 días. Sirve para saber a qué hora conviene mirar el panel." />
          <Lienzo min={180}>{(alto) => (
            <Barras valores={horas} etiquetas={horas.map((_, k) => `${desde + k} h`)} alto={alto} resaltar={horaTop - desde} apagado="#B9C7D5" mostrarValor
              detalle={(k) => <>{desde + k} h: <b>{numero(horas[k]!)}</b> {horas[k] === 1 ? "consulta" : "consultas"}</>} />
          )}</Lienzo>
          <Conclusion>{pegar(`La barra naranja es la hora con más consultas: ${horaTop} h.`)}</Conclusion>
        </Tarjeta>
        <Tarjeta className="lg:col-span-5" aria-labelledby="dias-titulo">
          <Encabezado id="dias-titulo" icono="grafico" etiqueta="Por día" titulo="¿Qué día de la semana llegan?" chico
            paraQue="Cuántas consultas entraron cada día de la semana, sumando los últimos 90 días." />
          <div className={`flex min-h-0 flex-1 flex-col justify-center ${SCROLL_FINO}`}>
            <Filas items={DIAS.map((d, i) => ({ texto: mayuscula(d), n: porDia[i]! }))} />
          </div>
          <Conclusion>{pegar(`El ${DIAS[diaTop]} es el día con más consultas.`)}</Conclusion>
        </Tarjeta>
      </div>
    </>
  );
}

const suma3 = (v: number[], h: number) => (v[h] ?? 0) + (v[h + 1] ?? 0) + (v[h + 2] ?? 0);

/** Una de las tres cifras de «Cuándo llegan», como las del Inicio: ícono, etiqueta, el número y qué quiere decir. */
function Dato3({ icono, etiqueta, valor, detalle }: { icono: string; etiqueta: string; valor: string; detalle: string }) {
  return (
    <Tarjeta className="!flex-row items-center !gap-3 py-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-ink-900 text-neutral-0"><Icono nombre={icono} className="h-5 w-5" acento="#F37040" grosor={2} /></span>
      <span className="min-w-0">
        <span className="block font-sub text-[11px] font-semibold uppercase tracking-wider text-ink-500">{etiqueta}</span>
        <span className="block font-sub text-2xl font-bold leading-tight tracking-tight text-ink-900">{valor}</span>
        <span className="block text-xs text-neutral-700">{detalle}</span>
      </span>
    </Tarjeta>
  );
}

export default function ConsultasPage() {
  return (
    <Suspense>
      <Consultas />
    </Suspense>
  );
}
