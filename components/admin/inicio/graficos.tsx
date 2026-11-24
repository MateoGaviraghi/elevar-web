"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

/**
 * Gráficos propios del Inicio del panel (2026-11-24): SVG + GSAP, sin librería de gráficos.
 * Reglas (método del portal CESS, 08-MOVIMIENTO): se dibujan una vez al entrar o al cambiar el
 * período, nunca en un refresco; muestran el valor exacto al pasar el mouse o al tocar; con
 * «menos movimiento» quedan quietos y completos.
 */

export const NARANJA = "#E94E1B";
export const NARANJA_OSCURO = "#C43E12";
export const TINTA = "#0B1E33";
export const GRIS_LINEA = "#E5EAEE";

/** Colores de ejes, etiquetas y vacíos según el fondo de la tarjeta: blanco o azul tinta. */
export function paleta(azul = false) {
  return azul
    ? { linea: "rgba(255,255,255,.16)", texto: "rgba(255,255,255,.72)", vacio: "rgba(255,255,255,.12)", guia: "#FFFFFF" }
    : { linea: GRIS_LINEA, texto: "#706F6F", vacio: GRIS_LINEA, guia: TINTA };
}

const miles = new Intl.NumberFormat("es-AR");
export const numero = (n: number) => miles.format(n);

/** El ancho real del contenedor, para dibujar en píxeles sin deformar el texto. */
export function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setAncho(el.clientWidth);
    const ro = new ResizeObserver(() => setAncho(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, ancho] as const;
}

// --- Cifras ------------------------------------------------------------------------------------

/** Un número que cuenta desde 0 al entrar (0,9 s). Cifras tabulares: no empuja lo de al lado. */
export function Cifra({ valor, formato = numero, className, style }: CifraProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = formato(valor);
      return;
    }
    const o = { v: 0 };
    gsap.to(o, {
      v: valor, duration: 0.9, ease: "power3.out",
      onUpdate: () => { el.textContent = formato(Math.round(o.v)); },
    });
  }, { dependencies: [valor] });
  return <span ref={ref} className={`tabular-nums ${className ?? ""}`} style={style}>{formato(valor)}</span>;
}

interface CifraProps {
  valor: number;
  formato?: (n: number) => string;
  className?: string;
  style?: CSSProperties;
}

/**
 * La cifra que rueda (Finance Bento): cada dígito es una columna que gira hasta su número,
 * de derecha a izquierda. El separador de miles queda quieto.
 */
export function CifraRueda({ valor, className }: { valor: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const texto = numero(valor);
  useGSAP(() => {
    const columnas = ref.current?.querySelectorAll<HTMLElement>("[data-columna]");
    if (!columnas?.length) return;
    columnas.forEach((c) => {
      const d = Number(c.dataset.columna);
      const final = -(10 + d);
      if (prefersReducedMotion()) gsap.set(c, { yPercent: (final * 100) / 20 });
      else gsap.fromTo(c, { yPercent: 0 }, { yPercent: (final * 100) / 20, duration: 1.4, ease: "expo.out", delay: 0.1 });
    });
    if (!prefersReducedMotion()) gsap.from([...columnas].reverse(), { opacity: 0, duration: 0.4, stagger: 0.06 });
  }, { dependencies: [valor], scope: ref });
  return (
    <span ref={ref} className={`inline-flex tabular-nums leading-none ${className ?? ""}`} aria-label={texto}>
      {[...texto].map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} aria-hidden className="relative inline-block h-[1em] overflow-hidden">
            <span data-columna={ch} className="flex flex-col">
              {Array.from({ length: 20 }, (_, k) => (
                <span key={k} className="block h-[1em] text-center">{k % 10}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden>{ch}</span>
        ),
      )}
    </span>
  );
}

// --- Detalle al pasar el mouse ------------------------------------------------------------------

function Detalle({ x, y, ancho, children }: { x: number; y: number; ancho: number; children: ReactNode }) {
  const izquierda = Math.min(Math.max(x - 80, 0), Math.max(ancho - 160, 0));
  return (
    <div
      className="pointer-events-none absolute z-10 w-40 rounded-[10px] bg-ink-900 px-3 py-2 text-xs text-neutral-0 shadow-lg"
      style={{ left: izquierda, top: Math.max(y - 56, 0) }}
    >
      {children}
    </div>
  );
}

/** El índice más cercano al puntero (mouse o dedo) sobre una serie de n puntos. */
function useIndice(n: number, x0: number, paso: number) {
  const [i, setI] = useState<number | null>(null);
  const mover = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const k = Math.round((e.clientX - r.left - x0) / paso);
    setI(k >= 0 && k < n ? k : null);
  };
  return { i, mover, salir: () => setI(null) };
}

// --- Líneas -------------------------------------------------------------------------------------

/** Curva suave entre puntos (Catmull-Rom a Bézier), sin pasarse de los extremos en y. */
function curva(p: [number, number][], piso: number) {
  if (p.length < 2) return "";
  let d = `M${p[0]![0]},${p[0]![1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i]!;
    const b = p[i]!;
    const c = p[i + 1]!;
    const e = p[i + 2] ?? c;
    const y1 = Math.min(b[1] + (c[1] - a[1]) / 6, piso);
    const y2 = Math.min(c[1] - (e[1] - b[1]) / 6, piso);
    d += ` C${b[0] + (c[0] - a[0]) / 6},${y1} ${c[0] - (e[0] - b[0]) / 6},${y2} ${c[0]},${c[1]}`;
  }
  return d;
}

/** Escalones con esquinas suaves (Growth Benchmark): cada día es un tramo plano. */
function escalones(p: [number, number][], paso: number) {
  if (!p.length) return "";
  let d = `M${p[0]![0] - paso / 2},${p[0]![1]}`;
  for (let i = 0; i < p.length; i++) {
    const [x, y] = p[i]!;
    const sig = p[i + 1];
    d += ` H${x + paso * 0.15}`;
    if (sig) d += ` C${x + paso * 0.5},${y} ${x + paso * 0.5},${sig[1]} ${x + paso * 0.85},${sig[1]}`;
    else d += ` H${x + paso / 2}`;
  }
  return d;
}

/** Revela un dibujo de izquierda a derecha con un recorte que crece (1,4 s). */
function useRevelar(clip: React.RefObject<SVGRectElement | null>, ancho: number, clave: unknown) {
  useGSAP(() => {
    const r = clip.current;
    if (!r || !ancho) return;
    if (prefersReducedMotion()) gsap.set(r, { attr: { width: ancho } });
    else gsap.fromTo(r, { attr: { width: 0 } }, { attr: { width: ancho }, duration: 1.4, ease: "power2.inOut" });
  }, { dependencies: [ancho, clave] });
}

/**
 * La serie contra la de antes (Growth Benchmark de Evil Charts): la actual en trazo lleno sobre
 * un área rayada; la anterior, punteada. `claro` la dibuja en blanco sobre la tarjeta de color.
 */
export function LineaContraAntes({ actual, antes, etiquetas, detalle, alto = 200, claro = false }: LineaProps) {
  const [caja, ancho] = useAncho<HTMLDivElement>();
  const clip = useRef<SVGRectElement>(null);
  const id = useRef(`l${Math.random().toString(36).slice(2, 8)}`).current;
  const max = Math.max(1, ...actual, ...antes);
  const x0 = 8, abajo = alto - 22, arriba = 10;
  const paso = actual.length > 1 ? (ancho - x0 * 2) / (actual.length - 1) : 0;
  const y = (v: number) => abajo - ((abajo - arriba) * v) / max;
  const pa: [number, number][] = actual.map((v, i) => [x0 + i * paso, y(v)]);
  const pb: [number, number][] = antes.map((v, i) => [x0 + i * paso, y(v)]);
  const linea = escalones(pa, paso);
  const { i, mover, salir } = useIndice(actual.length, x0, paso || 1);
  useRevelar(clip, ancho, actual.join());
  const tinta = claro ? "#FFFFFF" : NARANJA;
  const suave = claro ? "rgba(255,255,255,.65)" : "#929292";
  return (
    <div ref={caja} className="relative w-full" style={{ height: alto }}>
      {ancho > 0 && (
        <svg width={ancho} height={alto} className="block touch-none" onPointerMove={mover} onPointerDown={mover} onPointerLeave={salir} role="img" aria-label="Gráfico de consultas por día">
          <defs>
            <clipPath id={`${id}c`}><rect ref={clip} x={0} y={0} width={0} height={alto} /></clipPath>
            <pattern id={`${id}r`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke={tinta} strokeOpacity={claro ? 0.22 : 0.14} strokeWidth="2" />
            </pattern>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={0} x2={ancho} y1={y(max * f)} y2={y(max * f)} stroke={claro ? "rgba(255,255,255,.18)" : GRIS_LINEA} strokeDasharray="2 4" />
          ))}
          <g clipPath={`url(#${id}c)`}>
            <path d={`${linea} V${abajo} H${x0 - paso / 2} Z`} fill={`url(#${id}r)`} />
            <path d={escalones(pb, paso)} fill="none" stroke={suave} strokeWidth="1.5" strokeDasharray="4 4" />
            <path d={linea} fill="none" stroke={tinta} strokeWidth="2.25" strokeLinejoin="round" />
          </g>
          {etiquetas.map((t, k) =>
            k === 0 || k === etiquetas.length - 1 || k === Math.floor(etiquetas.length / 2) ? (
              <text key={k} x={x0 + k * paso} y={alto - 4} fontSize="11" fill={claro ? "rgba(255,255,255,.8)" : "#706F6F"}
                textAnchor={k === 0 ? "start" : k === etiquetas.length - 1 ? "end" : "middle"}>{t}</text>
            ) : null,
          )}
          {i !== null && (
            <g>
              <line x1={pa[i]![0]} x2={pa[i]![0]} y1={arriba} y2={abajo} stroke={tinta} strokeOpacity=".35" />
              <circle cx={pa[i]![0]} cy={pa[i]![1]} r="4.5" fill={claro ? NARANJA : "#fff"} stroke={tinta} strokeWidth="2" />
            </g>
          )}
        </svg>
      )}
      {i !== null && pa[i] && <Detalle x={pa[i]![0]} y={pa[i]![1]} ancho={ancho}>{detalle(i)}</Detalle>}
    </div>
  );
}

interface LineaProps {
  actual: number[];
  antes: number[];
  etiquetas: string[];
  detalle: (i: number) => ReactNode;
  alto?: number;
  claro?: boolean;
}

/**
 * Área en degradé (Audience Growth de Evil Charts): curva suave que se revela de izquierda a derecha.
 * `meta` dibuja una línea punteada con su texto (el cupo, en el ritmo de inscripción).
 */
export function AreaDegrade({ valores, etiquetas, detalle, alto = 220, azul = false, meta, textoMeta }: AreaProps) {
  const pal = paleta(azul);
  const [caja, ancho] = useAncho<HTMLDivElement>();
  const clip = useRef<SVGRectElement>(null);
  const id = useRef(`a${Math.random().toString(36).slice(2, 8)}`).current;
  const max = Math.max(1, ...valores, meta ?? 0);
  const x0 = 0, abajo = alto - 24, arriba = meta ? 22 : 8;
  const paso = valores.length > 1 ? ancho / (valores.length - 1) : 0;
  const p: [number, number][] = valores.map((v, i) => [x0 + i * paso, abajo - ((abajo - arriba) * v) / max]);
  const d = curva(p, abajo);
  const yMeta = meta ? abajo - ((abajo - arriba) * meta) / max : 0;
  const { i, mover, salir } = useIndice(valores.length, x0, paso || 1);
  useRevelar(clip, ancho, valores.join());
  return (
    <div ref={caja} className="relative w-full" style={{ height: alto }}>
      {ancho > 0 && (
        <svg width={ancho} height={alto} className="block touch-none" onPointerMove={mover} onPointerDown={mover} onPointerLeave={salir} role="img" aria-label="Gráfico de consultas por semana">
          <defs>
            <linearGradient id={`${id}t`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#F79268" />
              <stop offset="1" stopColor={NARANJA_OSCURO} />
            </linearGradient>
            <linearGradient id={`${id}f`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={NARANJA} stopOpacity={azul ? ".4" : ".18"} />
              <stop offset="1" stopColor={NARANJA} stopOpacity="0" />
            </linearGradient>
            <clipPath id={`${id}c`}><rect ref={clip} x={0} y={0} width={0} height={alto} /></clipPath>
          </defs>
          {meta ? (
            <g>
              <line x1={0} x2={ancho} y1={yMeta} y2={yMeta} stroke={pal.guia} strokeOpacity=".45" strokeDasharray="5 5" />
              <text x={ancho} y={yMeta - 7} fontSize="11" textAnchor="end" fill={pal.texto} fontWeight="600">{textoMeta}</text>
            </g>
          ) : null}
          <g clipPath={`url(#${id}c)`}>
            <path d={`${d} V${abajo} H0 Z`} fill={`url(#${id}f)`} />
            <path d={d} fill="none" stroke={`url(#${id}t)`} strokeWidth="3" strokeLinecap="round" />
          </g>
          {etiquetas.map((t, k) => (
            <text key={k} x={(k / Math.max(1, etiquetas.length - 1)) * ancho} y={alto - 4} fontSize="11" fill={pal.texto}
              textAnchor={k === 0 ? "start" : k === etiquetas.length - 1 ? "end" : "middle"}>{t}</text>
          ))}
          {i !== null && p[i] && (
            <g>
              <line x1={p[i]![0]} x2={p[i]![0]} y1={arriba} y2={abajo} stroke={pal.guia} strokeOpacity=".25" />
              <circle cx={p[i]![0]} cy={p[i]![1]} r="5" fill="#fff" stroke={NARANJA} strokeWidth="2.5" />
            </g>
          )}
        </svg>
      )}
      {i !== null && p[i] && <Detalle x={p[i]![0]} y={p[i]![1]} ancho={ancho}>{detalle(i)}</Detalle>}
    </div>
  );
}

interface AreaProps {
  valores: number[];
  etiquetas: string[];
  detalle: (i: number) => ReactNode;
  alto?: number;
  azul?: boolean;
  meta?: number;
  textoMeta?: string;
}

// --- Barras -------------------------------------------------------------------------------------

/** Barras que crecen desde abajo en cascada (0,6 s cada una, 0,03 s entre una y otra). */
export function Barras({ valores, etiquetas, detalle, alto = 220, resaltar, color = NARANJA, apagado = "#FAB99E", mostrarValor = false, azul = false }: BarrasProps) {
  const pal = paleta(azul);
  const [caja, ancho] = useAncho<HTMLDivElement>();
  const grupo = useRef<SVGGElement>(null);
  const max = Math.max(1, ...valores);
  const abajo = alto - 22, arriba = mostrarValor ? 18 : 6;
  const paso = valores.length ? ancho / valores.length : 0;
  const barra = Math.max(3, Math.min(36, paso * 0.62));
  const [i, setI] = useState<number | null>(null);
  useGSAP(() => {
    const rects = grupo.current?.querySelectorAll("rect");
    if (!rects?.length || prefersReducedMotion()) return;
    gsap.fromTo(rects, { scaleY: 0.02, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.6, ease: "power3.out", stagger: Math.min(0.05, 0.9 / rects.length) });
  }, { dependencies: [ancho > 0, valores.join()] });
  // Una etiqueta cada tantas barras como hagan falta para dejar 64 px entre una y otra; la última siempre.
  const cadaEtiqueta = Math.max(1, Math.ceil(64 / Math.max(1, paso)));
  return (
    <div ref={caja} className="relative w-full" style={{ height: alto }}>
      {ancho > 0 && (
        <svg width={ancho} height={alto} className="block touch-none" onPointerLeave={() => setI(null)} role="img" aria-label="Gráfico de barras">
          <line x1={0} x2={ancho} y1={abajo} y2={abajo} stroke={pal.linea} />
          <g ref={grupo}>
            {valores.map((v, k) => {
              const h = Math.max(2, ((abajo - arriba) * v) / max);
              const activa = resaltar === undefined ? k === i : k === resaltar || k === i;
              return (
                <rect key={k} x={k * paso + (paso - barra) / 2} y={abajo - h} width={barra} height={h} rx={Math.min(6, barra / 2)}
                  fill={resaltar === undefined || activa ? color : apagado}
                  onPointerEnter={() => setI(k)} onPointerDown={() => setI(k)} />
              );
            })}
          </g>
          {mostrarValor && valores.map((v, k) => (
            <text key={k} x={k * paso + paso / 2} y={abajo - Math.max(2, ((abajo - arriba) * v) / max) - 5} fontSize="11" textAnchor="middle" fill={pal.texto} className="tabular-nums">{v}</text>
          ))}
          {etiquetas.map((t, k) => {
            const ultima = k === etiquetas.length - 1;
            const toca = k % cadaEtiqueta === 0 && (ultima || etiquetas.length - 1 - k >= cadaEtiqueta);
            if (!toca && !ultima) return null;
            return (
              <text key={k} x={k === 0 ? k * paso + (paso - barra) / 2 : ultima ? k * paso + (paso + barra) / 2 : k * paso + paso / 2} y={alto - 4} fontSize="11"
                textAnchor={k === 0 ? "start" : ultima ? "end" : "middle"} fill={pal.texto}>{t}</text>
            );
          })}
        </svg>
      )}
      {i !== null && <Detalle x={i * paso + paso / 2} y={abajo - ((abajo - arriba) * (valores[i] ?? 0)) / max} ancho={ancho}>{detalle(i)}</Detalle>}
    </div>
  );
}

interface BarrasProps {
  valores: number[];
  etiquetas: string[];
  detalle: (i: number) => ReactNode;
  alto?: number;
  resaltar?: number;
  color?: string;
  apagado?: string;
  mostrarValor?: boolean;
  azul?: boolean;
}

// --- Medidor -------------------------------------------------------------------------------------

/** Medio círculo de rayitas que se prenden hasta la proporción (Finance Bento). Solo para una parte de un total. */
export function Medidor({ parte, total, claro = false }: { parte: number; total: number; claro?: boolean }) {
  const ref = useRef<SVGGElement>(null);
  const n = 40;
  const prendidas = Math.round(Math.min(1, parte / Math.max(1, total)) * n);
  const ancho = 240, alto = 132, cx = 120, cy = 122, r1 = 92, r2 = 112;
  useGSAP(() => {
    const rayas = ref.current?.querySelectorAll("[data-on]");
    if (!rayas?.length || prefersReducedMotion()) return;
    gsap.fromTo(rayas, { stroke: claro ? "rgba(255,255,255,.2)" : GRIS_LINEA }, { stroke: claro ? "#FFFFFF" : NARANJA, duration: 0.25, stagger: 0.03, ease: "none" });
  }, { dependencies: [parte, total] });
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="block w-full max-w-[260px]" role="img" aria-label={`${parte} de ${total}`}>
      <g ref={ref}>
        {Array.from({ length: n }, (_, k) => {
          const a = Math.PI - (Math.PI * k) / (n - 1);
          const on = k < prendidas;
          return (
            <line key={k} {...(on ? { "data-on": "" } : {})}
              x1={cx + r1 * Math.cos(a)} y1={cy - r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy - r2 * Math.sin(a)}
              stroke={on ? (claro ? "#FFFFFF" : NARANJA) : claro ? "rgba(255,255,255,.2)" : GRIS_LINEA} strokeWidth="4" strokeLinecap="round" />
          );
        })}
      </g>
    </svg>
  );
}

// --- Filas horizontales (de dónde vienen las consultas) -----------------------------------------------

/** Una barra por fila, que crece de izquierda a derecha (0,8 s, en cascada); la más grande en naranja. */
export function Filas({ items, azul = false }: { items: { texto: string; n: number }[]; azul?: boolean }) {
  const ref = useRef<HTMLUListElement>(null);
  const max = Math.max(1, ...items.map((x) => x.n));
  const total = items.reduce((a, b) => a + b.n, 0);
  const iMax = items.findIndex((x) => x.n === max);
  useGSAP(() => {
    const barras = ref.current?.querySelectorAll("[data-barra]");
    if (!barras?.length || prefersReducedMotion()) return;
    gsap.fromTo(barras, { scaleX: 0 }, { scaleX: 1, transformOrigin: "0% 50%", duration: 0.8, ease: "power3.out", stagger: 0.1 });
  }, { dependencies: [items.map((x) => x.n).join()], scope: ref });
  return (
    <ul ref={ref} className="flex flex-col gap-4">
      {items.map((x, k) => (
        <li key={x.texto} className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold">{x.texto}</span>
            <span className={`font-sub tabular-nums ${azul ? "text-neutral-0/80" : "text-neutral-700"}`}>
              <b className={azul ? "text-neutral-0" : "text-ink-900"}>{numero(x.n)}</b> · {total ? Math.round((x.n / total) * 100) : 0} %
            </span>
          </span>
          <span className={`h-3 overflow-hidden rounded-full ${azul ? "bg-neutral-0/10" : "bg-ink-50"}`}>
            <span data-barra className={`block h-full rounded-full ${k === iMax && x.n > 0 ? "bg-brand-500" : azul ? "bg-ink-200" : "bg-ink-500"}`}
              style={{ width: `${(x.n / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

// --- Embudo (del webinar a la compra) -------------------------------------------------------------------

/** Dos franjas: todos los que se anotaron y, debajo, la parte que compró, que se angosta al entrar. */
export function Embudo({ arriba, abajo, textoArriba, textoAbajo }: { arriba: number; abajo: number; textoArriba: string; textoAbajo: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const parte = arriba ? Math.max(0.04, abajo / arriba) : 0;
  useGSAP(() => {
    const b = ref.current?.querySelector("[data-abajo]");
    if (!b || prefersReducedMotion()) return;
    gsap.fromTo(b, { width: "100%" }, { width: `${parte * 100}%`, duration: 1.1, ease: "power3.inOut", delay: 0.2 });
  }, { dependencies: [parte], scope: ref });
  return (
    <div ref={ref} className="flex flex-col gap-2" role="img" aria-label={`${textoArriba}: ${arriba}. ${textoAbajo}: ${abajo}.`}>
      <div className="flex h-12 items-center justify-between rounded-[12px] bg-neutral-0/10 px-4">
        <span className="text-sm">{textoArriba}</span>
        <Cifra valor={arriba} className="font-sub text-xl font-bold" />
      </div>
      <div className="flex justify-center">
        <div data-abajo className="flex h-12 min-w-[150px] items-center justify-between gap-3 rounded-[12px] bg-brand-500 px-4" style={{ width: `${parte * 100}%` }}>
          <span className="whitespace-nowrap text-sm font-semibold">{textoAbajo}</span>
          <Cifra valor={abajo} className="font-sub text-xl font-bold" />
        </div>
      </div>
    </div>
  );
}

// --- Mosaico de cursos (Analytics Bento) -------------------------------------------------------------

interface Rect { x: number; y: number; w: number; h: number }

/** Reparte un rectángulo en partes proporcionales, alternando el corte (mosaico simple). */
function repartir(valores: number[], r: Rect): Rect[] {
  if (!valores.length) return [];
  if (valores.length === 1) return [r];
  const total = valores.reduce((a, b) => a + b, 0) || 1;
  let acum = 0, corte = 1;
  for (; corte < valores.length; corte++) {
    acum += valores[corte - 1]!;
    if (acum >= total / 2) break;
  }
  const f = valores.slice(0, corte).reduce((a, b) => a + b, 0) / total;
  const [a, b] = r.w >= r.h
    ? [{ ...r, w: r.w * f }, { ...r, x: r.x + r.w * f, w: r.w * (1 - f) }]
    : [{ ...r, h: r.h * f }, { ...r, y: r.y + r.h * f, h: r.h * (1 - f) }];
  return [...repartir(valores.slice(0, corte), a), ...repartir(valores.slice(corte), b)];
}

const TONOS = [
  { fondo: "#E94E1B", texto: "#FFFFFF" },
  { fondo: "#0B1E33", texto: "#FFFFFF" },
  { fondo: "#FAB99E", texto: "#0B1E33" },
  { fondo: "#1A3247", texto: "#FFFFFF" },
  { fondo: "#9A2F0C", texto: "#FFFFFF" },
  { fondo: "#FDDDD4", texto: "#0B1E33" },
  { fondo: "#C43E12", texto: "#FFFFFF" },
  { fondo: "#DCE4EC", texto: "#0B1E33" },
];

export function MosaicoCursos({ cursos, alto = 320, href }: { cursos: { id: number; curso: string; codigo: string; lugares: number }[]; alto?: number; href: (id: number) => string }) {
  const [caja, ancho] = useAncho<HTMLDivElement>();
  const ref = useRef<HTMLDivElement>(null);
  const rects = repartir(cursos.map((c) => c.lugares), { x: 0, y: 0, w: ancho, h: alto });
  useGSAP(() => {
    const t = ref.current?.querySelectorAll("[data-t]");
    if (!t?.length || prefersReducedMotion()) return;
    gsap.fromTo(t, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.55, ease: "power3.out", stagger: 0.06, clearProps: "opacity,transform" });
  }, { dependencies: [ancho > 0, cursos.map((c) => c.lugares).join()] });
  return (
    <div ref={caja} className="relative w-full" style={{ height: alto }}>
      <div ref={ref}>
        {ancho > 0 && cursos.map((c, k) => {
          const r = rects[k]!;
          const tono = TONOS[k % TONOS.length]!;
          const chico = r.w < 110 || r.h < 80;
          return (
            <a key={c.id} data-t href={href(c.id)} aria-label={`${c.curso}: ${c.lugares} lugares vendidos`}
              className="absolute flex flex-col justify-between overflow-hidden rounded-[14px] p-3 outline-none ring-brand-500 ring-offset-2 transition-[filter] duration-150 focus-visible:ring-2 [@media(hover:hover)]:hover:brightness-110"
              style={{ left: r.x + 2, top: r.y + 2, width: r.w - 4, height: r.h - 4, background: tono.fondo, color: tono.texto }}>
              {!chico && <span className="line-clamp-2 text-xs font-semibold leading-snug opacity-90">{c.curso}</span>}
              <span className="flex items-end justify-between gap-2">
                <Cifra valor={c.lugares} className={`font-display font-semibold leading-none ${chico ? "text-lg" : "text-3xl"}`} />
                {!chico && <span className="rounded-full border border-current px-2 py-0.5 text-[11px] font-semibold opacity-80">{c.codigo}</span>}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// --- Mapa de calor (reaviz) --------------------------------------------------------------------------

const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_LARGOS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

/** Qué días y a qué hora entran consultas (queda para la pantalla de Consultas; el Inicio ya no lo usa): un punto por hora, más grande y más fuerte cuantas más. */
export function MapaCalor({ celdas, desde = 7, hasta = 23, azul = false }: { celdas: { dia: number; hora: number; n: number }[]; desde?: number; hasta?: number; azul?: boolean }) {
  const pal = paleta(azul);
  const [caja, ancho] = useAncho<HTMLDivElement>();
  const grupo = useRef<SVGGElement>(null);
  const horas = hasta - desde + 1;
  const izq = 34, abajo = 18;
  const paso = ancho ? (ancho - izq) / horas : 0;
  const filaAlto = Math.max(22, Math.min(34, paso * 1.15));
  const alto = filaAlto * 7 + abajo;
  const valor = new Map(celdas.map((c) => [`${c.dia}-${c.hora}`, c.n]));
  const max = Math.max(1, ...celdas.map((c) => c.n));
  const [sel, setSel] = useState<{ d: number; h: number } | null>(null);
  useGSAP(() => {
    const p = grupo.current?.querySelectorAll("circle");
    if (!p?.length || prefersReducedMotion()) return;
    gsap.fromTo(p, { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out", stagger: { each: 0.004, grid: [7, horas], from: "start" } });
  }, { dependencies: [ancho > 0, celdas.length] });
  const nSel = sel ? valor.get(`${sel.d}-${sel.h}`) ?? 0 : 0;
  return (
    <div ref={caja} className="relative w-full" style={{ height: alto }}>
      {ancho > 0 && (
        <svg width={ancho} height={alto} className="block touch-none" onPointerLeave={() => setSel(null)} role="img" aria-label="Consultas por día de la semana y hora">
          {DIAS_CORTOS.map((d, k) => <text key={d} x={0} y={filaAlto * k + filaAlto / 2 + 4} fontSize="11" fill={pal.texto}>{d}</text>)}
          <g ref={grupo}>
            {Array.from({ length: 7 }, (_, d) => Array.from({ length: horas }, (_, h) => {
              const n = valor.get(`${d + 1}-${h + desde}`) ?? 0;
              const f = n / max;
              return (
                <circle key={`${d}-${h}`} cx={izq + paso * h + paso / 2} cy={filaAlto * d + filaAlto / 2}
                  r={n ? Math.max(3, (Math.min(paso, filaAlto) / 2 - 1) * (0.45 + 0.55 * f)) : 1.8}
                  fill={n ? NARANJA : pal.vacio} fillOpacity={n ? 0.3 + 0.7 * f : 1}
                  onPointerEnter={() => setSel({ d: d + 1, h: h + desde })} onPointerDown={() => setSel({ d: d + 1, h: h + desde })} />
              );
            }))}
          </g>
          {Array.from({ length: horas }, (_, h) => ((h + desde) % 3 === 0 ? (
            <text key={h} x={izq + paso * h + paso / 2} y={alto - 3} fontSize="11" textAnchor="middle" fill={pal.texto}>{h + desde}</text>
          ) : null))}
        </svg>
      )}
      {sel && (
        <Detalle x={izq + paso * (sel.h - desde) + paso / 2} y={filaAlto * (sel.d - 1)} ancho={ancho}>
          <span className="first-letter:uppercase">{DIAS_LARGOS[sel.d - 1]}</span> a las {sel.h} h: <b>{nSel}</b> {nSel === 1 ? "consulta" : "consultas"}
        </Detalle>
      )}
    </div>
  );
}

// --- Fechas cortas sin Intl de mes (el servidor y el navegador dan textos distintos) -----------------

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const diaCorto = (iso: string) => `${Number(iso.slice(8, 10))} ${MESES[Number(iso.slice(5, 7)) - 1]}`;
export const mesCorto = (iso: string) => MESES[Number(iso.slice(5, 7)) - 1]!;
export const mesLargo = (iso: string) => MESES_LARGOS[Number(iso.slice(5, 7)) - 1]!;
export const diaDeSemana = (iso: string) => DIAS_LARGOS[(new Date(`${iso}T12:00:00`).getDay() + 6) % 7]!;
