import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/anim/reveal";

const VALUES = [
  {
    img: "/assets/valores/pictograma3.1_escuchar.png",
    title: "Escuchar",
    desc: "Escuchar e interpretar las necesidades de nuestros clientes.",
  },
  {
    img: "/assets/valores/pictograma3.2_trabajar.png",
    title: "Trabajar",
    desc: "Trabajar en equipo entre nuestros clientes y expertos.",
  },
  {
    img: "/assets/valores/pictograma3.3_sugerir.png",
    title: "Sugerir",
    desc: "Sugerir soluciones adaptadas a las necesidades y recursos de nuestros clientes.",
  },
];

export function ValuesSection() {
  return (
    <section className="bg-neutral-0 py-20 md:py-28">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow="Cómo trabajamos"
            title="Nuestros valores"
          />
        </Reveal>

        <Reveal
          as="div"
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10"
          stagger={0.08}
        >
          {VALUES.map((val) => (
            <div key={val.title}>
              <Image
                src={val.img}
                alt=""
                width={72}
                height={72}
                className="mb-5 h-20 w-20 object-contain"
                aria-hidden="true"
              />
              <h3 className="font-display text-xl font-semibold text-ink-900">
                {val.title}
              </h3>
              <p className="text-neutral-700 mt-2">{val.desc}</p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
