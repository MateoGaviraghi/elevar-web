"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "@/lib/admin/api";
import type { Categoria, CursoDatos } from "@/lib/admin/tipos";
import { adminButtonClasses } from "./ui";

/** Formulario de un curso (05-PANTALLAS, «/admin/cursos/[id]»). Plata siempre como texto. */

export const CURSO_VACIO: CursoDatos = {
  code: "",
  title: "",
  slug: "",
  summary: "",
  lead: "",
  description: "",
  objectives: "",
  syllabus: [],
  category: 0,
  modality: "ASYNC",
  price: "0.00",
  price_usd: null,
  currency: "ARS",
  level: "",
  duration_hours: null,
  instructor_names: "",
  instructor_role: "",
  pdf_url: "",
  code_suffix: "",
  position: 0,
  is_published: false,
  is_featured: false,
  badge: "",
};

const PLATA = /^\d{1,10}([.,]\d{1,2})?$/;

/** «48.000,5» o «48000.5» → «48000.50». Nunca pasa por Number (08: nada de float para plata). */
function plataTexto(valor: string): string | null {
  const limpio = valor.trim().replace(/\.(?=\d{3}(\D|$))/g, "");
  if (!PLATA.test(limpio)) return null;
  const [entero, dec = ""] = limpio.replace(",", ".").split(".");
  return `${entero.replace(/^0+(?=\d)/, "")}.${dec.padEnd(2, "0")}`;
}

function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 200);
}

function Campo({ id, etiqueta, children, ayuda, error }: CampoProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{etiqueta}</label>
      {children}
      {ayuda && !error && <p className="text-xs text-neutral-500">{ayuda}</p>}
      {error && <p role="alert" className="text-sm text-status-error">{error}</p>}
    </div>
  );
}

interface CampoProps {
  id: string;
  etiqueta: string;
  children: ReactNode;
  ayuda?: string;
  error?: string;
}

export function CursoFormulario({ inicial, categorias, textoBoton, onGuardar }: CursoFormularioProps) {
  const [datos, setDatos] = useState<CursoDatos>(inicial);
  const [precio, setPrecio] = useState(inicial.price);
  const [precioUsd, setPrecioUsd] = useState(inicial.price_usd ?? "");
  const [temario, setTemario] = useState(inicial.syllabus.join("\n"));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [slugTocado, setSlugTocado] = useState(Boolean(inicial.slug));

  const poner = <K extends keyof CursoDatos>(k: K, v: CursoDatos[K]) => setDatos((d) => ({ ...d, [k]: v }));

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const price = plataTexto(precio);
    const priceUsd = precioUsd.trim() === "" ? null : plataTexto(precioUsd);
    const propios: Record<string, string> = {};
    if (price === null) propios.price = "Escribí un monto, por ejemplo 48000 o 48000,50.";
    if (precioUsd.trim() !== "" && priceUsd === null) propios.price_usd = "Escribí un monto, por ejemplo 35 o 35,50.";
    if (!datos.category) propios.category = "Elegí una categoría.";
    if (Object.keys(propios).length) return setErrores(propios);

    setGuardando(true);
    setErrores({});
    try {
      await onGuardar({
        ...datos,
        price: price as string,
        price_usd: priceUsd,
        syllabus: temario.split("\n").map((l) => l.trim()).filter(Boolean),
      });
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length) {
        setErrores(Object.fromEntries(Object.entries(e.fieldErrors).map(([k, v]) => [k, Array.isArray(v) ? v.join(" ") : String(v)])));
      } else {
        setErrores({ general: e instanceof ApiError ? e.message : "Algo falló. Reintentá." });
      }
    } finally {
      setGuardando(false);
    }
  }

  const campo = (error?: string) =>
    `min-h-[44px] w-full border bg-neutral-50 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none ${error ? "border-status-error" : "border-neutral-200"}`;

  const texto = (id: keyof CursoDatos, etiqueta: string, ayuda?: string) => (
    <Campo id={id} etiqueta={etiqueta} ayuda={ayuda} error={errores[id]}>
      <input id={id} value={String(datos[id] ?? "")} onChange={(e) => poner(id, e.target.value as never)} className={campo(errores[id])} />
    </Campo>
  );

  const area = (id: keyof CursoDatos, etiqueta: string, filas = 4) => (
    <Campo id={id} etiqueta={etiqueta} error={errores[id]}>
      <textarea id={id} rows={filas} value={String(datos[id] ?? "")} onChange={(e) => poner(id, e.target.value as never)} className={campo(errores[id])} />
    </Campo>
  );

  return (
    <form onSubmit={enviar} className="flex flex-col gap-6" noValidate>
      {errores.general && <p role="alert" className="border border-status-error/40 bg-status-error/10 px-4 py-3 text-sm text-status-error">{errores.general}</p>}

      <fieldset className="grid grid-cols-1 gap-4 border border-neutral-200 bg-neutral-0 p-4 sm:grid-cols-2 sm:p-6">
        <legend className="px-1 font-display text-lg font-semibold text-ink-900">Datos principales</legend>
        <Campo id="title" error={errores.title} etiqueta="Título">
          <input
            id="title"
            value={datos.title}
            onChange={(e) => {
              poner("title", e.target.value);
              if (!slugTocado) poner("slug", slug(e.target.value));
            }}
            className={campo(errores.title)}
          />
        </Campo>
        <Campo id="slug" error={errores.slug} etiqueta="Dirección en el sitio" ayuda={`/cursos/${datos.slug || "…"}`}>
          <input id="slug" value={datos.slug} onChange={(e) => { setSlugTocado(true); poner("slug", slug(e.target.value)); }} className={campo(errores.slug)} />
        </Campo>
        {texto("code", "Código", "Por ejemplo CV57")}
        {texto("code_suffix", "Mes y año del código", "Solo en vivo, por ejemplo NOV/27")}
        <Campo id="category" error={errores.category} etiqueta="Categoría">
          <select id="category" value={datos.category || ""} onChange={(e) => poner("category", Number(e.target.value))} className={campo(errores.category)}>
            <option value="">Elegí una</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Campo>
        <Campo id="modality" error={errores.modality} etiqueta="Modalidad">
          <select id="modality" value={datos.modality} onChange={(e) => poner("modality", e.target.value as CursoDatos["modality"])} className={campo(errores.modality)}>
            <option value="ASYNC">Asincrónico</option>
            <option value="LIVE">En vivo</option>
            <option value="WEBINAR">Webinar</option>
            <option value="WORKSHOP">Taller</option>
          </select>
        </Campo>
        <Campo id="price" error={errores.price} etiqueta="Precio en pesos">
          <input id="price" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} className={campo(errores.price)} />
        </Campo>
        <Campo id="price_usd" error={errores.price_usd} etiqueta="Precio en dólares (opcional)">
          <input id="price_usd" inputMode="decimal" value={precioUsd} onChange={(e) => setPrecioUsd(e.target.value)} className={campo(errores.price_usd)} />
        </Campo>
        <Campo id="badge" error={errores.badge} etiqueta="Etiqueta">
          <select id="badge" value={datos.badge} onChange={(e) => poner("badge", e.target.value as CursoDatos["badge"])} className={campo(errores.badge)}>
            <option value="">Ninguna</option>
            <option value="NUEVO">Nuevo</option>
            <option value="PROXIMO">Próximo</option>
          </select>
        </Campo>
        <Campo id="position" error={errores.position} etiqueta="Posición en las listas" ayuda="El número más chico va primero">
          <input id="position" type="number" min={0} value={datos.position} onChange={(e) => poner("position", Number(e.target.value) || 0)} className={campo(errores.position)} />
        </Campo>
        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:gap-6">
          <label className="flex min-h-[44px] items-center gap-3 text-sm text-ink-900">
            <input type="checkbox" checked={datos.is_published} onChange={(e) => poner("is_published", e.target.checked)} className="h-5 w-5 accent-brand-500" />
            Publicado en el sitio
          </label>
          <label className="flex min-h-[44px] items-center gap-3 text-sm text-ink-900">
            <input type="checkbox" checked={datos.is_featured} onChange={(e) => poner("is_featured", e.target.checked)} className="h-5 w-5 accent-brand-500" />
            Destacado
          </label>
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 border border-neutral-200 bg-neutral-0 p-4 sm:grid-cols-2 sm:p-6">
        <legend className="px-1 font-display text-lg font-semibold text-ink-900">Ficha</legend>
        <div className="sm:col-span-2">{texto("lead", "Bajada", "Frase corta arriba de la ficha")}</div>
        <div className="sm:col-span-2">{area("summary", "Resumen", 2)}</div>
        <div className="sm:col-span-2">{area("description", "Descripción", 6)}</div>
        <div className="sm:col-span-2">{area("objectives", "Objetivos", 4)}</div>
        <div className="sm:col-span-2">
          <Campo id="syllabus" error={errores.syllabus} etiqueta="Temario" ayuda="Un punto por línea. Los que empiezan con «MÓDULO» son módulos.">
            <textarea id="syllabus" rows={6} value={temario} onChange={(e) => setTemario(e.target.value)} className={campo(errores.syllabus)} />
          </Campo>
        </div>
        {texto("instructor_names", "Disertantes")}
        {texto("instructor_role", "Cargo del disertante")}
        {texto("level", "Nivel")}
        <Campo id="duration_hours" error={errores.duration_hours} etiqueta="Duración (horas)">
          <input id="duration_hours" type="number" min={0} value={datos.duration_hours ?? ""} onChange={(e) => poner("duration_hours", e.target.value === "" ? null : Number(e.target.value))} className={campo(errores.duration_hours)} />
        </Campo>
        <div className="sm:col-span-2">{texto("pdf_url", "Link al PDF del curso", "Por ejemplo, de Drive. Si queda vacío, el sitio ofrece la ficha para imprimir")}</div>
      </fieldset>

      <div>
        <button type="submit" disabled={guardando} className={adminButtonClasses("primary")}>
          {guardando ? "Guardando…" : textoBoton}
        </button>
      </div>
    </form>
  );
}

interface CursoFormularioProps {
  inicial: CursoDatos;
  categorias: Categoria[];
  textoBoton: string;
  onGuardar: (datos: CursoDatos) => Promise<void>;
}
