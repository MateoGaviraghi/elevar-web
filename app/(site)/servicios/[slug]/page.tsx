import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicioDetalle } from "@/components/servicios/servicios";
import { SERVICIOS, servicio } from "@/lib/servicios";

export function generateStaticParams() {
  return SERVICIOS.map((s) => ({ slug: s.id }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const s = servicio(slug);
  if (!s) return { title: "Servicio no encontrado — Elevar" };
  return { title: `${s.titulo} — Servicios Elevar`, description: s.frase };
}

export default async function ServicioPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  if (!servicio(slug)) notFound();
  return <ServicioDetalle id={slug} />;
}
