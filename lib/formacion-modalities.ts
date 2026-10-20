import type { Modality } from "@/types";

export interface ModalityInfo {
  slug: string;
  modality: Modality;
  title: string;
  /** Nombre corto para las píldoras de la lista. */
  short: string;
  desc: string;
  img: string;
}

export const MODALITIES: ModalityInfo[] = [
  {
    slug: "cursos-online-en-vivo",
    modality: "LIVE",
    title: "Cursos online en vivo",
    short: "En vivo",
    img: "/assets/formacion/pictograma2.1_envivo.png",
    desc: "Con días y horarios preestablecidos, tienen lugar capacitaciones en tiempo real.",
  },
  {
    slug: "cursos-asincronicos",
    modality: "ASYNC",
    title: "Cursos asincrónicos",
    short: "Asincrónicos",
    img: "/assets/formacion/pictograma2.2_asincronico.png",
    desc: "Permiten estudiar al tiempo y ritmo de cada persona mediante documentación teórica, videos explicativos y comunicación directa con el disertante.",
  },
  {
    slug: "webinars-gratuitos",
    modality: "WEBINAR",
    title: "Webinars gratuitos",
    short: "Webinars",
    img: "/assets/formacion/pictograma2.3_webinar.png",
    desc: "Temas puntuales, en encuentros cortos, como alternativa para mantener la actualización técnica.",
  },
  {
    slug: "talleres",
    modality: "WORKSHOP",
    title: "Talleres",
    short: "Talleres",
    img: "/assets/formacion/pictograma2.4_workshop.png",
    desc: "Nuestros talleres son encuentros de capacitación donde los participantes se forman en un tema específico de forma intensiva.",
  },
  {
    // ELEVAR todavía no confirmó si existen (OQ en 15-MEMORY); bajada y pictograma provisorios.
    slug: "e-books",
    modality: "EBOOK",
    title: "E-Books",
    short: "E-Books",
    img: "/assets/formacion/pictograma2.2_asincronico.png",
    desc: "Material de estudio descargable sobre temas puntuales de la norma, para leer y consultar cuando lo necesites.",
  },
];

export function getModalityBySlug(slug: string): ModalityInfo | undefined {
  return MODALITIES.find((m) => m.slug === slug);
}
