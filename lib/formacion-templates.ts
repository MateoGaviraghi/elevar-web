import type { Modality } from "@/types";

/**
 * Bloques de la ficha que son iguales en todos los cursos de una modalidad.
 * Textos literales de elevar.com.ar (relevados el 2026-10-19): en el sitio actual
 * se repiten idénticos en los 48 asincrónicos y en los 14 en vivo; los webinars no
 * los muestran. En el admin se editan una vez por modalidad, no en cada curso.
 * Lo que falta definir con ELEVAR va como {{CONFIRMAR}}.
 */
export interface ModalityTemplate {
  /** "¿Qué incluye el curso?" */
  includes: string[];
  /** "Modalidad de la cursada": cómo se cursa, paso a paso. */
  howItWorks: string[];
  certificate: { intro: string; tiers: { name: string; rule: string }[] } | null;
  payment: { region: string; methods: string[] }[];
  promos: { title: string; detail: string }[];
}

const INCLUYE = [
  "Presentación en formato pdf para descargar.",
  "Video explicativo generado en el encuentro del curso.",
  "Ejercicio final.",
  "Acceso a email y WhatsApp para dudas o consultas de forma ilimitada.",
];

const ACCESO =
  "El acceso a la plataforma para realizar la cursada se brinda dentro de las 24 h. de realizado el pago y se encuentra disponible por 90 días corridos. Pasada dicha fecha, el acceso a la plataforma se invalida automáticamente, por lo que será necesario solicitar acceso a info@elevar.com.ar para culminar el curso y obtener el certificado.";

const PLATAFORMA =
  "Una vez realizado el pago, se comparte un usuario y contraseña para ingresar a la plataforma de capacitación de ELEVAR donde el alumno podrá descargar documentación, visualizar el video generado y realizar el ejercicio final.";

const CERTIFICADO: ModalityTemplate["certificate"] = {
  intro: "Se otorga un certificado:",
  tiers: [
    { name: "De participación", rule: "si el puntaje del ejercicio final es menor al 70%" },
    { name: "De aprobación", rule: "si el puntaje del ejercicio final es mayor al 70%" },
  ],
};

const PAGO: ModalityTemplate["payment"] = [
  { region: "Para Argentina", methods: ["Mercado Pago", "Transferencia bancaria"] },
  { region: "Otros países", methods: ["Paypal", "Transferencia bancaria", "Western Union"] },
];

const PROMOS: ModalityTemplate["promos"] = [
  {
    title: "Promoción grupo de alumnos",
    detail: "brindamos descuento de 10% para grupos a partir de 2 personas.",
  },
  {
    title: "Descuentos medios de pago",
    detail: "realizando el pago desde el exterior mediante Western Union se aplica descuento del 20%.",
  },
];

const EMPTY: ModalityTemplate = { includes: [], howItWorks: [], certificate: null, payment: [], promos: [] };

/**
 * E-Books (Mateo, 2026-10-19: la ficha se diseña con E-Books). Son una modalidad más
 * desde la página de la lista; ELEVAR todavía no confirmó si existen.
 */
export const EBOOK_TEMPLATE: ModalityTemplate = {
  includes: ["{{CONFIRMAR}} Qué incluye el e-book (formato, páginas)."],
  howItWorks: ["{{CONFIRMAR}} Cómo se recibe el e-book después del pago."],
  certificate: null,
  payment: PAGO,
  promos: [],
};

export const MODALITY_TEMPLATES: Record<Modality, ModalityTemplate> = {
  ASYNC: {
    includes: INCLUYE,
    howItWorks: [
      "El curso se realiza en modalidad asincrónica.",
      PLATAFORMA,
      "El curso finaliza con la realización del ejercicio final y la emisión del certificado.",
      ACCESO,
    ],
    certificate: CERTIFICADO,
    payment: PAGO,
    promos: PROMOS,
  },
  LIVE: {
    includes: INCLUYE,
    howItWorks: [
      "El curso se realiza en modalidad virtual en vivo.",
      PLATAFORMA,
      "El enlace para ingresar a la sala de capacitación en el día estipulado es compartido en la plataforma de capacitación de ELEVAR.",
      "El curso finaliza con la emisión del certificado.",
      ACCESO,
    ],
    certificate: CERTIFICADO,
    payment: PAGO,
    promos: PROMOS,
  },
  // El sitio actual no muestra estos bloques en los webinars (gratuitos).
  WEBINAR: EMPTY,
  // El sitio actual no tiene talleres publicados.
  WORKSHOP: EMPTY,
  EBOOK: EBOOK_TEMPLATE,
};
