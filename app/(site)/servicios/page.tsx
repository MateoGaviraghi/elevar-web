import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";
import { MediaHero } from "@/components/media/media-hero";
import { buttonClasses } from "@/components/ui/button";
import { SERVICIOS_DATA } from "@/lib/servicios";

export const metadata: Metadata = {
  title: "Servicios — Elevar",
  description:
    "Formación, acreditación ISO/IEC 17025, auditorías internas, asistencia técnica, implementación normativa y servicios de gestión para laboratorios.",
};

const SERVICE_IMG: Record<string, string> = {
  "formacion-profesional": "/assets/mockup/m1.jpg",
  "acreditacion-iso-17025": "/assets/mockup/m6.jpg",
  "auditorias-internas": "/assets/mockup/m8.jpg",
  "asistencia-tecnica": "/assets/mockup/m5.jpg",
  "implementacion-normativa": "/assets/mockup/m4.jpg",
  gestion: "/assets/mockup/m2.jpg",
};

export default function ServiciosPage() {
  return (
    <>
      {/* Hero con foto + parallax */}
      <MediaHero
        image="/assets/mockup/m4.jpg"
        eyebrow="Servicios"
        size="lg"
        title="Nuestros servicios"
        subtitle="Acompañamos a laboratorios de ensayo y calibración en cada etapa de su sistema de gestión, con foco en la norma ISO/IEC 17025."
      />

      {/* Grilla de servicios con foto */}
      <section className="bg-neutral-0 py-16 md:py-24">
        <Container>
          <Reveal
            as="div"
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
            stagger={0.07}
          >
            {SERVICIOS_DATA.map((s) => (
              <Link
                key={s.id}
                href={`/servicios/${s.id}`}
                className="group flex flex-col overflow-hidden border border-neutral-200 bg-neutral-0 transition-all duration-300 hover:-translate-y-1 hover:border-ink-900 hover:shadow-[0_18px_50px_-22px_rgba(15,23,42,0.25)]"
              >
                <div className="aspect-[16/10] overflow-hidden bg-ink-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={SERVICE_IMG[s.id]}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.pictogram} alt="" aria-hidden className="h-10 w-10 object-contain" />
                  <h2 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink-900 transition-colors group-hover:text-brand-600">
                    {s.title}
                  </h2>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-700">{s.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 transition-colors group-hover:text-brand-600">
                    Ver servicio
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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

      {/* CTA */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <Container className="py-16 md:py-20">
          <Reveal as="div" className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900 md:text-3xl">
                ¿Querés evaluar el sistema de tu laboratorio?
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-700">
                Contanos en qué etapa estás y armamos una propuesta a la medida de tus
                necesidades y recursos.
              </p>
            </div>
            <Link
              href="/contacto"
              className={buttonClasses({ variant: "primary", size: "lg", className: "shrink-0" })}
            >
              Solicitar asesoramiento
            </Link>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
