"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FormularioCurso } from "@/components/admin/cursos/FormularioCurso";
import { Fechas } from "@/components/admin/cursos/Fechas";
import { EstadoNoListo, useErrorDeAccion, type EstadoDatos } from "@/components/admin/datos";
import { useDatosRecordados } from "@/components/admin/lista/memoria";
import { numero } from "@/components/admin/inicio/graficos";
import { Banda, CifraFiltro } from "@/components/admin/lista/Banda";
import { BarraFiltros, Buscador, Limpiar, Menu, Pastilla, type Opcion } from "@/components/admin/lista/BarraFiltros";
import { BotonAccion, BotonFicha, ChipOscuro, CuadroIcono, Rotulo } from "@/components/admin/lista/Botones";
import { Ficha, useAviso } from "@/components/admin/lista/Ficha";
import { Paginacion, TAMANOS } from "@/components/admin/lista/Paginacion";
import { ChipPunto, Tabla, Vacia, type Columna } from "@/components/admin/lista/Tabla";
import { panel } from "@/lib/admin/api";
import { ACCION, MODALIDAD, fechaHora, plata } from "@/lib/admin/formato";
import type { CursoCifras, CursoDetalle, CursoFila, EventoHistorial, Modalidad } from "@/lib/admin/tipos";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { pegar } from "@/lib/texto";

/**
 * Cursos (2026-11-26, D-006), con la forma del portal CESS como Consultas, Órdenes e Inscripciones: banda con cuatro
 * cifras que filtran (Publicados, Borradores, Con fecha próxima, Sin fecha) y «Nuevo curso»; filtros Modalidad y
 * Categoría con el buscador por título o código; tabla de a 10. Tocar una fila abre la tarjeta del curso (crece desde
 * la fila; ↑ ↓ recorren, Esc cierra): sus fechas, lo que dice la ficha, el historial, publicar o sacar del sitio
 * (al toque, con «Deshacer») y «Editar curso». El alta y la edición son una tarjeta con pasos (`FormularioCurso`).
 */

const POR_DEFECTO = { estado: "TODOS", modalidad: "", categoria: "", q: "", pagina: "1", por: "10", ver: "", editar: "" };
type Clave = keyof typeof POR_DEFECTO;

const ESTADOS: Opcion<string>[] = [
  { valor: "TODOS", texto: "Todos" },
  { valor: "PUBLICADOS", texto: "Publicados" },
  { valor: "BORRADORES", texto: "Borradores" },
  { valor: "CON_FECHA", texto: "Con fecha próxima" },
  { valor: "SIN_FECHA", texto: "Sin fecha" },
];
// Sin «Taller»: el sitio sacó los talleres (KAN-30). Un taller viejo igual aparece con «Todas».
const MODALIDADES: Opcion<string>[] = [{ valor: "", texto: "Todas" }, ...Object.entries(MODALIDAD).filter(([valor]) => valor !== "WORKSHOP").map(([valor, texto]) => ({ valor, texto }))];
const SIGLA: Record<Modalidad, string> = { LIVE: "VIVO", WEBINAR: "WEB", ASYNC: "ASIN", WORKSHOP: "TALL" };
const ZONA = "America/Argentina/Cordoba";
const conFechas = (m: Modalidad) => m === "LIVE" || m === "WEBINAR";

const diaArg = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: ZONA }).format(d);
function dia(iso: string): string {
  const d = new Date(iso);
  const semana = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, weekday: "short" }).format(d).replace(".", "");
  const fecha = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, day: "2-digit", month: "2-digit" }).format(d);
  return `${semana} ${fecha}`;
}
const hora = (iso: string) => new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
function cuanto(iso: string): string {
  const dias = Math.round((new Date(`${diaArg(new Date(iso))}T00:00:00Z`).getTime() - new Date(`${diaArg(new Date())}T00:00:00Z`).getTime()) / 86_400_000);
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  return `en ${dias} días`;
}

function Cursos() {
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
    if (Object.keys(cambios).some((k) => !["pagina", "por", "ver", "editar"].includes(k))) nuevos.delete("pagina");
    for (const [k, val] of Object.entries(cambios) as [Clave, string][]) {
      if (val === POR_DEFECTO[k]) nuevos.delete(k);
      else nuevos.set(k, val);
    }
    const texto = nuevos.toString();
    return texto ? `${pathname}?${texto}` : pathname;
  }, [params, pathname]);
  // La dirección cambia sin pedirle nada al servidor (15-MEMORY 2026-11-25: router.replace se sentía «tildado»).
  const ir = useCallback((cambios: Partial<Record<Clave, string>>) => window.history.replaceState(null, "", enlace(cambios)), [enlace]);

  const claveLista = [v.estado, v.modalidad, v.categoria, v.q, pagina, por].join("|");
  const lista = useDatosRecordados(() => panel.cursos({ estado: v.estado, modalidad: v.modalidad, categoria: v.categoria, q: v.q, page: pagina, page_size: por }), [claveLista]);
  const cifras = useDatosRecordados(() => panel.cursoCifras(), []);
  const categorias = useDatosRecordados(() => panel.categorias(), []);
  const { aviso, avisar } = useAviso();
  const refrescar = useCallback(() => {
    lista.recargar();
    cifras.recargar();
  }, [lista, cifras]);

  const filas = lista.estado.tipo === "listo" ? lista.estado.datos.results : [];
  const total = lista.estado.tipo === "listo" ? lista.estado.datos.count : 0;
  const cats = categorias.estado.tipo === "listo" ? categorias.estado.datos : [];
  const hayFiltros = v.estado !== "TODOS" || v.modalidad !== "" || v.categoria !== "" || v.q !== "";
  const opcionesCategoria: Opcion<string>[] = [{ valor: "", texto: "Todas" }, ...cats.map((c) => ({ valor: String(c.id), texto: c.name }))];

  // La tarjeta del curso (`ver`) y el formulario (`editar`: un id o «nuevo»).
  const ver = Number.parseInt(v.ver, 10) || 0;
  const idx = filas.findIndex((f) => f.id === ver);
  const [mostrada, setMostrada] = useState(ver);
  if (ver && ver !== mostrada) setMostrada(ver);
  const editar = v.editar === "nuevo" ? "nuevo" : Number.parseInt(v.editar, 10) || 0;
  const [formulario, setFormulario] = useState<number | "nuevo" | 0>(editar);
  if (editar && editar !== formulario) setFormulario(editar);
  /** A qué tarjeta vuelve el formulario al cerrarse sin guardar (si se abrió desde una). */
  const volverA = useRef(0);
  const origenNuevo = useRef<HTMLElement | null>(null);

  const filaDe = useCallback((id: number) => () => {
    const el = [...document.querySelectorAll<HTMLElement>(`[data-fila="${id}"]`)].find((f) => f.offsetParent !== null);
    return el?.getBoundingClientRect() ?? null;
  }, []);
  const alSalirFicha = useCallback(() => {
    const id = mostrada;
    setMostrada(0);
    if (!new URLSearchParams(window.location.search).get("editar"))
      [...document.querySelectorAll<HTMLElement>(`[data-fila="${id}"] [data-accion], [data-fila="${id}"]`)].find((b) => b.offsetParent !== null)?.focus();
  }, [mostrada]);
  const abrirFormulario = (id: number | "nuevo", desdeTarjeta = false) => {
    volverA.current = desdeTarjeta && id !== "nuevo" ? id : 0;
    ir({ ver: "", editar: String(id) });
  };

  const columnas: Columna<CursoFila>[] = [
    { titulo: "Curso", celda: (c) => <Curso c={c} />, ancho: "w-[44%]" },
    { titulo: "Precio", celda: (c) => <Precio c={c} />, centro: true },
    { titulo: "Próxima fecha", celda: (c) => <Proxima c={c} />, centro: true, ocultar: "hidden lg:table-cell" },
    { titulo: "Estado", celda: (c) => <ChipPunto texto={c.is_published ? "Publicado" : "Borrador"} tono={c.is_published ? "ok" : "neutro"} />, centro: true },
    { titulo: "Acciones", centro: true, celda: (c) => <BotonAccion icono="editar" onClick={() => abrirFormulario(c.id)} etiqueta={`Editar ${c.title}`}>Editar</BotonAccion> },
  ];

  const pastillas: ReactNode[] = [];
  if (v.estado !== "TODOS") pastillas.push(<Pastilla key="e" texto={ESTADOS.find((o) => o.valor === v.estado)?.texto ?? v.estado} onQuitar={() => ir({ estado: "TODOS" })} />);
  if (v.modalidad) pastillas.push(<Pastilla key="m" texto={`Modalidad: ${MODALIDAD[v.modalidad] ?? v.modalidad}`} onQuitar={() => ir({ modalidad: "" })} />);
  if (v.categoria) pastillas.push(<Pastilla key="c" texto={`Categoría: ${opcionesCategoria.find((o) => o.valor === v.categoria)?.texto ?? v.categoria}`} onQuitar={() => ir({ categoria: "" })} />);
  if (v.q) pastillas.push(<Pastilla key="q" texto={`«${v.q}»`} onQuitar={() => ir({ q: "" })} />);
  const limpiar = () => ir({ estado: "TODOS", modalidad: "", categoria: "", q: "" });

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 lg:h-[calc(100dvh-4rem)]">
      <Banda sobre="Catálogo" titulo="Cursos"
        contador={cifras.estado.tipo === "listo" ? `${numero(cifras.estado.datos.publicados)} ${cifras.estado.datos.publicados === 1 ? "publicado" : "publicados"}` : undefined}
        derecha={
          <span ref={(el) => void (origenNuevo.current = el)} className="inline-block">
            <BotonFicha onClick={() => abrirFormulario("nuevo")} icono="mas">Nuevo curso</BotonFicha>
          </span>
        }>
        <Cifras estado={cifras.estado} v={v} enlace={enlace} />
      </Banda>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <BarraFiltros pastillas={pastillas.length ? <>{pastillas}<Limpiar onLimpiar={limpiar} /></> : undefined}>
          <Buscador etiqueta="Buscar por título o código" valor={v.q} onCambiar={(q) => ir({ q })} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
            <Menu etiqueta="Cuáles" valor={v.estado} opciones={ESTADOS} porDefecto="TODOS" onCambiar={(estado) => ir({ estado })} />
            <Menu etiqueta="Modalidad" valor={v.modalidad} opciones={MODALIDADES} porDefecto="" onCambiar={(modalidad) => ir({ modalidad })} />
            <Menu etiqueta="Categoría" valor={v.categoria} opciones={opcionesCategoria} porDefecto="" onCambiar={(categoria) => ir({ categoria })} />
          </div>
        </BarraFiltros>

        {lista.estado.tipo !== "listo" && lista.estado.tipo !== "cargando" ? (
          <div className="min-h-0 flex-1 overflow-auto rounded-[18px] border border-ink-100 bg-neutral-0 p-4">
            <EstadoNoListo estado={lista.estado} recargar={lista.recargar} />
          </div>
        ) : (
          <Tabla etiqueta="Cursos" filas={filas} columnas={columnas} clave={(c) => c.id} activa={ver || null}
            alAbrir={(c) => ir({ ver: String(c.id) })} movil={(c) => <FilaMovil c={c} />} cargando={lista.estado.tipo === "cargando"}
            vacio={hayFiltros
              ? <Vacia titulo="No hay cursos con estos filtros." texto={pegar("Probá con otra modalidad, otra categoría u otra búsqueda.")} accion={<Limpiar onLimpiar={limpiar} />} />
              : <Vacia titulo="Todavía no hay cursos cargados." texto={pegar("Cargá el primero con «Nuevo curso».")} accion={<BotonFicha onClick={() => abrirFormulario("nuevo")} icono="mas">Nuevo curso</BotonFicha>} />}
            pie={total > 0 ? <Paginacion total={total} pagina={pagina} porPagina={por} onPagina={(n) => ir({ pagina: String(n) })} onPorPagina={(n) => ir({ por: String(n), pagina: "1" })} /> : undefined} />
        )}
      </div>

      {mostrada > 0 && (
        <FichaCurso id={mostrada} abierta={!!ver} fila={filas.find((f) => f.id === mostrada)} origen={filaDe(mostrada)} onSalida={alSalirFicha}
          onCerrar={() => ir({ ver: "" })} avisar={avisar} onCambio={refrescar} onEditar={() => abrirFormulario(mostrada, true)}
          posicion={idx >= 0 ? `${idx + 1} de ${filas.length}` : undefined}
          onAnterior={idx > 0 ? () => ir({ ver: String(filas[idx - 1]!.id) }) : undefined}
          onSiguiente={idx >= 0 && idx < filas.length - 1 ? () => ir({ ver: String(filas[idx + 1]!.id) }) : undefined} />
      )}
      {formulario !== 0 && categorias.estado.tipo === "listo" && (
        <FormularioCurso key={String(formulario)} abierta={!!editar} cursoId={formulario === "nuevo" ? null : formulario} categorias={cats}
          origen={formulario === "nuevo" ? () => origenNuevo.current?.getBoundingClientRect() ?? null : filaDe(formulario)}
          onCerrar={() => ir({ editar: "", ver: volverA.current ? String(volverA.current) : "" })}
          onSalida={() => setFormulario(0)}
          onGuardado={(curso, nuevo) => {
            refrescar();
            avisar(nuevo ? "Curso creado. Revisalo y publicalo cuando esté listo." : "Cambios guardados.");
            ir({ editar: "", ver: String(curso.id) });
          }} />
      )}
      {aviso}
    </div>
  );
}

// --- La banda --------------------------------------------------------------------------------------------

function Cifras({ estado, v, enlace }: { estado: EstadoDatos<CursoCifras>; v: typeof POR_DEFECTO; enlace: (c: Partial<Record<Clave, string>>) => string }) {
  if (estado.tipo !== "listo") {
    return <>{[0, 1, 2, 3].map((k) => <span key={k} aria-hidden className="h-16 rounded-[16px] bg-neutral-0/[0.06] ring-1 ring-neutral-0/10" />)}</>;
  }
  const d = estado.datos;
  const base = { pagina: "1", ver: "", editar: "", modalidad: "", categoria: "", q: "" };
  const sinOtros = !v.modalidad && !v.categoria && !v.q;
  const elegida = (e: string) => sinOtros && v.estado === e;
  // Tocar la cifra elegida la suelta: vuelve a todos.
  const href = (e: string) => enlace({ ...base, estado: elegida(e) ? "TODOS" : e });
  return (
    <>
      <CifraFiltro href={href("PUBLICADOS")} icono="cursos" nombre="Publicados" detalle="Se ven en el sitio" valor={d.publicados} elegida={elegida("PUBLICADOS")} />
      <CifraFiltro href={href("BORRADORES")} icono="editar" nombre="Borradores" detalle="Cargados, sin publicar" valor={d.borradores} elegida={elegida("BORRADORES")} />
      <CifraFiltro href={href("CON_FECHA")} icono="inscripciones" nombre="Con fecha" detalle="Webinars y en vivo por venir" valor={d.con_fecha} elegida={elegida("CON_FECHA")} />
      <CifraFiltro href={href("SIN_FECHA")} icono="reloj" nombre="Sin fecha" detalle="En vivo o webinar sin fecha" valor={d.sin_fecha} elegida={elegida("SIN_FECHA")}
        aviso={d.sin_fecha > 0 ? "No se venden" : undefined} />
    </>
  );
}

// --- Las celdas -------------------------------------------------------------------------------------------

function Sigla({ m }: { m: Modalidad }) {
  return (
    <span aria-hidden className={`inline-grid h-9 w-9 shrink-0 place-items-center rounded-full font-sub text-[10px] font-semibold ${m === "LIVE" ? "bg-brand-500 text-neutral-0" : m === "WEBINAR" ? "bg-ink-900 text-neutral-0" : "bg-ink-50 text-ink-900 ring-1 ring-ink-100"}`}>
      {SIGLA[m]}
    </span>
  );
}

function Curso({ c }: { c: CursoFila }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Sigla m={c.modality} />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink-900" title={c.title}>{c.title}</span>
        <span className="block truncate text-xs text-neutral-700">
          <span className="font-mono">{c.code}</span> · {MODALIDAD[c.modality]} · {c.category_nombre}
          {c.badge && <span className="ml-1.5 rounded-full bg-brand-500/10 px-1.5 py-px font-sub text-[10px] font-semibold uppercase text-brand-600">{c.badge === "NUEVO" ? "Nuevo" : "Próximo"}</span>}
        </span>
      </span>
    </span>
  );
}

function Precio({ c }: { c: CursoFila }) {
  const gratis = c.price === "0.00" && !c.price_usd;
  return (
    <span className="inline-flex flex-col items-center whitespace-nowrap tabular-nums">
      <span className="font-sub text-sm font-semibold text-ink-900">{gratis ? "Gratis" : plata(c.price, c.currency)}</span>
      {c.price_usd && <span className="text-xs text-neutral-700">{plata(c.price_usd, "USD")}</span>}
    </span>
  );
}

function Proxima({ c }: { c: CursoFila }) {
  if (c.proxima_fecha) {
    return (
      <span className="inline-flex flex-col items-center whitespace-nowrap">
        <span className="font-sub text-sm font-semibold capitalize text-ink-900">{dia(c.proxima_fecha)} · {hora(c.proxima_fecha)}</span>
        <span className="text-xs font-semibold text-brand-600">{cuanto(c.proxima_fecha)}</span>
      </span>
    );
  }
  if (conFechas(c.modality) && c.is_published) return <span className="font-sub text-xs font-semibold text-brand-600">Sin fecha</span>;
  return <span className="text-neutral-500" aria-label={conFechas(c.modality) ? "Sin fecha" : "No lleva fecha"}>—</span>;
}

function FilaMovil({ c }: { c: CursoFila }) {
  return (
    <span className="flex flex-col gap-1.5">
      <Curso c={c} />
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 text-xs text-neutral-700">
        <Precio c={c} />
        {c.proxima_fecha ? <span className="capitalize">{dia(c.proxima_fecha)} · {hora(c.proxima_fecha)}</span> : conFechas(c.modality) && c.is_published ? <span className="font-semibold text-brand-600">Sin fecha</span> : null}
        <ChipPunto texto={c.is_published ? "Publicado" : "Borrador"} tono={c.is_published ? "ok" : "neutro"} />
      </span>
    </span>
  );
}

// --- La tarjeta del curso ----------------------------------------------------------------------------------

interface FichaCursoProps {
  id: number;
  abierta: boolean;
  fila?: CursoFila;
  origen: () => DOMRect | null;
  onSalida: () => void;
  posicion?: string;
  onCerrar: () => void;
  onAnterior?: () => void;
  onSiguiente?: () => void;
  onEditar: () => void;
  onCambio: () => void;
  avisar: (texto: string, deshacer?: () => void) => void;
}

function FichaCurso({ id, abierta, fila, origen, onSalida, posicion, onCerrar, onAnterior, onSiguiente, onEditar, onCambio, avisar }: FichaCursoProps) {
  const { estado, recargar, setEstado } = useDatosRecordados(() => panel.curso(String(id)), [id]);
  const cuerpo = useRef<HTMLDivElement>(null);
  const [publicando, setPublicando] = useState(false);
  const errorDeAccion = useErrorDeAccion();
  const c = estado.tipo === "listo" && estado.datos.id === id ? estado.datos : null;
  const cabeza = c ?? fila ?? null;

  useLayoutEffect(() => {
    const partes = cuerpo.current?.querySelectorAll<HTMLElement>("[data-entra]");
    if (!c || !partes?.length || prefersReducedMotion()) return;
    gsap.fromTo(partes, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power3.out", clearProps: "opacity,transform" });
  }, [c?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Publicar o sacar del sitio: al toque, con «Deshacer» (se puede volver atrás). */
  const publicar = async (valor: boolean, deshaciendo = false) => {
    setPublicando(true);
    try {
      const nuevo = await panel.editarCurso(id, { is_published: valor });
      setEstado({ tipo: "listo", datos: nuevo });
      onCambio();
      if (!deshaciendo) avisar(valor ? "Publicado: ya se ve en el sitio." : "Sacado del sitio: ya no se ve ni se puede comprar.", () => void publicar(!valor, true));
    } catch (e) {
      avisar(errorDeAccion(e) ?? "No se pudo cambiar. Probá de nuevo.");
    } finally {
      setPublicando(false);
    }
  };

  const pie = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs text-neutral-700">{posicion ? `Curso ${posicion} de esta página` : " "}</span>
      {c && <span className="text-xs text-neutral-700">Actualizado {fechaHora(c.updated_at)}</span>}
    </div>
  );

  return (
    <Ficha abierta={abierta} origen={origen} onSalida={onSalida} sobre={cabeza ? `Catálogo · ${MODALIDAD[cabeza.modality]}` : "Catálogo"} posicion={posicion}
      onCerrar={onCerrar} onAnterior={onAnterior} onSiguiente={onSiguiente} pie={pie}
      titulo={<span className="line-clamp-3 sm:line-clamp-none" title={cabeza?.title}>{cabeza ? cabeza.title : "Curso"}</span>}
      chips={cabeza && (
        <>
          <ChipOscuro punto={cabeza.is_published ? "bg-status-success" : "bg-neutral-0/50"}>{cabeza.is_published ? "Publicado" : "Borrador"}</ChipOscuro>
          <ChipOscuro>{cabeza.code}</ChipOscuro>
          {c && <ChipOscuro>{c.category_nombre}</ChipOscuro>}
          {cabeza.is_featured && <ChipOscuro punto="bg-brand-400">Destacado</ChipOscuro>}
        </>
      )}>
      <div ref={cuerpo}>
        {!c && (estado.tipo === "cargando" || estado.tipo === "listo") ? (
          <div aria-busy="true" className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <span className="h-72 rounded-[16px] bg-ink-50" />
            <span className="h-72 rounded-[16px] bg-ink-50" />
          </div>
        ) : !c ? (
          <EstadoNoListo estado={estado} recargar={recargar} noEncontrado={{ texto: "No encontramos ese curso.", volver: <button type="button" onClick={onCerrar} className="text-sm font-semibold text-brand-600 underline">Volver a la lista</button> }} />
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-3">
              {conFechas(c.modality) && (
                <Fechas key={c.id} cursoId={c.id} webinar={c.modality === "WEBINAR"} fechas={c.fechas}
                  onCambio={async (texto) => {
                    setEstado({ tipo: "listo", datos: await panel.curso(String(id)) });
                    onCambio();
                    avisar(texto);
                  }} />
              )}
              <LaFicha c={c} onEditar={onEditar} />
              <HistorialCurso eventos={c.historial} />
            </div>
            <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-0">
              <EnElSitio c={c} publicando={publicando} onPublicar={(v) => void publicar(v)} onEditar={onEditar} />
              <Datos c={c} />
            </div>
          </div>
        )}
      </div>
    </Ficha>
  );
}

function EnElSitio({ c, publicando, onPublicar, onEditar }: { c: CursoDetalle; publicando: boolean; onPublicar: (v: boolean) => void; onEditar: () => void }) {
  const sinFecha = conFechas(c.modality) && !c.fechas.some((f) => f.status === "SCHEDULED" && new Date(f.starts_at).getTime() >= Date.now());
  return (
    <section data-entra data-escribe aria-labelledby="sitio-titulo" className="flex flex-col gap-3 rounded-[16px] border border-ink-100 p-4">
      <header className="flex items-center gap-3">
        <CuadroIcono nombre={c.is_published ? "ojo" : "ocultar"} tono={c.is_published ? "exito" : "suave"} />
        <div className="min-w-0">
          <h3 id="sitio-titulo" className="font-display text-lg font-semibold leading-tight text-ink-900">{c.is_published ? "Publicado en el sitio" : "Sin publicar"}</h3>
          <p className="text-xs text-neutral-700">
            {c.is_published ? (sinFecha ? pegar("Se ve, pero sin fecha por venir no se puede comprar.") : "Se ve en la lista de cursos y se puede comprar.") : "Solo se ve acá, en el panel."}
          </p>
        </div>
      </header>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <BotonFicha onClick={onEditar} icono="editar">Editar curso</BotonFicha>
        {c.is_published
          ? <BotonFicha variante="contorno" onClick={() => onPublicar(false)} deshabilitado={publicando} icono="ocultar">{publicando ? "Sacando…" : "Sacar del sitio"}</BotonFicha>
          : <BotonFicha variante="contorno" onClick={() => onPublicar(true)} deshabilitado={publicando} icono="tilde">{publicando ? "Publicando…" : "Publicar"}</BotonFicha>}
      </div>
      {c.is_published && <BotonFicha variante="contorno" href={`/cursos/${c.slug}`} externo icono="abrir">Ver en el sitio</BotonFicha>}
    </section>
  );
}

function Datos({ c }: { c: CursoDetalle }) {
  const filas: [string, ReactNode][] = [
    ["Precio", `${c.price === "0.00" && !c.price_usd ? "Gratis" : plata(c.price, c.currency)}${c.price_usd ? ` · ${plata(c.price_usd, "USD")}` : ""}`],
    ["Categoría", c.category_nombre],
    ["Código", `${c.code}${c.modality === "LIVE" && c.code_suffix ? ` · ${c.code_suffix}` : ""}`],
    ["Etiqueta", c.badge === "NUEVO" ? "Nuevo" : c.badge === "PROXIMO" ? "Próximo" : "Ninguna"],
    ["Posición", String(c.position)],
    ["Dirección", <span key="d" className="[overflow-wrap:anywhere]">/cursos/{c.slug}</span>],
  ];
  return (
    <section data-entra aria-label="Datos" className="flex flex-col gap-2 rounded-[16px] border border-ink-100 p-4">
      <Rotulo>Datos</Rotulo>
      <dl className="flex flex-col gap-1.5">
        {filas.map(([k, val]) => (
          <div key={k} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 text-sm">
            <dt className="text-neutral-700">{k}</dt>
            <dd className="min-w-0 font-semibold tabular-nums text-ink-900">{val}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Lo que dice la ficha del curso en el sitio, en corto, y qué le falta. */
function LaFicha({ c, onEditar }: { c: CursoDetalle; onEditar: () => void }) {
  const falta = [
    !c.summary.trim() && "resumen",
    !c.description.trim() && "descripción",
    !c.objectives.trim() && "objetivos",
    c.syllabus.length === 0 && "temario",
    !c.instructor_names.trim() && "disertantes",
  ].filter(Boolean) as string[];
  const modulos = c.syllabus.filter((p) => /^m[óo]dulo/i.test(p)).length;
  return (
    <section data-entra aria-labelledby="ficha-curso-titulo" className="flex flex-col gap-3 rounded-[16px] border border-ink-100 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 id="ficha-curso-titulo" className="font-display text-lg font-semibold leading-tight text-ink-900">La ficha</h3>
        <button type="button" onClick={onEditar} className="min-h-[36px] rounded-[8px] px-2 font-sub text-sm font-semibold text-brand-600 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [@media(hover:hover)]:hover:underline">Editar</button>
      </div>
      {(c.lead || c.summary) ? <p className="text-sm leading-relaxed text-ink-900 [overflow-wrap:anywhere]">{c.lead || c.summary}</p> : <p className="text-sm text-neutral-700">Sin bajada ni resumen.</p>}
      <dl className="grid gap-2 sm:grid-cols-3">
        <Mini k="Temario" v={c.syllabus.length ? `${c.syllabus.length} ${c.syllabus.length === 1 ? "punto" : "puntos"}${modulos ? ` · ${modulos} mód.` : ""}` : "—"} />
        <Mini k="Disertantes" v={c.instructor_names || "—"} />
        <Mini k="Duración" v={[c.duration_hours ? `${c.duration_hours} h` : "", c.level].filter(Boolean).join(" · ") || "—"} />
      </dl>
      {falta.length > 0 && <p className="text-xs font-semibold text-brand-600">Falta cargar: {falta.join(", ")}.</p>}
    </section>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0 rounded-[12px] bg-ink-50 px-3 py-2">
      <dt className="font-sub text-[11px] font-semibold uppercase tracking-wider text-ink-500">{k}</dt>
      <dd className="truncate text-sm font-semibold text-ink-900" title={v}>{v}</dd>
    </div>
  );
}

/** Los nombres de los campos del curso, para el historial. */
const CAMPO: Record<string, string> = {
  title: "título", slug: "dirección", code: "código", code_suffix: "mes y año", category: "categoría", modality: "modalidad",
  price: "precio", price_usd: "precio en dólares", badge: "etiqueta", position: "posición", is_published: "publicación", is_featured: "destacado",
  lead: "bajada", summary: "resumen", description: "descripción", objectives: "objetivos", syllabus: "temario",
  instructor_names: "disertantes", instructor_role: "cargo", level: "nivel", duration_hours: "duración", pdf_url: "PDF", currency: "moneda",
};

function HistorialCurso({ eventos }: { eventos: EventoHistorial[] }) {
  if (!eventos.length) return null;
  return (
    <section data-entra aria-label="Historial" className="rounded-[16px] border border-ink-100 p-4">
      <Rotulo>Historial</Rotulo>
      <ol className={`mt-2 flex max-h-64 flex-col gap-2.5 overflow-y-auto`}>
        {eventos.map((e, k) => {
          const campos = Array.isArray(e.detalle.campos) ? (e.detalle.campos as string[]).map((x) => CAMPO[x] ?? x) : [];
          return (
            <li key={k} className="flex gap-3 text-sm">
              <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.accion === "fecha.cancelada" ? "bg-status-error" : e.accion.endsWith(".alta") ? "bg-status-success" : "bg-ink-200"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-ink-900">{ACCION[e.accion] ?? e.accion}{campos.length ? `: ${campos.join(", ")}` : ""}</p>
                <p className="text-xs text-neutral-700">{e.persona} · {fechaHora(e.fecha)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function CursosPage() {
  return (
    <Suspense>
      <Cursos />
    </Suspense>
  );
}
