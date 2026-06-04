import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/anim/reveal";

const POINTS = [
  {
    num: "01",
    title: "Respuesta rápida",
    desc: "Personas dedicadas a encontrar las mejores soluciones para situaciones que requieren una pronta respuesta.",
  },
  {
    num: "02",
    title: "Personal capacitado",
    desc: "Sabemos que las actividades en los laboratorios de ensayo involucran personal altamente capacitado.",
  },
  {
    num: "03",
    title: "Rigurosidad y veracidad",
    desc: "Nos comprometemos con que la competencia técnica garantice resultados con rigurosidad y veracidad.",
  },
  {
    num: "04",
    title: "Servicio integral",
    desc: "No solo formamos equipos de trabajo: brindamos consultoría y capacitación de forma integral.",
  },
];

export function WhyUsSection() {
  return (
    <section className="bg-ink-900 py-14 sm:py-20 md:py-28">
      <Container>
        <Reveal>
          <SectionHeader dark eyebrow="¿Por qué elegirnos?" title="Experiencia técnica, no solo teoría" />
        </Reveal>

        <div className="mt-10 grid items-center gap-10 sm:mt-14 sm:gap-12 lg:grid-cols-2">
          {/* Imagen real del equipo, con marco de acento */}
          <Reveal as="div" variant="scale" duration={0.9} className="relative">
            <span aria-hidden className="absolute -left-3 -top-3 z-10 h-16 w-16 border-l-2 border-t-2 border-brand-500" />
            <span aria-hidden className="absolute -bottom-3 -right-3 z-10 h-16 w-16 border-b-2 border-r-2 border-brand-500" />
            <img
              src="/assets/porque-elegirnos.png"
              alt="El equipo de Elevar trabajando en un proyecto"
              className="aspect-[4/3] w-full object-cover"
            />
          </Reveal>

          {/* Puntos */}
          <Reveal as="div" className="grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2" stagger={0.1}>
            {POINTS.map((pt) => (
              <div key={pt.num}>
                <div className="flex items-center gap-3">
                  <span className="font-display text-2xl font-semibold text-brand-500">{pt.num}</span>
                  <span className="h-px w-8 bg-neutral-0/15" aria-hidden />
                </div>
                <h3 className="mt-3 font-semibold text-neutral-0">{pt.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{pt.desc}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
