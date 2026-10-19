import { CONTACT } from "@/lib/contact";
import { MODALITIES } from "@/lib/formacion-modalities";
import { SERVICIOS_DATA } from "@/lib/servicios";

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

/** Tarjeta del menú desplegable: pictograma + título corto + bajada de Laura. */
export interface NavCard {
  label: string;
  href: string;
  pictogram: string;
  desc: string;
}

const serviceById = new Map(SERVICIOS_DATA.map((s) => [s.id, s]));

/** "Formación" en el menú: las 4 modalidades (títulos y bajadas de `formacion-modalities`). */
export const NAV_FORMACION_CARDS: NavCard[] = MODALITIES.map((m) => ({
  label: m.title,
  href: `/formacion/${m.slug}`,
  pictogram: m.img,
  desc: m.desc,
}));

/** "Servicios" en el menú: los títulos cortos de `SERVICIOS` con el pictograma y la bajada de cada página. */
export const NAV_SERVICIOS_CARDS: NavCard[] = SERVICIOS.map((s) => {
  const data = serviceById.get(s.href.replace("/servicios/", ""));
  return { ...s, pictogram: data?.pictogram ?? "", desc: data?.desc ?? "" };
});

export const PLATAFORMA_URL = "https://aulavirtual.elevar.com.ar";

/** WhatsApp comercial (1 a 1). El número vive en `lib/contact.ts`. */
export const WHATSAPP_URL = CONTACT.whatsappUrl;

/**
 * Comunidad de WhatsApp de Elevar. El enlace de invitación definitivo lo provee
 * Elevar; se configura con NEXT_PUBLIC_WHATSAPP_COMUNIDAD_URL.
 */
export const COMUNIDAD_WHATSAPP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_COMUNIDAD_URL ?? "https://chat.whatsapp.com/DvRcHiEneWF6y8UbiQ9W3H";
