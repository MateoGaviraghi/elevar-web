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

export type RevealVariant = "up" | "fade" | "scale" | "blur" | "left" | "right";

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Tipo de entrada. Permite que no todas las secciones animen igual. */
  variant?: RevealVariant;
  /** px a recorrer (para up/left/right/blur). */
  y?: number;
  /** si se setea, anima los hijos directos con este stagger (segundos) */
  stagger?: number;
  delay?: number;
  /** duración en segundos */
  duration?: number;
  as?: ElementType;
  /** Aceptado por compatibilidad; ya no se usa. */
  start?: string;
}

// easeOutExpo: arranca rápido y desacelera suave. Lectura premium, sin rebote.
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function fromTransform(variant: RevealVariant, d: number): string {
  switch (variant) {
    case "up":
      return `translateY(${d}px)`;
    case "blur":
      return `translateY(${Math.round(d * 0.6)}px)`;
    case "left":
      return `translateX(-${d}px)`;
    case "right":
      return `translateX(${d}px)`;
    case "scale":
      return "scale(0.94)";
    case "fade":
    default:
      return "none";
  }
}

/**
 * Reveal de entrada al viewport (fade + movimiento), con variantes.
 *
 * IntersectionObserver + transiciones CSS: el estado "visible" es un boolean de
 * React, así que nunca se revierte a opacity:0 por un refresh, reflow de fuentes
 * o Fast Refresh. Lo que ya está en viewport al montar se revela enseguida (nada
 * queda en blanco); lo de más abajo entra al hacer scroll. Sin timer global.
 */
export function Reveal({
  children,
  className,
  variant = "up",
  y = 28,
  stagger,
  delay = 0,
  duration = 0.8,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) {
      setShown(true);
      return;
    }
    // Ya visible al montar (above-fold / carga a mitad de página): revelar ya.
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
    return () => io?.disconnect();
  }, []);

  const style = (i: number): CSSProperties => ({
    opacity: shown ? 1 : 0,
    transform: shown ? "none" : fromTransform(variant, y),
    filter: shown ? "blur(0px)" : variant === "blur" ? "blur(12px)" : "blur(0px)",
    transition:
      `opacity ${duration}s ${EASE}, transform ${duration}s ${EASE}` +
      (variant === "blur" ? `, filter ${duration}s ${EASE}` : ""),
    transitionDelay: `${delay + (stagger ? i * stagger : 0)}s`,
    willChange: "opacity, transform",
  });

  // Con stagger: animar cada hijo directo que acepte `style`.
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
