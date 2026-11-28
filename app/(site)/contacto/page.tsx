import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ContactSection } from "@/components/home/contact";
import { pegar, sinViuda } from "@/lib/texto";

export const metadata: Metadata = {
  title: "Contacto — Elevar",
  description:
    "Escribinos tu consulta sobre acreditación ISO/IEC 17025, formación, auditorías o asistencia técnica. Gualeguaychú, Entre Ríos.",
};

export default function ContactoPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-ink-900 text-neutral-0">
        <Container className="py-16 md:py-20">
          {/* Rótulo y título entran por CSS desde el primer cuadro (`titulo-entra`): con la
              entrada de GSAP esperaban al JS, unos 4 s en un celular medio. */}
          <div className="titulo-entra mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-brand-500" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Contacto
            </span>
          </div>
          <h1 className="titulo-entra [animation-delay:0.2s] max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            {sinViuda("¿Tiene alguna consulta?")}
          </h1>
          {/* Fuera de la entrada: se ve desde el primer cuadro (en un celular medio la cabecera
              tardaba 4 s en aparecer esperando el JS). */}
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
            {pegar("Contanos en qué podemos ayudarte y te respondemos a la brevedad.")}
          </p>
        </Container>
      </section>

      <ContactSection showHeading={false} />
    </>
  );
}
