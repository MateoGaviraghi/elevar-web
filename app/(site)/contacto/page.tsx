import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";
import { ContactSection } from "@/components/home/contact";

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
          <Reveal>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-brand-500" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Contacto
              </span>
            </div>
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              ¿Tiene alguna consulta?
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
              Contanos en qué podemos ayudarte y te respondemos a la brevedad.
            </p>
          </Reveal>
        </Container>
      </section>

      <ContactSection showHeading={false} />
    </>
  );
}
