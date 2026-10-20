import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TalleresContent } from "@/components/formacion/talleres-content";
import { CourseCatalog } from "@/components/catalog/course-table";
import { getCourses } from "@/lib/api";
import { MODALITIES, getModalityBySlug } from "@/lib/formacion-modalities";

export const dynamicParams = false;

export function generateStaticParams() {
  return MODALITIES.map((m) => ({ modality: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { modality: string };
}): Promise<Metadata> {
  const info = getModalityBySlug(params.modality);
  if (!info) return {};
  return {
    title: `${info.title} — Elevar Formación`,
    description: info.desc,
  };
}

/**
 * Lista de cursos por modalidad (Mateo, 2026-10-19: referencia Dennis Snellenberg ·
 * Work). Recibe todos los cursos: las píldoras cambian de modalidad sin recargar y
 * actualizan la dirección (/formacion/<modalidad>).
 */
export default async function ModalityPage({
  params,
}: {
  params: { modality: string };
}) {
  const info = getModalityBySlug(params.modality);
  if (!info) notFound();

  const data = await getCourses().catch(() => null);

  return (
    <CourseCatalog
      courses={data?.results ?? []}
      initial={info.slug}
      workshop={<TalleresContent />}
    />
  );
}
