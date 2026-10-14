"use client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Curva y tiempos del sitio: lento y parejo, nada rápido de arranque. */
export const EASE = "expo.out";
export const START = "top 78%";

export { gsap, ScrollTrigger, SplitText, useGSAP };

/**
 * Las máscaras de SplitText (`mask: "lines"`) miden lo mismo que el interlineado,
 * y con interlineados apretados (1,04) cortan las colas de g, j, p, y y el "¿".
 * Esto les da aire arriba y abajo sin mover el texto (padding compensado con
 * margen negativo). Las líneas tienen que arrancar a 135 % para quedar ocultas.
 */
export function airMasks(masks: Element[]) {
  gsap.set(masks, { paddingTop: "0.1em", marginTop: "-0.1em", paddingBottom: "0.22em", marginBottom: "-0.22em" });
}
export const LINE_FROM = 135;
