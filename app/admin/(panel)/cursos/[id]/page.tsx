"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * El curso abierto vive en la lista, como tarjeta al centro (2026-11-26, forma del portal CESS, D-006). Esta
 * dirección se mantiene para los enlaces que ya existen (Inicio, Órdenes, Inscripciones, Auditoría): lleva a la
 * lista con la tarjeta de ese curso abierta.
 */
export default function CursoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/admin/cursos?ver=${encodeURIComponent(id)}`);
  }, [id, router]);
  return <p className="sr-only">Abriendo el curso…</p>;
}
