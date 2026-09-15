"use client";

import { useState } from "react";
import { emptyCourse } from "@/lib/content";
import { CourseForm } from "@/components/admin/course-form";
import { PageHeader } from "@/components/admin/ui";

export default function NewCoursePage() {
  // Se calcula una sola vez para que el id sugerido no cambie en cada render.
  const [draft] = useState(() => emptyCourse());

  return (
    <>
      <PageHeader
        title="Nuevo curso"
        description="Cargá los datos del curso; podés dejarlo oculto hasta terminar de armarlo."
        back={{ href: "/admin/cursos", label: "Cursos" }}
      />
      <CourseForm course={draft} isNew />
    </>
  );
}
