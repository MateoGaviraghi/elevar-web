"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Course } from "@/types";
import { getCourseById } from "@/lib/content";
import { CourseForm } from "@/components/admin/course-form";
import { AdminButton, EmptyState, PageHeader } from "@/components/admin/ui";

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<Course | null | undefined>(undefined);

  useEffect(() => {
    setCourse(getCourseById(Number(params.id)) ?? null);
  }, [params.id]);

  if (course === undefined) {
    return <p className="text-sm text-neutral-500">Cargando curso…</p>;
  }

  if (course === null) {
    return (
      <>
        <PageHeader title="Curso no encontrado" back={{ href: "/admin/cursos", label: "Cursos" }} />
        <EmptyState
          title="No encontramos este curso"
          description="Puede haberse eliminado desde otra pestaña."
          action={<AdminButton href="/admin/cursos">Volver al listado</AdminButton>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={course.title || "Editar curso"}
        description={`Código ${course.code}`}
        back={{ href: "/admin/cursos", label: "Cursos" }}
        actions={
          course.is_published !== false ? (
            <Link
              href={`/cursos/${course.slug}`}
              target="_blank"
              className="text-xs font-semibold text-neutral-500 transition-colors hover:text-ink-900"
            >
              Ver en el sitio ↗
            </Link>
          ) : undefined
        }
      />
      <CourseForm course={course} isNew={false} />
    </>
  );
}
