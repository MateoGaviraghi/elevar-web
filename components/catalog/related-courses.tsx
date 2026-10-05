"use client";

import { useEffect, useState } from "react";
import type { Course, Modality, Promo } from "@/types";
import { getCourses, getPromos } from "@/lib/api";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { CourseRail } from "@/components/catalog/course-rail";

// "Otros cursos" al final de la ficha: misma categoría o modalidad, sin el actual.
// Primero los de la misma categoría, después los de la misma modalidad; hasta 8.

export function RelatedCourses({
  courseId,
  modality,
  categorySlug,
}: {
  courseId: number;
  modality: Modality;
  categorySlug?: string;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    getCourses()
      .then(({ results }) => {
        const others = results.filter((c) => c.id !== courseId);
        const score = (c: Course) =>
          (categorySlug && c.category?.slug === categorySlug ? 2 : 0) + (c.modality === modality ? 1 : 0);
        setCourses(
          others
            .filter((c) => score(c) > 0)
            .sort((a, b) => score(b) - score(a) || Number(b.is_featured) - Number(a.is_featured))
            .slice(0, 8)
        );
      })
      .catch(() => setCourses([]));
    getPromos({ featured: true }).then(setPromos).catch(() => setPromos([]));
  }, [courseId, modality, categorySlug]);

  if (courses.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 bg-neutral-50">
      <CourseRail
        courses={courses}
        promos={promos}
        label="Otros cursos"
        header={
          <Container>
            <SectionHeader
              eyebrow="Seguí capacitándote"
              title="Otros cursos que te pueden interesar"
              action={{ label: "Ver todos los cursos", href: "/formacion" }}
            />
          </Container>
        }
      />
    </section>
  );
}
