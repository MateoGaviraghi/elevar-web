import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";
import { VideoSlot } from "@/components/media/video-slot";
import { buttonClasses } from "@/components/ui/button";

function IconTarget() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function IconAward() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="9" r="6" /><path d="M9 14.5 8 22l4-2 4 2-1-7.5" />
    </svg>
  );
}

const INCLUYE = [
  { Icon: IconTarget, t: "Tema a medida", d: "El contenido se define con tu equipo, sobre lo que necesitan reforzar." },
  { Icon: IconBolt, t: "Intensivo y práctico", d: "Jornadas concentradas con ejercicios sobre casos reales del laboratorio." },
  { Icon: IconPin, t: "Presencial o remoto", d: "En tu laboratorio o por videollamada, según les quede mejor." },
  { Icon: IconAward, t: "Con certificado", d: "Cada participante recibe su certificado de participación." },
];

/** Página dedicada de Talleres (la modalidad no tiene catálogo de cursos). */
export function TalleresContent() {
  return (
    <>
      {/* Intro: imagen editorial + prosa */}
      <section className="bg-neutral-0 py-20 md:py-28">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <Reveal as="div" className="order-2 lg:order-1">
              <h2 className="text-balance font-display text-3xl font-semibold leading-[1.1] tracking-tight text-ink-900 md:text-[2.6rem]">
                Formación intensiva, a la medida de tu laboratorio
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-ink-700">
                Encuentros donde tu equipo se forma en un tema específico, con práctica
                guiada y foco en la realidad operativa de tu laboratorio. Definimos el
                contenido, la fecha y la modalidad junto a vos.
              </p>
              <Link
                href="/contacto"
                className={buttonClasses({ variant: "primary", size: "lg", className: "mt-9" })}
              >
                Armar un taller para tu equipo
              </Link>
            </Reveal>

            <Reveal as="div" className="order-1 lg:order-2">
              <div className="relative">
                <div className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/mockup/m1.jpg"
                    alt="Profesional de laboratorio durante una capacitación"
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
                {/* Detalle superpuesto: rompe la grilla, da oficio editorial */}
                <div className="absolute -bottom-7 -left-7 hidden w-44 overflow-hidden bg-neutral-0 p-2 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] sm:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/mockup/m3.jpg"
                    alt=""
                    aria-hidden
                    className="aspect-square w-full object-cover"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Qué incluye: fila editorial con íconos (sin cards numeradas ni cajas) */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-16 md:py-24">
        <Container>
          <Reveal
            as="div"
            className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.07}
          >
            {INCLUYE.map((f) => (
              <div key={f.t}>
                <span className="inline-grid h-12 w-12 place-items-center bg-ink-900 text-brand-400">
                  <f.Icon />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-ink-900">
                  {f.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">{f.d}</p>
              </div>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* Video + cierre */}
      <section className="bg-neutral-0 py-20 md:py-28">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <Reveal as="div">
              <VideoSlot poster="/assets/mockup/m6.jpg" label="Taller en acción" />
            </Reveal>
            <Reveal as="div">
              <h2 className="text-balance font-display text-2xl font-semibold leading-tight tracking-tight text-ink-900 md:text-[2rem]">
                Llevamos la capacitación a donde la necesites
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-700">
                Coordinamos fecha, modalidad y alcance con tu equipo. Contanos qué tema
                necesitan reforzar y armamos una propuesta.
              </p>
              <Link
                href="/contacto"
                className={buttonClasses({ variant: "outline", size: "md", className: "mt-8" })}
              >
                Solicitar propuesta
              </Link>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
