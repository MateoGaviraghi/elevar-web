import type { Metadata } from "next";
import { DocumentoLegal } from "@/components/legal/documento";
import { PRIVACIDAD, VIGENCIA } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad — Elevar",
  description: "Qué datos pide la web de ELEVAR, para qué los usa, quién más los recibe y cómo pedir verlos, corregirlos o borrarlos.",
};

/** Política de privacidad (KAN-41; Ley 25.326 art. 6 y Res. AAIP 14/2018). Textos en `lib/legal.ts`. */
export default function PrivacidadPage() {
  return (
    <DocumentoLegal
      etiqueta="Privacidad"
      titulo="Qué hacemos con tus datos"
      bajada="Qué datos te pedimos en cada formulario, para qué los usamos y cómo pedirnos verlos, corregirlos o borrarlos."
      vigencia={VIGENCIA}
      secciones={PRIVACIDAD}
    />
  );
}
