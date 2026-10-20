import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RelatedCourses } from "@/components/catalog/related-courses";
import { CourseFicha } from "@/components/curso/ficha";
import { MODALITY_TEMPLATES } from "@/lib/formacion-templates";
import { ApiError, getCourse } from "@/lib/api";
import type { Course } from "@/types";

// Fase 0 (mockup sobre next dev): se renderiza on-demand. En Fase 1 (export estático)
// añadir generateStaticParams() con los slugs publicados.

// Va acá y no en ficha-parts ("use client"): un objeto importado de un módulo de
// cliente llega al servidor como referencia, no como valor.
const MODALITY_PATH: Record<Course["modality"], { slug: string; label: string }> = {
  ASYNC: { slug: "cursos-asincronicos", label: "Curso asincrónico" },
  LIVE: { slug: "cursos-online-en-vivo", label: "Curso online en vivo" },
  WEBINAR: { slug: "webinars-gratuitos", label: "Webinar gratuito" },
  WORKSHOP: { slug: "talleres", label: "Taller" },
  EBOOK: { slug: "e-books", label: "E-Book" },
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
    title: `${course.code} · ${course.title} — Elevar Formación`,
    description: course.objectives ?? course.summary,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const course = await fetchCourse(params.slug);
  if (!course) notFound();

  const data = {
    course,
    tpl: MODALITY_TEMPLATES[course.modality],
    modality: MODALITY_PATH[course.modality],
  };

  return (
    <>
      <CourseFicha data={data} />
      <RelatedCourses courseId={course.id} modality={course.modality} categorySlug={course.category?.slug} />
    </>
  );
}
