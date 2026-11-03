import { pegarTodo, sinViuda } from "@/lib/texto";

// Servicios de ELEVAR (2026-11-03, versión "Bandas" elegida por Mateo). Texto completo de
// elevar.com.ar/servicios/*, copiado de las páginas reales (solo se corrigieron tildes y
// erratas del original), más los títulos y bajadas de Laura (revisión 1.0). Las fotos son
// las de muestra (`/assets/mockup`) hasta tener las reales {{CONFIRMAR}}.

export type Bloque =
  | { kind: "texto"; parrafos: string[] }
  | { kind: "lista"; titulo: string; items: string[] }
  | { kind: "items"; titulo: string; items: { t: string; d: string; img: string }[] }
  | { kind: "sectores"; titulo: string; items: { t: string; img: string }[]; nota: string[] };

export interface Servicio {
  id: string;
  /** Nombre corto (menú y listados). */
  nombre: string;
  /** Título de Laura. */
  titulo: string;
  /** Línea corta, del texto de servicios del inicio de elevar.com.ar. */
  frase: string;
  /** Bajada de Laura. */
  desc: string;
  pictogram: string;
  bloques: Bloque[];
  cta: { label: string; href: string };
  foto: string;
}

const P = "/assets/servicios/";

/** Ninguna palabra sola en la última línea: sinViuda() en cada texto, salvo el nombre
 * corto (filas grandes que tienen que poder partir en el celular) y las rutas. */
const NO_TOCAR = new Set(["id", "nombre", "pictogram", "foto", "img", "href", "kind"]);
function sinViudas<T>(d: T): T {
  if (typeof d === "string") return sinViuda(d) as T;
  if (Array.isArray(d)) return d.map(sinViudas) as T;
  if (d && typeof d === "object")
    return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, NO_TOCAR.has(k) ? v : sinViudas(v)])) as T;
  return d;
}

const DATOS: Servicio[] = sinViudas(pegarTodo([
  {
    id: "acreditacion-iso-17025",
    nombre: "Acreditación ISO/IEC 17025",
    titulo: "Acompañamiento en la acreditación ISO/IEC 17025",
    frase: "Asistimos en la acreditación ISO/IEC 17025 en un alcance definido, para lograr reconocimiento y posicionamiento en el mercado.",
    desc: "Acompañamos a los laboratorios durante todo el proceso de acreditación ISO/IEC 17025, desde el diagnóstico inicial hasta la evaluación del organismo de acreditación. Brindamos asistencia en la preparación de documentación, la implementación de requisitos, la formación del personal y el tratamiento de no conformidades.",
    pictogram: `${P}pictograma1.3_acreditacion.png`,
    foto: "/assets/mockup/m6.jpg",
    bloques: [
      {
        kind: "texto",
        parrafos: [
          "En ocasiones, buscando reconocimiento, posicionamiento en el mercado, cubrir la necesidad de un cliente, entre otros motivos, los laboratorios buscan acreditar la norma ISO/IEC 17025 en un alcance definido.",
        ],
      },
      {
        kind: "lista",
        titulo: "Para una acreditación exitosa, ELEVAR te ofrece",
        items: [
          "Adecuación del sistema de calidad en función de los lineamientos establecidos en los documentos de acreditación propios de cada organismo.",
          "Acompañamiento en la resolución de la documentación a presentar ante el organismo de acreditación.",
          "Acompañamiento en auditorías de acreditación y/o mantenimiento.",
        ],
      },
    ],
    cta: { label: "Solicitar este servicio", href: "/contacto" },
  },
  {
    id: "implementacion-normativa",
    nombre: "Implementación normativa",
    titulo: "Implementación de sistemas de gestión",
    frase: "Acompañamos para implementar y mejorar los sistemas de gestión de los laboratorios basados en la norma ISO/IEC 17025 en su versión vigente.",
    desc: "Asesoramos a laboratorios de ensayo y calibración en el diseño, la implementación y la mejora de sistemas de gestión basados en ISO/IEC 17025. Desarrollamos soluciones adaptadas a las actividades, la estructura y las necesidades de cada organización, buscando sistemas eficaces, prácticos y sostenibles.",
    pictogram: `${P}pictograma1.4_implementacion.png`,
    foto: "/assets/mockup/m4.jpg",
    bloques: [
      {
        kind: "texto",
        parrafos: [
          "Contamos con respaldo normativo y una trayectoria mayor a 20 años en empresas privadas y organismos públicos de la República Argentina y América Latina.",
          "Cuando trabajamos en un laboratorio, necesitamos tener una guía o respaldo documental que permita organizar las actividades y cumplir con parámetros que aseguren los resultados ofrecidos. Para ello, una de las mejores formas es implementar un sistema de gestión de calidad a partir de una normativa de referencia.",
          "Desde ELEVAR acompañamos para implementar y mejorar los sistemas de gestión de los laboratorios basados en la norma internacionalmente reconocida ISO/IEC 17025 en su versión vigente.",
        ],
      },
      {
        kind: "items",
        titulo: "Nuestras implementaciones tienen estas ventajas",
        items: [
          { t: "Visitas y reuniones presenciales a los laboratorios", d: "Para conocer e identificar situaciones reales y, a partir de ellas, plantear la mejor alternativa de implementación normativa.", img: `${P}pictograma5.1_visitas.png` },
          { t: "Confidencialidad de la información compartida", d: "Mediante compromisos firmados con anterioridad al comienzo de la implementación.", img: `${P}pictograma5.2_confidencialidad.png` },
          { t: "Uso de TICs (Tecnologías de la Información y la Comunicación)", d: "Para reuniones de trabajo con empresas lejos de nuestra sede, o simplemente empresas que no disponen de tiempo para reuniones presenciales.", img: `${P}pictograma5.3_tics.png` },
          { t: "Implementaciones dinámicas", d: "Adaptadas a las actividades y horarios de los laboratorios.", img: `${P}pictograma5.4_implementaciones.png` },
          { t: "Reuniones globales", d: "Donde se involucra a todo el personal necesario del laboratorio, generando compromiso interno para cada actividad planteada en la implementación.", img: `${P}pictograma5.5_reuniones.png` },
        ],
      },
    ],
    cta: { label: "Solicitar este servicio", href: "/contacto" },
  },
  {
    id: "auditorias-internas",
    nombre: "Auditorías internas",
    titulo: "Auditorías internas",
    frase: "Para sistemas de calidad basados en ISO/IEC 17025, o combinados de ISO/IEC 17025 e ISO 9001.",
    desc: "Realizamos auditorías internas de sistemas de gestión basados en ISO/IEC 17025 y auditorías combinadas con ISO 9001. Evaluamos el cumplimiento de los requisitos aplicables, identificamos oportunidades de mejora y proporcionamos información objetiva para fortalecer el desempeño del laboratorio.",
    pictogram: `${P}pictograma1.5_auditorias.png`,
    foto: "/assets/mockup/m8.jpg",
    bloques: [
      {
        kind: "texto",
        parrafos: [
          "ELEVAR ofrece auditorías internas para sistemas de calidad basados en ISO/IEC 17025 o sistemas de calidad combinados de ISO/IEC 17025 e ISO 9001. Nuestros auditores se encuentran formados en base a la norma ISO 19011, y generan cada plan de auditoría en función de sus directrices.",
          "El equipo de auditores se conforma particularmente para cada caso, brindando una dinámica capaz de generar un espacio no sólo de cumplimiento normativo, sino también de mejora continua.",
          "Contamos con expertos técnicos en áreas específicas, cubriendo alcances relacionados con ensayos microbiológicos y fisicoquímicos en matrices varias, como también en calibraciones de diferentes magnitudes.",
        ],
      },
      {
        kind: "items",
        titulo: "Nuestro servicio de auditoría cubre",
        items: [
          { t: "Auditorías de diagnóstico", d: "Para conocer el estado puntual de un proceso o actividad, de modo que una futura implementación normativa, asistencia técnica o acompañamiento de acreditación sea real y efectivo.", img: `${P}lupa-ojo-color2.png` },
          { t: "Auditorías internas", d: "Como apoyo en el crecimiento y la mejora del laboratorio.", img: `${P}papel-lapiz-auditoria-color.png` },
          { t: "Acompañamiento", d: "En auditorías de tercera parte (entes de acreditación) como de segunda parte (clientes y otras partes interesadas).", img: `${P}personas-de-frente2-color.png` },
        ],
      },
    ],
    cta: { label: "Solicitar este servicio", href: "/contacto" },
  },
  {
    id: "asistencia-tecnica",
    nombre: "Asistencia técnica",
    titulo: "Asistencia técnica especializada",
    frase: "Respaldo normativo y una trayectoria de más de 20 años en empresas privadas y organismos públicos de toda América Latina.",
    desc: "Brindamos asesoramiento técnico a laboratorios de ensayo y calibración, acompañándolos en la resolución de problemas, la interpretación de requisitos normativos y la mejora de sus procesos. Contamos con profesionales con más de 20 años de experiencia en organizaciones públicas y privadas.",
    pictogram: `${P}pictograma1.2_asistencia.png`,
    foto: "/assets/mockup/m1.jpg",
    bloques: [
      {
        kind: "texto",
        parrafos: [
          "Contamos con respaldo normativo y una trayectoria mayor a 20 años en empresas privadas y organismos públicos de la República Argentina y América Latina.",
        ],
      },
      {
        kind: "sectores",
        titulo: "Acompañamos laboratorios de",
        items: [
          { t: "Aguas y efluentes", img: `${P}pictograma4.1_gota.png` },
          { t: "Alimentos", img: `${P}pictograma4.2_alimentos.png` },
          { t: "Ambiente (suelo y aire)", img: `${P}pictograma4.3_ambiente.png` },
          { t: "Minería", img: `${P}pictograma4.4_mineria.png` },
          { t: "Ensayos clínicos", img: `${P}pictograma4.5_clinicos.png` },
          { t: "Compuestos orgánicos e inorgánicos", img: `${P}pictograma4.6_compuestos.png` },
          { t: "Ensayos farmacéuticos", img: `${P}pictograma4.7_farmaceuticos.png` },
          { t: "Calibraciones en diferentes magnitudes", img: `${P}pictograma4.8_calibraciones.png` },
        ],
        nota: ["Laboratorios de ensayo (microbiológicos y fisicoquímicos)", "Laboratorios de calibración"],
      },
    ],
    cta: { label: "Solicitar este servicio", href: "/contacto" },
  },
  {
    id: "gestion",
    nombre: "Gestión",
    titulo: "Mantenimiento y mejora del sistema de gestión",
    frase: "Que el sistema de gestión de calidad represente la rutina del laboratorio, se fortalezca en el tiempo y permita la mejora continua.",
    desc: "Acompañamos a los laboratorios en el mantenimiento y la mejora continua de sus sistemas de gestión. Brindamos asistencia periódica para asegurar que los requisitos se integren a las actividades cotidianas, se mantenga la eficacia del sistema y se facilite la preparación para las evaluaciones externas.",
    pictogram: `${P}pictograma1.6_gestion.png`,
    foto: "/assets/mockup/m5.jpg",
    bloques: [
      {
        kind: "texto",
        parrafos: [
          "Los laboratorios necesitan asegurar que su sistema de gestión de calidad represente las actividades de la rutina, se fortalezca en el tiempo y permita la mejora continua.",
        ],
      },
      {
        kind: "lista",
        titulo: "Ofrecemos acompañamiento en",
        items: [
          "Transición de la norma ISO/IEC 17025 desde su versión 2005 a 2017. Asesoramiento y acompañamiento en el proceso de acreditación.",
          "Identificación de riesgos y oportunidades.",
          "Redacción y resolución de no conformidades.",
          "Revisión y adecuación de documentos del sistema de gestión de calidad.",
          "Elaboración de informes de revisión por la dirección.",
          "Establecimiento y seguimiento de objetivos e indicadores de desempeño.",
          "Consultoría integral en la adecuación de los numerales de la norma en las actividades del laboratorio.",
          "Evaluación de proveedores de calibración, ensayo o subcontratistas.",
          "Seguimiento de programas de calibraciones y auditorías.",
        ],
      },
    ],
    cta: { label: "Solicitar este servicio", href: "/contacto" },
  },
  {
    id: "formacion-profesional",
    nombre: "Formación profesional",
    titulo: "Formación profesional",
    frase: "Formación en temas de gestión, laboratorio, auditoría y metrología, en diferentes modalidades.",
    desc: "Ofrecemos cursos, talleres y webinars especializados en gestión de calidad, actividades de laboratorio, auditorías y metrología. Nuestras capacitaciones combinan conocimientos técnicos con herramientas prácticas para fortalecer las competencias de los profesionales y facilitar su aplicación en el trabajo diario.",
    pictogram: `${P}pictograma1.1_formacion.png`,
    foto: "/assets/mockup/m2.jpg",
    bloques: [
      {
        kind: "texto",
        parrafos: [
          "Los profesionales de ELEVAR brindan la posibilidad de formación en temas de gestión, laboratorio, auditoría y metrología en diferentes modalidades.",
        ],
      },
      {
        kind: "lista",
        titulo: "Formación",
        items: ["Cursos online en vivo", "Cursos asincrónicos", "Webinars gratuitos", "Talleres en vivo"],
      },
    ],
    cta: { label: "Ver la oferta de formación", href: "/formacion" },
  },
]));

const ORDEN = ["formacion-profesional", "acreditacion-iso-17025", "auditorias-internas", "asistencia-tecnica", "implementacion-normativa", "gestion"];
export const SERVICIOS = ORDEN.map((id) => DATOS.find((s) => s.id === id)!);

/** Frase de cabecera del listado (texto real del inicio de elevar.com.ar). */
export const INTRO = pegarTodo({
  titulo: "Servicios",
  bajada: "ELEVAR es una consultora de la gestión de calidad aplicada a los laboratorios de primera, segunda y tercera parte.",
});

/** Lema del inicio de elevar.com.ar ("RESPALDO Y CONFIANZA / Especialistas en Gestión de Calidad"), en líneas. */
export const LEMA = ["Especialistas en", "Gestión de Calidad."];

/** Datos de contacto del pie de elevar.com.ar. */
export const CONTACTO = {
  pregunta: "¿Tiene alguna consulta?",
  tel: "(+54) 9 3446 507779",
  telHref: "tel:+5493446507779",
  mail: "info@elevar.com.ar",
};

export const CIERRE = pegarTodo({
  titulo: "¿Querés evaluar el sistema de tu laboratorio?",
  boton: "Hablar con ELEVAR",
});

export function servicio(id: string) {
  return SERVICIOS.find((s) => s.id === id);
}

export const hrefServicio = (id: string) => `/servicios/${id}`;

/** Alias para el menú (`lib/nav.ts`): id, pictograma y bajada de cada servicio. */
export const SERVICIOS_DATA = SERVICIOS;
export const getServicioById = servicio;

export type Punto = { t: string; d?: string; img?: string };

/** El bloque de "qué incluye" de un servicio (el primero que no es texto), como puntos. */
export function incluye(s: Servicio): { titulo: string; puntos: Punto[]; nota?: string[]; sectores: boolean } | null {
  const b = s.bloques.find((x): x is Exclude<Bloque, { kind: "texto" }> => x.kind !== "texto");
  if (!b) return null;
  if (b.kind === "lista") return { titulo: b.titulo, puntos: b.items.map((t) => ({ t })), sectores: false };
  if (b.kind === "items") return { titulo: b.titulo, puntos: b.items, sectores: false };
  return { titulo: b.titulo, puntos: b.items, nota: b.nota, sectores: true };
}

export const parrafos = (s: Servicio) => s.bloques.flatMap((b) => (b.kind === "texto" ? b.parrafos : []));
