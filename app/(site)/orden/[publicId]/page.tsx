import type { Metadata } from "next";
import { OrderStatusClient } from "@/components/order/order-status-client";

export const metadata: Metadata = {
  title: "Estado de tu orden — Elevar",
  robots: { index: false, follow: false },
};

export default async function OrderStatusPage(props: { params: Promise<{ publicId: string }> }) {
  const params = await props.params;
  return <OrderStatusClient publicId={params.publicId} />;
}
