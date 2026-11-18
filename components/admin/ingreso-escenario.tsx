"use client";

/* ──────────────────────────────────────────────────────────────────────────────
 * Escenario del ingreso: «Medidor», elegido por Mateo el 2026-11-18 (ronda 2). Fondo azul tinta
 * liso, el formulario a la izquierda y el isotipo de ELEVAR grande a la derecha, todo naranja:
 * los arcos se dibujan y las barras suben como un medidor. Al pasar de la contraseña al código
 * las barras laten; al entrar, el naranja sube hasta llenar la pantalla.
 * Correcciones de Mateo sobre la ronda 2: sin «01 Contraseña / 02 Código / 03 Adentro», sin las
 * líneas horizontales del fondo, el logo todo naranja y «algo más tranqui».
 * Ronda 3 (elegida «Título naranja»; rechazada «Tarjeta naranja»). Ronda 4, por «me quedó
 * insulso»: el título grande en blanco con la última palabra sobre un bloque naranja (brand-600:
 * el blanco sobre brand-500 contrasta 3,6 a 1, sobre brand-600 5,1 a 1), la tarjeta del
 * formulario debajo, y vida en el fondo (barras que respiran, ondas, brillo).
 * Ronda 5 (21st.dev, Mateo eligió «1 y 5»): la mitad derecha es un panel redondeado con humo
 * animado en WebGL (`humo.tsx`, ref. «Smoke Login») y el isotipo encima; las ondas y el brillo
 * de la ronda 4 se van porque el humo los reemplaza. El código sigue a «BeUI OTP Input».
 * ────────────────────────────────────────────────────────────────────────────── */

import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { LOGO_ARCS, LOGO_BARS, LOGO_ORANGE } from "@/components/brand/logo-geometry";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { Humo } from "./humo";
import { IngresoContexto, Oraciones, type IngresoContextoValor } from "./ingreso";

/** Colores de la tarjeta (variables que leen los campos y botones de `ingreso.tsx`). */
const TONO = {
  "--t-titulo": "#0B1E33",
  "--t-texto": "#706F6F",
  "--t-etiqueta": "#706F6F",
  "--c-borde": "#E5EAEE",
  "--c-borde-hover": "#0B1E33",
  "--c-fondo": "#FFFFFF",
  "--c-texto": "#0B1E33",
  "--b-fondo": "#0B1E33",
  "--b-texto": "#FFFFFF",
  "--enlace": "#C43E12",
  "--pie-borde": "#E5EAEE",
  "--error": "#B91C1C",
  "--error-fondo": "rgba(185, 28, 28, 0.08)",
  "--anillo-fondo": "#FFFFFF",
  // El indicador de pasos del primer ingreso va sobre el azul, arriba del título.
  "--paso-texto": "#FFFFFF",
  "--paso-nombre": "rgba(255, 255, 255, 0.85)",
  "--paso-lleno": "#FFFFFF",
  "--paso-vacio": "rgba(255, 255, 255, 0.3)",
} as CSSProperties;

/** Nivel del recorrido según la pantalla: 1 contraseña, 2 código o primer ingreso. */
function useNivel() {
  const ruta = usePathname() ?? "";
  return ruta.includes("/codigo") || ruta.includes("/primer-ingreso") ? 2 : 1;
}

const alTerminar = (tl: gsap.core.Timeline) => new Promise<void>((res) => tl.eventCallback("onComplete", () => res()));

/** El isotipo de ELEVAR, todo naranja: dos arcos que se dibujan y tres barras que suben. */
function IsotipoMedidor({ className }: { className?: string }) {
  // Hay dos (escritorio y celular): cada uno con sus máscaras, o el oculto se lleva las del otro.
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="-12 -12 698 1004" className={className} aria-hidden>
      <defs>
        {LOGO_ARCS.map((a) => (
          <mask key={a.id} id={`${uid}-arco-${a.id}`} maskUnits="userSpaceOnUse" x="-12" y="-12" width="698" height="1004">
            <path className="md-dibujo" d={a.draw} fill="none" stroke="#fff" strokeWidth="96" pathLength={1} strokeDasharray="1 1" />
          </mask>
        ))}
      </defs>
      <g fill={LOGO_ORANGE}>
        {LOGO_ARCS.map((a) => (
          <path key={a.id} d={a.d} mask={`url(#${uid}-arco-${a.id})`} />
        ))}
        {LOGO_BARS.map((b) => (
          <g key={b.id} className="md-respira">
            <path d={b.d} className="md-barra" />
          </g>
        ))}
      </g>
    </svg>
  );
}

function EscenaMedidor({ children }: { children: ReactNode }) {
  const raiz = useRef<HTMLElement>(null);
  const nivel = useNivel();

  const { contextSafe } = useGSAP(
    () => {
      const q = gsap.utils.selector(raiz.current);
      gsap.set(q(".md-barra, .md-respira"), { transformOrigin: "50% 100%" });
      gsap.set(raiz.current, { visibility: "inherit" });
      if (prefersReducedMotion()) return;
      // Entrada: el panel de humo se abre desde abajo, los arcos se dibujan y las barras suben.
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .fromTo(q(".md-panel"), { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 1.3, ease: "expo.inOut" }, 0)
        .from(q(".md-humo"), { autoAlpha: 0, duration: 1.6, ease: "power2.out" }, 0.5)
        .fromTo(q(".md-dibujo"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: "power3.inOut", autoRound: false }, 0.6)
        .fromTo(q(".md-barra"), { scaleY: 0 }, { scaleY: 1, duration: 1.5, ease: "back.out(1.15)", stagger: 0.14 }, 0.85);

      // Las barras respiran como un medidor encendido, cada una a su ritmo.
      const ritmo = [
        { scaleY: 0.9, duration: 2.6 },
        { scaleY: 0.86, duration: 3.2 },
        { scaleY: 0.92, duration: 2.9 },
      ];
      q(".md-respira").forEach((g, i) =>
        gsap.to(g, { ...ritmo[i % 3], ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2.4 + i * 0.35 }),
      );
    },
    { scope: raiz },
  );

  // Al pasar de la contraseña al código, las barras laten una vez (el escenario no se vuelve a armar).
  const nivelAntes = useRef(nivel);
  useEffect(() => {
    if (nivel === nivelAntes.current) return;
    nivelAntes.current = nivel;
    if (prefersReducedMotion()) return;
    const barras = gsap.utils.selector(raiz.current)(".md-barra");
    gsap
      .timeline()
      .to(barras, { scaleY: 0.72, duration: 0.5, ease: "power2.inOut", stagger: 0.08 })
      .to(barras, { scaleY: 1, duration: 1.1, ease: "back.out(1.3)", stagger: 0.08 }, 0.5);
  }, [nivel]);

  const salir = useMemo(
    () =>
      contextSafe(() => {
        const q = gsap.utils.selector(raiz.current);
        if (prefersReducedMotion()) return Promise.resolve();
        const tl = gsap
          .timeline()
          .to(q(".md-columna"), { yPercent: -2, autoAlpha: 0, duration: 0.7, ease: "power3.in" }, 0)
          .to(q(".md-barra"), { scaleY: 1.12, duration: 0.6, ease: "power2.out", stagger: 0.06 }, 0)
          .fromTo(q(".md-salida-1"), { scaleY: 0 }, { scaleY: 1, duration: 1.0, ease: "expo.inOut" }, 0.3)
          .fromTo(q(".md-salida-2"), { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: "expo.inOut" }, 0.6);
        return alTerminar(tl);
      }),
    [contextSafe],
  );

  const montaje = useRef(Date.now());
  const salirRef = useRef(salir);
  salirRef.current = salir;
  const ctx = useMemo<IngresoContextoValor>(
    () => ({
      // El título empieza a subir mientras el panel de humo se abre.
      retraso: () => (prefersReducedMotion() ? 0 : Math.max(0, 0.3 - (Date.now() - montaje.current) / 1000)),
      salir: () => salirRef.current(),
    }),
    [],
  );

  return (
    <IngresoContexto.Provider value={ctx}>
      <main ref={raiz} data-reveal="" className="relative min-h-dvh overflow-hidden bg-ink-900" style={TONO}>
        {/* Panel de humo: en escritorio, la mitad derecha con un margen y esquinas redondeadas; en
            celular, una franja arriba que se funde con el azul. El degradé de fondo queda si no hay WebGL. */}
        <div
          className="md-panel absolute inset-x-0 top-0 h-[42vh] overflow-hidden lg:inset-y-4 lg:left-auto lg:right-4 lg:h-auto lg:w-[calc(50%-1rem)] lg:rounded-[28px]"
          style={{ background: "radial-gradient(120% 90% at 70% 60%, #1A3247 0%, #0B1E33 70%)" }}
        >
          <div className="md-humo absolute inset-0">
            <Humo resolucion={0.5} />
          </div>
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-900 to-transparent lg:hidden" />
          {/* El isotipo encima del humo, en el centro del panel (escritorio). */}
          <div className="absolute inset-0 hidden items-center justify-center lg:flex">
            <IsotipoMedidor className="relative h-[min(52vh,480px)] w-auto drop-shadow-[0_20px_60px_rgba(11,30,51,0.6)]" />
          </div>
        </div>

        <div className="relative z-10 mx-auto flex min-h-dvh max-w-[1600px] flex-col px-5 py-6 sm:px-10 sm:py-8 lg:px-16">
          <div className="flex items-center justify-between lg:w-1/2">
            <Logo wordColor="#FFFFFF" className="h-8 sm:h-9" />
            {/* En celular, el isotipo chico arriba a la derecha, sobre el humo. */}
            <IsotipoMedidor className="h-12 w-auto sm:h-14 lg:hidden" />
          </div>

          <div className="flex flex-1 flex-col items-stretch justify-center py-8 lg:w-1/2 lg:items-start lg:py-10 lg:pr-12">
            <div className="md-columna sm:mx-auto lg:mx-0">{children}</div>
          </div>

          <p className="text-xs text-neutral-0/50 lg:w-1/2">
            <Oraciones texto="Panel interno de ELEVAR. Ingreso con contraseña y segundo factor." />
          </p>
        </div>

        <div aria-hidden className="md-salida-1 pointer-events-none fixed inset-0 z-50 origin-bottom scale-y-0 bg-brand-500" />
        <div aria-hidden className="md-salida-2 pointer-events-none fixed inset-0 z-50 origin-bottom scale-y-0 bg-ink-900" />
      </main>
    </IngresoContexto.Provider>
  );
}

/** El escenario del ingreso: lo monta el layout de `(ingreso)` alrededor de las tres pantallas. */
export function EscenarioIngreso({ children }: { children: ReactNode }) {
  return <EscenaMedidor>{children}</EscenaMedidor>;
}
