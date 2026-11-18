"use client";

/* ──────────────────────────────────────────────────────────────────────────────
 * Humo del ingreso (referencia elegida por Mateo el 2026-11-18: «Smoke Login» de 21st.dev,
 * https://21st.dev/@aakashmehra/components/smoke-login). Hecho acá desde cero con WebGL, sin
 * librerías: un solo programa que dibuja ruido deformado sobre sí mismo (fbm con «domain warping»),
 * en azul tinta con hilos naranjas de ELEVAR, y que se arremolina alrededor del puntero.
 * Cuidados: se dibuja a una fracción de la resolución, se frena cuando la pestaña no está a la
 * vista o el lienzo sale de pantalla, con movimiento reducido queda un cuadro quieto, y si el
 * navegador no tiene WebGL queda el degradé del contenedor.
 * ────────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";

const VERTICES = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAGMENTOS = `
precision mediump float;
uniform vec2 r;      // tamaño del lienzo en píxeles
uniform float t;     // segundos
uniform vec2 m;      // puntero, de 0 a 1
uniform float mi;    // fuerza del remolino del puntero, de 0 a 1

float hash(vec2 q) {
  q = fract(q * vec2(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}
float ruido(vec2 q) {
  vec2 i = floor(q), f = fract(q);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 q) {
  float v = 0.0, a = 0.5;
  mat2 giro = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * ruido(q); q = giro * q * 2.02; a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / r;
  float aspecto = r.x / r.y;
  vec2 q = vec2(uv.x * aspecto, uv.y);
  vec2 pm = vec2(m.x * aspecto, m.y);

  // Remolino alrededor del puntero.
  vec2 d = q - pm;
  float giro = mi * exp(-dot(d, d) * 7.0) * 2.4;
  float s = sin(giro), c = cos(giro);
  q = pm + mat2(c, -s, s, c) * d;

  float tt = t * 0.05;
  vec2 a = vec2(fbm(q * 1.5 + vec2(0.0, tt)), fbm(q * 1.5 + vec2(5.2, -tt * 1.3)));
  vec2 b = vec2(fbm(q * 1.5 + 3.4 * a + vec2(1.7, 9.2) + tt * 0.8), fbm(q * 1.5 + 3.4 * a + vec2(8.3, 2.8) - tt * 0.6));
  float f = fbm(q * 1.5 + 3.4 * b);

  vec3 tinta = vec3(0.043, 0.118, 0.200);   // ink-900
  vec3 humo = vec3(0.290, 0.355, 0.430);    // gris azulado
  vec3 naranja = vec3(0.914, 0.306, 0.106); // brand-500

  vec3 col = mix(tinta, humo, smoothstep(0.30, 0.95, f));
  // Hilos naranjas: una curva de nivel fina del campo deformado.
  float hilo = smoothstep(0.03, 0.0, abs(b.x - 0.6)) * smoothstep(0.35, 0.75, f);
  col = mix(col, naranja, hilo * 0.95);
  // Un resplandor naranja suave donde el humo es más denso.
  col += naranja * pow(smoothstep(0.5, 1.05, f), 3.0) * 0.35;
  // Viñeta hacia el azul en los bordes.
  col = mix(col, tinta, smoothstep(0.45, 1.05, length(uv - 0.5) * 1.35));
  gl_FragColor = vec4(col, 1.0);
}
`;

function compilar(gl: WebGLRenderingContext, tipo: number, fuente: string) {
  const sh = gl.createShader(tipo);
  if (!sh) return null;
  gl.shaderSource(sh, fuente);
  gl.compileShader(sh);
  return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
}

/** Lienzo de humo que llena a su contenedor. `resolucion`: fracción de los píxeles reales. */
export function Humo({ className, resolucion = 0.5 }: { className?: string; resolucion?: number }) {
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = lienzo.current;
    const gl = cv?.getContext("webgl", { antialias: false, premultipliedAlpha: false, powerPreference: "low-power" });
    if (!cv || !gl) return; // sin WebGL queda el degradé del contenedor

    const vs = compilar(gl, gl.VERTEX_SHADER, VERTICES);
    const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAGMENTOS);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");
    const uM = gl.getUniformLocation(prog, "m");
    const uMi = gl.getUniformLocation(prog, "mi");

    const medir = () => {
      const escala = Math.min(window.devicePixelRatio || 1, 2) * resolucion;
      cv.width = Math.max(1, Math.round(cv.clientWidth * escala));
      cv.height = Math.max(1, Math.round(cv.clientHeight * escala));
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(uR, cv.width, cv.height);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(cv);

    // Puntero: posición suavizada y fuerza que sube al moverse y se apaga sola.
    const puntero = { x: 0.6, y: 0.5, ax: 0.6, ay: 0.5, fuerza: 0, objetivo: 0 };
    const mover = (e: PointerEvent) => {
      const rc = cv.getBoundingClientRect();
      puntero.x = (e.clientX - rc.left) / rc.width;
      puntero.y = 1 - (e.clientY - rc.top) / rc.height;
      puntero.objetivo = 1;
    };
    window.addEventListener("pointermove", mover);

    const quieto = prefersReducedMotion();
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(cv);

    let id = 0;
    const inicio = performance.now();
    const dibujar = (ahora: number) => {
      const t = quieto ? 24 : (ahora - inicio) / 1000 + 24;
      puntero.ax += (puntero.x - puntero.ax) * 0.06;
      puntero.ay += (puntero.y - puntero.ay) * 0.06;
      puntero.fuerza += (puntero.objetivo - puntero.fuerza) * 0.04;
      puntero.objetivo *= 0.985;
      gl.uniform1f(uT, t);
      gl.uniform2f(uM, puntero.ax, puntero.ay);
      gl.uniform1f(uMi, quieto ? 0 : puntero.fuerza);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const bucle = (ahora: number) => {
      if (visible && !document.hidden) dibujar(ahora);
      id = requestAnimationFrame(bucle);
    };
    if (quieto) dibujar(performance.now());
    else id = requestAnimationFrame(bucle);

    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", mover);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [resolucion]);

  return <canvas ref={lienzo} aria-hidden className={`block h-full w-full ${className ?? ""}`} />;
}
