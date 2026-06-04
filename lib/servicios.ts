export interface Servicio {
  id: string;
  title: string;
  /** Bajada corta REAL del sitio (web-anterior, "Nuestros servicios"). */
  desc: string;
  pictogram: string;
  /** Desarrollo ampliado para la página del servicio. */
  long: string[];
  /** Qué incluye / entregables. */
  includes: string[];
}

// Bajadas REALES del sitio (web-anterior). El desarrollo ampliado profundiza esas
// bajadas con detalle profesional consistente con la propuesta de ELEVAR.
export const SERVICIOS_DATA: Servicio[] = [
  {
    id: "formacion-profesional",
    title: "Formación profesional",
    pictogram: "/assets/servicios/pictograma1.1_formacion.png",
    desc: "Los profesionales de ELEVAR brindan la posibilidad de formación en temas de gestión, laboratorio, auditoría y metrología en diferentes modalidades.",
    long: [
      "Diseñamos y dictamos capacitaciones en gestión de la calidad, técnicas de laboratorio, auditoría y metrología, adaptadas al nivel y a la realidad de cada equipo.",
      "Nuestros disertantes combinan experiencia técnica con práctica en el piso del laboratorio, en modalidades en vivo, asincrónica y webinars.",
    ],
    includes: [
      "Cursos en vivo, asincrónicos y webinars",
      "Contenidos a medida para tu laboratorio",
      "Material de estudio y certificado de participación",
      "Disertantes con experiencia en ISO/IEC 17025",
    ],
  },
  {
    id: "acreditacion-iso-17025",
    title: "Acreditación ISO/IEC 17025",
    pictogram: "/assets/servicios/pictograma1.3_acreditacion.png",
    desc: "Asistimos en la acreditación ISO/IEC 17025 en un alcance definido con el objeto de buscar reconocimiento y posicionamiento en el mercado, entre otros motivos.",
    long: [
      "Te acompañamos en todo el camino hacia la acreditación ISO/IEC 17025 sobre un alcance definido, con el objetivo de lograr reconocimiento y posicionamiento en el mercado.",
      "Trabajamos desde el diagnóstico inicial hasta la preparación para la evaluación del organismo de acreditación, ajustando el sistema a la operación real del laboratorio.",
    ],
    includes: [
      "Diagnóstico de brechas (gap analysis)",
      "Definición y documentación del alcance",
      "Preparación para la evaluación del OAA",
      "Acompañamiento hasta el cierre de no conformidades",
    ],
  },
  {
    id: "auditorias-internas",
    title: "Auditorías internas",
    pictogram: "/assets/servicios/pictograma1.5_auditorias.png",
    desc: "Ofrecemos auditorías internas para sistemas de calidad basados en ISO/IEC 17025 o sistemas de calidad combinados de ISO/IEC 17025 e ISO 9001.",
    long: [
      "Realizamos auditorías internas para sistemas de calidad basados en ISO/IEC 17025, o combinados con ISO 9001, con una mirada técnica y orientada a la mejora.",
      "Identificamos hallazgos reales, los priorizamos y proponemos acciones concretas y sostenibles, con foco en la realidad operativa del laboratorio.",
    ],
    includes: [
      "Auditorías ISO/IEC 17025 e ISO 9001",
      "Informe con hallazgos priorizados",
      "Foco en la realidad operativa del laboratorio",
      "Recomendaciones de mejora accionables",
    ],
  },
  {
    id: "asistencia-tecnica",
    title: "Asistencia técnica",
    pictogram: "/assets/servicios/pictograma1.2_asistencia.png",
    desc: "Contamos con el respaldo normativo y una trayectoria de más de 20 años tanto en empresas privadas como organismos públicos de toda América Latina.",
    long: [
      "Contamos con respaldo normativo y más de 20 años de trayectoria, tanto en empresas privadas como en organismos públicos de toda América Latina.",
      "Brindamos soporte técnico en trazabilidad, validación de métodos, estimación de la incertidumbre y aseguramiento de la validez de los resultados.",
    ],
    includes: [
      "Trazabilidad y validación de métodos",
      "Estimación de la incertidumbre de medición",
      "Aseguramiento de la validez de los resultados",
      "Soporte normativo continuo",
    ],
  },
  {
    id: "implementacion-normativa",
    title: "Implementación normativa",
    pictogram: "/assets/servicios/pictograma1.4_implementacion.png",
    desc: "Acompañamos para implementar y mejorar los sistemas de gestión de los laboratorios basados en la norma ISO/IEC 17025 en su versión vigente.",
    long: [
      "Acompañamos a los laboratorios a implementar y mejorar sus sistemas de gestión basados en ISO/IEC 17025 en su versión vigente.",
      "Adaptamos el sistema a la operación real, evitando documentación que no aporte valor y capacitando al personal en cada etapa.",
    ],
    includes: [
      "Implementación de ISO/IEC 17025 vigente",
      "Diseño de procesos y documentación útil",
      "Capacitación del personal",
      "Transición desde versiones anteriores de la norma",
    ],
  },
  {
    id: "gestion",
    title: "Servicios de gestión",
    pictogram: "/assets/servicios/pictograma1.6_gestion.png",
    desc: "Los laboratorios necesitan asegurar que su sistema de gestión de calidad represente las actividades de la rutina, se fortalezca en el tiempo y permita la mejora continua.",
    long: [
      "Ayudamos a que el sistema de gestión de calidad represente las actividades reales de la rutina, se fortalezca en el tiempo y habilite la mejora continua.",
      "Trabajamos sobre indicadores, gestión de no conformidades y revisión por la dirección para que el sistema sea sostenible y útil.",
    ],
    includes: [
      "Indicadores y tableros de gestión",
      "Gestión de no conformidades",
      "Revisión por la dirección",
      "Mejora continua sostenible",
    ],
  },
];

export function getServicioById(id: string): Servicio | undefined {
  return SERVICIOS_DATA.find((s) => s.id === id);
}
