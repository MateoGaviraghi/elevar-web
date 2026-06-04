import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/anim/reveal";
import { MediaHero } from "@/components/media/media-hero";
import { VideoSlot } from "@/components/media/video-slot";
import { CourseCard } from "@/components/catalog/course-card";
import { getCourses } from "@/lib/api";
import { MODALITIES } from "@/lib/formacion-modalities";

export const metadata: Metadata = {
  title: "Formación — Elevar",
  description:
    "Capacitación en calidad de laboratorio bajo la norma ISO/IEC 17025. Cursos en vivo, asincrónicos, webinars gratuitos y talleres.",
};

export default async function FormacionPage() {
  const featured = await getCourses({ featured: true }).catch(() => null);

  return (
    <>
      {/* Hero con foto + parallax */}
      <MediaHero
        image="/assets/mockup/m1.jpg"
        eyebrow="Formación"
        size="lg"
        title="Capacitación en calidad de laboratorio"
        subtitle="Formá a tu equipo bajo la norma ISO/IEC 17025: cursos en vivo, asincrónicos, webinars gratuitos y talleres."
      />

      {/* Cómo enseñamos — espacio de video (mockup) */}
      <section className="bg-neutral-0 py-20 md:py-28">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Reveal as="div">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-8 bg-brand-500" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                  Cómo enseñamos
                </span>
              </div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl">
                Aprendé viendo, no solo leyendo
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-700">
                Clases prácticas dictadas por profesionales que trabajan en laboratorios
                bajo ISO/IEC 17025.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-ink-700">
                {["Disertantes con experiencia real", "Material descargable", "Certificado de participación"].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                      {t}
                    </li>
                  )
                )}
              </ul>
            </Reveal>

            <Reveal as="div">
              <VideoSlot poster="/assets/mockup/m6.jpg" label="Video de muestra · próximamente" />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Modalidades */}
      <section className="bg-neutral-0 py-20 md:py-28">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Modalidades"
              title="Cuatro formas de capacitarte"
            />
          </Reveal>

          <Reveal
            as="div"
            className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            stagger={0.08}
          >
            {MODALITIES.map((m) => (
              <Link
                key={m.slug}
                href={`/formacion/${m.slug}`}
                className="group border border-neutral-200 bg-neutral-0 p-7 transition-colors hover:border-ink-900 flex flex-col"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.img}
                  alt=""
                  aria-hidden
                  className="mb-5 h-16 w-16 object-contain transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105"
                />
                <h3 className="font-display text-lg font-semibold text-ink-900">
                  {m.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-700 flex-1">{m.desc}</p>
                <div className="mt-6">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-ink-900 transition-colors group-hover:text-brand-600 pointer-events-none">
                    <span className="relative">
                      Ver cursos
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

      {/* Cursos destacados */}
      <section className="bg-neutral-50 py-20 md:py-28">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Destacados"
              title="Cursos destacados"
            />
          </Reveal>

          {featured && featured.results.length > 0 ? (
            <Reveal
              as="div"
              className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              stagger={0.08}
            >
              {featured.results.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </Reveal>
          ) : (
            <p className="mt-12 text-center text-neutral-500">
              Próximamente cursos destacados.
            </p>
          )}
        </Container>
      </section>
    </>
  );
}
