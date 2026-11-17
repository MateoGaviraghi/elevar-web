import type { Metadata } from "next";
import { Promociones } from "@/components/promos/promociones";
import { getCourses } from "@/lib/api";

/** Los listados se rehacen cada hora: así un curso que ya se dictó deja de figurar como próximo sin esperar otra publicación. */
export const revalidate = 3600;

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
  // Sin catch: si la API falla, falla el build (Vercel deja el despliegue anterior) o la
  // revalidación (Next deja la última página buena). Nunca se publica una lista vacía.
  const data = await getCourses();
  return <Promociones courses={data.results} />;
}
