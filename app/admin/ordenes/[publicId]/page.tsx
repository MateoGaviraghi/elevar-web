"use client";

import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/types";
import { getStoredOrder, setOrderStatus } from "@/lib/orders-store";
import { formatARS, formatDate, formatUSD } from "@/lib/formatters";
import { useCollection } from "@/components/admin/use-collection";
import { listOrders } from "@/lib/orders-store";
import { ORDER_STATUS_CHIP, PAYMENT_METHOD_LABEL } from "@/components/admin/order-status";
import {
  AdminButton,
  CardSection,
  Chip,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
  useToast,
} from "@/components/admin/ui";

const NEXT_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "PAID", label: "Marcar como pagada" },
  { value: "FULFILLED", label: "Marcar como entregada" },
  { value: "PENDING", label: "Volver a pendiente" },
  { value: "CANCELLED", label: "Cancelar orden" },
];

export default function AdminOrderDetailPage({ params }: { params: { publicId: string } }) {
  // Se re-lee al cambiar la colección para reflejar cambios de estado.
  useCollection(listOrders);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const { toast, showToast } = useToast();

  useEffect(() => {
    setOrder(getStoredOrder(params.publicId));
  }, [params.publicId]);

  function changeStatus(status: OrderStatus) {
    setOrderStatus(params.publicId, status, status === "PAID" ? new Date().toISOString() : null);
    setOrder(getStoredOrder(params.publicId));
    showToast("Estado de la orden actualizado.");
  }

  if (order === undefined) {
    return <p className="text-sm text-neutral-500">Cargando orden…</p>;
  }

  if (order === null) {
    return (
      <>
        <PageHeader title="Orden no encontrada" back={{ href: "/admin/ordenes", label: "Órdenes" }} />
        <EmptyState
          title="No encontramos esta orden"
          action={<AdminButton href="/admin/ordenes">Volver al listado</AdminButton>}
        />
      </>
    );
  }

  const units = order.items.reduce((acc, i) => acc + i.quantity, 0);
  const attendees = order.items.flatMap((i) =>
    (i.attendees ?? [])
      .filter((a) => a.email)
      .map((a) => ({ ...a, course: i.title_snapshot }))
  );

  return (
    <>
      <PageHeader
        title={`Orden #${order.public_id.slice(0, 8).toUpperCase()}`}
        description={`${units} inscripciones · ${formatDate(order.created_at)}`}
        back={{ href: "/admin/ordenes", label: "Órdenes" }}
        actions={<Chip tone={ORDER_STATUS_CHIP[order.status].tone}>{ORDER_STATUS_CHIP[order.status].label}</Chip>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <CardSection title="Detalle">
            <Table>
              <thead>
                <tr>
                  <Th>Curso</Th>
                  <Th className="text-right">Cantidad</Th>
                  <Th className="text-right">Unitario</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, i) => (
                  <tr key={i}>
                    <Td>
                      <span className="block font-medium text-ink-900">{it.title_snapshot}</span>
                      {it.session_label && (
                        <span className="mt-0.5 block text-xs text-neutral-500">
                          {it.session_label}
                        </span>
                      )}
                    </Td>
                    <Td className="text-right">{it.quantity}</Td>
                    <Td className="whitespace-nowrap text-right">{formatARS(it.unit_price)}</Td>
                    <Td className="whitespace-nowrap text-right font-medium">
                      {formatARS(parseFloat(it.unit_price) * it.quantity)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="space-y-2 border-t border-neutral-200 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-medium text-ink-900">{formatARS(order.subtotal)}</span>
              </div>
              {(order.discounts ?? []).map((d) => (
                <div key={d.promoId} className="flex justify-between gap-4">
                  <span className="text-emerald-700">
                    {d.label} <span className="font-mono text-xs">({d.code})</span>
                  </span>
                  <span className="font-medium text-emerald-700">−{formatARS(d.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-neutral-200 pt-2">
                <span className="font-semibold text-ink-900">Total</span>
                <span className="font-display text-lg font-semibold text-ink-900">
                  {formatARS(order.total)}
                </span>
              </div>
              {order.payment_method === "PAYPAL" && order.total_usd && (
                <p className="text-right text-xs text-neutral-500">
                  cobrado como {formatUSD(order.total_usd)}
                </p>
              )}
            </div>
          </CardSection>

          {attendees.length > 0 && (
            <CardSection
              title="Participantes"
              description="Correos cargados por el comprador para cada inscripción."
            >
              <Table>
                <thead>
                  <tr>
                    <Th>Nombre</Th>
                    <Th>Email</Th>
                    <Th>Curso</Th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((a, i) => (
                    <tr key={i}>
                      <Td className="font-medium text-ink-900">{a.name || "—"}</Td>
                      <Td className="text-neutral-600">{a.email}</Td>
                      <Td className="text-neutral-500">{a.course}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardSection>
          )}
        </div>

        <div className="space-y-6">
          <CardSection title="Comprador">
            <Row label="Nombre" value={order.buyer_name} />
            <Row label="Email" value={order.buyer_email} />
            {order.buyer_phone && <Row label="Teléfono" value={order.buyer_phone} />}
            {order.buyer_company && <Row label="Empresa" value={order.buyer_company} />}
          </CardSection>

          <CardSection title="Pago">
            <Row label="Medio" value={PAYMENT_METHOD_LABEL[order.payment_method]} />
            <Row label="Cupón" value={order.coupon_code ?? "—"} />
            <Row label="Creada" value={formatDate(order.created_at)} />
            <Row label="Pagada" value={order.paid_at ? formatDate(order.paid_at) : "—"} />
          </CardSection>

          <CardSection
            title="Cambiar estado"
            description="Útil para pagos coordinados por fuera de la pasarela."
          >
            <div className="flex flex-col gap-2">
              {NEXT_STATUSES.filter((s) => s.value !== order.status).map((s) => (
                <AdminButton
                  key={s.value}
                  tone={s.value === "CANCELLED" ? "danger" : "secondary"}
                  onClick={() => changeStatus(s.value)}
                  className="w-full"
                >
                  {s.label}
                </AdminButton>
              ))}
            </div>
          </CardSection>
        </div>
      </div>
      {toast}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-neutral-200 pb-2.5 last:border-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-ink-900">{value}</span>
    </div>
  );
}
