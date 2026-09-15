import type { Metadata } from "next";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { ServicesSection } from "@/components/home/services";
import { ModalitiesSection } from "@/components/home/modalities";
import { ParallaxBand } from "@/components/home/parallax-band";
import { ShowcaseSection } from "@/components/home/showcase";
import { ValuesSection } from "@/components/home/values";
import { WhyUsSection } from "@/components/home/why-us";
import { ClientsSection } from "@/components/home/clients";
import { ContactSection } from "@/components/home/contact";
import { PromoStrip } from "@/components/promos/promo-strip";

export const metadata: Metadata = {
  title: "Elevar — Formación y Asistencia Técnica para Laboratorios ISO/IEC 17025",
  description:
    "Acompañamos a laboratorios de ensayo y calibración en Argentina y LATAM en su camino hacia la acreditación: capacitaciones, asistencia técnica, auditorías e implementación de la norma ISO/IEC 17025.",
};

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <ServicesSection />
      <ParallaxBand image="/assets/mockup/m4.jpg">
        <p className="max-w-3xl font-display text-2xl font-medium leading-snug tracking-tight md:text-[2.4rem]">
          Trabajamos junto a laboratorios de alimentos, ambiente, minería y salud en toda
          América Latina.
        </p>
      </ParallaxBand>
      <ModalitiesSection />
      <PromoStrip />
      <ShowcaseSection />
      <ValuesSection />
      <WhyUsSection />
      <ClientsSection />
      <ContactSection />
    </>
  );
}
