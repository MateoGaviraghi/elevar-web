import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/anim/reveal";
import { Counter } from "@/components/anim/counter";

export const metadata: Metadata = {
  title: "Nosotros — Elevar",
  description:
    "Equipo de profesionales en calidad de laboratorio. Conocé a Elevar, consultoría en ISO/IEC 17025 en Argentina y LATAM.",
};

const INTRO = [
  "Nos destacamos por nuestra capacidad resolutiva y respuesta rápida, entendiendo que las exigencias en los laboratorios requieren soluciones a tiempo.",
  "Creemos que la competencia en los laboratorios es clave para el éxito de ensayos y calibraciones. Por eso ofrecemos formación, asistencia, asesoría y auditoría.",
  "Nos une la pasión por trabajar como un equipo interdisciplinario que brinda un servicio integral para los laboratorios.",
];

const TEAM = [
  { img: "/assets/equipo/laura.png", name: "Laura Delissi", role: "Directora de Elevar" },
  { img: "/assets/equipo/foto_daniela_kuba.png", name: "Daniela Kuba", role: "Técnica Química" },
  { img: "/assets/equipo/foto_natalia_arevalo.png", name: "Natalia Arévalo", role: "Analista Química" },
  { img: "/assets/equipo/foto_guillermo_teruel.png", name: "Guillermo Teruel", role: "Ingeniero Industrial" },
  { img: "/assets/equipo/foto_cesar_collino.png", name: "César Collino", role: "Bioquímico" },
  { img: "/assets/equipo/foto_luciana_lalosa.png", name: "Luciana Lalosa", role: "Bioquímica · Esp. en Endocrinología" },
];

const LAURA_BULLETS = [
  "Licenciada en Bromatología (UNER).",
  "Consultora independiente especialista en calidad de laboratorios.",
  "Auditora de sistemas de gestión y auditora técnica para ensayos químicos según norma ISO/IEC 17025.",
  "Experta técnica del Organismo Argentino de Acreditación (OAA).",
  "Diplomada en Calidad en la Gestión Integral de Procesos (INCALIN, INTI, UNSAM).",
  "Se desempeñó en el INTI como Analista en Laboratorios Químicos y de Absorción Atómica, y como Responsable de Calidad de la institución.",
];

const VALUES = [
  { img: "/assets/valores/pictograma3.1_escuchar.png", title: "Escuchar", desc: "Escuchar e interpretar las necesidades de nuestros clientes." },
  { img: "/assets/valores/pictograma3.2_trabajar.png", title: "Trabajar", desc: "Trabajar en equipo entre nuestros clientes y expertos." },
  { img: "/assets/valores/pictograma3.3_sugerir.png", title: "Sugerir", desc: "Sugerir soluciones adaptadas a las necesidades y recursos de nuestros clientes." },
];

const MV = [
  {
    title: "Misión",
    text: "Ser un equipo de profesionales en ciencia y tecnología que, abarcando los sectores de alimentos, minería, forense, ambiente, metrología e industria, ofrece capacitaciones, auditorías internas, asistencia e implementación de la norma ISO/IEC 17025 en laboratorios de ensayo y calibración en América Latina. Comprometidos a mejorar la competencia técnica y el posicionamiento sostenible de nuestros clientes en el mercado.",
  },
  {
    title: "Visión",
    text: "Ser reconocidos como líderes en la implementación de normas de calidad y competencia técnica en América Latina, destacándonos por nuestra ética profesional y trayectoria, y contribuyendo al desarrollo sostenible y exitoso de las organizaciones con las que colaboramos.",
  },
];

export default function NosotrosPage() {
  return (
    <>
      {/* 1) Hero + intro + stats */}
      <section className="relative isolate overflow-hidden bg-ink-900 text-neutral-0">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-500/10 blur-3xl" />
        <Container className="relative py-20 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <Reveal>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-brand-500" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Nosotros</span>
              </div>
              <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
                Acerca de nosotros
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-neutral-300">
                ELEVAR es una consultoría de gestión de calidad aplicada a laboratorios de primera, segunda y tercera parte.
              </p>
              <div className="mt-7 space-y-4">
                {INTRO.map((p) => (
                  <p key={p} className="text-sm leading-relaxed text-neutral-400">
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>

            <Reveal as="div">
              <div className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/mockup/m1.jpg"
                  alt="Profesional de ELEVAR en un laboratorio"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </Reveal>
          </div>

          <div className="mt-14 flex flex-wrap gap-x-12 gap-y-6 border-t border-neutral-0/10 pt-8">
            <div className="flex items-baseline gap-2">
              <Counter to={20} suffix="+" className="font-display text-2xl font-semibold text-neutral-0" />
              <span className="text-sm text-neutral-400">años de experiencia</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-neutral-0">LATAM</span>
              <span className="text-sm text-neutral-400">alcance regional</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-neutral-0">OAA</span>
              <span className="text-sm text-neutral-400">experta técnica acreditadora</span>
            </div>
          </div>
        </Container>
      </section>

      {/* 2) Misión + Visión */}
      <section className="bg-neutral-50 py-20 md:py-28">
        <Container>
          <div className="grid items-stretch gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal as="div" className="lg:sticky lg:top-28 lg:self-start">
              <div className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/mockup/m6.jpg"
                  alt="Instrumental de laboratorio"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </Reveal>
            <Reveal as="div" className="space-y-6">
              {MV.map((b) => (
                <article
                  key={b.title}
                  className="group border border-neutral-200 bg-neutral-0 p-8 transition-colors duration-300 hover:border-ink-900"
                >
                  <span className="mb-5 block h-0.5 w-8 bg-brand-500 transition-all duration-300 group-hover:w-14" aria-hidden />
                  <h2 className="font-display text-2xl font-semibold text-ink-900">{b.title}</h2>
                  <p className="mt-4 leading-relaxed text-neutral-700">{b.text}</p>
                </article>
              ))}
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 3) Valores */}
      <section className="bg-neutral-0 py-20 md:py-28">
        <Container>
          <Reveal>
            <SectionHeader eyebrow="Cómo trabajamos" title="Nuestros valores" />
          </Reveal>
          <Reveal as="div" stagger={0.1} className="mt-12 grid gap-10 md:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.img}
                  alt=""
                  aria-hidden
                  className="mb-5 h-16 w-16 object-contain transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105"
                />
                <h3 className="font-display text-xl font-semibold text-ink-900">{v.title}</h3>
                <p className="mt-2 leading-relaxed text-neutral-700">{v.desc}</p>
              </div>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* 4) Equipo */}
      <section className="bg-neutral-50 py-20 md:py-28">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="El equipo"
              title="Profesionales en ciencia y tecnología"
              lead="Un equipo interdisciplinario detrás de cada proyecto."
            />
          </Reveal>
          <Reveal
            as="div"
            stagger={0.07}
            className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6"
          >
            {TEAM.map((m) => (
              <div key={m.name} className="group text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full bg-neutral-200/50 ring-1 ring-neutral-200 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-2 group-hover:ring-brand-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.img} alt={m.name} className="h-full w-full object-contain" />
                </div>
                <h3 className="mt-4 font-display text-sm font-semibold text-ink-900 transition-colors group-hover:text-brand-600">
                  {m.name}
                </h3>
                <p className="mt-0.5 text-xs leading-snug text-neutral-500">{m.role}</p>
              </div>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* 5) Bio Laura */}
      <section className="bg-ink-900 py-20 text-neutral-0 md:py-28">
        <Container>
          <Reveal as="div" className="grid items-center gap-12 md:grid-cols-[16rem_1fr]">
            <div className="relative mx-auto md:mx-0">
              <span aria-hidden className="absolute -left-3 -top-3 h-12 w-12 border-l-2 border-t-2 border-brand-500" />
              <span aria-hidden className="absolute -bottom-3 -right-3 h-12 w-12 border-b-2 border-r-2 border-brand-500" />
              <div className="h-56 w-56 overflow-hidden rounded-full bg-neutral-0/5 ring-1 ring-neutral-0/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/equipo/laura.png" alt="Laura Delissi" className="h-full w-full object-contain" />
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-400">Dirección</span>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Laura Delissi</h2>
              <p className="mt-1 font-medium text-brand-400">Directora de Elevar</p>
              <ul className="mt-6 space-y-3">
                {LAURA_BULLETS.map((item) => (
                  <li key={item} className="flex items-start gap-3 leading-relaxed text-neutral-300">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* 6) CTA */}
      <section className="bg-neutral-0 py-16 md:py-20">
        <Container>
          <Reveal>
            <div className="text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl">
                ¿Trabajamos juntos?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-neutral-700">
                Contanos sobre tu laboratorio y te ayudamos a dar el próximo paso hacia la acreditación.
              </p>
              <div className="mt-8 flex justify-center">
                <Button variant="primary" size="lg" href="/contacto">
                  Contactanos
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
