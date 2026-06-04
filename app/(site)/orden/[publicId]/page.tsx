import type { Metadata } from "next";
import { OrderStatusClient } from "@/components/order/order-status-client";

export const metadata: Metadata = {
  title: "Estado de tu orden — Elevar",
  robots: { index: false, follow: false },
};

export default function OrderStatusPage({ params }: { params: { publicId: string } }) {
  return <OrderStatusClient publicId={params.publicId} />;
}
