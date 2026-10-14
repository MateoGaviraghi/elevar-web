import type { Metadata } from "next";
import { NosotrosHero } from "@/components/nosotros/hero";
import { Enfoque } from "@/components/nosotros/enfoque";
import { MisionVision } from "@/components/nosotros/mision-vision";
import { Valores } from "@/components/nosotros/valores";
import { Direccion } from "@/components/nosotros/direccion";
import { Colaboradores } from "@/components/nosotros/colaboradores";
import { Cierre } from "@/components/nosotros/cierre";

export const metadata: Metadata = {
  title: "Nosotros — Elevar",
  description:
    "Consultora de gestión de calidad para laboratorios de ensayo y calibración. Conocé a ELEVAR y a su directora, Laura Delissi, experta técnica y evaluadora coordinadora del OAA.",
};

// Fondos: azul, blanco, azul, blanco, azul, blanco, naranja (y el footer azul).
export default function NosotrosPage() {
  return (
    <>
      <NosotrosHero />
      <Enfoque />
      <MisionVision />
      <Valores />
      <Direccion />
      <Colaboradores />
      <Cierre />
    </>
  );
}
