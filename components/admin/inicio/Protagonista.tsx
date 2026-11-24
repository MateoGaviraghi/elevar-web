"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { MODALIDAD, ORIGEN_CONSULTA, fechaHora, plata } from "@/lib/admin/formato";
import type { Inicio } from "@/lib/admin/tipos";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { pegar, sinViuda } from "@/lib/texto";
import { AreaDegrade, Barras, Cifra, CifraRueda, Embudo, Filas, LineaContraAntes, Medidor, MosaicoCursos, diaCorto, diaDeSemana, mesCorto, mesLargo, numero } from "./graficos";
import {
  Acciones, Bienvenida, Boton, Conclusion, ConsultasViejas, Encabezado, Lienzo, Referencia, Tarjeta,
  SI_ALCANZA, cambio, consultaMasVieja, frasesDelMes, hace, plural, suave, suma, textoMontos, useTono, type Tono,
} from "./piezas";
import { PilaUrgente, contarUrgencias } from "./PilaUrgente";

/**
 * El Inicio (elegido el 2026-11-24 sobre la versión A). Tercera pasada, mismo día: «los componentes son tan
 * grandes que arrancás y no ves ninguno… si entran dentro de la pantalla mejor, porque el scrollear te pierde».
 * Una banda baja con la pila de urgencias y tres pestañas; en la computadora cada pestaña entra entera en la
 * pantalla (medido a 1366×650, 1440×900 y 1920×1080):
 * - Hoy: cuatro cifras (consultas, accesos, compras para recuperar, tiempo de respuesta), las consultas de 30
 *   días y a quién contestar primero.
 * - Lo que viene: la próxima fecha con su cupo, el ritmo de inscripción y las otras fechas.
 * - Negocio: lo cobrado, las ventas, los cursos, de dónde llegan las consultas y del webinar a la compra.
 * La pestaña queda en la dirección (?vista=), así que al recargar no se pierde.
 */

const VISTAS = [
  { id: "hoy", texto: "Hoy" },
  { id: "viene", texto: "Lo que viene" },
  { id: "negocio", texto: "Negocio" },
] as const;
type Vista = (typeof VISTAS)[number]["id"];
// Cómo se reparte el alto en la computadora: la fila de cifras a su medida y el resto para los gráficos.
const FILAS: Record<Vista, string> = { hoy: "lg:grid-rows-[auto_minmax(0,1fr)]", viene: "lg:grid-rows-[minmax(0,1fr)]", negocio: "lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] [@media(min-width:1024px)_and_(max-height:780px)]:grid-rows-[minmax(0,1.35fr)_minmax(0,1fr)]" };

export function Protagonista({ d, nombre }: { d: Inicio; nombre: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const pedida = params.get("vista");
  const vista: Vista = VISTAS.some((v) => v.id === pedida) ? (pedida as Vista) : "hoy";
  const elegir = useCallback((v: Vista) => {
    router.replace(v === "hoy" ? pathname : `${pathname}?vista=${v}`, { scroll: false });
  }, [pathname, router]);

  const panel = useRef<HTMLDivElement>(null);
  // Al cambiar de pestaña, las tarjetas entran en cascada (0,4 s).
  useGSAP(() => {
    const tarjetas = panel.current?.querySelectorAll("[data-tarjeta]");
    if (!tarjetas?.length || prefersReducedMotion()) return;
    gsap.fromTo(tarjetas, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.05, clearProps: "opacity,transform" });
  }, { dependencies: [vista], scope: panel });

  const cuentas: Record<Vista, number | null> = { hoy: contarUrgencias(d), viene: d.proximas_fechas.length, negocio: null };

  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-4rem)]">
      <Bienvenida d={d} nombre={nombre} urgente={<PilaUrgente d={d} />} />
      <Pestanas vista={vista} elegir={elegir} cuentas={cuentas} />
      <div ref={panel} id={`vista-${vista}`} role="tabpanel" aria-labelledby={`pestana-${vista}`}
        className={`grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12 ${FILAS[vista]}`}>
        {vista === "hoy" && <VistaHoy d={d} />}
        {vista === "viene" && <VistaViene d={d} />}
        {vista === "negocio" && <VistaNegocio d={d} />}
      </div>
    </div>
  );
}

/** La barra de pestañas: un resaltado azul que se desliza a la elegida (0,35 s); flechas, Inicio y Fin del teclado. */
function Pestanas({ vista, elegir, cuentas }: { vista: Vista; elegir: (v: Vista) => void; cuentas: Record<Vista, number | null> }) {
  const lista = useRef<HTMLDivElement>(null);
  const resalte = useRef<HTMLSpanElement>(null);
  const primera = useRef(true);
  useLayoutEffect(() => {
    const el = lista.current?.querySelector<HTMLElement>(`[data-vista="${vista}"]`);
    if (!el || !resalte.current) return;
    const destino = { x: el.offsetLeft, width: el.offsetWidth, opacity: 1 };
    if (primera.current || prefersReducedMotion()) gsap.set(resalte.current, destino);
    else gsap.to(resalte.current, { ...destino, duration: 0.35, ease: "power3.out" });
    primera.current = false;
  }, [vista]);
  const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = VISTAS.findIndex((v) => v.id === vista);
    const siguiente = e.key === "ArrowRight" ? (i + 1) % VISTAS.length : e.key === "ArrowLeft" ? (i - 1 + VISTAS.length) % VISTAS.length
      : e.key === "Home" ? 0 : e.key === "End" ? VISTAS.length - 1 : -1;
    if (siguiente < 0) return;
    e.preventDefault();
    elegir(VISTAS[siguiente]!.id);
    lista.current?.querySelector<HTMLElement>(`[data-vista="${VISTAS[siguiente]!.id}"]`)?.focus();
  };
  return (
    <div className="sticky top-14 z-20 -mx-1 shrink-0 bg-ink-50/90 px-1 py-1 backdrop-blur lg:static lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <div ref={lista} role="tablist" aria-label="Vistas del inicio" onKeyDown={tecla}
        className="relative inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-ink-100 bg-neutral-0 p-1">
        <span ref={resalte} aria-hidden className="absolute bottom-1 left-0 top-1 rounded-full bg-ink-900 opacity-0" />
        {VISTAS.map((v) => {
          const activa = v.id === vista;
          const n = cuentas[v.id];
          return (
            <button key={v.id} type="button" role="tab" id={`pestana-${v.id}`} data-vista={v.id} aria-selected={activa} aria-controls={`vista-${v.id}`}
              tabIndex={activa ? 0 : -1} onClick={() => elegir(v.id)}
              className={`relative z-[1] inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full px-4 font-sub text-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 ${activa ? "text-neutral-0" : "text-ink-900 [@media(hover:hover)]:hover:bg-ink-50"}`}>
              {v.texto}
              {n ? <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${activa ? "bg-brand-500 text-neutral-0" : "bg-ink-100 text-ink-900"}`}>{n}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Hoy ------------------------------------------------------------------------------------------------

const horas = (h: number) => (h < 1 ? "< 1 h" : h < 48 ? `${numero(Math.round(h))} h` : `${numero(Math.round(h / 24))} días`);

function VistaHoy({ d }: { d: Inicio }) {
  const vieja = consultaMasVieja(d);
  const { cantidad, ordenes } = d.compras_sin_completar;
  const t = d.tiempo_respuesta;
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-12 xl:grid-cols-4">
        <Cifra4 tono="naranja" icono="espera" etiqueta="Pendientes" titulo="Consultas sin contestar" href="/admin/consultas" accion="Contestar"
          paraQue="Cada una es alguien que preguntó por un curso y espera tu respuesta."
          valor={<CifraRueda valor={d.consultas_nuevas} className="font-sub text-4xl font-bold tracking-tight" />}
          pie={vieja ? `La más vieja llegó el ${vieja}.` : "No hay nadie esperando."} />
        <Cifra4 tono="azul" icono="llave" etiqueta="Por cumplir" titulo="Pagaron y no tienen el curso" href="/admin/ordenes" accion="Dar el acceso"
          paraQue="Ya pagaron y todavía no pueden entrar al aula. Es lo primero que reclaman."
          valor={<Cifra valor={d.ordenes_sin_cumplir} className="font-sub text-4xl font-bold" />}
          pie={d.ordenes_sin_cumplir && d.sin_acceso_desde ? `La que más espera pagó ${hace(d.sin_acceso_desde)}.` : "Todas tienen el acceso."} />
        <Cifra4 icono="moneda" etiqueta="Para recuperar" titulo="Compras que no se completaron" href="/admin/ordenes?estado=FAILED" accion="Escribirles"
          paraQue="Quisieron comprar en el último mes y el pago falló o lo dejaron por la mitad. Un mensaje puede recuperar la venta."
          valor={<Cifra valor={cantidad} className="font-sub text-4xl font-bold" />}
          pie={ordenes[0] ? `La última: ${ordenes[0].buyer_name}, ${plata(ordenes[0].total, ordenes[0].currency)}.` : "Ninguna en el último mes."} />
        <Cifra4 icono="reloj" etiqueta="Atención" titulo="Tiempo de respuesta" href="/admin/consultas" accion="Consultas"
          paraQue="La mitad de las consultas se contesta en este tiempo o menos (últimos 90 días). Solo cuenta lo que se marca en el panel: si se contesta por correo sin cambiar el estado, no entra."
          valor={<span className="font-sub text-4xl font-bold">{t.mediana_horas !== null ? horas(t.mediana_horas) : "Sin datos"}</span>}
          pie={t.mediana_horas_antes !== null ? `Antes: ${horas(t.mediana_horas_antes)} (90 días anteriores).` : `${plural(t.medidas, "consulta medida", "consultas medidas")}.`} />
      </div>
      <Consultas30 d={d} />
      <Tarjeta className="lg:col-span-5" aria-labelledby="a-viejas">
        <Encabezado icono="responder" etiqueta="Para contestar" id="a-viejas" titulo="¿A quién contestar primero?"
          paraQue="Las consultas sin contestar, de la que más espera a la más nueva. Tocá una para abrirla."
          extra={<Boton href="/admin/consultas" variante="enlace">Ver todas</Boton>} />
        <ConsultasViejas d={d} />
      </Tarjeta>
    </>
  );
}

/** Una cifra de la fila de arriba, con el lugar donde se resuelve. */
function Cifra4({ tono = "blanco", icono, etiqueta, titulo, valor, pie, href, accion, paraQue }: Cifra4Props) {
  return (
    <Tarjeta as="article" tono={tono} className="gap-2">
      <Encabezado chico icono={icono} etiqueta={etiqueta} titulo={titulo} paraQue={paraQue} />
      <div className="flex items-end justify-between gap-3">
        {valor}
        <EnlaceTarjeta href={href}>{accion}</EnlaceTarjeta>
      </div>
      <Pie>{pie}</Pie>
    </Tarjeta>
  );
}

interface Cifra4Props { tono?: Tono; icono: string; etiqueta: string; titulo: string; valor: ReactNode; pie: string; href: string; accion: string; paraQue: string }

function Pie({ children }: { children: string }) {
  const t = useTono();
  return <p className={`truncate text-xs ${suave(t)} ${SI_ALCANZA}`}>{pegar(children)}</p>;
}

function EnlaceTarjeta({ href, children }: { href: string; children: string }) {
  const t = useTono();
  return (
    <Link href={href} className={`group inline-flex shrink-0 items-center gap-1 pb-1 font-sub text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${t === "blanco" ? "text-ink-900" : "text-neutral-0"}`}>
      {children}
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className={`transition-transform duration-300 [@media(hover:hover)]:group-hover:translate-x-1 ${t === "blanco" ? "text-brand-500" : ""}`}>
        <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function Consultas30({ d }: { d: Inicio }) {
  const dias = d.consultas_dias.map((x) => x.n);
  const antes = d.consultas_dias_antes.map((x) => x.n);
  return (
    <Tarjeta className="lg:col-span-7" aria-labelledby="a-pendientes">
      <Encabezado icono="grafico" etiqueta="Consultas" id="a-pendientes" titulo="¿Cuántas consultas entraron?"
        paraQue="Las consultas de cada día de los últimos 30, contra los 30 anteriores. Sirve para ver si viene un mes movido o tranquilo." />
      <Referencia items={[{ muestra: "linea", texto: "Últimos 30 días" }, { muestra: "punteada", texto: "Los 30 anteriores" }]} />
      <Lienzo min={140}>
        {(alto) => (
          <LineaContraAntes actual={dias} antes={antes} alto={alto}
            etiquetas={d.consultas_dias.map((x, k) => (k === dias.length - 1 ? "Hoy" : diaCorto(x.dia)))}
            detalle={(i) => (
              <>
                <span className="block first-letter:uppercase">{diaDeSemana(d.consultas_dias[i]!.dia)} {diaCorto(d.consultas_dias[i]!.dia)}</span>
                <b>{plural(dias[i]!, "consulta", "consultas")}</b>
                <span className="block text-neutral-0/70">un mes antes: {antes[i]}</span>
              </>
            )} />
        )}
      </Lienzo>
      <Conclusion>{pegar(`Entraron ${plural(suma(dias), "consulta", "consultas")} en 30 días, ${cambio(suma(dias), suma(antes))}.`)}</Conclusion>
    </Tarjeta>
  );
}

// --- Lo que viene -----------------------------------------------------------------------------------

const diasHasta = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

function VistaViene({ d }: { d: Inicio }) {
  return (
    <>
      <Proximo d={d} />
      <Ritmo d={d} />
    </>
  );
}

function Proximo({ d }: { d: Inicio }) {
  const prox = d.proxima_fecha;
  const otras = d.proximas_fechas.slice(1);
  return (
    <Tarjeta tono="azul" className="lg:col-span-4" aria-labelledby="a-webinar">
      <Encabezado icono="personas" etiqueta="Agenda" id="a-webinar" titulo="¿Cuántos se anotaron al próximo?"
        paraQue="El cupo del próximo webinar o curso en vivo. Sirve para saber si hay que empujar la difusión antes de que empiece." />
      {prox ? (
        <>
          <div className="relative mx-auto w-full max-w-[210px] [@media(min-width:1024px)_and_(max-height:780px)]:max-w-[150px]">
            <Medidor claro parte={prox.inscriptos} total={prox.cupo ?? Math.max(prox.inscriptos, 1)} />
            <p className="absolute inset-x-0 bottom-0 text-center">
              <Cifra valor={prox.inscriptos} className="font-sub text-3xl font-bold [@media(min-width:1024px)_and_(max-height:780px)]:text-2xl" />
              <span className="block text-xs text-neutral-0/75">{prox.cupo ? `de ${prox.cupo} lugares` : "inscriptos, sin cupo"}</span>
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[12px] bg-neutral-0/[0.07] p-2.5">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{prox.curso}</span>
              <span className="block font-sub text-xs text-neutral-0/75">{MODALIDAD[prox.modalidad]} · {fechaHora(prox.inicio)}</span>
            </span>
            <span className="shrink-0 rounded-[10px] bg-brand-500 px-2.5 py-1 text-center">
              <span className="block font-sub text-lg font-bold leading-none">{diasHasta(prox.inicio)}</span>
              <span className="block text-[10px]">{diasHasta(prox.inicio) === 1 ? "día" : "días"}</span>
            </span>
          </div>
          {otras.length > 0 && (
            <ul className={`flex flex-col gap-1 border-t border-neutral-0/15 pt-2 ${SI_ALCANZA}`}>
              {otras.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="min-w-0 truncate">{f.curso}</span>
                  <span className="shrink-0 font-sub text-xs text-neutral-0/75">{diaCorto(f.inicio.slice(0, 10))} · {f.cupo ? `${f.inscriptos}/${f.cupo}` : f.inscriptos}</span>
                </li>
              ))}
            </ul>
          )}
          <Acciones><Boton href={`/admin/inscripciones?fecha=${prox.id}`} variante="secundario" chico>Ver los inscriptos</Boton></Acciones>
        </>
      ) : (
        <p className="py-8 text-center text-sm text-neutral-0/80">No hay webinars ni cursos en vivo con fecha.</p>
      )}
    </Tarjeta>
  );
}

function Ritmo({ d }: { d: Inicio }) {
  const prox = d.proxima_fecha;
  const serie = d.ritmo_inscripcion;
  const valores = serie.map((x) => x.n);
  const semana = valores.length ? valores.at(-1)! - (valores.at(-8) ?? 0) : 0;
  const faltan = prox?.cupo ? Math.max(0, prox.cupo - prox.inscriptos) : null;
  return (
    <Tarjeta className="lg:col-span-8" aria-labelledby="a-ritmo">
      <Encabezado icono="tendencia" etiqueta="Inscripción" id="a-ritmo" titulo="¿A qué ritmo se va llenando?"
        paraQue="Los inscriptos día por día hasta hoy, contra el cupo. Si la línea se aplana, conviene volver a difundir. Solo en webinars: en un curso en vivo no queda guardado qué día se ocupó cada lugar." />
      {serie.length > 1 && prox ? (
        <>
          <Referencia items={[{ muestra: "linea", texto: "Inscriptos acumulados" }, ...(prox.cupo ? [{ muestra: "punteada" as const, texto: "El cupo" }] : [])]} />
          <Lienzo min={160}>
            {(alto) => (
              <AreaDegrade valores={valores} meta={prox.cupo ?? undefined} textoMeta={prox.cupo ? `Cupo: ${prox.cupo}` : undefined} alto={alto}
                etiquetas={serie.filter((_, k) => k === 0 || k === serie.length - 1 || k % 7 === 0).map((x, k, a) => (k === a.length - 1 ? "Hoy" : diaCorto(x.dia)))}
                detalle={(i) => (
                  <>
                    <span className="block first-letter:uppercase">{diaDeSemana(serie[i]!.dia)} {diaCorto(serie[i]!.dia)}</span>
                    <b>{plural(valores[i]!, "inscripto", "inscriptos")}</b>
                  </>
                )} />
            )}
          </Lienzo>
          <Conclusion>
            {pegar(`En la última semana se anotaron ${numero(semana)}.${faltan !== null ? ` Quedan ${plural(faltan, "lugar", "lugares")} y faltan ${plural(diasHasta(prox.inicio), "día", "días")}.` : ""}`)}
          </Conclusion>
        </>
      ) : (
        <p className="flex flex-1 items-center justify-center py-10 text-center text-sm text-neutral-700">
          {pegar(prox && prox.modalidad !== "WEBINAR"
            ? "El ritmo se ve en los webinars, donde cada inscripción tiene su día. En un curso en vivo se ven los lugares ocupados en la tarjeta de al lado."
            : "Todavía no hay inscripciones para la próxima fecha.")}
        </p>
      )}
    </Tarjeta>
  );
}

// --- Negocio ------------------------------------------------------------------------------------------

function VistaNegocio({ d }: { d: Inicio }) {
  return (
    <>
      <Cobrado d={d} />
      <Ventas d={d} />
      <Origen d={d} />
      <Cursos d={d} />
      <WebinarACompra d={d} />
    </>
  );
}

function Cobrado({ d }: { d: Inicio }) {
  const mes = frasesDelMes(d);
  const anterior = d.compras_meses.at(-2);
  const nombreAnterior = anterior ? mesLargo(`${anterior.mes}-01`) : "";
  const monedas = Array.from(new Set([...Object.keys(mes.montosMes), ...Object.keys(anterior?.montos ?? {})])).sort();
  return (
    <Tarjeta tono="azul" className="lg:col-span-3" aria-labelledby="a-cobrado">
      <Encabezado chico icono="moneda" etiqueta="Cobros" id="a-cobrado" titulo={`Cobrado en ${mes.mesNombre}`}
        paraQue={`Lo que entró este mes contra ${nombreAnterior || "el mes anterior"}. Pesos y dólares van por separado porque no se suman.`} />
      {monedas.length ? (
        <ul className="flex flex-col gap-2 [@media(min-width:1024px)_and_(max-height:780px)]:gap-1">
          {monedas.map((m) => {
            const ahora = Number(mes.montosMes[m] ?? 0), antes = Number(anterior?.montos[m] ?? 0);
            const p = antes ? Math.round(((ahora - antes) / antes) * 100) : null;
            return (
              <li key={m} className="rounded-[12px] bg-neutral-0/[0.07] px-3 py-2 [@media(min-width:1024px)_and_(max-height:780px)]:py-1">
                <p className="font-sub text-2xl font-bold tabular-nums [@media(min-width:1024px)_and_(max-height:780px)]:text-xl">{plata(mes.montosMes[m] ?? "0", m)}</p>
                <p className="text-xs text-neutral-0/75">
                  {p === null ? `Sin cobros en ${nombreAnterior}.` : (
                    <><b className={p >= 0 ? "text-neutral-0" : "text-brand-300"}>{p >= 0 ? "+" : "−"}{Math.abs(p)} %</b> contra {nombreAnterior}</>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-neutral-0/80">Todavía no hay cobros este mes.</p>
      )}
      <p className={`mt-auto font-sub text-xs text-neutral-0/80 ${SI_ALCANZA}`}>{plural(mes.comprasMes, "compra", "compras")} · {numero(mes.comprasAntes)} en {nombreAnterior}</p>
    </Tarjeta>
  );
}

function Ventas({ d }: { d: Inicio }) {
  const compras = d.compras_meses.map((m) => m.cantidad);
  const iMax = compras.indexOf(Math.max(...compras));
  return (
    <Tarjeta className="lg:col-span-6" aria-labelledby="a-compras">
      <Encabezado icono="grafico" etiqueta="Ventas" id="a-compras" titulo="¿Cuántas compras entraron por mes?"
        paraQue="Las compras pagadas de cada uno de los últimos doce meses. Sirve para ver en qué épocas se vende más y planificar las fechas."
        extra={<Boton href="/admin/ordenes" variante="enlace">Órdenes</Boton>} />
      <Lienzo min={130}>
        {(alto) => (
          <Barras valores={compras} etiquetas={d.compras_meses.map((m) => mesCorto(`${m.mes}-01`))} resaltar={iMax} mostrarValor apagado="#B9C7D5" alto={alto}
            detalle={(i) => (
              <>
                <span className="block first-letter:uppercase">{mesLargo(`${d.compras_meses[i]!.mes}-01`)}</span>
                <b>{plural(compras[i]!, "compra", "compras")}</b>
                <span className="block text-neutral-0/70">{textoMontos(d.compras_meses[i]!.montos)}</span>
              </>
            )} />
        )}
      </Lienzo>
      {suma(compras) > 0
        ? <Conclusion>{pegar(`El mes con más compras fue ${mesLargo(`${d.compras_meses[iMax]!.mes}-01`)}, con ${numero(compras[iMax]!)}.`)}</Conclusion>
        : <p className="text-sm text-neutral-700">Todavía no hay compras pagadas en los últimos doce meses.</p>}
    </Tarjeta>
  );
}

function Origen({ d }: { d: Inicio }) {
  const items = d.consultas_por_origen.map((o) => ({ texto: ORIGEN_CONSULTA[o.origen] ?? o.origen, n: o.n }));
  const total = suma(items.map((x) => x.n));
  return (
    <Tarjeta tono="azul" className="lg:col-span-3" aria-labelledby="a-origen">
      <Encabezado icono="consultas" etiqueta="Canales" id="a-origen" titulo="¿De dónde llegan?"
        paraQue="De dónde llegaron las consultas de los últimos 90 días. Sirve para saber dónde vale la pena poner tiempo: el formulario, la comunidad o los webinars." />
      {total ? <Filas azul items={items} /> : <p className="py-6 text-center text-sm text-neutral-0/80">No entraron consultas en los últimos 90 días.</p>}
    </Tarjeta>
  );
}

function Cursos({ d }: { d: Inicio }) {
  const { cursos, resto } = d.cursos_mas_vendidos;
  const total = suma(cursos.map((c) => c.lugares)) + resto;
  return (
    <Tarjeta className="lg:col-span-8" aria-labelledby="a-cursos">
      <Encabezado icono="cursos" etiqueta="Cursos" id="a-cursos" titulo="¿Qué cursos se venden más?"
        paraQue="Cada bloque es un curso: cuanto más grande, más lugares vendió en los últimos doce meses. Tocalo para abrirlo. Sirve para decidir qué curso repetir y cuál difundir más."
        extra={<Boton href="/admin/cursos" variante="enlace">Cursos</Boton>} />
      {cursos.length ? (
        <>
          <Lienzo min={240}>{(alto) => <MosaicoCursos cursos={cursos} alto={alto} href={(id) => `/admin/cursos/${id}`} />}</Lienzo>
          <Conclusion>{sinViuda(`${cursos[0]!.curso} lleva ${plural(cursos[0]!.lugares, "lugar", "lugares")}, el ${Math.round((cursos[0]!.lugares / Math.max(1, total)) * 100)} % de lo vendido.`)}</Conclusion>
        </>
      ) : (
        <p className="py-10 text-center text-sm text-neutral-700">Todavía no hay compras pagadas en los últimos doce meses.</p>
      )}
    </Tarjeta>
  );
}

function WebinarACompra({ d }: { d: Inicio }) {
  const { inscriptos, compraron } = d.webinar_a_compra;
  const p = inscriptos ? Math.round((compraron / inscriptos) * 100) : 0;
  return (
    <Tarjeta tono="azul" className="lg:col-span-4" aria-labelledby="a-embudo">
      <Encabezado icono="personas" etiqueta="Del webinar a la venta" id="a-embudo" titulo="¿Cuántos compran después?"
        paraQue="De la gente que se anotó a un webinar gratis en los últimos doce meses, cuántos pagaron un curso después. Se cruza por correo: si alguien se anotó con un correo y pagó con otro, no se cuenta. Por eso es «al menos»." />
      {inscriptos ? (
        <>
          <p className="flex items-baseline gap-2">
            <Cifra valor={p} formato={(v) => `${v} %`} className="font-sub text-4xl font-bold [@media(min-width:1024px)_and_(max-height:780px)]:text-3xl" />
            <span className="text-xs text-neutral-0/75">compró al menos un curso ({numero(compraron)} de {numero(inscriptos)})</span>
          </p>
          <div className={SI_ALCANZA}><Embudo arriba={inscriptos} abajo={compraron} textoArriba="Se anotaron" textoAbajo="Compraron" /></div>
        </>
      ) : (
        <p className="py-6 text-center text-sm text-neutral-0/80">Todavía no hay inscriptos a webinars en los últimos doce meses.</p>
      )}
    </Tarjeta>
  );
}
