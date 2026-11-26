"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EstadoNoListo, useDatos } from "@/components/admin/datos";
import { BotonFicha, ChipOscuro, Rotulo } from "@/components/admin/lista/Botones";
import { Ficha } from "@/components/admin/lista/Ficha";
import { ApiError, panel } from "@/lib/admin/api";
import { MODALIDAD, plata } from "@/lib/admin/formato";
import type { Categoria, CursoDatos, CursoDetalle, Modalidad } from "@/lib/admin/tipos";
import { IndicadorPasos, PanelesPasos } from "./Pasos";

/**
 * El alta y la edición de un curso en una tarjeta con pasos, como el formulario del portal CESS (D-003: «el
 * formulario»; D-006, 2026-11-26): Datos · Precio · Ficha · Temario · Revisar. Los cinco paneles quedan montados:
 * lo escrito en un paso no se pierde y viaja entero al guardar. Un error vuelve al paso de su campo y le deja el
 * foco. Al editar se llega directo a cualquier paso y «Guardar cambios» está en todos (Mateo: «1 2 3 sí»); un curso
 * nuevo se crea desde Revisar. Cerrar con cambios sin guardar pregunta antes.
 */

export const CURSO_VACIO: CursoDatos = {
  code: "", title: "", slug: "", summary: "", lead: "", description: "", objectives: "", syllabus: [], category: 0,
  modality: "ASYNC", price: "0.00", price_usd: null, currency: "ARS", level: "", duration_hours: null,
  instructor_names: "", instructor_role: "", pdf_url: "", code_suffix: "", position: 0, is_published: false,
  is_featured: false, badge: "",
};

const PASOS = ["Datos", "Precio", "Ficha", "Temario", "Revisar"] as const;
const REVISAR = PASOS.length - 1;
/** En qué paso vive cada campo: un error vuelve ahí. */
const PASO_DE: Record<string, number> = {
  title: 0, slug: 0, code: 0, code_suffix: 0, category: 0, modality: 0,
  price: 1, price_usd: 1, badge: 1, position: 1, is_published: 1, is_featured: 1, currency: 1,
  lead: 2, summary: 2, description: 2, objectives: 2,
  syllabus: 3, instructor_names: 3, instructor_role: 3, level: 3, duration_hours: 3, pdf_url: 3,
};
/** Sin «Taller»: el sitio sacó los talleres (15-MEMORY 2026-11-04, KAN-30) y la página pública de uno da error.
 *  Un curso que ya es taller la sigue mostrando, para no cambiarle la modalidad sin querer. */
const MODALIDADES: Modalidad[] = ["ASYNC", "LIVE", "WEBINAR"];
const ETIQUETAS: { valor: CursoDatos["badge"]; texto: string }[] = [
  { valor: "", texto: "Ninguna" },
  { valor: "NUEVO", texto: "Nuevo" },
  { valor: "PROXIMO", texto: "Próximo" },
];

const PLATA = /^\d{1,10}([.,]\d{1,2})?$/;
/** «48.000,5» o «48000.5» → «48000.50». Nunca pasa por Number (08: nada de float para plata). */
function plataTexto(valor: string): string | null {
  const limpio = valor.trim().replace(/\.(?=\d{3}(\D|$))/g, "");
  if (!PLATA.test(limpio)) return null;
  const [entero, dec = ""] = limpio.replace(",", ".").split(".");
  return `${entero!.replace(/^0+(?=\d)/, "")}.${dec.padEnd(2, "0")}`;
}

function aSlug(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 200);
}

/** Lo que se edita: los datos del curso, con la plata y el temario como los escribe la persona. */
interface Borrador {
  datos: CursoDatos;
  precio: string;
  precioUsd: string;
  temario: string;
}
const borradorDe = (d: CursoDatos): Borrador => ({ datos: d, precio: d.price, precioUsd: d.price_usd ?? "", temario: d.syllabus.join("\n") });
const firma = (b: Borrador) => JSON.stringify(b);
/** Un curso nuevo arranca con el precio vacío: se escribe a propósito (un webinar gratis, 0). */
const VACIO: Borrador = { ...borradorDe(CURSO_VACIO), precio: "" };

/** Los errores que se ven sin ir al servidor: campos obligatorios y plata. */
function erroresPropios(b: Borrador): Record<string, string> {
  const e: Record<string, string> = {};
  if (!b.datos.title.trim()) e.title = "Escribí el título del curso.";
  if (!b.datos.slug.trim()) e.slug = "Escribí la dirección (se arma sola con el título).";
  if (!b.datos.code.trim()) e.code = "Escribí el código, por ejemplo CV57.";
  if (!b.datos.category) e.category = "Elegí una categoría.";
  if (plataTexto(b.precio) === null) e.price = "Escribí un monto, por ejemplo 48000 o 48000,50.";
  if (b.precioUsd.trim() !== "" && plataTexto(b.precioUsd) === null) e.price_usd = "Escribí un monto, por ejemplo 35 o 35,50.";
  return e;
}

interface Props {
  abierta: boolean;
  /** null: un curso nuevo. */
  cursoId: number | null;
  categorias: Categoria[];
  origen?: () => DOMRect | null;
  onCerrar: () => void;
  onSalida: () => void;
  onGuardado: (curso: CursoDetalle, nuevo: boolean) => void;
}

export function FormularioCurso({ abierta, cursoId, categorias, origen, onCerrar, onSalida, onGuardado }: Props) {
  const nuevo = cursoId === null;
  const detalle = useDatos(() => (cursoId === null ? Promise.resolve(null) : panel.curso(String(cursoId))), [cursoId]);
  const [b, setB] = useState<Borrador | null>(nuevo ? VACIO : null);
  const inicial = useRef<string>(nuevo ? firma(VACIO) : "");
  const [paso, setPaso] = useState(0);
  const [alcanzado, setAlcanzado] = useState(nuevo ? 0 : PASOS.length);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [slugTocado, setSlugTocado] = useState(!nuevo);
  const [preguntaSalir, setPreguntaSalir] = useState(false);
  const cuerpo = useRef<HTMLDivElement>(null);
  const primerPaso = useRef(true);

  // Al llegar el curso a editar, el borrador arranca con sus datos.
  useEffect(() => {
    if (b || detalle.estado.tipo !== "listo" || !detalle.estado.datos) return;
    const c = detalle.estado.datos;
    const { id: _i, category_nombre: _c, created_at: _a, updated_at: _u, fechas: _f, historial: _h, ...datos } = c;
    const inicio = borradorDe(datos);
    inicial.current = firma(inicio);
    setB(inicio);
  }, [detalle.estado, b]);

  // Al cambiar de paso, el foco va al primer campo del paso nuevo (no al abrir: lo deja la tarjeta).
  useEffect(() => {
    if (primerPaso.current) return void (primerPaso.current = false);
    const panelActivo = cuerpo.current?.querySelector<HTMLElement>("[data-activo]");
    panelActivo?.querySelector<HTMLElement>("input, select, textarea, button")?.focus({ preventScroll: true });
    cuerpo.current?.closest("[class*='overflow']")?.scrollTo?.({ top: 0 });
  }, [paso]);

  const cambiado = b !== null && firma(b) !== inicial.current;
  const pedirCierre = () => {
    if (guardando) return;
    if (cambiado && !preguntaSalir) return setPreguntaSalir(true);
    onCerrar();
  };

  const poner = <K extends keyof CursoDatos>(k: K, v: CursoDatos[K]) => {
    setB((x) => (x ? { ...x, datos: { ...x.datos, [k]: v } } : x));
    setErrores(({ [k]: _fuera, ...resto }) => resto);
    setPreguntaSalir(false);
  };
  const ponerTexto = (k: "precio" | "precioUsd" | "temario", v: string, campo: string) => {
    setB((x) => (x ? { ...x, [k]: v } : x));
    setErrores(({ [campo]: _fuera, ...resto }) => resto);
    setPreguntaSalir(false);
  };
  /** Valida un campo al salir de él (no por tecla). */
  const alSalir = (campo: string) => {
    if (!b) return;
    const e = erroresPropios(b)[campo];
    if (e) setErrores((x) => ({ ...x, [campo]: e }));
  };

  const irA = (n: number) => setPaso(n);
  /** Va al paso del primer campo con error y le deja el foco. */
  const mostrarError = (todos: Record<string, string>) => {
    const primero = Object.keys(todos).sort((x, y) => (PASO_DE[x] ?? 9) - (PASO_DE[y] ?? 9))[0];
    if (!primero) return;
    const n = PASO_DE[primero] ?? 0;
    setPaso(n);
    setAlcanzado((a) => Math.max(a, n));
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`curso-${primero}`)?.focus()));
  };
  const siguiente = () => {
    if (!b) return;
    const propios = Object.fromEntries(Object.entries(erroresPropios(b)).filter(([k]) => PASO_DE[k] === paso));
    if (Object.keys(propios).length) {
      setErrores((x) => ({ ...x, ...propios }));
      return mostrarError(propios);
    }
    setPaso(paso + 1);
    setAlcanzado((a) => Math.max(a, paso + 1));
  };

  const guardar = async () => {
    if (!b || guardando) return;
    const propios = erroresPropios(b);
    if (Object.keys(propios).length) {
      setErrores(propios);
      return mostrarError(propios);
    }
    setGuardando(true);
    setGeneral(null);
    const enviar: CursoDatos = {
      ...b.datos,
      price: plataTexto(b.precio)!,
      price_usd: b.precioUsd.trim() === "" ? null : plataTexto(b.precioUsd),
      syllabus: b.temario.split("\n").map((l) => l.trim()).filter(Boolean),
    };
    try {
      const curso = cursoId === null ? await panel.crearCurso(enviar) : await panel.editarCurso(cursoId, enviar);
      inicial.current = firma(b);
      onGuardado(curso, nuevo);
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length) {
        const delServidor = Object.fromEntries(Object.entries(e.fieldErrors).map(([k, v]) => [k, Array.isArray(v) ? v.join(" ") : String(v)]));
        setErrores(delServidor);
        mostrarError(delServidor);
      } else if (e instanceof ApiError && e.sinSesion) {
        setGeneral("La sesión venció. Ingresá de nuevo: lo que escribiste se pierde si cerrás esta pestaña.");
      } else {
        setGeneral(e instanceof ApiError && e.message ? e.message : "No se pudo guardar. Revisá la conexión y probá de nuevo.");
      }
    } finally {
      setGuardando(false);
    }
  };

  const listo = b !== null;
  const d = b?.datos;
  const pie = !listo ? null : preguntaSalir ? (
    <div role="alertdialog" aria-label="Cambios sin guardar" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-ink-900">Tenés cambios sin guardar. ¿Los descartás?</p>
      <div className="flex gap-2">
        <BotonFicha variante="contorno" onClick={() => setPreguntaSalir(false)}>Seguir editando</BotonFicha>
        <BotonFicha variante="peligro" onClick={onCerrar}>Descartar</BotonFicha>
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      {general && <p role="alert" className="rounded-[12px] border border-status-error/35 bg-status-error/10 px-3 py-2 text-sm text-status-error">{general}</p>}
      <div className="flex items-center justify-between gap-2">
        <span className="hidden text-xs text-neutral-700 sm:block">Paso {paso + 1} de {PASOS.length}{cambiado ? " · con cambios sin guardar" : ""}</span>
        {/* En el celular, de a dos por renglón; el tercero (Guardar) va abajo, a todo el ancho. */}
        <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:flex-none sm:justify-end [&>*]:grid">
          {paso > 0 ? <span><BotonFicha variante="contorno" onClick={() => irA(paso - 1)} deshabilitado={guardando}>Anterior</BotonFicha></span>
            : <span><BotonFicha variante="contorno" onClick={pedirCierre} deshabilitado={guardando}>Cancelar</BotonFicha></span>}
          {!nuevo && paso < REVISAR && <span><BotonFicha variante="contorno" onClick={siguiente} deshabilitado={guardando}>Siguiente</BotonFicha></span>}
          {!nuevo || paso === REVISAR ? (
            <span className={!nuevo && paso < REVISAR ? "col-span-2" : ""}>
              <BotonFicha onClick={() => void guardar()} deshabilitado={guardando || (!nuevo && !cambiado)} icono="tilde">
                {guardando ? "Guardando…" : nuevo ? "Crear curso" : "Guardar cambios"}
              </BotonFicha>
            </span>
          ) : <span><BotonFicha onClick={siguiente}>Siguiente</BotonFicha></span>}
        </div>
      </div>
    </div>
  );

  return (
    <Ficha abierta={abierta} origen={origen} onSalida={onSalida} onCerrar={pedirCierre} pie={pie}
      sobre={nuevo ? "Catálogo · Nuevo curso" : "Catálogo · Editar curso"}
      titulo={<span className="line-clamp-2 sm:line-clamp-none">{d?.title.trim() || (nuevo ? "Curso nuevo" : "Curso")}</span>}
      chips={d && (
        <>
          <ChipOscuro>{MODALIDAD[d.modality]}</ChipOscuro>
          <ChipOscuro punto={d.is_published ? "bg-status-success" : "bg-neutral-0/50"}>{d.is_published ? "Publicado" : "Borrador"}</ChipOscuro>
          {d.code && <ChipOscuro>{d.code}</ChipOscuro>}
        </>
      )}>
      <div ref={cuerpo} className="flex flex-col gap-4">
        {!listo ? (
          detalle.estado.tipo === "cargando" || detalle.estado.tipo === "listo" ? (
            <div aria-busy="true" className="flex flex-col gap-4">
              <span className="h-12 rounded-[14px] bg-ink-50" />
              <span className="h-64 rounded-[16px] bg-ink-50" />
            </div>
          ) : (
            <EstadoNoListo estado={detalle.estado} recargar={detalle.recargar} noEncontrado={{ texto: "No encontramos ese curso.", volver: <button type="button" onClick={onCerrar} className="text-sm font-semibold text-brand-600 underline">Volver a la lista</button> }} />
          )
        ) : (
          <>
            <div data-cascada><IndicadorPasos pasos={PASOS} actual={paso} alcanzado={alcanzado} alIr={irA} etiqueta="Pasos del curso" /></div>
            <form data-cascada noValidate onSubmit={(e) => { e.preventDefault(); if (nuevo && paso < REVISAR) siguiente(); else void guardar(); }}>
              <PanelesPasos actual={paso} nombres={PASOS}>
                <PasoDatos b={b!} errores={errores} categorias={categorias} poner={poner} alSalir={alSalir}
                  slugTocado={slugTocado} tocarSlug={() => setSlugTocado(true)} />
                <PasoPrecio b={b!} errores={errores} poner={poner} ponerTexto={ponerTexto} alSalir={alSalir} />
                <PasoFicha b={b!} errores={errores} poner={poner} />
                <PasoTemario b={b!} errores={errores} poner={poner} ponerTexto={ponerTexto} />
                <PasoRevisar b={b!} categorias={categorias} nuevo={nuevo} alIr={irA} />
              </PanelesPasos>
              {/* Enter en un campo avanza o guarda, como el botón principal. */}
              <button type="submit" hidden aria-hidden tabIndex={-1} />
            </form>
          </>
        )}
      </div>
    </Ficha>
  );
}

// --- Los campos ---------------------------------------------------------------------------------------------------

const CAMPO = "min-h-[44px] w-full rounded-[10px] border bg-neutral-0 px-3 text-base text-ink-900 outline-none transition-colors duration-150 placeholder:text-neutral-500 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 sm:text-sm";
const conError = (e?: string) => `${CAMPO} ${e ? "border-status-error" : "border-ink-200"}`;

function Campo({ id, etiqueta, ayuda, error, children, ancho = false }: { id: string; etiqueta: string; ayuda?: ReactNode; error?: string; children: ReactNode; ancho?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${ancho ? "sm:col-span-2" : ""}`}>
      <label htmlFor={`curso-${id}`} className="font-sub text-xs font-semibold text-ink-900">{etiqueta}</label>
      {children}
      {error ? <p id={`curso-${id}-error`} role="alert" className="text-sm text-status-error">{error}</p>
        : ayuda ? <p id={`curso-${id}-ayuda`} className="text-xs text-neutral-700">{ayuda}</p> : null}
    </div>
  );
}
const describe = (id: string, error?: string, ayuda?: unknown) => (error ? `curso-${id}-error` : ayuda ? `curso-${id}-ayuda` : undefined);

type Poner = <K extends keyof CursoDatos>(k: K, v: CursoDatos[K]) => void;
type PonerTexto = (k: "precio" | "precioUsd" | "temario", v: string, campo: string) => void;
interface PasoProps { b: Borrador; errores: Record<string, string>; poner: Poner }

function Texto({ b, errores, poner, id, etiqueta, ayuda, ancho, alSalir }: PasoProps & { id: "title" | "code" | "code_suffix" | "lead" | "instructor_names" | "instructor_role" | "level" | "pdf_url"; etiqueta: string; ayuda?: string; ancho?: boolean; alSalir?: (c: string) => void }) {
  return (
    <Campo id={id} etiqueta={etiqueta} ayuda={ayuda} error={errores[id]} ancho={ancho}>
      <input id={`curso-${id}`} value={b.datos[id]} onChange={(e) => poner(id, e.target.value)} onBlur={() => alSalir?.(id)}
        aria-invalid={!!errores[id]} aria-describedby={describe(id, errores[id], ayuda)} className={conError(errores[id])}
        {...(id === "pdf_url" ? { type: "url", inputMode: "url" as const } : {})} />
    </Campo>
  );
}

function Area({ b, errores, poner, id, etiqueta, ayuda, filas }: PasoProps & { id: "summary" | "description" | "objectives"; etiqueta: string; ayuda?: string; filas: number }) {
  return (
    <Campo id={id} etiqueta={etiqueta} ayuda={ayuda} error={errores[id]} ancho>
      <textarea id={`curso-${id}`} rows={filas} value={b.datos[id]} onChange={(e) => poner(id, e.target.value)}
        aria-invalid={!!errores[id]} aria-describedby={describe(id, errores[id], ayuda)} className={`${conError(errores[id])} py-2.5 leading-relaxed`} />
    </Campo>
  );
}

/** Un grupo de opciones como pastillas (radios): se ven todas de una. */
function Opciones<V extends string>({ id, etiqueta, valor, opciones, onCambiar, error, ayuda }: { id: string; etiqueta: string; valor: V; opciones: { valor: V; texto: string }[]; onCambiar: (v: V) => void; error?: string; ayuda?: string }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5" aria-describedby={describe(id, error, ayuda)}>
      <legend className="mb-1.5 font-sub text-xs font-semibold text-ink-900">{etiqueta}</legend>
      <div className="flex flex-wrap gap-1.5">
        {opciones.map((o, i) => (
          <label key={o.valor} className={`relative inline-flex min-h-[40px] cursor-pointer items-center rounded-full px-3.5 font-sub text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 focus-within:ring-2 focus-within:ring-brand-500 ${
            o.valor === valor ? "bg-ink-900 text-neutral-0" : "bg-neutral-0 text-ink-900 ring-1 ring-ink-200 [@media(hover:hover)]:hover:ring-ink-900"
          }`}>
            <input type="radio" name={id} id={i === 0 ? `curso-${id}` : undefined} value={o.valor} checked={o.valor === valor} onChange={() => onCambiar(o.valor)} className="sr-only" />
            {o.texto}
          </label>
        ))}
      </div>
      {error ? <p id={`curso-${id}-error`} role="alert" className="text-sm text-status-error">{error}</p>
        : ayuda ? <p id={`curso-${id}-ayuda`} className="text-xs text-neutral-700">{ayuda}</p> : null}
    </fieldset>
  );
}

/** Una casilla grande, con su explicación abajo. */
function Casilla({ id, titulo, texto, valor, onCambiar }: { id: string; titulo: string; texto: string; valor: boolean; onCambiar: (v: boolean) => void }) {
  return (
    <label htmlFor={`curso-${id}`} className={`flex min-h-[64px] cursor-pointer items-start gap-3 rounded-[14px] border p-3.5 transition-colors duration-150 focus-within:ring-2 focus-within:ring-brand-500 ${valor ? "border-ink-900 bg-ink-50" : "border-ink-200 bg-neutral-0"}`}>
      <input id={`curso-${id}`} type="checkbox" checked={valor} onChange={(e) => onCambiar(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-500" />
      <span className="min-w-0">
        <span className="block font-sub text-sm font-semibold text-ink-900">{titulo}</span>
        <span className="block text-xs text-neutral-700">{texto}</span>
      </span>
    </label>
  );
}

const grilla = "grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2";

function PasoDatos({ b, errores, poner, categorias, alSalir, slugTocado, tocarSlug }: PasoProps & { categorias: Categoria[]; alSalir: (c: string) => void; slugTocado: boolean; tocarSlug: () => void }) {
  const d = b.datos;
  return (
    <div className={grilla}>
      <Campo id="title" etiqueta="Título" error={errores.title} ancho>
        {/* Dos renglones: un título largo se lee entero. Sin saltos de línea (Enter avanza, como en un campo). */}
        <textarea id="curso-title" rows={2} maxLength={200} value={d.title} onBlur={() => alSalir("title")} aria-invalid={!!errores.title} aria-describedby={describe("title", errores.title)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
          onChange={(e) => { const t = e.target.value.replace(/\s*\n\s*/g, " "); poner("title", t); if (!slugTocado) poner("slug", aSlug(t)); }}
          className={`${conError(errores.title)} resize-none py-2.5 leading-snug`} />
      </Campo>
      <Campo id="slug" etiqueta="Dirección en el sitio" error={errores.slug} ayuda={<span className="[overflow-wrap:anywhere]">/cursos/{d.slug || "…"}</span>} ancho>
        <input id="curso-slug" value={d.slug} onBlur={() => alSalir("slug")} aria-invalid={!!errores.slug} aria-describedby={describe("slug", errores.slug, true)}
          onChange={(e) => { tocarSlug(); poner("slug", aSlug(e.target.value)); }} className={conError(errores.slug)} />
      </Campo>
      <Texto b={b} errores={errores} poner={poner} id="code" etiqueta="Código" ayuda="Por ejemplo CV57" alSalir={alSalir} />
      <Campo id="category" etiqueta="Categoría" error={errores.category}>
        <select id="curso-category" value={d.category || ""} onChange={(e) => poner("category", Number(e.target.value))} onBlur={() => alSalir("category")}
          aria-invalid={!!errores.category} aria-describedby={describe("category", errores.category)} className={conError(errores.category)}>
          <option value="">Elegí una</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Campo>
      <div className="sm:col-span-2">
        <Opciones id="modality" etiqueta="Modalidad" valor={d.modality} error={errores.modality}
          opciones={[...MODALIDADES, ...(d.modality === "WORKSHOP" ? (["WORKSHOP"] as Modalidad[]) : [])].map((m) => ({ valor: m, texto: MODALIDAD[m]! }))} onCambiar={(m) => poner("modality", m)}
          ayuda={d.modality === "WORKSHOP" ? "El sitio ya no tiene talleres: su página da error. Cambiale la modalidad o dejalo sin publicar."
            : d.modality === "LIVE" || d.modality === "WEBINAR" ? "Las fechas se agregan desde la tarjeta del curso, después de guardarlo." : undefined} />
      </div>
      {d.modality === "LIVE" && <Texto b={b} errores={errores} poner={poner} id="code_suffix" etiqueta="Mes y año del código" ayuda="Por ejemplo NOV/27" />}
    </div>
  );
}

function PasoPrecio({ b, errores, poner, ponerTexto, alSalir }: PasoProps & { ponerTexto: PonerTexto; alSalir: (c: string) => void }) {
  const d = b.datos;
  return (
    <div className={grilla}>
      <Campo id="price" etiqueta="Precio en pesos" error={errores.price} ayuda="Por ejemplo 48000 o 48000,50. Un webinar gratis va en 0.">
        <input id="curso-price" inputMode="decimal" value={b.precio} onChange={(e) => ponerTexto("precio", e.target.value, "price")} onBlur={() => alSalir("price")}
          aria-invalid={!!errores.price} aria-describedby={describe("price", errores.price, true)} className={`${conError(errores.price)} tabular-nums`} />
      </Campo>
      <Campo id="price_usd" etiqueta="Precio en dólares (opcional)" error={errores.price_usd} ayuda="Para quien paga desde afuera.">
        <input id="curso-price_usd" inputMode="decimal" value={b.precioUsd} onChange={(e) => ponerTexto("precioUsd", e.target.value, "price_usd")} onBlur={() => alSalir("price_usd")}
          aria-invalid={!!errores.price_usd} aria-describedby={describe("price_usd", errores.price_usd, true)} className={`${conError(errores.price_usd)} tabular-nums`} />
      </Campo>
      <Opciones id="badge" etiqueta="Etiqueta en el sitio" valor={d.badge} opciones={ETIQUETAS} onCambiar={(v) => poner("badge", v)} error={errores.badge} />
      <Campo id="position" etiqueta="Posición en las listas" error={errores.position} ayuda="El número más chico va primero.">
        <input id="curso-position" type="number" min={0} inputMode="numeric" value={d.position} onChange={(e) => poner("position", Number(e.target.value) || 0)}
          aria-invalid={!!errores.position} aria-describedby={describe("position", errores.position, true)} className={`${conError(errores.position)} tabular-nums`} />
      </Campo>
      <Casilla id="is_published" titulo="Publicado en el sitio" texto="Se ve en la lista de cursos y se puede comprar." valor={d.is_published} onCambiar={(v) => poner("is_published", v)} />
      <Casilla id="is_featured" titulo="Destacado" texto="Se muestra entre los destacados del sitio." valor={d.is_featured} onCambiar={(v) => poner("is_featured", v)} />
    </div>
  );
}

function PasoFicha({ b, errores, poner }: PasoProps) {
  return (
    <div className={grilla}>
      <Texto b={b} errores={errores} poner={poner} id="lead" etiqueta="Bajada" ayuda="Frase corta arriba de la ficha. Si queda vacía, el sitio arma un resumen." ancho />
      <Area b={b} errores={errores} poner={poner} id="summary" etiqueta="Resumen" filas={2} ayuda="El texto de la tarjeta del curso en las listas." />
      <Area b={b} errores={errores} poner={poner} id="description" etiqueta="Descripción" filas={5} />
      <Area b={b} errores={errores} poner={poner} id="objectives" etiqueta="Objetivos" filas={4} />
    </div>
  );
}

function PasoTemario({ b, errores, poner, ponerTexto }: PasoProps & { ponerTexto: PonerTexto }) {
  const d = b.datos;
  const puntos = b.temario.split("\n").map((l) => l.trim()).filter(Boolean);
  const modulos = puntos.filter((p) => /^m[óo]dulo/i.test(p)).length;
  return (
    <div className={grilla}>
      <Campo id="syllabus" etiqueta="Temario" error={errores.syllabus} ancho
        ayuda={`Un punto por línea. Los que empiezan con «MÓDULO» son módulos.${puntos.length ? ` Van ${puntos.length} ${puntos.length === 1 ? "punto" : "puntos"}${modulos ? `, ${modulos} ${modulos === 1 ? "módulo" : "módulos"}` : ""}.` : ""}`}>
        <textarea id="curso-syllabus" rows={7} value={b.temario} onChange={(e) => ponerTexto("temario", e.target.value, "syllabus")}
          aria-invalid={!!errores.syllabus} aria-describedby={describe("syllabus", errores.syllabus, true)} className={`${conError(errores.syllabus)} py-2.5 leading-relaxed`} />
      </Campo>
      <Texto b={b} errores={errores} poner={poner} id="instructor_names" etiqueta="Disertantes" />
      <Texto b={b} errores={errores} poner={poner} id="instructor_role" etiqueta="Cargo del disertante" />
      <Texto b={b} errores={errores} poner={poner} id="level" etiqueta="Nivel" />
      <Campo id="duration_hours" etiqueta="Duración (horas)" error={errores.duration_hours}>
        <input id="curso-duration_hours" type="number" min={0} inputMode="numeric" value={d.duration_hours ?? ""}
          onChange={(e) => poner("duration_hours", e.target.value === "" ? null : Number(e.target.value))}
          aria-invalid={!!errores.duration_hours} aria-describedby={describe("duration_hours", errores.duration_hours)} className={`${conError(errores.duration_hours)} tabular-nums`} />
      </Campo>
      <Texto b={b} errores={errores} poner={poner} id="pdf_url" etiqueta="Link al PDF del curso" ayuda="Por ejemplo, de Drive. Si queda vacío, el sitio ofrece la ficha para imprimir." ancho />
    </div>
  );
}

/** Todo lo cargado, por paso, con «Cambiar» para volver a cada uno. */
function PasoRevisar({ b, categorias, nuevo, alIr }: { b: Borrador; categorias: Categoria[]; nuevo: boolean; alIr: (n: number) => void }) {
  const d = b.datos;
  const p = plataTexto(b.precio);
  const u = b.precioUsd.trim() ? plataTexto(b.precioUsd) : null;
  const puntos = b.temario.split("\n").map((l) => l.trim()).filter(Boolean);
  const vacio = <span className="text-neutral-500">Sin cargar</span>;
  const corto = (t: string) => (t.trim() ? <span className="line-clamp-2 [overflow-wrap:anywhere]">{t}</span> : vacio);
  const bloques: { paso: number; filas: [string, ReactNode][] }[] = [
    { paso: 0, filas: [
      ["Título", d.title || vacio], ["Dirección", <span key="s" className="[overflow-wrap:anywhere]">/cursos/{d.slug || "…"}</span>], ["Código", `${d.code || "—"}${d.modality === "LIVE" && d.code_suffix ? ` · ${d.code_suffix}` : ""}`],
      ["Categoría", categorias.find((c) => c.id === d.category)?.name ?? vacio], ["Modalidad", MODALIDAD[d.modality]],
    ] },
    { paso: 1, filas: [
      ["Precio", p ? `${p === "0.00" && !u ? "Gratis" : plata(p)}${u ? ` · ${plata(u, "USD")}` : ""}` : vacio], ["Etiqueta", ETIQUETAS.find((e) => e.valor === d.badge)?.texto],
      ["En el sitio", `${d.is_published ? "Publicado" : "Sin publicar"}${d.is_featured ? " · destacado" : ""} · posición ${d.position}`],
    ] },
    { paso: 2, filas: [["Bajada", corto(d.lead)], ["Resumen", corto(d.summary)], ["Descripción", corto(d.description)], ["Objetivos", corto(d.objectives)]] },
    { paso: 3, filas: [
      ["Temario", puntos.length ? `${puntos.length} ${puntos.length === 1 ? "punto" : "puntos"}` : vacio], ["Disertantes", corto(d.instructor_names)],
      ["Nivel y duración", [d.level, d.duration_hours ? `${d.duration_hours} h` : ""].filter(Boolean).join(" · ") || vacio], ["PDF", d.pdf_url ? "Link cargado" : "La ficha para imprimir"],
    ] },
  ];
  return (
    <div className="flex flex-col gap-3 pt-1">
      {nuevo && !d.is_published && (
        <p className="rounded-[12px] bg-ink-50 px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-100">Se crea sin publicar: revisalo y publicalo desde su tarjeta cuando esté listo.</p>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {bloques.map((bl) => (
          <section key={bl.paso} aria-label={PASOS[bl.paso]} className="flex min-w-0 flex-col gap-2 rounded-[16px] border border-ink-100 p-4">
            <div className="flex items-center justify-between gap-2">
              <Rotulo>{PASOS[bl.paso]}</Rotulo>
              <button type="button" onClick={() => alIr(bl.paso)} className="min-h-[36px] rounded-[8px] px-2 font-sub text-sm font-semibold text-brand-600 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [@media(hover:hover)]:hover:underline">
                Cambiar
              </button>
            </div>
            <dl className="flex flex-col gap-1.5">
              {bl.filas.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2 text-sm">
                  <dt className="text-neutral-700">{k}</dt>
                  <dd className="min-w-0 font-semibold text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
