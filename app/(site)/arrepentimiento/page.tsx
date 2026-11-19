import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ArrepentimientoForm } from "@/components/legal/arrepentimiento-form";
import { CONTACT } from "@/lib/contact";
import { pegar, sinViuda } from "@/lib/texto";

export const metadata: Metadata = {
  title: "Botón de arrepentimiento — Elevar",
  description: "Si compraste un curso en la web de ELEVAR y te arrepentiste, pedí la baja acá, sin crear una cuenta. Te damos un código al instante.",
};

/** Botón de arrepentimiento (KAN-41, Res. 424/2020): acceso directo desde el footer, sin registro. */
export default function ArrepentimientoPage() {
  return (
    <>
      <section className="bg-ink-900 text-neutral-0">
        <Container className="py-16 md:py-20">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-brand-500" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Botón de arrepentimiento</span>
          </div>
          <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            {sinViuda("¿Te arrepentiste de tu compra?")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
            {pegar("Si compraste un curso en esta web, pedí la baja acá. No hace falta crear una cuenta ni explicar el motivo: al enviarlo te damos un código y te lo mandamos por mail.")}
          </p>
        </Container>
      </section>

      <section className="bg-neutral-50 py-14 md:py-20">
        <Container>
          <div className="mx-auto max-w-[760px]">
            <ArrepentimientoForm />
            <p className="mt-6 text-sm leading-relaxed text-neutral-700">
              {pegar("Si preferís, también podés pedirlo escribiendo")}{" a "}
              <a href={CONTACT.emailUrl} className="font-semibold text-ink-900 underline decoration-brand-500 underline-offset-4">
                {CONTACT.email}
              </a>
              .
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
