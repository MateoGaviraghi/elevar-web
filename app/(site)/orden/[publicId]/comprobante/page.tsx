import type { Metadata } from "next";
import { Comprobante } from "@/components/order/comprobante";

export const metadata: Metadata = {
  title: "Comprobante de inscripción — Elevar",
  robots: { index: false, follow: false },
};

export default async function ComprobantePage(props: { params: Promise<{ publicId: string }> }) {
  const params = await props.params;
  return <Comprobante publicId={params.publicId} />;
}
