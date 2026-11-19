"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { pegar, sinViuda } from "@/lib/texto";

/* ──────────────────────────────────────────────────────────────────────────────
 * Pantallas de ingreso del panel (05-PANTALLAS: /admin/ingresar, /codigo, /primer-ingreso).
 * El fondo y la marca viven en el escenario (`ingreso-escenario.tsx`, montado por el layout de
 * `(ingreso)`), que no se vuelve a armar al pasar de una pantalla a otra. Acá vive lo que va
 * adentro: el título grande, la tarjeta, los campos y los botones. Los colores de la tarjeta salen
 * de variables CSS que pone el escenario.
 * Movimiento: GSAP, lento y parejo (1,1 s `expo.out`); con movimiento reducido, todo quieto.
 * ────────────────────────────────────────────────────────────────────────────── */

export interface IngresoContextoValor {
  /** Segundos que espera la primera pantalla a que el escenario se abra. Después, 0. */
  retraso: () => number;
  /** La animación de salida al entrar al panel. Resuelve cuando terminó: recién ahí se navega. */
  salir: () => Promise<void>;
}

export const IngresoContexto = createContext<IngresoContextoValor>({
  retraso: () => 0,
  salir: async () => {},
});

export const useIngreso = () => useContext(IngresoContexto);

/** Espera en milisegundos (para dejar ver una animación de acierto antes de navegar). */
export const esperar = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, prefersReducedMotion() ? 0 : ms));

/** Un texto de varias oraciones que nunca corta a mitad de frase entre dos oraciones (regla de
 * saltos de línea, 2026-10-26): cada oración empieza su renglón y pasa por pegar(). Una oración
 * más larga que el renglón se parte sola, como cualquier párrafo. */
export function Oraciones({ texto }: { texto: string }) {
  const partes = texto.split(/(?<=[.?!])\s+/);
  return (
    <>
      {partes.map((o, i) => (
        <span key={i} className="block">
          {pegar(o)}
        </span>
      ))}
    </>
  );
}

/** Cada pantalla de ingreso: el título grande en blanco sobre el azul, con la última palabra sobre
 * un bloque naranja que se pinta de izquierda a derecha (el «título naranja» elegido, en grande), y
 * debajo la tarjeta blanca con el formulario, que se abre desde abajo. El nombre queda de la versión
 * anterior para no tocar cómo la usan las páginas. */
export function IngresoMarco({ titulo, bajada, encabezado, pie, ancho = "angosto", children }: IngresoMarcoProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const { retraso } = useIngreso();

  useGSAP(
    () => {
      const el = raiz.current!;
      gsap.set(el, { visibility: "inherit" });
      if (prefersReducedMotion()) return;
      const q = gsap.utils.selector(el);
      gsap
        .timeline({ delay: retraso(), defaults: { ease: "expo.out" } })
        .from(q(".tj-palabra"), { yPercent: 115, duration: 1.2, stagger: 0.08 }, 0)
        .fromTo(q(".tj-resalte"), { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: "expo.inOut" }, 0.45)
        .from(q(".tj-aparece"), { y: 16, autoAlpha: 0, duration: 1.0, stagger: 0.08 }, 0.5)
        .fromTo(q(".tj-tarjeta"), { scaleY: 0, transformOrigin: "50% 0%" }, { scaleY: 1, duration: 1.1, ease: "expo.inOut" }, 0.4)
        .from(q(".tj-dentro"), { y: 18, autoAlpha: 0, duration: 1.0, stagger: 0.08 }, 1.05);
    },
    { scope: raiz },
  );

  // sinViuda: la última palabra nunca baja sola (va pegada a la anterior, y las dos llevan el resalte).
  const palabras = sinViuda(titulo).split(" ");
  const ultima = palabras.length - 1;

  return (
    <div ref={raiz} data-reveal="" className={`w-full ${ancho === "ancho" ? "sm:w-[31rem]" : "sm:w-[27rem]"}`}>
      {encabezado && <div className="tj-aparece">{encabezado}</div>}
      <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight text-neutral-0 sm:text-5xl lg:text-6xl">
        {palabras.map((p, i) => (
          <span key={i}>
            {i === ultima ? (
              <span className="relative inline-block whitespace-nowrap px-[0.14em]">
                <span aria-hidden className="tj-resalte absolute inset-x-0 bottom-[0.02em] top-[0.12em] origin-left rounded-[10px] bg-brand-600" />
                <span className="relative inline-block overflow-hidden pb-[0.1em] align-bottom">
                  <span className="tj-palabra inline-block">{p}</span>
                </span>
              </span>
            ) : (
              <span className="inline-block overflow-hidden pb-[0.1em] align-bottom">
                <span className="tj-palabra inline-block">{p}</span>
              </span>
            )}
            {i < ultima ? " " : null}
          </span>
        ))}
      </h1>
      {bajada && (
        <p className="tj-aparece mt-4 text-base text-neutral-0/75 sm:text-lg">
          {typeof bajada === "string" ? <Oraciones texto={bajada} /> : bajada}
        </p>
      )}
      <div className="tj-tarjeta mt-8 rounded-[24px] bg-neutral-0 p-6 shadow-lg sm:p-9">
        <div className="tj-dentro">{children}</div>
        {pie && (
          <div className="tj-dentro mt-7 border-t border-[color:var(--pie-borde)] pt-5 text-sm text-[color:var(--t-texto)]">{pie}</div>
        )}
      </div>
    </div>
  );
}

export interface IngresoMarcoProps {
  titulo: string;
  bajada?: ReactNode;
  /** Lo que va arriba del título (el indicador de pasos del primer ingreso). */
  encabezado?: ReactNode;
  /** Ayuda al pie del formulario, separada por una línea. */
  pie?: ReactNode;
  /** «ancho» para el primer ingreso (QR y códigos de respaldo). */
  ancho?: "angosto" | "ancho";
  children: ReactNode;
}

/** Paso actual de un recorrido de varias pantallas: «Paso 1 de 2» y una barra por paso. */
export function IndicadorPasos({ actual, total, nombre }: IndicadorPasosProps) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-[color:var(--paso-texto,var(--enlace))]">
        Paso {actual} de {total}
        <span className="font-normal text-[color:var(--paso-nombre,var(--t-texto))]"> · {nombre}</span>
      </p>
      <div aria-hidden className="mt-3 flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 ${i < actual ? "bg-[color:var(--paso-lleno,#E94E1B)]" : "bg-[color:var(--paso-vacio,var(--c-borde))]"}`}
          />
        ))}
      </div>
    </div>
  );
}

export interface IndicadorPasosProps {
  actual: number;
  total: number;
  nombre: string;
}

/** Mensaje de error del formulario, anunciado por los lectores de pantalla. Entra desde el costado. */
export function AvisoError({ mensaje }: AvisoErrorProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!mensaje || !ref.current || prefersReducedMotion()) return;
    gsap.fromTo(ref.current, { x: -10, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, ease: "expo.out" });
  }, [mensaje]);
  if (!mensaje) return null;
  return (
    <p
      ref={ref}
      role="alert"
      className="rounded-[12px] border-l-[3px] border-[color:var(--error)] bg-[color:var(--error-fondo)] px-4 py-3 text-sm text-[color:var(--error)]"
    >
      {mensaje}
    </p>
  );
}

export interface AvisoErrorProps {
  mensaje: string | null;
}

/** Tilde que se dibuja una vez, cuando el dato quedó bien escrito (o el ingreso salió bien). */
function Tilde({ className = "h-5 w-5 text-brand-500" }: { className?: string }) {
  const ref = useRef<SVGPathElement>(null);
  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;
    gsap.fromTo(ref.current, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power3.out", autoRound: false });
  }, []);
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path ref={ref} d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" pathLength={1} strokeDasharray="1 1" />
    </svg>
  );
}

const CLASE_CAJA =
  "peer block h-14 w-full rounded-[12px] border border-[color:var(--c-borde)] bg-[color:var(--c-fondo)] px-4 pb-2 pt-6 text-base text-[color:var(--c-texto)] transition-[border-color,box-shadow] duration-500 placeholder:text-transparent hover:border-neutral-500 focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(233,78,27,0.14)] focus:outline-none";

/** Campo del ingreso (variante de los campos del portal de CESS): la etiqueta flota al escribir, la
 * línea de abajo se llena con el foco, tilde cuando el dato está bien, aviso de Bloq Mayús en la
 * contraseña y una línea de mensaje reservada abajo. */
export function CampoIngreso({ etiqueta, id, error, accesorio, ok, alEnter, onKeyDown, onKeyUp, ...props }: CampoIngresoProps) {
  const [mayus, setMayus] = useState(false);
  const esClave = props.type === "password" || props.autoComplete?.includes("password");
  const leerMayus = (e: React.KeyboardEvent<HTMLInputElement>) => esClave && setMayus(e.getModifierState("CapsLock"));
  const alApretar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    leerMayus(e);
    onKeyDown?.(e);
    // Enter en un campo que no es el último pasa al siguiente en vez de enviar el formulario.
    if (alEnter && e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      alEnter();
    }
  };
  const alSoltar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    leerMayus(e);
    onKeyUp?.(e);
  };
  const mensaje = error ?? (mayus ? "Tenés activadas las mayúsculas." : undefined);

  return (
    <div className="flex flex-col">
      <div className="group relative">
        <input
          id={id}
          name={id}
          placeholder=" "
          aria-invalid={Boolean(error)}
          aria-describedby={mensaje ? `${id}-mensaje` : undefined}
          onKeyDown={alApretar}
          onKeyUp={alSoltar}
          className={`${CLASE_CAJA} ${error ? "!border-[color:var(--error)]" : ""} ${accesorio && ok ? "pr-20" : accesorio || ok ? "pr-12" : ""}`}
          {...props}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-[color:var(--t-etiqueta)] transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-[color:var(--c-etiqueta-foco,var(--enlace))] peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold peer-autofill:top-2.5 peer-autofill:translate-y-0 peer-autofill:text-xs"
        >
          {etiqueta}
        </label>
        {(accesorio || ok) && (
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-1">
            {ok && <Tilde />}
            {accesorio}
          </div>
        )}
      </div>
      <p id={`${id}-mensaje`} aria-live="polite" className="min-h-[1.5rem] pt-1.5 text-sm">
        {error ? (
          <span role="alert" className="text-[color:var(--error)]">
            {error}
          </span>
        ) : mayus ? (
          <span className="text-[color:var(--enlace)]">{mensaje}</span>
        ) : null}
      </p>
    </div>
  );
}

export interface CampoIngresoProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "name"> {
  etiqueta: string;
  id: string;
  error?: string;
  accesorio?: ReactNode;
  /** El dato quedó bien escrito: se dibuja el tilde. */
  ok?: boolean;
  /** Qué hacer con Enter en vez de enviar (pasar al campo siguiente). */
  alEnter?: () => void;
}

const LARGO_CODIGO = 6;
/** Verde de los aciertos (casillas del código y botón): flúor, con texto en azul tinta. */
const VERDE_ACIERTO = "#34EF8C";

/** Código de 6 dígitos en seis casillas, de a tres. Por dentro es un solo campo (se puede pegar,
 * el celular sugiere el código con one-time-code y las pruebas lo llenan por su etiqueta); las
 * casillas dibujan lo que tiene. Cada dígito cae en su casilla; con un error, las casillas
 * tiemblan (`sacudir` cambia de valor). No envía solo: se confirma con el botón. */
export function CampoCodigo({ etiqueta, id, valor, alCambiar, deshabilitado, sacudir = 0, correcto = false }: CampoCodigoProps) {
  const [foco, setFoco] = useState(false);
  const fila = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const estabaDeshabilitado = useRef(Boolean(deshabilitado));

  // Cuando termina de verificar un código malo, el foco vuelve a las casillas para escribir el
  // próximo sin tocarlas (con el código bueno no hace falta: se sale de la pantalla).
  useEffect(() => {
    if (estabaDeshabilitado.current && !deshabilitado && !correcto) entrada.current?.focus();
    estabaDeshabilitado.current = Boolean(deshabilitado);
  }, [deshabilitado, correcto]);
  const antes = useRef(valor.length);
  const activa = Math.min(valor.length, LARGO_CODIGO - 1);

  useEffect(() => {
    const el = fila.current;
    const largo = valor.length;
    if (el && !prefersReducedMotion() && largo > antes.current) {
      const nuevos = Array.from(el.querySelectorAll<HTMLElement>(".cc-digito")).slice(antes.current, largo);
      gsap.fromTo(nuevos, { yPercent: -70, autoAlpha: 0, scale: 0.7 }, { yPercent: 0, autoAlpha: 1, scale: 1, duration: 0.55, ease: "back.out(2.2)", stagger: 0.04 });
    }
    antes.current = largo;
  }, [valor]);

  // Código correcto: las seis casillas se ponen verdes una por una, con un pequeño salto.
  useEffect(() => {
    const el = fila.current;
    if (!correcto || !el) return;
    const cajas = el.querySelectorAll<HTMLElement>(".cc-caja");
    // Verde flúor (pedido de Mateo, 2026-11-18: «más flúor, claro, brillante, no tan opaco»), con
    // el número en azul tinta: sobre ese verde el blanco no se lee.
    const verde = { backgroundColor: VERDE_ACIERTO, borderColor: VERDE_ACIERTO, color: "#0B1E33", boxShadow: "0 0 0 5px rgba(52,239,140,0.28), 0 0 22px rgba(52,239,140,0.45)" };
    if (prefersReducedMotion()) {
      gsap.set(cajas, verde);
      return;
    }
    gsap
      .timeline()
      .to(cajas, { ...verde, duration: 0.45, ease: "power2.out", stagger: 0.07 }, 0)
      .to(cajas, { keyframes: { scale: [1, 1.1, 1] }, duration: 0.5, ease: "power2.out", stagger: 0.07 }, 0);
  }, [correcto]);

  useEffect(() => {
    if (!sacudir || !fila.current || prefersReducedMotion()) return;
    gsap.fromTo(fila.current, { x: 0 }, { keyframes: { x: [-12, 10, -7, 5, -2, 0] }, duration: 0.6, ease: "power2.out" });
  }, [sacudir]);

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-2.5 block text-sm font-semibold text-[color:var(--t-titulo)]">
        {etiqueta}
      </label>
      <div className="relative">
        <div ref={fila} aria-hidden className="flex items-center gap-2 sm:gap-3">
          {[0, 3].map((desde) => (
            <div key={desde} className="grid flex-1 grid-cols-3 gap-2">
              {[desde, desde + 1, desde + 2].map((i) => {
                const enFoco = foco && i === activa;
                const lleno = Boolean(valor[i]);
                return (
                  <div
                    key={i}
                    className={`cc-caja relative flex h-14 items-center justify-center overflow-hidden rounded-[14px] border bg-[color:var(--c-fondo)] font-display text-2xl font-semibold tabular-nums text-[color:var(--c-texto)] transition-[border-color,box-shadow] duration-500 sm:h-16 ${
                      enFoco
                        ? "border-brand-500 shadow-[0_0_0_4px_rgba(233,78,27,0.14)]"
                        : lleno
                          ? "border-ink-900/40"
                          : "border-[color:var(--c-borde)]"
                    }`}
                  >
                    {lleno ? (
                      <span className="cc-digito inline-block">{valor[i]}</span>
                    ) : enFoco ? (
                      <span className="h-6 w-px animate-pulse bg-[color:var(--c-texto)]" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <input
          ref={entrada}
          id={id}
          name={id}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={LARGO_CODIGO}
          required
          disabled={deshabilitado}
          value={valor}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          onChange={(e) => alCambiar(e.target.value.replace(/\D/g, "").slice(0, LARGO_CODIGO))}
          className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none selection:bg-transparent"
        />
      </div>
    </div>
  );
}

export interface CampoCodigoProps {
  etiqueta: string;
  id: string;
  valor: string;
  alCambiar: (valor: string) => void;
  deshabilitado?: boolean;
  /** Cambia de valor con cada error: las casillas tiemblan. */
  sacudir?: number;
  /** El código fue aceptado: las casillas se ponen verdes. */
  correcto?: boolean;
}

/** Las tres barras del isotipo latiendo: el «cargando» del ingreso. */
function BarrasCargando() {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.to(".bc-barra", {
        scaleY: 0.35,
        duration: 0.45,
        ease: "power2.inOut",
        stagger: { each: 0.12, repeat: -1, yoyo: true },
      });
    },
    { scope: ref },
  );
  return (
    <span ref={ref} aria-hidden className="flex h-4 items-end gap-[3px]">
      {[0.75, 1, 0.8].map((h, i) => (
        <span key={i} className="bc-barra w-[3px] origin-bottom bg-current" style={{ height: `${h * 100}%` }} />
      ))}
    </span>
  );
}

const CLASE_BOTON =
  "group relative inline-flex min-h-[52px] w-full items-center justify-center overflow-hidden rounded-[12px] px-5 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--anillo-fondo)] disabled:cursor-not-allowed";

/** Botón principal: el relleno naranja sube al pasar el mouse (0,8 s), la flecha avanza y,
 * mientras envía, laten las barras del isotipo. */
export function BotonEnvio({ enviando, texto, textoEnviando, exito = false, textoExito = "Listo" }: BotonEnvioProps) {
  return (
    <button type="submit" disabled={enviando || exito} className={`${CLASE_BOTON} bg-[color:var(--b-fondo)] text-[color:var(--b-texto)]`}>
      <span
        aria-hidden
        className={`absolute inset-0 bg-[color:var(--b-relleno,#E94E1B)] transition-transform duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0 ${
          enviando ? "translate-y-0" : "translate-y-full"
        }`}
      />
      {/* Acierto: una capa verde sube por encima del naranja y se dibuja el tilde. */}
      <span
        aria-hidden
        className={`absolute inset-0 bg-[#34EF8C] transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          exito ? "translate-y-0" : "translate-y-full"
        }`}
      />
      {exito ? (
        <span role="status" className="relative flex items-center gap-2.5 text-ink-900">
          <Tilde className="h-5 w-5" />
          {textoExito}
        </span>
      ) : (
      <span className={`relative flex items-center gap-3 transition-colors duration-500 group-hover:text-[color:var(--b-texto-hover,#FFFFFF)] ${enviando ? "text-[color:var(--b-texto-hover,#FFFFFF)]" : ""}`}>
        {enviando ? <BarrasCargando /> : null}
        {enviando ? textoEnviando : texto}
        {!enviando && (
          <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 transition-transform duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-1.5">
            <path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
      </span>
      )}
    </button>
  );
}

export interface BotonEnvioProps {
  enviando: boolean;
  texto: string;
  textoEnviando: string;
  /** Salió bien: el botón se pone verde con un tilde antes de seguir. */
  exito?: boolean;
  textoExito?: string;
}

/** Botón secundario (Descargar, Reintentar): borde fino que se llena al pasar el mouse. */
export function BotonSecundario({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${CLASE_BOTON} border border-[color:var(--c-borde)] text-[color:var(--t-titulo)]`} {...props}>
      <span
        aria-hidden
        className="absolute inset-0 translate-y-full bg-[color:var(--t-titulo)] transition-transform duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0"
      />
      <span className="relative transition-colors duration-500 group-hover:text-[color:var(--anillo-fondo)]">{children}</span>
    </button>
  );
}

/** Link de texto del ingreso: «Usar un código de respaldo», «Volver a empezar». La línea de abajo
 * se dibuja al pasar el mouse. */
export function BotonTexto({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="group relative self-start pb-0.5 text-sm font-semibold text-[color:var(--enlace)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      {...props}
    >
      {children}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px origin-right scale-x-0 bg-current transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:origin-left group-hover:scale-x-100"
      />
    </button>
  );
}

/** El ojo de la contraseña: abierto mientras está oculta; al mostrarla, una raya lo tacha
 * (se dibuja en 0,5 s) y la pupila se achica. La etiqueta no dice «contraseña» para que el
 * campo siga siendo el único con ese nombre (las pruebas lo buscan así). */
export function BotonOjo({ visible, alCambiar }: { visible: boolean; alCambiar: () => void }) {
  return (
    <button
      type="button"
      onClick={alCambiar}
      aria-pressed={visible}
      aria-label={visible ? "Ocultar lo que escribiste" : "Ver lo que escribiste"}
      title={visible ? "Ocultar" : "Mostrar"}
      className="flex h-11 w-11 items-center justify-center text-[color:var(--t-etiqueta)] transition-colors duration-500 hover:text-[color:var(--c-etiqueta-foco,var(--enlace))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" strokeLinejoin="round" />
        <circle
          cx="12"
          cy="12"
          r="3"
          className="origin-center transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
          style={{ transform: visible ? "scale(0.55)" : "scale(1)", transformBox: "fill-box" }}
        />
        <path
          d="M4 4l16 16"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          className="transition-[stroke-dashoffset] duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
          style={{ strokeDashoffset: visible ? 0 : 1 }}
        />
      </svg>
    </button>
  );
}

/** Ayuda fija del pie: el acceso no se recupera desde la pantalla, lo restablece soporte.
 * Una oración por renglón, para que nunca corte a mitad de frase. */
export const AYUDA_ACCESO = (
  <>
    <span className="block">{pegar("¿Perdiste la contraseña o el celular?")}</span>
    <span className="block">{pegar("Pedí que te restablezcan el acceso.")}</span>
  </>
);
