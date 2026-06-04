import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";
import { MediaHero } from "@/components/media/media-hero";
import { TalleresContent } from "@/components/formacion/talleres-content";
import { CourseIndex } from "@/components/catalog/course-index";
import { getCourses } from "@/lib/api";
import { MODALITIES, getModalityBySlug } from "@/lib/formacion-modalities";
import type { Modality } from "@/types";

export const dynamicParams = false;

// Foto de hero por modalidad (mockup lab/ciencia).
const MODALITY_IMG: Record<Modality, string> = {
  LIVE: "/assets/mockup/m1.jpg",
  ASYNC: "/assets/mockup/m6.jpg",
  WEBINAR: "/assets/mockup/m5.jpg",
  WORKSHOP: "/assets/mockup/m4.jpg",
};

export function generateStaticParams() {
  return MODALITIES.map((m) => ({ modality: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { modality: string };
}): Promise<Metadata> {
  const { modality: slug } = params;
  const info = getModalityBySlug(slug);
  if (!info) return {};
  return {
    title: `${info.title} — Elevar Formación`,
    description: info.desc,
  };
}

export default async function ModalityPage({
  params,
}: {
  params: { modality: string };
}) {
  const { modality: slug } = params;
  const info = getModalityBySlug(slug);
  if (!info) notFound();

  const data = await getCourses({ modality: info.modality }).catch(() => null);

  return (
    <>
      {/* Hero con foto + parallax */}
      <MediaHero
        image={MODALITY_IMG[info.modality] ?? "/assets/mockup/m1.jpg"}
        eyebrow="Formación"
        size="md"
        title={info.title}
        subtitle={info.desc}
      >
        <div className="mb-8 flex items-center gap-2 text-xs text-neutral-300">
          <Link href="/formacion" className="transition-colors hover:text-neutral-0">
            Formación
          </Link>
          <span aria-hidden>/</span>
          <span className="text-neutral-200">{info.title}</span>
        </div>
      </MediaHero>

      {/* Talleres tiene página dedicada; el resto muestra el catálogo editorial. */}
      {info.modality === "WORKSHOP" ? (
        <TalleresContent />
      ) : (
        (data?.results.length ?? 0) > 0 && (
          <section className="bg-neutral-0 py-16 md:py-24">
            <Container className="max-w-4xl">
              {info.modality === "LIVE" && (
                <p className="mb-10 text-sm text-neutral-500">
                  A continuación, se describen los próximos cursos disponibles.
                </p>
              )}
              <CourseIndex
                courses={data?.results ?? []}
                grouped={info.modality === "ASYNC"}
              />
            </Container>
          </section>
        )
      )}
    </>
  );
}
