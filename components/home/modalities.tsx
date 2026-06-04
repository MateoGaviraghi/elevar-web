import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/anim/reveal";

const MODALITIES = [
  {
    img: "/assets/formacion/pictograma2.1_envivo.png",
    title: "Cursos online en vivo",
    desc: "Con días y horarios preestablecidos, tienen lugar capacitaciones en tiempo real.",
    href: "/formacion/cursos-online-en-vivo",
  },
  {
    img: "/assets/formacion/pictograma2.2_asincronico.png",
    title: "Cursos asincrónicos",
    desc: "La posibilidad de estudiar al tiempo y ritmo de cada persona, desde una plataforma amigable.",
    href: "/formacion/cursos-asincronicos",
  },
  {
    img: "/assets/formacion/pictograma2.3_webinar.png",
    title: "Webinars gratuitos",
    desc: "Temas puntuales, en encuentros cortos, como alternativa para mantener la actualización técnica.",
    href: "/formacion/webinars-gratuitos",
  },
  {
    img: "/assets/formacion/pictograma2.4_workshop.png",
    title: "Talleres en vivo",
    desc: "Un espacio para compartir análisis, conocimientos teóricos, experiencias y formas de trabajo.",
    href: "/formacion/talleres",
  },
];

export function ModalitiesSection() {
  return (
    <section className="bg-neutral-50 py-20 md:py-28">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow="Formación"
            title="Cuatro formas de capacitarte"
            lead="Elegí la modalidad que mejor se adapta a tu equipo y tus tiempos."
            action={{ label: "Ver todos los cursos", href: "/formacion" }}
          />
        </Reveal>

        <Reveal
          as="div"
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          stagger={0.08}
        >
          {MODALITIES.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="group bg-neutral-0 border border-neutral-200 p-7 transition-colors hover:border-ink-900 flex flex-col"
            >
              <Image
                src={mod.img}
                alt=""
                width={72}
                height={72}
                className="mb-6 h-16 w-16 object-contain"
                aria-hidden="true"
              />

              <h3 className="font-display text-lg font-semibold text-ink-900">
                {mod.title}
              </h3>

              <p className="text-sm text-neutral-700 mt-2 flex-1">{mod.desc}</p>

              <div className="mt-6">
                <span className="group/link inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-ink-900 transition-colors hover:text-brand-500 pointer-events-none">
                  <span className="relative">
                    Ver más
                    <span className="pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 ease-out group-hover:scale-x-100" />
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-300 ease-out group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    <line x1="4" y1="12" x2="19" y2="12" />
                    <polyline points="13 6 19 12 13 18" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
