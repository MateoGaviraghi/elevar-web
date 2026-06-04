import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ModalityChip } from "@/components/ui/modality-chip";
import { Reveal } from "@/components/anim/reveal";
import { MediaHero } from "@/components/media/media-hero";
import { AddToCartPanel } from "@/components/catalog/add-to-cart-panel";
import { ApiError, getCourse } from "@/lib/api";
import type { Course } from "@/types";

// Fase 0 (mockup sobre next dev): se renderiza on-demand. En Fase 1 (export estático)
// añadir generateStaticParams() con los slugs publicados.

const MODALITY_PATH: Record<Course["modality"], { slug: string; label: string }> = {
  ASYNC: { slug: "cursos-asincronicos", label: "Cursos asincrónicos" },
  LIVE: { slug: "cursos-online-en-vivo", label: "Cursos online en vivo" },
  WEBINAR: { slug: "webinars-gratuitos", label: "Webinars gratuitos" },
  WORKSHOP: { slug: "talleres", label: "Talleres" },
};

const MODALITY_IMG: Record<Course["modality"], string> = {
  LIVE: "/assets/mockup/m1.jpg",
  ASYNC: "/assets/mockup/m6.jpg",
  WEBINAR: "/assets/mockup/m5.jpg",
  WORKSHOP: "/assets/mockup/m4.jpg",
};

// Imagen editorial dentro del cuerpo, alterna según modalidad.
const BODY_IMG: Record<Course["modality"], string> = {
  LIVE: "/assets/mockup/m2.jpg",
  ASYNC: "/assets/mockup/m3.jpg",
  WEBINAR: "/assets/mockup/m8.jpg",
  WORKSHOP: "/assets/mockup/m6.jpg",
};

async function fetchCourse(slug: string): Promise<Course | null> {
  try {
    return await getCourse(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = await fetchCourse(params.slug);
  if (!course) return { title: "Curso no encontrado — Elevar" };
  return {
    title: `${course.title} — Elevar Formación`,
    description: course.summary,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const course = await fetchCourse(params.slug);
  if (!course) notFound();

  const mod = MODALITY_PATH[course.modality];
  const paragraphs = (course.description ?? course.summary)
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const facts: { label: string; value: string }[] = [
    { label: "Modalidad", value: mod.label },
  ];
  if (course.level) facts.push({ label: "Nivel", value: course.level });
  if (course.duration_hours)
    facts.push({ label: "Duración", value: `${course.duration_hours} h` });
  if (course.instructor_names)
    facts.push({ label: "Disertante", value: course.instructor_names });
  facts.push({ label: "Código", value: course.code });

  return (
    <>
      {/* Hero con foto + parallax */}
      <MediaHero
        image={MODALITY_IMG[course.modality]}
        size="md"
        title={course.title}
        subtitle={course.summary}
      >
        <nav
          aria-label="Migas de pan"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs text-neutral-300"
        >
          <Link href="/formacion" className="transition-colors hover:text-neutral-0">
            Formación
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/formacion/${mod.slug}`} className="transition-colors hover:text-neutral-0">
            {mod.label}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-neutral-200">{course.code}</span>
        </nav>
        <div className="mb-5 flex items-center gap-3">
          <ModalityChip modality={course.modality} />
          <span className="font-mono text-xs font-semibold tracking-wider text-brand-300">
            {course.code}
          </span>
        </div>
      </MediaHero>

      {/* Cuerpo */}
      <section className="bg-neutral-0 py-16 md:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:gap-16">
            {/* Contenido */}
            <Reveal as="div" className="order-2 min-w-0 lg:order-1">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                Sobre el curso
              </h2>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink-700">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {/* Imagen editorial */}
              <figure className="mt-10 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={BODY_IMG[course.modality]}
                  alt=""
                  aria-hidden
                  className="aspect-[16/9] w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                />
              </figure>

              {/* Ficha técnica */}
              <h2 className="mt-14 font-display text-2xl font-semibold tracking-tight text-ink-900">
                Detalles
              </h2>
              <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 sm:gap-x-12">
                {facts.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-baseline justify-between gap-4 border-b border-neutral-200 py-4"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                      {f.label}
                    </dt>
                    <dd className="text-right text-sm font-medium text-ink-900">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {/* Panel de compra (sticky en desktop, arriba en mobile) */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-28 lg:self-start">
              <AddToCartPanel course={course} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
