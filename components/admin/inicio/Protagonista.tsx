"use client";

import Link from "next/link";
import { ESTADO_ORDEN, MEDIO_DE_PAGO, MODALIDAD, ORIGEN_CONSULTA, fechaHora, plata } from "@/lib/admin/formato";
import type { Inicio } from "@/lib/admin/tipos";
import { pegar, sinViuda } from "@/lib/texto";
import { AreaDegrade, Barras, Cifra, CifraRueda, Embudo, Filas, LineaContraAntes, Medidor, MosaicoCursos, diaCorto, diaDeSemana, mesCorto, mesLargo, numero } from "./graficos";
import {
  Acciones, Bienvenida, Boton, Conclusion, ConsultasViejas, Encabezado, Etiqueta, Piso, Referencia, Tarjeta,
  cambio, consultaMasVieja, frasesDelMes, hace, plural, suma, textoMontos,
} from "./piezas";
import { PilaUrgente } from "./PilaUrgente";

/**
 * El Inicio (elegido el 2026-11-24 sobre la versión A, «Protagonista»): tres pisos con lo que importa cada día.
 * 1. Para hacer hoy: lo que alguien espera de ELEVAR (arrepentimientos, consultas, compras pagas sin acceso,
 *    compras que no se completaron).
 * 2. Lo que viene: la próxima fecha, su cupo y su ritmo de inscripción.
 * 3. Cómo va el negocio: lo cobrado, las ventas, los cursos, de dónde vienen las consultas, del webinar a la
 *    compra y cuánto se tarda en contestar.
 * Azul tinta como superficie en cada fila, naranja para lo que espera, blanco para leer.
 */
export function Protagonista({ d, nombre }: { d: Inicio; nombre: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="lg:col-span-12">
        <Bienvenida d={d} nombre={nombre} urgente={<PilaUrgente d={d} />} acciones={(
          <>
            <Boton href="/admin/ordenes" variante="secundario">Ver las órdenes</Boton>
            <Boton href="/admin/inscripciones" variante="secundario">Ver las inscripciones</Boton>
          </>
        )} />
      </div>

      <Piso id="piso-hoy" titulo="Para hacer hoy" detalle="Lo que alguien está esperando de ELEVAR. Lo más urgente va primero." />
      <Consultas d={d} />
      <SinAcceso d={d} />
      <Tarjeta className="flex flex-col gap-4 lg:col-span-7" aria-labelledby="a-viejas">
        <Encabezado icono="responder" etiqueta="Para contestar" id="a-viejas" titulo="¿A quién contestar primero?"
          paraQue="Las que llevan más tiempo esperando van arriba. Tocá una para abrirla." />
        <ConsultasViejas d={d} />
        <Acciones><Boton href="/admin/consultas" variante="enlace">Ver todas las consultas</Boton></Acciones>
      </Tarjeta>
      <SinCompletar d={d} />

      <Piso id="piso-viene" titulo="Lo que viene" detalle="Los próximos webinars y cursos en vivo, y cómo se van llenando." />
      <Proximo d={d} />
      <Ritmo d={d} />

      <Piso id="piso-negocio" titulo="Cómo va el negocio" detalle="La plata, lo que se vende y de dónde llega la gente." />
      <Cobrado d={d} />
      <Ventas d={d} />
      <Cursos d={d} />
      <Origen d={d} />
      <WebinarACompra d={d} />
      <Respuesta d={d} />
    </div>
  );
}

// --- Para hacer hoy ---------------------------------------------------------------------------------

function Consultas({ d }: { d: Inicio }) {
  const dias = d.consultas_dias.map((x) => x.n);
  const antes = d.consultas_dias_antes.map((x) => x.n);
  const vieja = consultaMasVieja(d);
  return (
    <Tarjeta tono="naranja" className="flex flex-col gap-5 rounded-[24px] sm:p-7 lg:col-span-8" aria-labelledby="a-pendientes">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Etiqueta icono="espera">Pendientes</Etiqueta>
          <h2 id="a-pendientes" className="font-display text-xl font-semibold">Consultas sin contestar</h2>
          <CifraRueda valor={d.consultas_nuevas} className="font-sub text-7xl font-bold tracking-tight" />
          <p className="max-w-md text-sm text-neutral-0/90">
            {pegar(vieja ? `Cada una es alguien que preguntó por un curso y espera tu respuesta. La que más espera llegó el ${vieja}.` : "No hay nadie esperando respuesta.")}
          </p>
        </div>
        <Boton href="/admin/consultas">Contestar consultas</Boton>
      </div>
      <div className="flex flex-col gap-2">
        <Referencia items={[{ muestra: "linea", texto: "Consultas por día, últimos 30 días" }, { muestra: "punteada", texto: "Los 30 días anteriores" }]} />
        <LineaContraAntes claro actual={dias} antes={antes} alto={170}
          etiquetas={d.consultas_dias.map((x, k) => (k === dias.length - 1 ? "Hoy" : diaCorto(x.dia)))}
          detalle={(i) => (
            <>
              <span className="block first-letter:uppercase">{diaDeSemana(d.consultas_dias[i]!.dia)} {diaCorto(d.consultas_dias[i]!.dia)}</span>
              <b>{plural(dias[i]!, "consulta", "consultas")}</b>
              <span className="block text-neutral-0/70">un mes antes: {antes[i]}</span>
            </>
          )} />
      </div>
      <Conclusion>{pegar(`Entraron ${plural(suma(dias), "consulta", "consultas")} en 30 días, ${cambio(suma(dias), suma(antes))}.`)}</Conclusion>
    </Tarjeta>
  );
}

function SinAcceso({ d }: { d: Inicio }) {
  const n = d.ordenes_sin_cumplir;
  return (
    <Tarjeta tono="azul" className="flex flex-col gap-4 lg:col-span-4" aria-labelledby="a-acceso">
      <Encabezado icono="llave" etiqueta="Por cumplir" id="a-acceso" titulo="Pagaron y no tienen el curso"
        paraQue="Ya pagaron y todavía no pueden entrar al aula. Es lo primero que reclaman." />
      <p className="flex items-baseline gap-3">
        <Cifra valor={n} className="font-sub text-6xl font-bold" />
        <span className="text-sm text-neutral-0/75">{n === 1 ? "compra" : "compras"}</span>
      </p>
      {n > 0 && d.sin_acceso_desde ? (
        <div className="rounded-[14px] bg-neutral-0/[0.07] p-3">
          <p className="font-sub text-xs font-semibold uppercase tracking-wider text-neutral-0/70">La que más espera</p>
          <p className="mt-1 text-sm font-semibold">{pegar(`Pagó ${hace(d.sin_acceso_desde)}, el ${fechaHora(d.sin_acceso_desde)}.`)}</p>
        </div>
      ) : (
        <p className="text-sm text-neutral-0/80">Todas las compras pagadas ya tienen el acceso.</p>
      )}
      <Acciones><Boton href="/admin/ordenes">Dar el acceso</Boton></Acciones>
    </Tarjeta>
  );
}

function SinCompletar({ d }: { d: Inicio }) {
  const { cantidad, ordenes } = d.compras_sin_completar;
  return (
    <Tarjeta className="flex flex-col gap-4 lg:col-span-5" aria-labelledby="a-intentos">
      <Encabezado icono="moneda" etiqueta="Para recuperar" id="a-intentos" titulo="Compras que no se completaron"
        paraQue="Quisieron comprar y el pago falló o lo dejaron por la mitad. Un mensaje puede recuperar la venta." />
      {ordenes.length ? (
        <ul className="flex flex-col gap-2">
          {ordenes.map((o) => (
            <li key={o.public_id}>
              <Link href={`/admin/ordenes/${o.public_id}`} className="flex min-h-[56px] items-center justify-between gap-3 rounded-[14px] border border-ink-100 px-3 py-2 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 [@media(hover:hover)]:hover:border-ink-900 [@media(hover:hover)]:hover:bg-ink-50">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink-900">{o.buyer_name}</span>
                  <span className="block truncate text-xs text-neutral-700">{ESTADO_ORDEN[o.status]?.texto ?? o.status} · {MEDIO_DE_PAGO[o.payment_method] ?? o.payment_method} · {hace(o.created_at)}</span>
                </span>
                <span className="shrink-0 font-sub text-sm font-bold tabular-nums text-ink-900">{plata(o.total, o.currency)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-neutral-700">{pegar("En el último mes no quedó ninguna compra sin completar.")}</p>
      )}
      {cantidad > ordenes.length && <p className="text-xs text-neutral-700">{pegar(`Son ${numero(cantidad)} en el último mes; acá van las 5 más nuevas.`)}</p>}
      <Acciones><Boton href="/admin/ordenes?estado=FAILED" variante="secundario">Ver y escribirles</Boton></Acciones>
    </Tarjeta>
  );
}

// --- Lo que viene -----------------------------------------------------------------------------------

const diasHasta = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

function Proximo({ d }: { d: Inicio }) {
  const prox = d.proxima_fecha;
  const otras = d.proximas_fechas.slice(1);
  return (
    <Tarjeta tono="azul" className="flex flex-col gap-4 lg:col-span-5" aria-labelledby="a-webinar">
      <Encabezado icono="personas" etiqueta="Agenda" id="a-webinar" titulo="¿Cuántos se anotaron al próximo?"
        paraQue="Sirve para saber si hay que empujar la difusión antes de que empiece." />
      {prox ? (
        <>
          <div className="relative mx-auto w-full max-w-[260px]">
            <Medidor claro parte={prox.inscriptos} total={prox.cupo ?? Math.max(prox.inscriptos, 1)} />
            <p className="absolute inset-x-0 bottom-1 text-center">
              <Cifra valor={prox.inscriptos} className="font-sub text-4xl font-bold" />
              <span className="block text-xs text-neutral-0/75">{prox.cupo ? `de ${prox.cupo} lugares` : "inscriptos, sin cupo"}</span>
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[14px] bg-neutral-0/[0.07] p-3">
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{sinViuda(prox.curso)}</span>
              <span className="block font-sub text-xs text-neutral-0/75">{MODALIDAD[prox.modalidad]} · {fechaHora(prox.inicio)}</span>
            </span>
            <span className="shrink-0 rounded-[10px] bg-brand-500 px-3 py-1.5 text-center">
              <span className="block font-sub text-xl font-bold leading-none">{diasHasta(prox.inicio)}</span>
              <span className="block text-[11px]">{diasHasta(prox.inicio) === 1 ? "día" : "días"}</span>
            </span>
          </div>
          {otras.length > 0 && (
            <ul className="flex flex-col gap-1 border-t border-neutral-0/15 pt-3">
              {otras.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{f.curso}</span>
                  <span className="shrink-0 font-sub text-xs text-neutral-0/75">{diaCorto(f.inicio.slice(0, 10))} · {f.cupo ? `${f.inscriptos}/${f.cupo}` : f.inscriptos}</span>
                </li>
              ))}
            </ul>
          )}
          <Acciones><Boton href={`/admin/inscripciones?fecha=${prox.id}`} variante="secundario">Ver los inscriptos</Boton></Acciones>
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
    <Tarjeta className="flex flex-col gap-4 lg:col-span-7" aria-labelledby="a-ritmo">
      <Encabezado icono="tendencia" etiqueta="Inscripción" id="a-ritmo" titulo="¿A qué ritmo se va llenando?"
        paraQue="Los inscriptos día por día hasta hoy. Si la línea se aplana, conviene volver a difundir." />
      {serie.length > 1 && prox ? (
        <>
          <Referencia items={[{ muestra: "linea", texto: "Inscriptos acumulados" }, ...(prox.cupo ? [{ muestra: "punteada" as const, texto: "El cupo" }] : [])]} />
          <AreaDegrade valores={valores} meta={prox.cupo ?? undefined} textoMeta={prox.cupo ? `Cupo: ${prox.cupo}` : undefined} alto={220}
            etiquetas={serie.filter((_, k) => k === 0 || k === serie.length - 1 || k % 7 === 0).map((x, k, a) => (k === a.length - 1 ? "Hoy" : diaCorto(x.dia)))}
            detalle={(i) => (
              <>
                <span className="block first-letter:uppercase">{diaDeSemana(serie[i]!.dia)} {diaCorto(serie[i]!.dia)}</span>
                <b>{plural(valores[i]!, "inscripto", "inscriptos")}</b>
              </>
            )} />
          <Conclusion>
            {pegar(`En la última semana se anotaron ${numero(semana)}.${faltan !== null ? ` Quedan ${plural(faltan, "lugar", "lugares")} y faltan ${plural(diasHasta(prox.inicio), "día", "días")}.` : ""}`)}
          </Conclusion>
        </>
      ) : (
        <p className="py-10 text-center text-sm text-neutral-700">
          {pegar(prox && prox.modalidad !== "WEBINAR"
            ? "El ritmo se ve en los webinars, donde cada inscripción tiene su día. En un curso en vivo se ven los lugares ocupados en la tarjeta de al lado."
            : "Todavía no hay inscripciones para la próxima fecha.")}
        </p>
      )}
    </Tarjeta>
  );
}

// --- Cómo va el negocio -------------------------------------------------------------------------------

function Cobrado({ d }: { d: Inicio }) {
  const mes = frasesDelMes(d);
  const anterior = d.compras_meses.at(-2);
  const nombreAnterior = anterior ? mesLargo(`${anterior.mes}-01`) : "";
  const monedas = Array.from(new Set([...Object.keys(mes.montosMes), ...Object.keys(anterior?.montos ?? {})])).sort();
  return (
    <Tarjeta tono="azul" className="flex flex-col gap-4 lg:col-span-4" aria-labelledby="a-cobrado">
      <Encabezado icono="moneda" etiqueta="Cobros" id="a-cobrado" titulo={`Cobrado en ${mes.mesNombre}`}
        paraQue={`Lo que entró este mes contra ${nombreAnterior || "el mes anterior"}. Pesos y dólares van por separado porque no se suman.`} />
      {monedas.length ? (
        <ul className="flex flex-col gap-3">
          {monedas.map((m) => {
            const ahora = Number(mes.montosMes[m] ?? 0), antes = Number(anterior?.montos[m] ?? 0);
            const p = antes ? Math.round(((ahora - antes) / antes) * 100) : null;
            return (
              <li key={m} className="rounded-[14px] bg-neutral-0/[0.07] p-3">
                <p className="font-sub text-3xl font-bold tabular-nums">{plata(mes.montosMes[m] ?? "0", m)}</p>
                <p className="text-xs text-neutral-0/75">
                  {p === null ? `En ${nombreAnterior} no hubo cobros en ${m === "USD" ? "dólares" : "pesos"}.` : (
                    <><b className={p >= 0 ? "text-neutral-0" : "text-brand-300"}>{p >= 0 ? "+" : "−"}{Math.abs(p)} %</b> contra {nombreAnterior} ({plata(anterior?.montos[m] ?? "0", m)})</>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-neutral-0/80">Todavía no hay cobros este mes.</p>
      )}
      <p className="font-sub text-sm">{plural(mes.comprasMes, "compra", "compras")} en {mes.mesNombre} · {numero(mes.comprasAntes)} en {nombreAnterior}</p>
    </Tarjeta>
  );
}

function Ventas({ d }: { d: Inicio }) {
  const compras = d.compras_meses.map((m) => m.cantidad);
  const iMax = compras.indexOf(Math.max(...compras));
  return (
    <Tarjeta className="flex flex-col gap-4 lg:col-span-8" aria-labelledby="a-compras">
      <Encabezado icono="grafico" etiqueta="Ventas" id="a-compras" titulo="¿Cuántas compras entraron por mes?"
        paraQue="Sirve para ver en qué meses se vende más y planificar las fechas de los cursos." />
      <Referencia items={[{ muestra: "barra", texto: "El mes que más vendió" }, { muestra: "apagada", texto: "Los demás meses" }]} />
      <Barras valores={compras} etiquetas={d.compras_meses.map((m) => mesCorto(`${m.mes}-01`))} resaltar={iMax} mostrarValor apagado="#B9C7D5"
        detalle={(i) => (
          <>
            <span className="block first-letter:uppercase">{mesLargo(`${d.compras_meses[i]!.mes}-01`)}</span>
            <b>{plural(compras[i]!, "compra", "compras")}</b>
            <span className="block text-neutral-0/70">{textoMontos(d.compras_meses[i]!.montos)}</span>
          </>
        )} />
      {suma(compras) > 0
        ? <Conclusion>{pegar(`El mes con más compras fue ${mesLargo(`${d.compras_meses[iMax]!.mes}-01`)}, con ${numero(compras[iMax]!)}.`)}</Conclusion>
        : <p className="text-sm text-neutral-700">Todavía no hay compras pagadas en los últimos doce meses.</p>}
      <Acciones><Boton href="/admin/ordenes" variante="enlace">Ver todas las órdenes</Boton></Acciones>
    </Tarjeta>
  );
}

function Cursos({ d }: { d: Inicio }) {
  const { cursos, resto } = d.cursos_mas_vendidos;
  const total = suma(cursos.map((c) => c.lugares)) + resto;
  return (
    <Tarjeta className="flex flex-col gap-4 lg:col-span-7" aria-labelledby="a-cursos">
      <Encabezado icono="cursos" etiqueta="Cursos" id="a-cursos" titulo="¿Qué cursos se venden más?"
        paraQue="Sirve para decidir qué curso repetir y cuál conviene difundir más." />
      {cursos.length ? (
        <>
          <Referencia>Cada bloque es un curso: cuanto más grande, más lugares vendió en los últimos doce meses. Tocalo para abrirlo.</Referencia>
          <MosaicoCursos cursos={cursos} alto={300} href={(id) => `/admin/cursos/${id}`} />
          <Conclusion>{sinViuda(`${cursos[0]!.curso} lleva ${plural(cursos[0]!.lugares, "lugar", "lugares")}, el ${Math.round((cursos[0]!.lugares / Math.max(1, total)) * 100)} % de lo vendido.`)}</Conclusion>
          {resto > 0 && <p className="text-xs text-neutral-700">Los demás cursos suman {plural(resto, "lugar", "lugares")}.</p>}
        </>
      ) : (
        <p className="py-10 text-center text-sm text-neutral-700">Todavía no hay compras pagadas en los últimos doce meses.</p>
      )}
      <Acciones><Boton href="/admin/cursos" variante="secundario">Ver los cursos</Boton></Acciones>
    </Tarjeta>
  );
}

function Origen({ d }: { d: Inicio }) {
  const items = d.consultas_por_origen.map((o) => ({ texto: ORIGEN_CONSULTA[o.origen] ?? o.origen, n: o.n }));
  const total = suma(items.map((x) => x.n));
  const mejor = items.reduce((m, x) => (x.n > m.n ? x : m), items[0] ?? { texto: "", n: 0 });
  return (
    <Tarjeta tono="azul" className="flex flex-col gap-4 lg:col-span-5" aria-labelledby="a-origen">
      <Encabezado icono="consultas" etiqueta="Canales" id="a-origen" titulo="¿De dónde llegan las consultas?"
        paraQue="Sirve para saber dónde vale la pena poner tiempo: el formulario, la comunidad o los webinars." />
      {total ? (
        <>
          <Referencia>Últimos 90 días.</Referencia>
          <Filas azul items={items} />
          <Conclusion>{pegar(`La mayoría llega por ${mejor.texto.toLowerCase()}: ${Math.round((mejor.n / total) * 100)} % de ${plural(total, "consulta", "consultas")}.`)}</Conclusion>
        </>
      ) : (
        <p className="py-8 text-center text-sm text-neutral-0/80">No entraron consultas en los últimos 90 días.</p>
      )}
    </Tarjeta>
  );
}

function WebinarACompra({ d }: { d: Inicio }) {
  const { inscriptos, compraron } = d.webinar_a_compra;
  const p = inscriptos ? Math.round((compraron / inscriptos) * 100) : 0;
  return (
    <Tarjeta tono="azul" className="flex flex-col gap-4 lg:col-span-6" aria-labelledby="a-embudo">
      <Encabezado icono="personas" etiqueta="Del webinar a la venta" id="a-embudo" titulo="¿Cuántos compran después del webinar?"
        paraQue="De la gente que se anotó a un webinar gratis en los últimos doce meses, cuántos pagaron un curso después." />
      {inscriptos ? (
        <>
          <p className="flex items-baseline gap-3">
            <Cifra valor={p} formato={(v) => `${v} %`} className="font-sub text-6xl font-bold" />
            <span className="text-sm text-neutral-0/75">compró al menos un curso</span>
          </p>
          <Embudo arriba={inscriptos} abajo={compraron} textoArriba="Se anotaron" textoAbajo="Compraron" />
          <p className="text-xs text-neutral-0/70">{pegar("Se cruza por correo: si alguien se anotó con un correo y pagó con otro, no se cuenta. Por eso es «al menos».")}</p>
        </>
      ) : (
        <p className="py-8 text-center text-sm text-neutral-0/80">Todavía no hay inscriptos a webinars en los últimos doce meses.</p>
      )}
    </Tarjeta>
  );
}

const horas = (h: number) => (h < 1 ? "menos de 1 h" : h < 48 ? `${numero(Math.round(h))} h` : `${numero(Math.round(h / 24))} días`);

function Respuesta({ d }: { d: Inicio }) {
  const t = d.tiempo_respuesta;
  const mejor = t.mediana_horas !== null && t.mediana_horas_antes !== null ? t.mediana_horas <= t.mediana_horas_antes : null;
  return (
    <Tarjeta className="flex flex-col gap-4 lg:col-span-6" aria-labelledby="a-respuesta">
      <Encabezado icono="reloj" etiqueta="Atención" id="a-respuesta" titulo="¿Cuánto se tarda en contestar?"
        paraQue="Quien recibe respuesta rápido compra más. Es un número que se puede mejorar día a día." />
      {t.mediana_horas !== null ? (
        <>
          <p className="flex items-baseline gap-3">
            <span className="font-sub text-6xl font-bold text-ink-900">{horas(t.mediana_horas)}</span>
            <span className="text-sm text-neutral-700">tarda la mitad de las respuestas, o menos</span>
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[14px] bg-ink-50 p-3">
              <p className="font-sub text-xs font-semibold uppercase tracking-wider text-ink-500">{pegar("Últimos 90 días")}</p>
              <p className="font-sub text-2xl font-bold text-ink-900">{horas(t.mediana_horas)}</p>
              <p className="text-xs text-neutral-700">{pegar(plural(t.medidas, "consulta medida", "consultas medidas"))}</p>
            </div>
            <div className="rounded-[14px] bg-ink-50 p-3">
              <p className="font-sub text-xs font-semibold uppercase tracking-wider text-ink-500">{pegar("Los 90 anteriores")}</p>
              <p className="font-sub text-2xl font-bold text-ink-900">{t.mediana_horas_antes !== null ? horas(t.mediana_horas_antes) : "Sin datos"}</p>
              <p className="text-xs text-neutral-700">{pegar(plural(t.medidas_antes, "consulta medida", "consultas medidas"))}</p>
            </div>
          </div>
          {mejor !== null && <Conclusion>{mejor ? "Se está contestando más rápido que antes." : "Se está tardando más que antes en contestar."}</Conclusion>}
        </>
      ) : (
        <p className="py-6 text-center text-sm text-neutral-700">{pegar("Todavía no hay consultas marcadas como contestadas en el panel.")}</p>
      )}
      <p className="text-xs text-neutral-700">{pegar("Solo cuenta lo que se marca en el panel: si se contesta por correo sin cambiar el estado, esa consulta no entra.")}</p>
    </Tarjeta>
  );
}
