// Cada servicio tiene su propia página de detalle.
export const SERVICIOS = [
  { label: "Acreditación ISO/IEC 17025", href: "/servicios/acreditacion-iso-17025" },
  { label: "Asistencia técnica", href: "/servicios/asistencia-tecnica" },
  { label: "Auditorías internas", href: "/servicios/auditorias-internas" },
  { label: "Implementación normativa", href: "/servicios/implementacion-normativa" },
  { label: "Servicios de gestión", href: "/servicios/gestion" },
];

export const FORMACION = [
  { label: "Todos los cursos", href: "/formacion" },
  { label: "Online en vivo", href: "/formacion/cursos-online-en-vivo" },
  { label: "Asincrónicos", href: "/formacion/cursos-asincronicos" },
  { label: "Webinars gratuitos", href: "/formacion/webinars-gratuitos" },
  { label: "Talleres", href: "/formacion/talleres" },
  { label: "Promociones", href: "/promociones" },
];

export const PLATAFORMA_URL = "https://aulavirtual.elevar.com.ar";

/** WhatsApp comercial (1 a 1). */
export const WHATSAPP_URL = "https://wa.me/5493446507779";

/**
 * Comunidad de WhatsApp de Elevar. El enlace de invitación definitivo lo provee
 * Elevar; se configura con NEXT_PUBLIC_WHATSAPP_COMUNIDAD_URL.
 */
export const COMUNIDAD_WHATSAPP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_COMUNIDAD_URL ?? "https://chat.whatsapp.com/elevar-comunidad";
