// Textos de /nosotros (fuente: elevar.com.ar/nosotros). La sección "Dirección"
// tiene los suyos en `laura.ts`.

/** Texto con tramos resaltados: `[texto, resaltado]`. */
export type Tramo = [string, boolean?];

export const HERO = {
  title: [
    ["ELEVAR es una consultora de "],
    ["gestión de calidad", true],
    [" aplicada a laboratorios de primera, segunda y tercera parte."],
  ] as Tramo[],
  lead: "Formación, asistencia, asesoría y auditoría para laboratorios de ensayo y calibración.",
  link: { label: "Conocé a nuestra directora", href: "#direccion" },
};

export const ENFOQUE = {
  lead: "Nos destacamos por nuestra capacidad resolutiva y respuesta rápida, entendiendo que las actividades en los laboratorios requieren soluciones inmediatas.",
  /** Palabras del lead que se encienden en naranja. */
  hot: ["capacidad", "resolutiva", "respuesta", "rápida,"],
  paragraphs: [
    "Creemos que la competencia en los laboratorios es clave para el éxito de ensayos y calibraciones. Por eso ofrecemos formación, asistencia, asesoría y auditoría, asegurando la validez de los resultados.",
    "Nuestra pasión nos ha unido en un equipo interdisciplinario, brindando un servicio integral para los laboratorios.",
  ],
};

export const MISION_VISION = [
  {
    title: "Misión",
    text: [
      ["Ser un equipo de profesionales en ciencia y tecnología que, abarcando los sectores de "],
      ["alimentos", true],
      [", "],
      ["minería", true],
      [", "],
      ["forense", true],
      [", "],
      ["ambiente", true],
      [", "],
      ["metrología", true],
      [" e "],
      ["industria", true],
      [", ofrece capacitaciones, auditorías internas, asistencia e implementación de la norma "],
      ["ISO/IEC 17025", true],
      [" en laboratorios de ensayo y calibración en "],
      ["América Latina", true],
      [". Comprometernos a mejorar la competencia técnica y el posicionamiento sostenible de nuestros clientes en el mercado."],
    ] as Tramo[],
  },
  {
    title: "Visión",
    text: [
      ["Ser reconocidos como líderes en la implementación de normas de calidad y "],
      ["competencia técnica", true],
      [" en América Latina, destacándonos por nuestra "],
      ["ética profesional y trayectoria", true],
      [", y contribuyendo al desarrollo sostenible y exitoso de las organizaciones con las que colaboramos."],
    ] as Tramo[],
  },
];

export const VALORES = [
  { img: "/assets/valores/pictograma3.1_escuchar.png", title: "Escuchar", desc: "Escuchar e interpretar las necesidades de nuestros clientes." },
  { img: "/assets/valores/pictograma3.2_trabajar.png", title: "Trabajar", desc: "Trabajar en equipo entre nuestros clientes y expertos." },
  { img: "/assets/valores/pictograma3.3_sugerir.png", title: "Sugerir", desc: "Sugerir soluciones adaptadas a las necesidades y recursos de nuestros clientes." },
];

export const CIERRE = {
  title: "¿Trabajamos juntos?",
  text: "Contanos sobre tu laboratorio y te ayudamos a dar el próximo paso hacia la acreditación.",
};
