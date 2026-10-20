import type { Metadata } from "next";
import { Promociones } from "@/components/promos/promociones";
import { getCourses } from "@/lib/api";

export const metadata: Metadata = {
  title: "Promociones — Elevar",
  description:
    "Descuento para grupos desde 2 personas y beneficios por medio de pago en las capacitaciones de laboratorio bajo ISO/IEC 17025. Calculá tu total.",
};

/**
 * Promociones (Mateo, 2026-10-20: referencia Epic Web con el número rodante de
 * NumberFlow, "1 próximo 2 sí GO-AHEAD"). Calculadora con los cursos reales.
 */
export default async function PromocionesPage() {
  const data = await getCourses().catch(() => null);
  return <Promociones courses={data?.results ?? []} />;
}
