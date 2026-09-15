import type { Metadata } from "next";
import { MediaHero } from "@/components/media/media-hero";
import { PromosClient } from "@/components/promos/promos-client";

export const metadata: Metadata = {
  title: "Promociones y descuentos — Elevar",
  description:
    "Descuentos por equipo, combos de cursos y cupones vigentes para capacitaciones de laboratorio bajo ISO/IEC 17025.",
};

export default function PromocionesPage() {
  return (
    <>
      <MediaHero
        image="/assets/mockup/m7.jpg"
        size="md"
        title="Promociones y descuentos"
        subtitle="Beneficios vigentes para capacitar a todo tu equipo de laboratorio."
      />
      <PromosClient />
    </>
  );
}
