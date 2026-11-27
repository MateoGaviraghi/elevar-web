"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { plata } from "@/lib/admin/formato";
import type { AvisoCobro, Inicio, TipoAviso } from "@/lib/admin/tipos";
import { TIPO_AVISO } from "../avisos";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { pegar } from "@/lib/texto";
import { Icono } from "../iconos";

/**
 * Urgente (2026-11-24, «quiero como lo tiene el portal de CESS»: su `PilaUrgente`, D-045 del portal).
 * Cerrada es una pila de vidrio dentro de la banda azul: la urgencia más grave al frente, dos asomando detrás
 * y abajo cuántas hay. Un toque la abre en una bandeja agrupada (Urgente / Para mirar) donde cada fila empieza
 * por su dato (las horas que faltan, los días que lleva esperando), que cuenta desde 0. Se cierra con Esc, con
 * la cruz o tocando afuera, y el foco vuelve a la pila.
 */

type Nivel = "grave" | "atencion";
interface Urgencia { clave: string; nivel: Nivel; n: string; unidad: string; tipo: string; titulo: string; href: string; accion: string; icono: string }

const HORA = 3_600_000;
const tiempo = (ms: number) => {
  const h = Math.max(0, ms / HORA);
  return h < 24 ? { n: String(Math.max(1, Math.floor(h))), dias: false } : { n: String(Math.floor(h / 24)), dias: true };
};

/** Qué hacer con cada aviso de cobro (2026-11-27). */
const ACCION_AVISO: Record<TipoAviso, string> = {
  MONTO_DISTINTO: "Revisar el pago",
  SIN_LUGAR: "Reubicar o devolver",
  CONFIRMACION_FALLIDA: "Reenviar la confirmación",
  ALERTA_FALLIDA: "Mirar la orden",
  PAGO_SIN_ORDEN: "Ver el pago",
  DEVOLUCION_PARCIAL: "Mirar la orden",
  DEVOLUCION_OTRO_PAGO: "Mirar la orden",
  LUGARES_SIN_NOMBRE: "Pedirle los nombres",
};

/** Los avisos de cobro, uno por tipo: si hay varios del mismo tipo, cuántos y el más viejo; si hay uno, lo abre. */
function urgenciasDeCobro(avisos: AvisoCobro[], ahora: number): Urgencia[] {
  const porTipo = new Map<TipoAviso, AvisoCobro[]>();
  for (const a of avisos) porTipo.set(a.tipo, [...(porTipo.get(a.tipo) ?? []), a]);
  return [...porTipo.entries()].map(([tipo, lista]) => {
    const viejo = lista.reduce((x, y) => (new Date(y.creado) < new Date(x.creado) ? y : x));
    const quien = viejo.orden ? `#${viejo.numero}${viejo.quien ? ` · ${viejo.quien}` : ""}` : `Pago ${viejo.pago}`;
    const t = tiempo(ahora - new Date(viejo.creado).getTime());
    const uno = lista.length === 1;
    return {
      clave: `cobro-${tipo}`, nivel: viejo.nivel,
      n: uno ? (tipo === "LUGARES_SIN_NOMBRE" ? String(viejo.detalle.faltan ?? 1) : t.n) : String(lista.length),
      unidad: uno ? (tipo === "LUGARES_SIN_NOMBRE" ? "sin nombre" : t.dias ? "días abierto" : "h abierto") : "para revisar",
      tipo: TIPO_AVISO[tipo].nombre, titulo: uno ? quien : `El más viejo: ${quien}`,
      href: uno && viejo.orden ? `/admin/ordenes?estado=A_REVISAR&ver=${viejo.orden}` : "/admin/ordenes?estado=A_REVISAR",
      accion: ACCION_AVISO[tipo], icono: TIPO_AVISO[tipo].icono,
    };
  });
}

/** Lo que alguien espera de ELEVAR, de lo más grave a lo menos: arrepentimientos, accesos, problemas de cobro,
 * consultas, compras. */
function urgencias(d: Inicio, ahora: number): Urgencia[] {
  const lista: Urgencia[] = [];
  for (const a of d.arrepentimientos) {
    const resta = new Date(a.vence).getTime() - ahora;
    const t = tiempo(Math.abs(resta));
    lista.push({
      clave: `a${a.id}`, nivel: "grave", n: t.n,
      unidad: resta <= 0 ? (t.dias ? "días vencido" : "h vencido") : "h para vencer",
      tipo: "Arrepentimiento", titulo: a.name, href: `/admin/consultas/${a.id}`, accion: "Responder", icono: "responder",
    });
  }
  if (d.ordenes_sin_cumplir > 0 && d.sin_acceso_desde) {
    const t = tiempo(ahora - new Date(d.sin_acceso_desde).getTime());
    lista.push({
      clave: "acceso", nivel: t.dias ? "grave" : "atencion", n: t.n, unidad: t.dias ? "días sin acceso" : "h sin acceso",
      tipo: "Pagó y no tiene el curso",
      titulo: d.ordenes_sin_cumplir === 1 ? "1 compra pagada espera el acceso al aula" : `${d.ordenes_sin_cumplir} compras pagadas esperan el acceso al aula`,
      href: "/admin/ordenes", accion: "Dar el acceso", icono: "llave",
    });
  }
  lista.push(...urgenciasDeCobro(d.avisos_cobro ?? [], ahora));
  const vieja = d.consultas_viejas[0];
  if (vieja) {
    const t = tiempo(ahora - new Date(vieja.created_at).getTime());
    lista.push({
      clave: `c${vieja.id}`, nivel: "atencion", n: t.n, unidad: t.dias ? "días esperando" : "h esperando",
      tipo: "Consulta sin contestar", titulo: vieja.name, href: `/admin/consultas/${vieja.id}`, accion: "Contestar la más vieja", icono: "espera",
    });
  }
  const { cantidad, ordenes } = d.compras_sin_completar;
  if (cantidad > 0) {
    const o = ordenes[0]!;
    lista.push({
      clave: "intentos", nivel: "atencion", n: String(cantidad), unidad: "sin completar",
      tipo: "Compras para recuperar", titulo: `La última: ${o.buyer_name}, ${plata(o.total, o.currency)}`,
      href: "/admin/ordenes?estado=FAILED", accion: "Escribirles", icono: "moneda",
    });
  }
  return lista;
}

/** Cuántas urgencias hay (para el número de la pestaña «Hoy»). */
export const contarUrgencias = (d: Inicio) => urgencias(d, Date.now()).length;

const resumen = (graves: number, atencion: number) =>
  [graves ? `${graves} ${graves === 1 ? "urgente" : "urgentes"}` : "", atencion ? `${atencion} para mirar` : ""].filter(Boolean).join(" · ");

function Flecha({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Alerta() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" />
    </svg>
  );
}

const COLOR_GRAVE = "#FF6B5E"; // rojo claro que se lee sobre el azul tinta (como el portal)

export function PilaUrgente({ d }: { d: Inicio }) {
  const [ahora] = useState(() => Date.now());
  const lista = urgencias(d, ahora);
  const graves = lista.filter((u) => u.nivel === "grave");
  const atencion = lista.filter((u) => u.nivel === "atencion");
  const ordenadas = [...graves, ...atencion];
  const n = ordenadas.length;

  const [abierta, setAbierta] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});
  const raiz = useRef<HTMLElement>(null);
  const mazo = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const cerrando = useRef(false);

  const medir = useCallback(() => {
    const r = raiz.current?.getBoundingClientRect();
    if (!r) return;
    const ancho = Math.min(Math.max(r.width, 400), innerWidth - 32);
    const izq = Math.min(Math.max(16, r.left + r.width / 2 - ancho / 2), innerWidth - 16 - ancho);
    setPos({ position: "absolute", top: r.top + scrollY, left: izq + scrollX, width: ancho });
  }, []);

  const cerrar = useCallback(() => {
    const p = panel.current;
    if (!p || cerrando.current) return;
    const fin = () => {
      cerrando.current = false;
      setAbierta(false);
      mazo.current?.focus({ preventScroll: true });
    };
    if (prefersReducedMotion()) return fin();
    cerrando.current = true;
    const filas = p.querySelectorAll<HTMLElement>("[data-fila]");
    const alto = filas[0]?.offsetHeight ?? 64;
    gsap.to(filas, { y: (i: number) => -i * (alto - 8), opacity: (i: number) => (i < 3 ? 1 : 0), duration: 0.22, ease: "power2.in" });
    gsap.to(p, { opacity: 0, duration: 0.2, delay: 0.08, onComplete: fin });
  }, []);

  // Al abrir: las tarjetas salen de la pila y caen a su lugar; el número de cada una cuenta desde 0 (0,6 s).
  useLayoutEffect(() => {
    const p = panel.current;
    if (!abierta || !p) return;
    p.focus({ preventScroll: true });
    if (prefersReducedMotion()) return;
    const filas = p.querySelectorAll<HTMLElement>("[data-fila]");
    const alto = filas[0]?.offsetHeight ?? 64;
    const tl = gsap.timeline();
    tl.fromTo(p, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" });
    tl.fromTo(p.querySelectorAll("[data-grupo]"), { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.12, clearProps: "opacity,transform" }, 0.1);
    tl.fromTo(filas,
      { y: (i: number) => -i * (alto - 8), scale: (i: number) => 1 - Math.min(i, 3) * 0.04, opacity: (i: number) => (i < 3 ? 1 - i * 0.25 : 0) },
      { y: 0, scale: 1, opacity: 1, duration: 0.55, ease: "back.out(1.3)", stagger: 0.035, clearProps: "transform,opacity" }, 0);
    p.querySelectorAll<HTMLElement>("[data-cuenta]").forEach((el, i) => {
      const fin = Number(el.dataset.cuenta);
      const o = { v: 0 };
      tl.to(o, { v: fin, duration: 0.6, ease: "power2.out", onUpdate: () => void (el.textContent = String(Math.round(o.v))) }, 0.15 + i * 0.035);
    });
    return () => void tl.progress(1).kill();
  }, [abierta]);

  // Esc y tocar afuera la cierran; si cambia el tamaño de la ventana, se reubica.
  useEffect(() => {
    if (!abierta) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    const toque = (e: PointerEvent) => {
      const x = e.target as Node;
      if (!panel.current?.contains(x) && !mazo.current?.contains(x)) cerrar();
    };
    addEventListener("keydown", tecla);
    addEventListener("pointerdown", toque);
    addEventListener("resize", medir);
    return () => {
      removeEventListener("keydown", tecla);
      removeEventListener("pointerdown", toque);
      removeEventListener("resize", medir);
    };
  }, [abierta, cerrar, medir]);

  if (n === 0) {
    return (
      <section aria-label="Urgente" className="inline-flex items-center gap-3 rounded-full border border-neutral-0/15 bg-neutral-0/[0.08] py-2 pl-2 pr-5">
        <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-[#C9F27B] text-ink-900">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
        </span>
        <span>
          <strong className="block font-sub text-base">Nada urgente</strong>
          <span className="block text-sm text-neutral-0/75">{pegar("Nadie está esperando una respuesta.")}</span>
        </span>
      </section>
    );
  }

  const primera = ordenadas[0]!;
  const grave = primera.nivel === "grave";

  const grupo = (titulo: string, items: Urgencia[], nivel: Nivel) => items.length > 0 && (
    <div className="flex flex-col gap-2">
      <p data-grupo className="flex items-center gap-2 font-sub text-xs font-bold uppercase tracking-wider" style={{ color: nivel === "grave" ? COLOR_GRAVE : "#F79268" }}>
        {titulo} <span className="rounded-full bg-neutral-0/10 px-2 py-0.5 text-neutral-0">{items.length}</span>
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((u) => {
          const esNumero = /^\d+$/.test(u.n);
          return (
            <li key={u.clave}>
              <Link href={u.href} data-fila onClick={() => setAbierta(false)}
                aria-label={`${u.tipo}: ${u.titulo}. ${u.n} ${u.unidad}. ${u.accion}`}
                className="group flex items-center gap-3 rounded-[16px] bg-neutral-0/[0.06] p-3 outline-none ring-1 ring-inset ring-neutral-0/10 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-neutral-0 [@media(hover:hover)]:hover:bg-neutral-0/[0.11]">
                <span aria-hidden className="grid w-[5.25rem] shrink-0 sm:w-[6rem] justify-items-center border-r border-neutral-0/10 pr-3 leading-none">
                  <strong data-cuenta={esNumero ? u.n : undefined} className="font-sub text-3xl font-light tabular-nums tracking-tight" style={{ color: u.nivel === "grave" ? COLOR_GRAVE : "#F79268" }}>{u.n}</strong>
                  <span className="mt-1 whitespace-nowrap text-center text-[11px] font-semibold text-neutral-0/70">{u.unidad}</span>
                </span>
                <span aria-hidden className="grid min-w-0 flex-1 gap-0.5">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-0/70">
                    <Icono nombre={u.icono} className="h-4 w-4" acento={u.nivel === "grave" ? COLOR_GRAVE : "#F79268"} />
                    {u.tipo}
                  </span>
                  <span className="truncate text-sm font-semibold text-neutral-0">{pegar(u.titulo)}</span>
                  <span className="font-sub text-xs font-semibold" style={{ color: u.nivel === "grave" ? COLOR_GRAVE : "#F79268" }}>{u.accion}</span>
                </span>
                <span aria-hidden className="text-neutral-0/60 transition-transform duration-300 [@media(hover:hover)]:group-hover:translate-x-1"><Flecha /></span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const bandeja = (
    <div ref={panel} style={pos} role="dialog" aria-label="Urgente" tabIndex={-1}
      className="z-[60] flex max-h-[min(36rem,80vh)] flex-col gap-4 overflow-hidden rounded-[24px] bg-ink-900 pt-5 text-neutral-0 shadow-[0_0_0_1px_rgba(255,255,255,.1)_inset,0_28px_56px_rgba(10,14,30,.42)] outline-none [background-image:radial-gradient(26rem_12rem_at_0%_0%,rgba(255,107,94,.16),transparent_70%)]">
      <header className="flex items-start justify-between gap-3 px-5">
        <div>
          <h3 className="font-display text-2xl font-semibold">Urgente</h3>
          <p className="mt-0.5 text-sm text-neutral-0/70">{resumen(graves.length, atencion.length)}</p>
        </div>
        <button type="button" onClick={cerrar} aria-label="Cerrar"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-0/10 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-neutral-0 [@media(hover:hover)]:hover:bg-neutral-0/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </header>
      <div className="flex flex-col gap-5 overflow-y-auto overscroll-contain pb-10 pl-4 pr-2 [mask-image:linear-gradient(to_bottom,#000_calc(100%-2.5rem),transparent)] [scrollbar-color:rgba(255,255,255,.18)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-0/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
        {grupo("Urgente", graves, "grave")}
        {grupo("Para mirar", atencion, "atencion")}
      </div>
    </div>
  );

  return (
    <section ref={raiz} aria-label="Urgente" className="w-full min-w-0 max-w-[30rem]">
      <button ref={mazo} type="button" aria-expanded={abierta} aria-haspopup="dialog"
        onClick={() => {
          if (abierta) return cerrar();
          medir();
          setAbierta(true);
        }}
        className="group flex w-full flex-col gap-2 rounded-[18px] border border-neutral-0/15 bg-neutral-0/[0.08] p-2 text-left text-neutral-0 outline-none backdrop-blur-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-neutral-0 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 [@media(hover:hover)]:hover:bg-neutral-0/[0.12]">
        <span className="relative block">
          {n > 2 && <span aria-hidden className="absolute inset-0 z-[1] translate-y-[0.9rem] scale-[0.9] rounded-[16px] bg-[#24364B] opacity-45 shadow-[0_8px_20px_rgba(0,0,0,.3)] transition-transform duration-300 [@media(hover:hover)]:group-hover:translate-y-[1.2rem]" />}
          {n > 1 && <span aria-hidden className="absolute inset-0 z-[1] translate-y-[0.45rem] scale-[0.95] rounded-[16px] bg-[#24364B] opacity-75 shadow-[0_8px_20px_rgba(0,0,0,.3)] transition-transform duration-300 [@media(hover:hover)]:group-hover:translate-y-[0.6rem]" />}
          <span className="relative z-[2] flex items-center gap-3 rounded-[14px] bg-[#24364B] py-2 pl-2 pr-3 shadow-[0_0_0_1px_rgba(255,255,255,.1)_inset,0_8px_20px_rgba(0,0,0,.3)]">
            <span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${grave ? "text-neutral-0" : "text-brand-300"}`}
              style={grave ? { background: COLOR_GRAVE, boxShadow: "0 0 0 4px rgba(255,107,94,.18)" } : { background: "rgba(247,146,104,.2)" }}>
              {grave ? <Alerta /> : <Icono nombre={primera.icono} className="h-5 w-5" acento="#FFFFFF" />}
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="truncate font-sub text-xs font-bold uppercase tracking-wider" style={{ color: grave ? COLOR_GRAVE : "#F79268" }}>
                {grave ? "Urgente" : "Para mirar"}<span className="hidden text-neutral-0/60 sm:inline"> · {primera.tipo}</span>
              </span>
              <span className="text-xs text-neutral-0/70 sm:hidden">{primera.tipo}</span>
              <span className="line-clamp-2 text-sm font-semibold leading-snug sm:truncate">{primera.titulo}</span>
            </span>
            <span aria-hidden className="grid shrink-0 justify-items-center border-l border-neutral-0/10 pl-3 leading-none">
              <strong className="font-sub text-2xl font-light tabular-nums tracking-tight" style={{ color: grave ? COLOR_GRAVE : "#F79268" }}>{primera.n}</strong>
              <span className="mt-1 text-[10px] font-semibold text-neutral-0/65">{primera.unidad}</span>
            </span>
          </span>
        </span>
        <span className={`flex items-center gap-2 px-1 text-xs font-semibold ${n === 2 ? "mt-1.5" : n > 2 ? "mt-3" : ""}`}>
          <span className="inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 font-sub text-xs font-bold tabular-nums"
            style={graves.length ? { background: COLOR_GRAVE, color: "#fff" } : { background: "#F79268", color: "#0B1E33" }}>{n}</span>
          <span className="whitespace-nowrap">{n === 1 ? "Ver la urgencia" : `Ver las ${n}`}</span>
          <span className="hidden truncate font-normal text-neutral-0/70 before:mr-2 before:content-['·'] sm:inline">{resumen(graves.length, atencion.length)}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
            className={`ml-auto shrink-0 text-neutral-0/70 transition-transform duration-200 ${abierta ? "rotate-180" : "[@media(hover:hover)]:group-hover:translate-y-0.5"}`}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {abierta && createPortal(bandeja, document.body)}
    </section>
  );
}
