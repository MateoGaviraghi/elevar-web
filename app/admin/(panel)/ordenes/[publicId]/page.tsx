"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * La orden abierta vive en la lista, como tarjeta al centro (2026-11-25, forma del portal CESS, D-004). Esta
 * dirección se mantiene para los enlaces que ya existen (el Inicio, la pila de urgencias, los correos a ELEVAR):
 * lleva a la lista de todas las órdenes con esa tarjeta abierta.
 */
export default function OrdenPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/admin/ordenes?estado=TODAS&ver=${encodeURIComponent(publicId)}`);
  }, [publicId, router]);
  return <p className="sr-only">Abriendo la orden…</p>;
}
