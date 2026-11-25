"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * La consulta abierta vive en la lista, como ficha al centro (2026-11-24, forma del portal CESS). Esta
 * dirección se mantiene para los enlaces que ya existen (el Inicio, la pila de urgencias, los correos): lleva
 * a la lista con esa ficha abierta.
 */
export default function ConsultaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/admin/consultas?consulta=${encodeURIComponent(id)}`);
  }, [id, router]);
  return <p className="sr-only">Abriendo la consulta…</p>;
}
