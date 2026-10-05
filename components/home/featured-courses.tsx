"use client";

import { useEffect, useState } from "react";
import type { Course, Promo } from "@/types";
import { getCourses, getPromos } from "@/lib/api";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { CourseRail } from "@/components/catalog/course-rail";

// Cursos destacados del Inicio: primero los destacados, después el resto, hasta 8.
// Se leen en el navegador para que reflejen lo cargado desde el panel.

export function FeaturedCoursesSection() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    getCourses()
      .then(({ results }) =>
        setCourses(
          [...results]
            .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
            .slice(0, 8)
        )
      )
      .catch(() => setCourses([]));
    getPromos({ featured: true }).then(setPromos).catch(() => setPromos([]));
  }, []);

  const header = (
    <Container>
      <SectionHeader
        eyebrow="Cursos"
        title="Cursos destacados"
        lead="Capacitaciones abiertas para tu laboratorio. Tocá un curso para ver el detalle."
        action={{ label: "Ver todos los cursos", href: "/formacion" }}
      />
    </Container>
  );

  return (
    <section className="bg-neutral-0">
      {courses && courses.length > 0 ? (
        <CourseRail courses={courses} promos={promos} label="Cursos destacados" header={header} />
      ) : (
        <div className="min-h-[calc(100svh-64px)]" />
      )}
    </section>
  );
}
