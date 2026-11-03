import type { Metadata } from "next";
import { ServiciosListado } from "@/components/servicios/servicios";

export const metadata: Metadata = {
  title: "Servicios — Elevar",
  description:
    "Formación, acreditación ISO/IEC 17025, auditorías internas, asistencia técnica, implementación normativa y servicios de gestión para laboratorios.",
};

export default function ServiciosPage() {
  return <ServiciosListado />;
}
