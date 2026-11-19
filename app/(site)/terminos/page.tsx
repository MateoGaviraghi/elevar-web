import type { Metadata } from "next";
import { DocumentoLegal } from "@/components/legal/documento";
import { TERMINOS, VIGENCIA } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos de inscripción — Elevar",
  description: "Cómo te inscribís a un curso de ELEVAR, precios, medios de pago, descuentos, acceso a la plataforma, certificado y arrepentimiento.",
};

/** Términos de inscripción y pago (KAN-41; Res. 271/2020). Textos en `lib/legal.ts`. */
export default function TerminosPage() {
  return (
    <DocumentoLegal
      etiqueta="Términos"
      titulo="Términos de inscripción"
      bajada="Lo que tenés que saber antes de pagar un curso: precios, medios de pago, descuentos, acceso, certificado y cómo arrepentirte de la compra."
      vigencia={VIGENCIA}
      secciones={TERMINOS}
    />
  );
}
