import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";
import { Pictogram } from "@/components/ui/pictogram";

// Textos de Laura (revisión 1.0, oct 2026). Orden row-major: índices pares = columna izq, impares = der.
const SERVICES = [
  {
    title: "Formación profesional",
    img: "/assets/servicios/pictograma1.1_formacion.png",
    desc: "Ofrecemos cursos, talleres y webinars especializados en gestión de calidad, actividades de laboratorio, auditorías y metrología. Nuestras capacitaciones combinan conocimientos técnicos con herramientas prácticas para fortalecer las competencias de los profesionales y facilitar su aplicación en el trabajo diario.",
  },
  {
    title: "Asistencia técnica especializada",
    img: "/assets/servicios/pictograma1.2_asistencia.png",
    desc: "Brindamos asesoramiento técnico a laboratorios de ensayo y calibración, acompañándolos en la resolución de problemas, la interpretación de requisitos normativos y la mejora de sus procesos. Contamos con profesionales con más de 20 años de experiencia en organizaciones públicas y privadas.",
  },
  {
    title: "Acompañamiento en la acreditación ISO/IEC 17025",
    img: "/assets/servicios/pictograma1.3_acreditacion.png",
    desc: "Acompañamos a los laboratorios durante todo el proceso de acreditación ISO/IEC 17025, desde el diagnóstico inicial hasta la evaluación del organismo de acreditación. Brindamos asistencia en la preparación de documentación, la implementación de requisitos, la formación del personal y el tratamiento de no conformidades.",
  },
  {
    title: "Implementación de sistemas de gestión",
    img: "/assets/servicios/pictograma1.4_implementacion.png",
    desc: "Asesoramos a laboratorios de ensayo y calibración en el diseño, la implementación y la mejora de sistemas de gestión basados en ISO/IEC 17025. Desarrollamos soluciones adaptadas a las actividades, la estructura y las necesidades de cada organización, buscando sistemas eficaces, prácticos y sostenibles.",
  },
  {
    title: "Auditorías internas",
    img: "/assets/servicios/pictograma1.5_auditorias.png",
    desc: "Realizamos auditorías internas de sistemas de gestión basados en ISO/IEC 17025 y auditorías combinadas con ISO 9001. Evaluamos el cumplimiento de los requisitos aplicables, identificamos oportunidades de mejora y proporcionamos información objetiva para fortalecer el desempeño del laboratorio.",
  },
  {
    title: "Mantenimiento y mejora del sistema de gestión",
    img: "/assets/servicios/pictograma1.6_gestion.png",
    desc: "Acompañamos a los laboratorios en el mantenimiento y la mejora continua de sus sistemas de gestión. Brindamos asistencia periódica para asegurar que los requisitos se integren a las actividades cotidianas, se mantenga la eficacia del sistema y se facilite la preparación para las evaluaciones externas.",
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
                <Pictogram src={s.img} index={idx} className="h-14 w-14 sm:h-24 sm:w-24" />
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
