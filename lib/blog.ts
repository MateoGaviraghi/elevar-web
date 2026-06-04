/** Bloque de contenido del cuerpo de una nota. */
export interface BlogBlock {
  type: "p" | "h" | "li";
  text: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  /** Gancho corto que va sobre la imagen (overlay), tal como el sitio real. */
  hook: string;
  /** Bajada/extracto real tomado de la tarjeta del sitio (web-anterior). */
  teaser: string;
  category: string;
  /** Fecha placeholder (el cuerpo de las notas se carga en Fase 1). */
  date: string;
}

const CATEGORY = "Cápsula informativa";

// Títulos + ganchos + bajadas REALES del blog del sitio (web-anterior). El cuerpo
// completo de cada nota es placeholder de Fase 0 (se redacta con Laura en Fase 1).
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "componentes-incertidumbre-microbiologia-iso-19036",
    title: "3 componentes de la incertidumbre en microbiología según ISO 19036",
    hook: "Incertidumbre para todos",
    teaser:
      "¿Conocés los 3 componentes de la incertidumbre en microbiología? Te contamos cómo identificarlos y estimarlos.",
    category: CATEGORY,
    date: "2026-05-28",
  },
  {
    slug: "fuentes-de-deteccion-de-no-conformidades",
    title: "Fuentes de detección de no conformidades",
    hook: "¿En qué momento se detectan no conformidades en tu laboratorio?",
    teaser:
      "¿En qué momento se detectan las no conformidades en tu laboratorio? Repasamos sus principales fuentes.",
    category: CATEGORY,
    date: "2026-05-21",
  },
  {
    slug: "relacion-entre-veracidad-precision-y-exactitud",
    title: "Relación entre veracidad, precisión y exactitud",
    hook: "Tres conceptos diferentes, tres caminos hacia el mismo destino",
    teaser:
      "Tres conceptos diferentes, tres caminos hacia el mismo destino: aclaramos dudas y definimos términos.",
    category: CATEGORY,
    date: "2026-05-14",
  },
  {
    slug: "auditorias-internas-y-cultura-de-calidad",
    title: "Auditorías internas y cultura de calidad",
    hook: "La mejora continua y el desafío frente a los sistemas de gestión",
    teaser: "La mejora continua y el desafío frente a los sistemas de gestión.",
    category: CATEGORY,
    date: "2026-05-07",
  },
  {
    slug: "informacion-documentada-que-mantener-y-conservar",
    title: "Información documentada que mantener y conservar",
    hook: "¿Lo guardo o lo desecho? La gran pregunta sobre los documentos",
    teaser: "¿Lo guardo o lo desecho? La gran pregunta sobre los documentos.",
    category: CATEGORY,
    date: "2026-04-30",
  },
  {
    slug: "priorizacion-de-tareas-en-el-laboratorio",
    title: "Priorización de tareas en el laboratorio",
    hook: "Ordenar el día cuando no hay sólo análisis por realizar",
    teaser: "Ordenar el día cuando no hay sólo análisis por realizar.",
    category: CATEGORY,
    date: "2026-04-23",
  },
  {
    slug: "rotulado-de-reactivos-en-el-laboratorio-de-quimica",
    title: "Rotulado de reactivos en el laboratorio de química",
    hook: "Rotulá tus reactivos y evitá problemas de recursos",
    teaser: "Rotulá tus reactivos y evitá problemas de trazabilidad y recursos.",
    category: CATEGORY,
    date: "2026-04-16",
  },
  {
    slug: "correlacion-de-resultados-numeral-7-7-1-iso-17025",
    title: "Correlación de resultados: una mirada del ítem de ensayo (Numeral 7.7.1)",
    hook: "Entrelazando resultados: otra mirada del ítem de ensayo",
    teaser: "Entrelazando resultados: otra mirada del ítem de ensayo según ISO/IEC 17025.",
    category: CATEGORY,
    date: "2026-04-09",
  },
  {
    slug: "no-conformidad-en-mas-de-un-requisito",
    title: "No conformidad en más de un requisito",
    hook: "Relacionando incumplimientos para un mejor tratamiento",
    teaser: "Relacionando incumplimientos para un mejor tratamiento.",
    category: CATEGORY,
    date: "2026-04-02",
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
