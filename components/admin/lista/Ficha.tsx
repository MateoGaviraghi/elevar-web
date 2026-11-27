"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { SCROLL_FINO, Trama } from "../inicio/piezas";

/**
 * La ficha del portal CESS (su D-030 y su TarjetaModal): tocar una fila abre una tarjeta al centro, con la
 * cabecera azul, el nombre, sus chips y «↑ ↓ para recorrer · Esc para cerrar».
 *
 * Movimiento (2026-11-25, Mateo: «sigue sin entrar de manera inmersiva… entra trabada»), igual al portal:
 * - Crece desde la fila que se tocó (`origen`): 0,55 s, expo.out. La cabecera azul viene puesta desde el primer
 *   cuadro y su texto aparece a los 0,06 s (2026-11-25: antes llegaba a los 0,32 s y la tarjeta crecía blanca);
 *   el cuerpo aparece a los 0,16 s y sus partes (`[data-cascada]`) entran una detrás de otra desde los 0,22 s.
 * - Sin fila a la vista (se abrió por dirección): crece desde la mitad de su tamaño y 40 px más abajo (0,42 s).
 * - Al cerrar vuelve a su fila (0,38 s) y recién ahí se desmonta (`onSalida`).
 * - La animación arranca dos cuadros después de montar, para que el montaje no se coma los primeros cuadros.
 * - Con «menos movimiento», solo aparece y desaparece (0,15 s).
 * En el celular ocupa la pantalla y sube desde abajo.
 */
export function Ficha({ abierta, sobre, posicion, titulo, chips, onCerrar, onAnterior, onSiguiente, onSalida, origen, pie, chica = false, children }: FichaProps) {
  const fondo = useRef<HTMLDivElement>(null);
  const tarjeta = useRef<HTMLDivElement>(null);
  const interior = useRef<HTMLDivElement>(null);
  const textoCabeza = useRef<HTMLDivElement>(null);
  const [enCliente, setEnCliente] = useState(false);
  const [montada, setMontada] = useState(abierta);
  if (abierta && !montada) setMontada(true);
  const alOrigen = useRef(origen);
  const alSalir = useRef(onSalida);
  useLayoutEffect(() => {
    alOrigen.current = origen;
    alSalir.current = onSalida;
  });
  useEffect(() => setEnCliente(true), []);

  // Teclado: Esc cierra, ↑ ↓ recorren (si no se está escribiendo) y Tab no se escapa de la tarjeta.
  useEffect(() => {
    if (!abierta) return;
    const tecla = (e: KeyboardEvent) => {
      const escribiendo = (e.target as HTMLElement).closest("input, textarea, select, [contenteditable]");
      if (e.key === "Escape") return e.preventDefault(), onCerrar();
      if (!escribiendo && e.key === "ArrowUp" && onAnterior) return e.preventDefault(), onAnterior();
      if (!escribiendo && e.key === "ArrowDown" && onSiguiente) return e.preventDefault(), onSiguiente();
      if (e.key === "Tab" && tarjeta.current) {
        const foco = [...tarjeta.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex='-1'])")];
        if (!foco.length) return;
        const [primero, ultimo] = [foco[0]!, foco[foco.length - 1]!];
        if (e.shiftKey && document.activeElement === primero) return e.preventDefault(), ultimo.focus();
        if (!e.shiftKey && document.activeElement === ultimo) return e.preventDefault(), primero.focus();
      }
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [abierta, onCerrar, onAnterior, onSiguiente]);

  useEffect(() => {
    if (!montada) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, [montada]);

  useLayoutEffect(() => {
    const v = fondo.current;
    const t = tarjeta.current;
    const adentro = interior.current;
    const texto = textoCabeza.current;
    if (!montada || !v || !t || !adentro || !texto) return;
    gsap.killTweensOf([v, t, adentro, texto]);
    const quieto = prefersReducedMotion();
    const partes = () => Array.from(t.querySelectorAll<HTMLElement>("[data-cascada]"));
    if (abierta) {
      gsap.set(t, { clearProps: "transform,transformOrigin,opacity" });
      gsap.set([adentro, texto], { clearProps: "opacity" });
      const o = quieto ? null : alOrigen.current?.();
      gsap.set(v, { opacity: 0 });
      if (aLaVista(o)) {
        gsap.set(t, { ...encima(t.getBoundingClientRect(), o), transformOrigin: "0 0", opacity: 1 });
        gsap.set([adentro, texto], { opacity: 0 });
      } else gsap.set(t, quieto ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 40 });
      t.focus({ preventScroll: true });
      let cuadro = requestAnimationFrame(() => {
        cuadro = requestAnimationFrame(() => {
          if (quieto) {
            gsap.to([v, t], { opacity: 1, duration: 0.15 });
            return;
          }
          gsap.to(v, { opacity: 1, duration: 0.3, ease: "power2.out" });
          if (aLaVista(o)) {
            gsap.to(t, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.55, ease: "expo.out", clearProps: "transform,transformOrigin" });
            gsap.to(texto, { opacity: 1, duration: 0.2, delay: 0.06, ease: "power1.out", clearProps: "opacity" });
            gsap.to(adentro, { opacity: 1, duration: 0.22, delay: 0.16, ease: "power1.out", clearProps: "opacity" });
            gsap.fromTo(partes(), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, delay: 0.22, ease: "power3.out", clearProps: "opacity,transform" });
          } else {
            gsap.to(t, { scale: 1, y: 0, duration: 0.42, ease: "expo.out", clearProps: "transform" });
            gsap.to(t, { opacity: 1, duration: 0.15, ease: "none" });
            gsap.fromTo(partes(), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.32, stagger: 0.045, delay: 0.14, ease: "power3.out", clearProps: "opacity,transform" });
          }
        });
      });
      return () => cancelAnimationFrame(cuadro);
    }
    const fin = () => {
      setMontada(false);
      alSalir.current?.();
    };
    if (quieto) {
      gsap.to([v, t], { opacity: 0, duration: 0.15, onComplete: fin });
      return;
    }
    const o = alOrigen.current?.();
    if (aLaVista(o)) {
      // De vuelta a su fila: lo de adentro se apaga y la tarjeta se achica sobre el rectángulo de la fila.
      gsap.set(t, { transformOrigin: "0 0" });
      gsap.to([adentro, texto], { opacity: 0, duration: 0.12, ease: "power1.in" });
      gsap.to(t, { ...encima(t.getBoundingClientRect(), o), duration: 0.38, delay: 0.05, ease: "power3.inOut" });
      gsap.to(t, { opacity: 0, duration: 0.12, delay: 0.33, ease: "none" });
      gsap.to(v, { opacity: 0, duration: 0.3, delay: 0.1, ease: "power2.in", onComplete: fin });
      return;
    }
    gsap.to(t, { scale: 0.8, opacity: 0, duration: 0.18, ease: "power2.in" });
    gsap.to(v, { opacity: 0, duration: 0.2, ease: "power2.in", onComplete: fin });
  }, [abierta, montada, enCliente]);

  if (!montada || !enCliente) return null;
  return createPortal(
    <div className={`fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6 ${abierta ? "" : "pointer-events-none"}`}>
      <div ref={fondo} aria-hidden onClick={onCerrar} className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]" />
      <div ref={tarjeta} role="dialog" aria-modal="true" aria-labelledby="ficha-titulo" tabIndex={-1}
        className={`relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[22px] bg-neutral-0 shadow-[0_30px_80px_-24px_rgba(11,30,51,.55)] outline-none will-change-transform sm:max-h-[min(90dvh,820px)] sm:rounded-[22px] ${chica ? "sm:max-w-[520px]" : "sm:max-w-[1040px] lg:h-[min(88dvh,760px)]"}`}>
        <header className="relative shrink-0 bg-ink-900 px-5 pb-3.5 pt-3.5 text-neutral-0 sm:px-6">
          <Trama />
          <div ref={textoCabeza} className="relative">
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-sub text-[11px] font-semibold uppercase tracking-wider text-brand-300">
                  {sobre}{posicion && <span className="text-neutral-0"> · {posicion}</span>}
                </p>
                {(onAnterior || onSiguiente) && <p className="mt-0.5 hidden text-xs text-neutral-0/70 sm:block">↑ ↓ para recorrer · Esc para cerrar</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {onAnterior && <BotonCabecera etiqueta="Anterior" onClick={onAnterior}><path d="m5 12.5 5-5 5 5" /></BotonCabecera>}
                {onSiguiente && <BotonCabecera etiqueta="Siguiente" onClick={onSiguiente}><path d="m5 7.5 5 5 5-5" /></BotonCabecera>}
                <BotonCabecera etiqueta="Cerrar" onClick={onCerrar}><path d="m5.5 5.5 9 9M14.5 5.5l-9 9" /></BotonCabecera>
              </div>
            </div>
            <h2 id="ficha-titulo" className="relative mt-1 break-words font-display text-2xl font-semibold tracking-tight">{titulo}</h2>
            {chips && <div className="relative mt-2 flex flex-wrap items-center gap-2">{chips}</div>}
          </div>
        </header>
        <div ref={interior} className="flex min-h-0 flex-1 flex-col">
          <div className={`min-h-0 flex-1 px-5 py-4 sm:px-6 ${SCROLL_FINO}`}>{children}</div>
          {pie && <footer data-cascada className="shrink-0 border-t border-ink-100 px-5 py-3 sm:px-6">{pie}</footer>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

const aLaVista = (r: DOMRect | null | undefined): r is DOMRect => !!r && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
/** La tarjeta puesta encima de la fila: corrida y achicada hasta calzar con ese rectángulo. */
const encima = (caja: DOMRect, o: DOMRect) => ({ x: o.left - caja.left, y: o.top - caja.top, scaleX: o.width / caja.width, scaleY: o.height / caja.height });

interface FichaProps {
  abierta: boolean;
  sobre: string;
  posicion?: string;
  titulo: ReactNode;
  chips?: ReactNode;
  onCerrar: () => void;
  onAnterior?: () => void;
  onSiguiente?: () => void;
  /** Se llama cuando terminó la salida y la tarjeta se desmontó. */
  onSalida?: () => void;
  /** El rectángulo de la fila que la abrió: la tarjeta crece desde ahí y vuelve ahí. */
  origen?: () => DOMRect | null;
  pie?: ReactNode;
  /** Una tarjeta angosta y del alto de su contenido (formularios cortos: Mi cuenta). */
  chica?: boolean;
  children: ReactNode;
}

function BotonCabecera({ etiqueta, onClick, children }: { etiqueta: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={etiqueta} title={etiqueta} onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full text-neutral-0/85 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-400 [@media(hover:hover)]:hover:bg-neutral-0/10 [@media(hover:hover)]:hover:text-neutral-0">
      <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>
    </button>
  );
}

/** Un dato de la ficha en su tarjeta, con un ícono en un cuadro, como «Cliente» y «Actualizado» del portal. */
export function DatoFicha({ icono, etiqueta, children, destacado = false, accion }: { icono: ReactNode; etiqueta: string; children: ReactNode; destacado?: boolean; accion?: ReactNode }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-[16px] border p-3.5 ${destacado ? "border-ink-200 bg-ink-50" : "border-ink-100 bg-neutral-0"}`}>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[12px] ${destacado ? "bg-ink-900 text-neutral-0" : "bg-ink-50 text-ink-900"}`}>{icono}</span>
      <div className="min-w-0 flex-1">
        <p className="font-sub text-[11px] font-semibold uppercase tracking-wider text-ink-500">{etiqueta}</p>
        <div className="break-words text-sm font-semibold text-ink-900">{children}</div>
      </div>
      {accion && <div className="shrink-0">{accion}</div>}
    </div>
  );
}

/**
 * Un aviso abajo al centro con «Deshacer» (control 5 del plugin: lo que se puede volver atrás se hace al
 * toque, sin preguntar). Dura 6 s; se queda mientras el mouse o el foco están encima.
 */
export function useAviso() {
  const [aviso, setAviso] = useState<{ texto: string; deshacer?: () => void; id: number } | null>(null);
  const caja = useRef<HTMLDivElement>(null);
  const quieto = useRef(false);
  const avisar = useCallback((texto: string, deshacer?: () => void) => setAviso({ texto, deshacer, id: Date.now() }), []);

  useEffect(() => {
    if (!aviso) return;
    const t = setInterval(() => !quieto.current && Date.now() - aviso.id > 6000 && setAviso(null), 500);
    return () => clearInterval(t);
  }, [aviso]);

  useLayoutEffect(() => {
    if (!aviso || !caja.current || prefersReducedMotion()) return;
    gsap.fromTo(caja.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.22, ease: "power3.out" });
  }, [aviso]);

  const nodo = aviso ? (
    <div ref={caja} role="status" onPointerEnter={() => (quieto.current = true)} onPointerLeave={() => (quieto.current = false)}
      onFocus={() => (quieto.current = true)} onBlur={() => (quieto.current = false)}
      className="fixed bottom-5 left-1/2 z-[90] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-[14px] bg-ink-900 py-2 pl-4 pr-2 text-sm text-neutral-0 shadow-[0_18px_40px_-12px_rgba(11,30,51,.6)]">
      <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden className="shrink-0 text-brand-400">
        <path d="m4.5 10.5 3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="min-w-0">{aviso.texto}</span>
      {aviso.deshacer && (
        <button type="button" onClick={() => { aviso.deshacer!(); setAviso(null); }}
          className="min-h-[36px] shrink-0 rounded-[10px] px-3 font-sub text-sm font-semibold text-brand-300 outline-none focus-visible:ring-2 focus-visible:ring-brand-400 [@media(hover:hover)]:hover:bg-neutral-0/10">
          Deshacer
        </button>
      )}
    </div>
  ) : null;
  return { aviso: nodo, avisar };
}
