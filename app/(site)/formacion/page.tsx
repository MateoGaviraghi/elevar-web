import type { Metadata } from "next";
import { FormacionPortada } from "@/components/formacion/portada";
import { getCourses } from "@/lib/api";

export const metadata: Metadata = {
  title: "Formación — Elevar",
  description:
    "Capacitación en calidad de laboratorio bajo la norma ISO/IEC 17025. Cursos en vivo, asincrónicos, webinars gratuitos, talleres y e-books.",
};

/**
 * Portada de Formación (Mateo, 2026-10-20: referencia Hyper Island, "1 sacar 2 dejar
 * GO-AHEAD"). Sin la franja de promoción hasta rediseñar /promociones.
 */
export default async function FormacionPage() {
  const data = await getCourses().catch(() => null);
  return <FormacionPortada courses={data?.results ?? []} />;
}
