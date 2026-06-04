// Catálogo ESTÁTICO (mockup) capturado de la API. El front no requiere backend.
// Generado por scripts/gen-mock-catalog.mjs. Para regenerar: levantar el backend y correr el script.
import type { Category, Course } from "@/types";

export const CATEGORIES: Category[] = [
  {
    "id": 8,
    "name": "Laboratorio de Microbiología",
    "slug": "microbiologia"
  },
  {
    "id": 9,
    "name": "Calidad y Metrología",
    "slug": "calidad-metrologia"
  },
  {
    "id": 10,
    "name": "Laboratorio de Fisicoquímica",
    "slug": "fisicoquimica"
  }
];

export const COURSES: Course[] = [
  {
    "id": 48,
    "code": "CA17",
    "title": "Estimación de la incertidumbre de la medición en ensayos microbiológicos en aguas y alimentos",
    "slug": "estimacion-de-la-incertidumbre-de-la-medicion-en-ensayos-microbiologicos-en-aguas-y-alimentos-ca17",
    "summary": "Estimación de la incertidumbre de la medición en ensayos microbiológicos en aguas y alimentos. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "ASYNC",
    "price": "30000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Avanzado",
    "duration_hours": 14,
    "instructor_names": "Laura Delissi",
    "badge": null,
    "is_featured": true,
    "sessions": []
  },
  {
    "id": 46,
    "code": "CA12",
    "title": "Validación y verificación de métodos de ensayo microbiológico según ISO 16140-3",
    "slug": "validacion-y-verificacion-de-metodos-de-ensayo-microbiologico-segun-iso-16140-3-ca12",
    "summary": "Validación y verificación de métodos de ensayo microbiológico según ISO 16140-3. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "ASYNC",
    "price": "34000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Avanzado",
    "duration_hours": 16,
    "instructor_names": "Laura Delissi",
    "badge": "NUEVO",
    "is_featured": true,
    "sessions": []
  },
  {
    "id": 52,
    "code": "CA63",
    "title": "Test de promoción de crecimiento en los medios de cultivo",
    "slug": "test-de-promocion-de-crecimiento-en-los-medios-de-cultivo-ca63",
    "summary": "Test de promoción de crecimiento en los medios de cultivo. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "ASYNC",
    "price": "22000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Intermedio",
    "duration_hours": 6,
    "instructor_names": "Natalia Arévalo",
    "badge": null,
    "is_featured": false,
    "sessions": []
  },
  {
    "id": 51,
    "code": "CA18",
    "title": "Gestión de ensayos de aptitud en pruebas biológicas y Microbiológicas cualitativas, cuantitativas y semicuantitativas",
    "slug": "gestion-de-ensayos-de-aptitud-en-pruebas-biologicas-y-microbiologicas-cualitativas-cuantitativas-y-semicuantitativas-ca18",
    "summary": "Gestión de ensayos de aptitud en pruebas biológicas y Microbiológicas cualitativas, cuantitativas y semicuantitativas. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "ASYNC",
    "price": "28000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Avanzado",
    "duration_hours": 12,
    "instructor_names": "Daniela Kuba",
    "badge": null,
    "is_featured": false,
    "sessions": []
  },
  {
    "id": 49,
    "code": "CA20",
    "title": "Gestión de Cepas de Referencia y Trabajo en el Laboratorio Microbiológico",
    "slug": "gestion-de-cepas-de-referencia-y-trabajo-en-el-laboratorio-microbiologico-ca20",
    "summary": "Gestión de Cepas de Referencia y Trabajo en el Laboratorio Microbiológico. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "ASYNC",
    "price": "24000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Intermedio",
    "duration_hours": 8,
    "instructor_names": "Daniela Kuba",
    "badge": null,
    "is_featured": false,
    "sessions": []
  },
  {
    "id": 50,
    "code": "CA37",
    "title": "Manejo de muestras microbiológicas en aguas y alimentos",
    "slug": "manejo-de-muestras-microbiologicas-en-aguas-y-alimentos-ca37",
    "summary": "Manejo de muestras microbiológicas en aguas y alimentos. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "ASYNC",
    "price": "24000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Inicial",
    "duration_hours": 8,
    "instructor_names": "Natalia Arévalo",
    "badge": null,
    "is_featured": false,
    "sessions": []
  },
  {
    "id": 47,
    "code": "CA35",
    "title": "Aseguramiento de la validez de los resultados en ensayos microbiológicos",
    "slug": "aseguramiento-de-la-validez-de-los-resultados-en-ensayos-microbiologicos-ca35",
    "summary": "Aseguramiento de la validez de los resultados en ensayos microbiológicos. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "ASYNC",
    "price": "30000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Intermedio",
    "duration_hours": 12,
    "instructor_names": "Laura Delissi",
    "badge": "NUEVO",
    "is_featured": false,
    "sessions": []
  },
  {
    "id": 45,
    "code": "CA61",
    "title": "Determinación del Número Más Probable (NMP) usando calculadoras según ISO 7218",
    "slug": "determinacion-del-numero-mas-probable-nmp-usando-calculadoras-segun-iso-7218-ca61",
    "summary": "Determinación del Número Más Probable (NMP) usando calculadoras según ISO 7218. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "ASYNC",
    "price": "28000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Intermedio",
    "duration_hours": 10,
    "instructor_names": "Daniela Kuba",
    "badge": "NUEVO",
    "is_featured": false,
    "sessions": []
  },
  {
    "id": 44,
    "code": "CA58",
    "title": "Métodos de siembra: Buenas prácticas y errores comunes",
    "slug": "metodos-de-siembra-buenas-practicas-y-errores-comunes-ca58",
    "summary": "Métodos de siembra: Buenas prácticas y errores comunes. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "ASYNC",
    "price": "26000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Intermedio",
    "duration_hours": 8,
    "instructor_names": "Daniela Kuba",
    "badge": null,
    "is_featured": false,
    "sessions": []
  },
  {
    "id": 53,
    "code": "CV49",
    "title": "Detección de outliers: fundamentos estadísticos y aplicación práctica",
    "slug": "deteccion-de-outliers-fundamentos-estadisticos-y-aplicacion-practica-cv49",
    "summary": "Detección de outliers: fundamentos estadísticos y aplicación práctica. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 9,
      "name": "Calidad y Metrología",
      "slug": "calidad-metrologia"
    },
    "modality": "LIVE",
    "price": "90000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Avanzado",
    "duration_hours": 16,
    "instructor_names": "Laura Delissi",
    "badge": "NUEVO",
    "is_featured": true,
    "sessions": [
      {
        "id": 27,
        "starts_at": "2026-06-17T15:25:04.720285-03:00",
        "ends_at": "2026-06-17T19:25:04.720285-03:00",
        "timezone": "America/Argentina/Cordoba",
        "capacity": 30,
        "seats_available": 27,
        "status": "SCHEDULED"
      },
      {
        "id": 28,
        "starts_at": "2026-07-18T15:25:04.720285-03:00",
        "ends_at": "2026-07-18T19:25:04.720285-03:00",
        "timezone": "America/Argentina/Cordoba",
        "capacity": 30,
        "seats_available": 30,
        "status": "SCHEDULED"
      }
    ]
  },
  {
    "id": 57,
    "code": "CV45",
    "title": "Validación y verificación de métodos de ensayo según ISO 16140-3",
    "slug": "validacion-y-verificacion-de-metodos-de-ensayo-segun-iso-16140-3-cv45",
    "summary": "Validación y verificación de métodos de ensayo según ISO 16140-3. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "LIVE",
    "price": "92000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Avanzado",
    "duration_hours": 18,
    "instructor_names": "Laura Delissi",
    "badge": "PROXIMO",
    "is_featured": false,
    "sessions": [
      {
        "id": 32,
        "starts_at": "2026-08-02T15:25:04.720285-03:00",
        "ends_at": "2026-08-02T19:25:04.720285-03:00",
        "timezone": "America/Argentina/Cordoba",
        "capacity": 25,
        "seats_available": 25,
        "status": "SCHEDULED"
      }
    ]
  },
  {
    "id": 56,
    "code": "CV46",
    "title": "Monitoreo ambiental en microbiología",
    "slug": "monitoreo-ambiental-en-microbiologia-cv46",
    "summary": "Monitoreo ambiental en microbiología. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "LIVE",
    "price": "85000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Intermedio",
    "duration_hours": 12,
    "instructor_names": "César Collino",
    "badge": null,
    "is_featured": false,
    "sessions": [
      {
        "id": 31,
        "starts_at": "2026-07-13T15:25:04.720285-03:00",
        "ends_at": "2026-07-13T19:25:04.720285-03:00",
        "timezone": "America/Argentina/Cordoba",
        "capacity": 30,
        "seats_available": 30,
        "status": "SCHEDULED"
      }
    ]
  },
  {
    "id": 54,
    "code": "CV48",
    "title": "Cómo asegurar resultados confiables en métodos cuantitativos clásicos",
    "slug": "como-asegurar-resultados-confiables-en-metodos-cuantitativos-clasicos-cv48",
    "summary": "Cómo asegurar resultados confiables en métodos cuantitativos clásicos. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "LIVE",
    "price": "88000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Intermedio",
    "duration_hours": 14,
    "instructor_names": "Daniela Kuba",
    "badge": null,
    "is_featured": false,
    "sessions": [
      {
        "id": 29,
        "starts_at": "2026-06-24T15:25:04.720285-03:00",
        "ends_at": "2026-06-24T19:25:04.720285-03:00",
        "timezone": "America/Argentina/Cordoba",
        "capacity": 25,
        "seats_available": 2,
        "status": "SCHEDULED"
      }
    ]
  },
  {
    "id": 55,
    "code": "CV47",
    "title": "Gestión de medios de cultivo en laboratorios de microbiología",
    "slug": "gestion-de-medios-de-cultivo-en-laboratorios-de-microbiologia-cv47",
    "summary": "Gestión de medios de cultivo en laboratorios de microbiología. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "LIVE",
    "price": "88000.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Intermedio",
    "duration_hours": 14,
    "instructor_names": "Daniela Kuba",
    "badge": null,
    "is_featured": false,
    "sessions": [
      {
        "id": 30,
        "starts_at": "2026-07-01T15:25:04.720285-03:00",
        "ends_at": "2026-07-01T19:25:04.720285-03:00",
        "timezone": "America/Argentina/Cordoba",
        "capacity": 25,
        "seats_available": 19,
        "status": "SCHEDULED"
      }
    ]
  },
  {
    "id": 58,
    "code": "W54",
    "title": "Cómo detectar problemas antes de que aparezca una no conformidad",
    "slug": "como-detectar-problemas-antes-de-que-aparezca-una-no-conformidad-w54",
    "summary": "Cómo detectar problemas antes de que aparezca una no conformidad. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 9,
      "name": "Calidad y Metrología",
      "slug": "calidad-metrologia"
    },
    "modality": "WEBINAR",
    "price": "0.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Inicial",
    "duration_hours": 1,
    "instructor_names": "Laura Delissi",
    "badge": "NUEVO",
    "is_featured": true,
    "sessions": [
      {
        "id": 33,
        "starts_at": "2026-06-14T09:25:04.720285-03:00",
        "ends_at": "2026-06-14T10:25:04.720285-03:00",
        "timezone": "America/Argentina/Cordoba",
        "capacity": null,
        "seats_available": null,
        "status": "SCHEDULED"
      }
    ]
  },
  {
    "id": 62,
    "code": "W49",
    "title": "Política de calidad, visión, misión y valores - la carta de presentación del laboratorio",
    "slug": "politica-de-calidad-vision-mision-y-valores-la-carta-de-presentacion-del-laboratorio-w49",
    "summary": "Política de calidad, visión, misión y valores - la carta de presentación del laboratorio. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 9,
      "name": "Calidad y Metrología",
      "slug": "calidad-metrologia"
    },
    "modality": "WEBINAR",
    "price": "0.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Inicial",
    "duration_hours": 1,
    "instructor_names": "Laura Delissi",
    "badge": null,
    "is_featured": false,
    "sessions": [
      {
        "id": 37,
        "starts_at": "2026-07-04T09:25:04.720285-03:00",
        "ends_at": "2026-07-04T10:25:04.720285-03:00",
        "timezone": "America/Argentina/Cordoba",
        "capacity": null,
        "seats_available": null,
        "status": "SCHEDULED"
      }
    ]
  },
  {
    "id": 63,
    "code": "W47",
    "title": "Cómo prepararse para una auditoría con foco en la realidad del laboratorio",
    "slug": "como-prepararse-para-una-auditoria-con-foco-en-la-realidad-del-laboratorio-w47",
    "summary": "Cómo prepararse para una auditoría con foco en la realidad del laboratorio. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 9,
      "name": "Calidad y Metrología",
      "slug": "calidad-metrologia"
    },
    "modality": "WEBINAR",
    "price": "0.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Inicial",
    "duration_hours": 1,
    "instructor_names": "Guillermo Teruel",
    "badge": null,
    "is_featured": false,
    "sessions": [
      {
        "id": 38,
        "starts_at": "2026-07-09T09:25:04.720285-03:00",
        "ends_at": "2026-07-09T10:25:04.720285-03:00",
        "timezone": "America/Argentina/Cordoba",
        "capacity": null,
        "seats_available": null,
        "status": "SCHEDULED"
      }
    ]
  },
  {
    "id": 61,
    "code": "W50",
    "title": "No toda queja es una no conformidad: criterios técnicos para su gestión",
    "slug": "no-toda-queja-es-una-no-conformidad-criterios-tecnicos-para-su-gestion-w50",
    "summary": "No toda queja es una no conformidad: criterios técnicos para su gestión. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 9,
      "name": "Calidad y Metrología",
      "slug": "calidad-metrologia"
    },
    "modality": "WEBINAR",
    "price": "0.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Inicial",
    "duration_hours": 1,
    "instructor_names": "Laura Delissi",
    "badge": null,
    "is_featured": false,
    "sessions": [
      {
        "id": 36,
        "starts_at": "2026-06-29T09:25:04.720285-03:00",
        "ends_at": "2026-06-29T10:25:04.720285-03:00",
        "timezone": "America/Argentina/Cordoba",
        "capacity": null,
        "seats_available": null,
        "status": "SCHEDULED"
      }
    ]
  },
  {
    "id": 59,
    "code": "W53",
    "title": "Control ambiental en laboratorio",
    "slug": "control-ambiental-en-laboratorio-w53",
    "summary": "Control ambiental en laboratorio. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 8,
      "name": "Laboratorio de Microbiología",
      "slug": "microbiologia"
    },
    "modality": "WEBINAR",
    "price": "0.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Inicial",
    "duration_hours": 1,
    "instructor_names": "Daniela Kuba",
    "badge": null,
    "is_featured": false,
    "sessions": [
      {
        "id": 34,
        "starts_at": "2026-06-19T09:25:04.720285-03:00",
        "ends_at": "2026-06-19T10:25:04.720285-03:00",
        "timezone": "America/Argentina/Cordoba",
        "capacity": null,
        "seats_available": null,
        "status": "SCHEDULED"
      }
    ]
  },
  {
    "id": 60,
    "code": "W51",
    "title": "Indicadores de gestión: ¿medimos o cuantificamos?",
    "slug": "indicadores-de-gestion-medimos-o-cuantificamos-w51",
    "summary": "Indicadores de gestión: ¿medimos o cuantificamos?. Capacitación para profesionales de laboratorio bajo ISO/IEC 17025.",
    "category": {
      "id": 9,
      "name": "Calidad y Metrología",
      "slug": "calidad-metrologia"
    },
    "modality": "WEBINAR",
    "price": "0.00",
    "currency": "ARS",
    "cover_image": null,
    "level": "Inicial",
    "duration_hours": 1,
    "instructor_names": "Laura Delissi",
    "badge": null,
    "is_featured": false,
    "sessions": [
      {
        "id": 35,
        "starts_at": "2026-06-24T09:25:04.720285-03:00",
        "ends_at": "2026-06-24T10:25:04.720285-03:00",
        "timezone": "America/Argentina/Cordoba",
        "capacity": null,
        "seats_available": null,
        "status": "SCHEDULED"
      }
    ]
  }
];
