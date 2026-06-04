"use client";

import {
  Children,
  cloneElement,
  CSSProperties,
  ElementType,
  isValidElement,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { prefersReducedMotion } from "@/lib/gsap";

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** px a recorrer en el eje Y */
  y?: number;
  /** si se setea, anima los hijos directos con este stagger (segundos) */
  stagger?: number;
  delay?: number;
  as?: ElementType;
  /** Aceptado por compatibilidad; ya no se usa (reveal por IntersectionObserver). */
  start?: string;
}

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const DUR = 0.6;

/**
 * Reveal fade + slide-up al entrar en viewport.
 *
 * Implementado con IntersectionObserver + transiciones CSS (NO GSAP ScrollTrigger):
 * el estado "visible" es un boolean de React, así que nunca puede revertirse a
 * opacity:0 por un refresh de ScrollTrigger, un reflow de fuentes o un Fast Refresh.
 * Incluye un timer de seguridad que fuerza la visibilidad pasado un umbral.
 */
export function Reveal({
  children,
  className,
  y = 24,
  stagger,
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Sin animación posible (reduce-motion o navegador sin IO): mostrar ya.
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) {
      setShown(true);
      return;
    }

    // Si ya está en viewport al montar (above-fold, o carga a mitad de página por
    // un ancla/scroll restaurado): revelar enseguida, sin depender de que el IO
    // dispare. Garantiza que nada se quede en blanco arriba.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setShown(true);
      return;
    }

    let io: IntersectionObserver | null = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io?.disconnect();
          io = null;
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);

    // NOTA: sin timer de "revelar todo". Un timeout global revela las secciones de
    // más abajo aunque sigas en el hero, y al scrollear ya están reveladas → se
    // pierde la animación. El IO dispara solo, y de inmediato para lo que ya está
    // en viewport, así que arriba entra al cargar y abajo entra al hacer scroll.
    return () => io?.disconnect();
  }, []);

  const style = (i: number): CSSProperties => ({
    opacity: shown ? 1 : 0,
    transform: shown ? "none" : `translateY(${y}px)`,
    transition: `opacity ${DUR}s ${EASE}, transform ${DUR}s ${EASE}`,
    transitionDelay: `${delay + (stagger ? i * stagger : 0)}s`,
    willChange: "opacity, transform",
  });

  // Con stagger: animar cada hijo directo (los que aceptan `style`); los que no,
  // simplemente quedan visibles (nunca ocultos).
  if (stagger != null) {
    return (
      <Tag ref={ref as never} className={className}>
        {Children.map(children, (child, i) =>
          isValidElement(child)
            ? cloneElement(child as React.ReactElement, {
                style: { ...(child.props as { style?: CSSProperties }).style, ...style(i) },
              })
            : child
        )}
      </Tag>
    );
  }

  return (
    <Tag ref={ref as never} className={className} style={style(0)}>
      {children}
    </Tag>
  );
}
