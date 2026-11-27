"use client";

import { useCallback, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { useDatos, useErrorDeAccion } from "@/components/admin/datos";
import { avisarUsuario, useUsuario } from "@/components/admin/shell";
import { ApiError, panel } from "@/lib/admin/api";
import { ACCION, ROLES, detalleEnPalabras, fechaHora, haceCuanto } from "@/lib/admin/formato";
import type { MiCuenta, Movimiento, SesionAbierta } from "@/lib/admin/tipos";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { pegar } from "@/lib/texto";
import { Icono, escribirEn, useEscribirIcono } from "../iconos";
import { CifraRueda } from "../inicio/graficos";
import { Trama } from "../inicio/piezas";
import { BotonFicha, CuadroIcono, Rotulo } from "../lista/Botones";
import { Ficha, useAviso } from "../lista/Ficha";
import { useLlega } from "../lista/Banda";

/**
 * Mi cuenta con la forma del portal CESS (su `VistaCuenta`, D-035 y D-036; 2026-11-26, Mateo: «falta la cuenta
 * como la que tiene el portal»). Arriba la banda azul con tus iniciales, tu nombre, tu correo, «Editar nombre» y
 * tres datos. Abajo una tarjeta con secciones: Perfil, Seguridad, Sesiones y Actividad. Al elegir una, el
 * resaltado se desliza (0,35 s), su ícono se dibuja y el contenido entra escalonado. ↑ ↓ (o ← →) recorren el
 * menú; en el celular el menú es una fila arriba. Los formularios abren una tarjeta chica que crece del botón.
 */
type Id = "perfil" | "seguridad" | "sesiones" | "actividad";
const SECCIONES: { id: Id; icono: string; titulo: string; texto: string; bajada: string }[] = [
  { id: "perfil", icono: "persona", titulo: "Perfil", texto: "Tu nombre y tu correo", bajada: "Así te ven en la auditoría y en el historial de cada cosa." },
  { id: "seguridad", icono: "escudo", titulo: "Seguridad", texto: "Contraseña y segundo factor", bajada: "Las dos protecciones de tu cuenta." },
  { id: "sesiones", icono: "pantalla", titulo: "Sesiones", texto: "Dónde está abierta", bajada: "Cada navegador donde entraste y no saliste. Si no reconocés uno, cerralo." },
  { id: "actividad", icono: "reloj", titulo: "Actividad", texto: "Lo que hiciste", bajada: "Tus últimos 20 movimientos en el panel." },
];

type Dialogo = null | "nombre" | "clave" | "codigos";

export function VistaCuenta() {
  const usuario = useUsuario();
  const errorDeAccion = useErrorDeAccion();
  const { aviso, avisar } = useAviso();
  const cuenta = useDatos(() => panel.miCuenta(), []);
  const sesiones = useDatos(() => panel.sesiones(), []);
  const actividad = useDatos(() => panel.miActividad(), []);
  const [actual, setActual] = useState<Id>("perfil");
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [abierto, setAbierto] = useState(false);
  const origen = useRef<DOMRect | null>(null);

  const abrir = (d: Exclude<Dialogo, null>) => {
    origen.current = (document.activeElement as HTMLElement | null)?.getBoundingClientRect() ?? null;
    setDialogo(d);
    setAbierto(true);
  };
  const cerrar = () => setAbierto(false);

  const datos: MiCuenta | null = cuenta.estado.tipo === "listo" ? cuenta.estado.datos : null;
  const nombre = datos?.nombre ?? usuario.nombre;
  const recargarTodo = () => { void cuenta.recargar(); void sesiones.recargar(); void actividad.recargar(); };

  return (
    <div className="flex flex-col gap-4">
      <BandaCuenta nombre={nombre} correo={datos?.correo ?? usuario.correo} datos={datos} onEditar={() => abrir("nombre")} />

      <Tarjeta actual={actual} elegir={setActual}>
        {actual === "perfil" && <PanelPerfil nombre={nombre} datos={datos} onEditar={() => abrir("nombre")} />}
        {actual === "seguridad" && <PanelSeguridad datos={datos} onClave={() => abrir("clave")} onCodigos={() => abrir("codigos")} />}
        {actual === "sesiones" && (
          <PanelSesiones estado={sesiones.estado} recargar={sesiones.recargar}
            onCerrarUna={async (s) => {
              try {
                await panel.cerrarSesionDe(s.id);
                avisar(`Se cerró la sesión de ${dispositivo(s.dispositivo)}`);
              } catch (e) {
                avisar(errorDeAccion(e) ?? "No se pudo cerrar esa sesión.");
              }
              recargarTodo();
            }}
            onCerrarDemas={async () => {
              try {
                const { cerradas } = await panel.cerrarOtrasSesiones();
                avisar(cerradas ? `Se ${cerradas === 1 ? "cerró 1 sesión" : `cerraron ${cerradas} sesiones`}` : "No había otras sesiones");
              } catch (e) {
                avisar(errorDeAccion(e) ?? "No se pudieron cerrar.");
              }
              recargarTodo();
            }} />
        )}
        {actual === "actividad" && <PanelActividad estado={actividad.estado} />}
      </Tarjeta>

      <Ficha chica abierta={abierto} sobre="Mi cuenta" onCerrar={cerrar} onSalida={() => setDialogo(null)} origen={() => origen.current}
        titulo={dialogo === "nombre" ? "Editar nombre" : dialogo === "clave" ? "Cambiar contraseña" : "Códigos de respaldo"}>
        {dialogo === "nombre" && (
          <FormNombre inicial={nombre} onListo={(n) => { avisarUsuario({ nombre: n }); avisar("Nombre guardado"); cerrar(); recargarTodo(); }} onCancelar={cerrar} />
        )}
        {dialogo === "clave" && (
          <FormClave onListo={(cerradas) => { avisar(cerradas ? `Contraseña cambiada. Se cerraron ${cerradas} sesiones.` : "Contraseña cambiada"); cerrar(); recargarTodo(); }} onCancelar={cerrar} />
        )}
        {dialogo === "codigos" && <FormCodigos onListo={() => { cerrar(); recargarTodo(); }} />}
      </Ficha>
      {aviso}
    </div>
  );
}

/** «Chrome en Windows» a partir del navegador que guardó la sesión. */
export function dispositivo(ua: string): string {
  if (!ua) return "Navegador desconocido";
  const navegador = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navegador";
  const sistema = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return sistema ? `${navegador} en ${sistema}` : navegador;
}
const esCelular = (ua: string) => /Android|iPhone|iPad|Mobile/.test(ua);

function iniciales(nombre: string) {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "·";
}

// --- Banda -----------------------------------------------------------------------------------

function BandaCuenta({ nombre, correo, datos, onEditar }: { nombre: string; correo: string; datos: MiCuenta | null; onEditar: () => void }) {
  const caja = useRef<HTMLElement>(null);
  useLlega(caja, 0);
  const desde = datos ? fechaHora(datos.creada_en).slice(0, 10) : "—";
  return (
    <section ref={caja} aria-labelledby="titulo-lista" className="relative shrink-0 overflow-hidden rounded-[22px] bg-ink-900 px-5 py-4 text-neutral-0 sm:px-6">
      <Trama />
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-500 font-sub text-lg font-bold text-neutral-0 ring-4 ring-neutral-0/10">{iniciales(nombre)}</span>
            <div className="min-w-0">
              <p className="font-sub text-[11px] font-semibold uppercase tracking-wider text-brand-300">Mi cuenta</p>
              <h1 id="titulo-lista" className="mt-0.5 break-words font-display text-3xl font-semibold tracking-tight">{pegar(nombre)}</h1>
              <p className="mt-0.5 break-all text-sm text-neutral-0/80">{correo}</p>
            </div>
          </div>
          <div className="shrink-0"><BotonFicha variante="claro" icono="editar" onClick={onEditar}>Editar nombre</BotonFicha></div>
        </div>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:gap-3">
          <DatoBanda icono="pantalla" rotulo="Sesiones abiertas">{datos ? <CifraRueda valor={datos.sesiones} className="font-sub text-2xl font-bold tabular-nums" /> : "—"}</DatoBanda>
          <DatoBanda icono="escudo" rotulo="Segundo factor">{datos ? (datos.segundo_factor_listo ? "Activo" : "Sin configurar") : "—"}</DatoBanda>
          <DatoBanda icono="reloj" rotulo="Cuenta desde">{desde}</DatoBanda>
        </dl>
      </div>
    </section>
  );
}

function DatoBanda({ icono, rotulo, children }: { icono: string; rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[64px] items-center gap-3 rounded-[16px] bg-neutral-0/[0.06] px-4 py-2.5 ring-1 ring-neutral-0/10">
      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-neutral-0/10 2xl:inline-flex">
        <Icono nombre={icono} className="h-5 w-5" acento="#F79268" grosor={2} />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="truncate font-sub text-sm font-semibold text-neutral-0/75">{rotulo}</dt>
        <dd className="font-sub text-2xl font-bold tabular-nums tracking-tight">{children}</dd>
      </div>
    </div>
  );
}

// --- Tarjeta con secciones -------------------------------------------------------------------

function Tarjeta({ actual, elegir, children }: { actual: Id; elegir: (id: Id) => void; children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const resalte = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const primera = useRef(true);
  const escribir = useEscribirIcono();
  useLlega(caja, 1, { y: 32 });

  const medir = useCallback((animar: boolean) => {
    const el = menu.current?.querySelector<HTMLElement>(`[data-id="${actual}"]`);
    const r = resalte.current;
    if (!el || !r) return;
    const a = { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight, opacity: 1 };
    if (!animar || prefersReducedMotion()) gsap.set(r, a);
    else gsap.to(r, { ...a, duration: 0.35, ease: "power3.out", overwrite: "auto" });
  }, [actual]);

  // Cambio de sección: el resaltado viaja, el ícono se dibuja y el panel entra de a partes.
  useLayoutEffect(() => {
    medir(!primera.current);
    const p = panelRef.current;
    if (!primera.current && p && !prefersReducedMotion()) {
      const el = menu.current?.querySelector<HTMLElement>(`[data-id="${actual}"]`);
      if (el) escribirEn(el);
      gsap.fromTo(p.querySelectorAll(":scope > *"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power3.out", clearProps: "opacity,transform" });
    }
    primera.current = false;
    const ajustar = () => medir(false);
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, [medir, actual]);

  // Al entrar: el menú cae de a uno.
  useLayoutEffect(() => {
    const m = menu.current;
    if (!m || prefersReducedMotion()) return;
    const t = gsap.fromTo(m.querySelectorAll("[role='tab']"), { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, delay: 0.2, ease: "power3.out", clearProps: "opacity,transform" });
    return () => void t.progress(1).kill();
  }, []);

  const teclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const paso = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!paso) return;
    e.preventDefault();
    const i = SECCIONES.findIndex((s) => s.id === actual);
    const sig = SECCIONES[(i + paso + SECCIONES.length) % SECCIONES.length]!.id;
    elegir(sig);
    menu.current?.querySelector<HTMLElement>(`[data-id="${sig}"]`)?.focus();
  };
  const sec = SECCIONES.find((s) => s.id === actual)!;

  return (
    <div ref={caja} className="grid overflow-hidden rounded-[22px] border border-ink-100 bg-neutral-0 shadow-[0_1px_2px_rgba(11,30,51,.05)] lg:grid-cols-[280px_minmax(0,1fr)]">
      <div ref={menu} role="tablist" aria-label="Secciones de tu cuenta" aria-orientation="vertical" onKeyDown={teclas}
        className="relative grid grid-cols-2 gap-1 border-b border-ink-100 bg-ink-50/60 p-2 sm:grid-cols-4 lg:flex lg:flex-col lg:border-b-0 lg:border-r lg:p-3">
        <p aria-hidden className="hidden px-3 pb-1 pt-1 font-sub text-[11px] font-semibold uppercase tracking-wider text-ink-500 lg:block">Tu cuenta</p>
        <span ref={resalte} aria-hidden className="pointer-events-none absolute left-0 top-0 rounded-[14px] bg-neutral-0 opacity-0 shadow-[0_1px_2px_rgba(11,30,51,.08)] ring-1 ring-ink-100" />
        {SECCIONES.map((s) => {
          const activa = s.id === actual;
          return (
            <button key={s.id} type="button" role="tab" id={`cu-tab-${s.id}`} data-id={s.id} aria-selected={activa} aria-controls="cu-panel"
              tabIndex={activa ? 0 : -1} onClick={() => elegir(s.id)} onPointerEnter={escribir}
              className="relative z-[1] flex min-h-[48px] shrink-0 items-center gap-3 rounded-[14px] px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:min-h-[60px]">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] transition-colors duration-200 ${activa ? "bg-ink-900 text-neutral-0" : "bg-neutral-0 text-ink-900 ring-1 ring-ink-100"}`}>
                <Icono nombre={s.icono} tam={20} acento={activa ? "#F79268" : undefined} />
              </span>
              <span className="min-w-0">
                <span className={`block whitespace-nowrap font-sub text-sm font-semibold ${activa ? "text-ink-900" : "text-ink-700"}`}>{s.titulo}</span>
                <span className="hidden whitespace-nowrap text-xs text-neutral-700 lg:block">{s.texto}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div ref={panelRef} id="cu-panel" role="tabpanel" aria-labelledby={`cu-tab-${actual}`} className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
        <header>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">{sec.titulo}</h2>
          <p className="mt-0.5 text-sm text-neutral-700">{pegar(sec.bajada)}</p>
        </header>
        {children}
      </div>
    </div>
  );
}

/** Un dato en su recuadro: ícono en color, rótulo, valor, una nota y, si se puede, su acción. */
function Recuadro({ icono, tono = "tinta", rotulo, valor, nota, accion }: { icono: string; tono?: "tinta" | "exito" | "marca"; rotulo: string; valor: ReactNode; nota?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[16px] border border-ink-100 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <CuadroIcono nombre={icono} tono={tono} />
        <div className="min-w-0 flex-1">
          <Rotulo>{rotulo}</Rotulo>
          <div className="mt-0.5 break-words text-[15px] font-semibold text-ink-900">{valor}</div>
          {nota && <p className="mt-1 text-sm text-neutral-700">{pegar(nota)}</p>}
        </div>
      </div>
      {accion && <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{accion}</div>}
    </div>
  );
}

function Etiqueta({ tono, children }: { tono: "ok" | "neutro"; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tono === "ok" ? "bg-status-success/15 text-[#166534]" : "bg-ink-50 text-ink-700"}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${tono === "ok" ? "bg-status-success" : "bg-ink-300"}`} />
      {children}
    </span>
  );
}

function PanelPerfil({ nombre, datos, onEditar }: { nombre: string; datos: MiCuenta | null; onEditar: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <Recuadro icono="persona" rotulo="Nombre" valor={pegar(nombre)} accion={<BotonFicha variante="contorno" icono="editar" onClick={onEditar}>Editar nombre</BotonFicha>} />
      <Recuadro icono="sobre" rotulo="Correo" valor={<span className="break-all">{datos?.correo ?? "—"}</span>} nota="Es con el que entrás al panel. Para cambiarlo, pedíselo a soporte." />
      <div className="grid gap-3 sm:grid-cols-2">
        <Recuadro icono="llave" rotulo="Rol" valor={datos ? ROLES[datos.rol] ?? datos.rol : "—"} />
        <Recuadro icono="reloj" rotulo="Cuenta desde" valor={datos ? fechaHora(datos.creada_en).slice(0, 10) : "—"} />
      </div>
    </div>
  );
}

/** Un medidor circular: cuántas de las dos protecciones tiene la cuenta. Se dibuja al entrar (1,1 s). */
function PanelSeguridad({ datos, onClave, onCodigos }: { datos: MiCuenta | null; onClave: () => void; onCodigos: () => void }) {
  const total = 2;
  const n = 1 + (datos?.segundo_factor_listo ? 1 : 0);
  const arco = useRef<SVGCircleElement>(null);
  const numero = useRef<HTMLSpanElement>(null);
  const R = 52;
  const largo = 2 * Math.PI * R;
  useLayoutEffect(() => {
    const a = arco.current;
    if (!a) return;
    const fin = largo * (1 - n / total);
    if (prefersReducedMotion()) return void (a.style.strokeDashoffset = String(fin));
    const o = { v: 0 };
    const tw = gsap.fromTo(a, { strokeDashoffset: largo }, { strokeDashoffset: fin, duration: 1.1, ease: "power3.out", delay: 0.15 });
    const tn = gsap.to(o, { v: n, duration: 1.1, ease: "power3.out", delay: 0.15, onUpdate: () => void (numero.current && (numero.current.textContent = String(Math.round(o.v)))) });
    return () => { tw.kill(); tn.kill(); };
  }, [largo, n]);
  const codigos = datos?.codigos_sin_usar ?? 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-5 rounded-[16px] bg-ink-50 p-4">
        <div className="relative h-[104px] w-[104px] shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r={R} fill="none" stroke="#D9E1E8" strokeWidth="10" />
            <circle ref={arco} cx="60" cy="60" r={R} fill="none" stroke={n === total ? "#15803D" : "#E94E1B"} strokeWidth="10" strokeLinecap="round" strokeDasharray={largo} strokeDashoffset={largo * (1 - n / total)} />
          </svg>
          <span className="absolute inset-0 grid place-items-center font-sub text-2xl font-bold tabular-nums text-ink-900"><span><span ref={numero}>{n}</span><span className="text-base text-neutral-700"> / {total}</span></span></span>
        </div>
        <div className="min-w-0">
          <p className="font-sub text-base font-semibold text-ink-900">{n === total ? "Tu cuenta está protegida" : "Te falta una protección"}</p>
          <p className="mt-0.5 text-sm text-neutral-700">{pegar(n === total ? "Para entrar hace falta tu contraseña y el código de tu celular." : "Configurá el segundo factor la próxima vez que entres.")}</p>
          <span className="sr-only">{n} de {total} protecciones activas</span>
        </div>
      </div>
      <Recuadro icono="llave" tono="exito" rotulo="Contraseña" valor={<Etiqueta tono="ok">Activa</Etiqueta>}
        nota="Mínimo 8 caracteres. Una frase larga es mejor que una palabra con símbolos."
        accion={<BotonFicha variante="contorno" icono="llave" onClick={onClave}>Cambiar</BotonFicha>} />
      <Recuadro icono="escudo" tono={datos?.segundo_factor_listo ? "exito" : "tinta"} rotulo="Segundo factor"
        valor={<Etiqueta tono={datos?.segundo_factor_listo ? "ok" : "neutro"}>{datos?.segundo_factor_listo ? "Activo" : "Sin configurar"}</Etiqueta>}
        nota={`El código de 6 dígitos de tu app. Te ${codigos === 1 ? "queda 1 código" : `quedan ${codigos} códigos`} de respaldo para cuando no tengas el celular.`}
        accion={<BotonFicha variante="contorno" icono="llave" onClick={onCodigos}>Códigos nuevos</BotonFicha>} />
    </div>
  );
}

function PanelSesiones({ estado, recargar, onCerrarUna, onCerrarDemas }: {
  estado: ReturnType<typeof useDatos<SesionAbierta[]>>["estado"];
  recargar: () => Promise<void> | void;
  onCerrarUna: (s: SesionAbierta) => Promise<void>;
  onCerrarDemas: () => Promise<void>;
}) {
  const [cerrando, setCerrando] = useState<string | null>(null);
  if (estado.tipo === "cargando") return <div className="h-40 animate-pulse rounded-[16px] bg-ink-50" />;
  if (estado.tipo !== "listo") return (
    <div className="flex flex-col items-start gap-3 rounded-[16px] border border-ink-100 p-4">
      <p className="text-sm text-ink-900">No se pudieron traer tus sesiones.</p>
      <BotonFicha variante="contorno" onClick={() => void recargar()}>Reintentar</BotonFicha>
    </div>
  );
  const lista = estado.datos;
  const otras = lista.filter((s) => !s.actual).length;
  return (
    <div className="flex flex-col gap-3">
      {otras > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-ink-50 px-4 py-3">
          <p className="text-sm text-ink-900">{otras === 1 ? "Hay 1 sesión abierta en otro lado." : `Hay ${otras} sesiones abiertas en otros lados.`}</p>
          <BotonFicha variante="contorno" icono="salir" deshabilitado={cerrando !== null}
            onClick={async () => { setCerrando("todas"); await onCerrarDemas(); setCerrando(null); }}>
            {cerrando === "todas" ? "Cerrando…" : "Cerrar las demás"}
          </BotonFicha>
        </div>
      )}
      <ul className="flex flex-col gap-2" aria-label="Sesiones abiertas">
        {lista.slice(0, 30).map((s) => (
          <li key={s.id} className={`flex flex-wrap items-center gap-3 rounded-[16px] border p-3.5 ${s.actual ? "border-status-success/40 bg-status-success/[0.06]" : "border-ink-100"}`}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-ink-50 text-ink-900">
              <Icono nombre={esCelular(s.dispositivo) ? "celular" : "pantalla"} tam={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-ink-900">
                {dispositivo(s.dispositivo)}
                {s.actual && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534]">
                    <span aria-hidden className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-status-success opacity-60 motion-safe:animate-ping" /><span className="relative inline-flex h-2 w-2 rounded-full bg-status-success" /></span>
                    Este dispositivo
                  </span>
                )}
              </p>
              <p className="text-xs text-neutral-700">{s.actual ? `Entraste ${haceCuanto(s.ingreso_en)}` : `Usada ${haceCuanto(s.ultimo_uso_en)} · entró el ${fechaHora(s.ingreso_en)}`}</p>
            </div>
            {!s.actual && (
              <BotonFicha variante="contorno" icono="salir" deshabilitado={cerrando !== null}
                onClick={async () => { setCerrando(s.id); await onCerrarUna(s); setCerrando(null); }}>
                {cerrando === s.id ? "Cerrando…" : "Cerrar"}
              </BotonFicha>
            )}
          </li>
        ))}
      </ul>
      {lista.length > 30 && <p className="text-sm text-neutral-700">{pegar(`Y ${lista.length - 30} sesiones más, todas viejas: «Cerrar las demás» las cierra juntas.`)}</p>}
      {otras === 0 && <p className="text-sm text-neutral-700">Tu cuenta solo está abierta en este dispositivo.</p>}
    </div>
  );
}

/** La línea de tiempo se dibuja de arriba abajo y cada punto aparece cuando la línea llega a él. */
function PanelActividad({ estado }: { estado: ReturnType<typeof useDatos<Movimiento[]>>["estado"] }) {
  const lista = useRef<HTMLDivElement>(null);
  const listo = estado.tipo === "listo";
  useLayoutEffect(() => {
    const l = lista.current;
    if (!l || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const items = l.querySelectorAll("[data-mov]");
      gsap.fromTo("[data-hilo]", { scaleY: 0 }, { scaleY: 1, duration: 0.25 + Math.min(items.length, 10) * 0.08, ease: "power1.inOut", transformOrigin: "top", delay: 0.1 });
      gsap.fromTo("[data-punto]", { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2)", stagger: 0.08, delay: 0.15, clearProps: "transform" });
      gsap.fromTo("[data-cuerpo]", { opacity: 0, x: 12 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, delay: 0.18, ease: "power3.out", clearProps: "opacity,transform" });
    }, l);
    return () => ctx.revert();
  }, [listo]);
  if (estado.tipo === "cargando") return <div className="h-40 animate-pulse rounded-[16px] bg-ink-50" />;
  if (estado.tipo !== "listo") return <p className="text-sm text-ink-900">No se pudo traer tu actividad.</p>;
  if (!estado.datos.length) return <p className="text-sm text-neutral-700">Todavía no hay movimientos tuyos.</p>;
  return (
    <div ref={lista} className="relative">
      <span data-hilo aria-hidden className="absolute bottom-3 left-[7px] top-3 w-px bg-ink-100" />
      <ol className="flex flex-col gap-3">
        {estado.datos.map((m) => {
          const detalle = detalleEnPalabras(m.accion, m.detalle);
          return (
            <li key={m.id} data-mov className="relative flex gap-4">
              <span data-punto aria-hidden className={`relative z-[1] mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-neutral-0 ${tonoPunto(m.accion)}`} />
              <div data-cuerpo className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{ACCION[m.accion] ?? m.accion}</p>
                  {detalle.length > 0 && <p className="text-xs text-neutral-700">{detalle.join(" · ")}</p>}
                </div>
                <time dateTime={m.created_at} title={fechaHora(m.created_at)} className="shrink-0 text-xs tabular-nums text-neutral-700">{haceCuanto(m.created_at)}</time>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** El color del punto de un movimiento: rojo lo que salió mal, verde lo que se creó, gris lo demás. */
export function tonoPunto(accion: string) {
  if (/fallido|bloqueado|denegado|cancelada|baja/.test(accion)) return "bg-status-error";
  if (/\.alta$|\.ok$|cumplida|confirmado/.test(accion)) return "bg-status-success";
  return "bg-ink-300";
}

// --- Formularios ------------------------------------------------------------------------------

const CAMPO = "min-h-[44px] w-full rounded-[10px] border bg-neutral-0 px-3 text-base text-ink-900 outline-none transition-colors duration-150 focus:border-ink-900 focus:ring-2 focus:ring-ink-900/10 sm:text-sm";

function Campo({ id, etiqueta, error, ayuda, children }: { id: string; etiqueta: string; error?: string; ayuda?: string; children: ReactNode }) {
  return (
    <div data-cascada className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sub text-xs font-semibold uppercase tracking-wider text-ink-700">{etiqueta}</label>
      {children}
      {error ? <p role="alert" className="text-sm text-status-error">{error}</p> : ayuda ? <p className="text-xs text-neutral-700">{pegar(ayuda)}</p> : null}
    </div>
  );
}

function Pie({ children }: { children: ReactNode }) {
  return <div data-cascada className="mt-2 flex flex-wrap justify-end gap-2">{children}</div>;
}

function BotonEnviar({ children, ocupado, deshabilitado }: { children: ReactNode; ocupado: boolean; deshabilitado?: boolean }) {
  return (
    <button type="submit" disabled={ocupado || deshabilitado}
      className="group relative isolate inline-flex min-h-[44px] items-center justify-center gap-2 overflow-hidden rounded-[12px] bg-brand-500 px-4 font-sub text-sm font-semibold text-neutral-0 outline-none transition-transform duration-150 [--acento:#0B1E33] focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50">
      <span aria-hidden className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-ink-900 transition-transform duration-500 ease-[cubic-bezier(.22,.8,.24,1)] [@media(hover:hover)]:group-enabled:group-hover:scale-y-100" />
      {ocupado ? "Guardando…" : children}
    </button>
  );
}

function FormNombre({ inicial, onListo, onCancelar }: { inicial: string; onListo: (n: string) => void; onCancelar: () => void }) {
  const [nombre, setNombre] = useState(inicial);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const errorDeAccion = useErrorDeAccion();
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setOcupado(true);
    setError("");
    try {
      onListo((await panel.cambiarNombre(nombre)).nombre);
    } catch (err) {
      setError(err instanceof ApiError && err.fieldErrors?.nombre ? err.fieldErrors.nombre.join(" ") : errorDeAccion(err) ?? "No se pudo guardar.");
    } finally {
      setOcupado(false);
    }
  };
  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <Campo id="cu-nombre" etiqueta="Tu nombre" error={error} ayuda="Como querés aparecer en la auditoría y en el historial.">
        <input id="cu-nombre" autoFocus autoComplete="name" maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)} aria-invalid={!!error} className={`${CAMPO} ${error ? "border-status-error" : "border-ink-200"}`} />
      </Campo>
      <Pie>
        <BotonFicha variante="contorno" onClick={onCancelar}>Cancelar</BotonFicha>
        <BotonEnviar ocupado={ocupado} deshabilitado={nombre.trim().length < 2 || nombre.trim() === inicial}>Guardar nombre</BotonEnviar>
      </Pie>
    </form>
  );
}

function FormClave({ onListo, onCancelar }: { onListo: (cerradas: number) => void; onCancelar: () => void }) {
  const [v, setV] = useState({ actual: "", nueva: "", repetida: "" });
  const [cerrarOtras, setCerrarOtras] = useState(true);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);
  const errorDeAccion = useErrorDeAccion();
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (v.nueva !== v.repetida) return setErrores({ repetida: "Las dos contraseñas nuevas no coinciden." });
    setOcupado(true);
    setErrores({});
    try {
      onListo((await panel.cambiarClave(v.actual, v.nueva, cerrarOtras)).otras_sesiones_cerradas);
    } catch (err) {
      const c = err instanceof ApiError ? err.fieldErrors : undefined;
      if (c && (c.actual || c.clave_nueva || c.nueva)) setErrores({ actual: c.actual?.join(" ") ?? "", nueva: (c.clave_nueva ?? c.nueva)?.join(" ") ?? "" });
      else setErrores({ general: errorDeAccion(err) ?? "No se pudo cambiar." });
    } finally {
      setOcupado(false);
    }
  };
  const campos = [
    { id: "actual" as const, etiqueta: "Contraseña actual", auto: "current-password" },
    { id: "nueva" as const, etiqueta: "Contraseña nueva", auto: "new-password", ayuda: "Mínimo 8 caracteres. No hace falta usar mayúsculas, números ni símbolos." },
    { id: "repetida" as const, etiqueta: "Repetí la contraseña nueva", auto: "new-password" },
  ];
  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {errores.general && <p role="alert" data-cascada className="rounded-[12px] bg-status-error/10 px-3 py-2 text-sm text-status-error">{errores.general}</p>}
      {campos.map((c, i) => (
        <Campo key={c.id} id={`cu-${c.id}`} etiqueta={c.etiqueta} error={errores[c.id]} ayuda={c.ayuda}>
          <input id={`cu-${c.id}`} type="password" autoFocus={i === 0} autoComplete={c.auto} maxLength={128} value={v[c.id]}
            onChange={(e) => setV((x) => ({ ...x, [c.id]: e.target.value }))} aria-invalid={!!errores[c.id]}
            className={`${CAMPO} ${errores[c.id] ? "border-status-error" : "border-ink-200"}`} />
        </Campo>
      ))}
      <label data-cascada className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink-900">
        <input type="checkbox" checked={cerrarOtras} onChange={(e) => setCerrarOtras(e.target.checked)} className="h-5 w-5 accent-brand-500" />
        Cerrar las sesiones abiertas en otros dispositivos
      </label>
      <Pie>
        <BotonFicha variante="contorno" onClick={onCancelar}>Cancelar</BotonFicha>
        <BotonEnviar ocupado={ocupado} deshabilitado={!v.actual || !v.nueva || !v.repetida}>Cambiar contraseña</BotonEnviar>
      </Pie>
    </form>
  );
}

function FormCodigos({ onListo }: { onListo: () => void }) {
  const [codigos, setCodigos] = useState<string[] | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);
  const errorDeAccion = useErrorDeAccion();
  const generar = async () => {
    setOcupado(true);
    setError("");
    try {
      setCodigos((await panel.codigosNuevos()).codigos_respaldo);
    } catch (err) {
      setError(errorDeAccion(err) ?? "No se pudieron generar.");
    } finally {
      setOcupado(false);
    }
  };
  if (!codigos) return (
    <div className="flex flex-col gap-4">
      <p data-cascada className="text-sm text-ink-900">{pegar("Se generan 10 códigos nuevos y los anteriores dejan de servir en este momento. Cada uno sirve una sola vez para entrar sin el celular.")}</p>
      {error && <p role="alert" className="text-sm text-status-error">{error}</p>}
      <Pie>
        <BotonFicha variante="contorno" onClick={onListo}>Cancelar</BotonFicha>
        <BotonFicha icono="llave" onClick={() => void generar()} deshabilitado={ocupado}>{ocupado ? "Generando…" : "Generar códigos nuevos"}</BotonFicha>
      </Pie>
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      <p data-cascada className="text-sm text-ink-900">{pegar("Tus códigos nuevos. Guardalos en un lugar seguro: no se vuelven a mostrar.")}</p>
      <ul data-cascada className="grid grid-cols-2 gap-2 rounded-[14px] bg-ink-50 p-4 font-mono text-sm tabular-nums text-ink-900">
        {codigos.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <Pie>
        <BotonFicha variante="contorno" icono="copiar" onClick={() => { void navigator.clipboard?.writeText(codigos.join("\n")).then(() => setCopiado(true)); }}>{copiado ? "Copiados" : "Copiar"}</BotonFicha>
        <BotonFicha icono="tilde" onClick={onListo}>Ya los guardé</BotonFicha>
      </Pie>
    </div>
  );
}
