"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** El alta de un curso es una tarjeta con pasos sobre la lista (2026-11-26, D-006): esta dirección la abre. */
export default function NuevoCursoPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/cursos?editar=nuevo");
  }, [router]);
  return <p className="sr-only">Abriendo el curso nuevo…</p>;
}
