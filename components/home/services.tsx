import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";

// Copy real del sitio de Elevar. Orden row-major: índices pares = columna izq, impares = der.
const SERVICES = [
  {
    title: "Formación Profesional",
    img: "/assets/servicios/pictograma1.1_formacion.png",
    desc: "Los profesionales de Elevar brindan la posibilidad de formación en temas de gestión, laboratorio, auditoría y metrología en diferentes modalidades.",
  },
  {
    title: "Asistencia Técnica",
    img: "/assets/servicios/pictograma1.2_asistencia.png",
    desc: "Contamos con el respaldo normativo y una trayectoria de más de 20 años, tanto en empresas privadas como en organismos públicos de toda América Latina.",
  },
  {
    title: "Acreditación ISO/IEC 17025",
    img: "/assets/servicios/pictograma1.3_acreditacion.png",
    desc: "Asistimos en la acreditación ISO/IEC 17025 en un alcance definido, con el objeto de buscar reconocimiento y posicionamiento en el mercado, entre otros motivos.",
  },
  {
    title: "Implementación Normativa",
    img: "/assets/servicios/pictograma1.4_implementacion.png",
    desc: "Acompañamos para implementar y mejorar los sistemas de gestión de los laboratorios basados en la norma ISO/IEC 17025 en su versión vigente.",
  },
  {
    title: "Auditorías Internas",
    img: "/assets/servicios/pictograma1.5_auditorias.png",
    desc: "Ofrecemos auditorías internas para sistemas de calidad basados en ISO/IEC 17025 o sistemas de calidad combinados de ISO/IEC 17025 e ISO 9001.",
  },
  {
    title: "Servicios de Gestión",
    img: "/assets/servicios/pictograma1.6_gestion.png",
    desc: "Los laboratorios necesitan asegurar que su sistema de gestión represente las actividades de la rutina, se fortalezca en el tiempo y permita la mejora continua.",
  },
];

export function ServicesSection() {
  return (
    <section className="bg-neutral-0 py-14 sm:py-20 md:py-28">
      <Container>
        <Reveal variant="blur">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-brand-500 md:text-4xl">
            Nuestros servicios
          </h2>
        </Reveal>

        <Reveal
          as="div"
          stagger={0.1}
          className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-x-10 gap-y-10 sm:mt-14 sm:gap-x-14 sm:gap-y-12 md:grid-cols-2"
        >
          {SERVICES.map((s, idx) => {
            // Mobile: ícono siempre a la izquierda (prolijo y consistente).
            // Desktop (2 columnas): se alterna para el ritmo editorial.
            const iconRight = idx % 2 === 0;
            return (
              <div
                key={s.title}
                className={`group flex items-start gap-5 sm:gap-6 ${iconRight ? "md:flex-row-reverse" : ""}`}
              >
                <img
                  src={s.img}
                  alt=""
                  aria-hidden
                  className="h-14 w-14 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-600">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </Reveal>
      </Container>
    </section>
  );
}
