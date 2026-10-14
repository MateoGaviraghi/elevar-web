// Fuente única de los datos de contacto de ELEVAR. Todo el sitio (contacto, footer,
// header, WhatsApp flotante, checkout, estado de la orden) lee de acá: un cambio de
// número o de cuenta se hace en un solo lugar.
// URLs de redes sociales confirmadas por Mateo el 2026-10-08.

/** Canales con ícono propio (ver `components/common/brand-icons.tsx`). */
export type BrandId = "instagram" | "linkedin" | "facebook" | "whatsapp" | "gmail" | "googlemaps" | "phone";

const PHONE_E164 = "+5493446507779";
const EMAIL = "info@elevar.com.ar";
const ADDRESS = "Pellegrini 189, oficina 9 (E2820), Gualeguaychú, Entre Ríos, Argentina";

export const CONTACT = {
  address: ADDRESS,
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`,
  phoneDisplay: "(+54) 9 3446 507779",
  /** Formato corto (barra superior del header). */
  phoneShort: "+54 9 3446 507779",
  phoneTel: `tel:${PHONE_E164}`,
  whatsappUrl: `https://wa.me/${PHONE_E164.slice(1)}`,
  email: EMAIL,
  emailUrl: `mailto:${EMAIL}`,
} as const;

export interface Channel {
  brand: BrandId;
  /** Texto visible de la fila (dato de contacto). */
  text: string;
  href: string;
  /** Nombre para lectores de pantalla. */
  aria: string;
  external: boolean;
}

/** Datos de contacto, en el orden en que se muestran. */
export const CONTACT_CHANNELS: Channel[] = [
  { brand: "googlemaps", text: CONTACT.address, href: CONTACT.mapsUrl, aria: `Ver en Google Maps: ${CONTACT.address}`, external: true },
  { brand: "phone", text: CONTACT.phoneDisplay, href: CONTACT.phoneTel, aria: `Llamar al ${CONTACT.phoneDisplay}`, external: false },
  { brand: "whatsapp", text: "Escribinos por WhatsApp", href: CONTACT.whatsappUrl, aria: "Escribir por WhatsApp", external: true },
  { brand: "gmail", text: CONTACT.email, href: CONTACT.emailUrl, aria: `Escribir a ${CONTACT.email}`, external: false },
];

/** Redes sociales. */
export const SOCIAL_CHANNELS: Channel[] = [
  { brand: "instagram", text: "@elevarcalidad", href: "https://www.instagram.com/elevarcalidad/", aria: "Instagram @elevarcalidad", external: true },
  { brand: "linkedin", text: "Elevar Calidad", href: "https://www.linkedin.com/in/elevar-calidad-7315191a4/", aria: "LinkedIn Elevar Calidad", external: true },
  { brand: "facebook", text: "@elevarcalidad", href: "https://www.facebook.com/elevarcalidad", aria: "Facebook @elevarcalidad", external: true },
];
