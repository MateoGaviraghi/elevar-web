"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { OrderStatus } from "@/types";
import { listOrders } from "@/lib/orders-store";
import { formatARS, formatDate } from "@/lib/formatters";
import { useCollection } from "@/components/admin/use-collection";
import { ORDER_STATUS_CHIP, PAYMENT_METHOD_LABEL } from "@/components/admin/order-status";
import { downloadCsv } from "@/components/admin/csv";
import {
  AdminButton,
  Chip,
  EmptyState,
  FilterTabs,
  PageHeader,
  SearchInput,
  StatCard,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";

type Filter = "ALL" | OrderStatus;

export default function AdminOrdersPage() {
  const { rows: orders } = useCollection(listOrders);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "ALL" && o.status !== filter) return false;
      if (!q) return true;
      return (
        o.buyer_name.toLowerCase().includes(q) ||
        o.buyer_email.toLowerCase().includes(q) ||
        o.public_id.toLowerCase().includes(q)
      );
    });
  }, [orders, query, filter]);

  const paid = orders.filter((o) => o.status === "PAID" || o.status === "FULFILLED");
  const revenue = paid.reduce((acc, o) => acc + parseFloat(o.total), 0);
  const units = orders.reduce(
    (acc, o) => acc + o.items.reduce((a, i) => a + i.quantity, 0),
    0
  );

  function exportCsv() {
    downloadCsv(
      "elevar-ordenes.csv",
      ["Orden", "Fecha", "Comprador", "Email", "Teléfono", "Estado", "Medio", "Cupón", "Descuento", "Total"],
      filtered.map((o) => [
        o.public_id,
        formatDate(o.created_at),
        o.buyer_name,
        o.buyer_email,
        o.buyer_phone ?? "",
        ORDER_STATUS_CHIP[o.status].label,
        PAYMENT_METHOD_LABEL[o.payment_method],
        o.coupon_code ?? "",
        o.discount_total,
        o.total,
      ])
    );
  }

  return (
    <>
      <PageHeader
        title="Órdenes"
        description="Operaciones registradas desde el carrito, con su estado de pago."
        actions={
          <AdminButton tone="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
            Exportar CSV
          </AdminButton>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Órdenes" value={orders.length} />
        <StatCard label="Pagadas" value={paid.length} />
        <StatCard label="Inscripciones vendidas" value={units} />
        <StatCard label="Ingresos confirmados" value={formatARS(revenue)} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por comprador, email o N° de orden…" />
        <FilterTabs<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ALL", label: "Todas", count: orders.length },
            { value: "PAID", label: "Pagadas" },
            { value: "PENDING", label: "Pendientes" },
            { value: "FAILED", label: "Fallidas" },
            { value: "CANCELLED", label: "Canceladas" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin órdenes para mostrar"
          description="Cuando se registre una compra desde el sitio, vas a verla acá con su estado."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Orden</Th>
              <Th>Comprador</Th>
              <Th>Fecha</Th>
              <Th>Medio</Th>
              <Th>Estado</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.public_id} className="transition-colors hover:bg-neutral-50">
                <Td>
                  <Link
                    href={`/admin/ordenes/${o.public_id}`}
                    className="font-mono text-xs font-semibold text-ink-900 hover:text-brand-600"
                  >
                    #{o.public_id.slice(0, 8).toUpperCase()}
                  </Link>
                  <span className="mt-0.5 block text-xs text-neutral-400">
                    {o.items.reduce((a, i) => a + i.quantity, 0)} inscripciones
                  </span>
                </Td>
                <Td>
                  <span className="block font-medium text-ink-900">{o.buyer_name}</span>
                  <span className="block text-xs text-neutral-500">{o.buyer_email}</span>
                </Td>
                <Td className="whitespace-nowrap text-neutral-500">{formatDate(o.created_at)}</Td>
                <Td className="text-neutral-600">{PAYMENT_METHOD_LABEL[o.payment_method]}</Td>
                <Td>
                  <Chip tone={ORDER_STATUS_CHIP[o.status].tone}>
                    {ORDER_STATUS_CHIP[o.status].label}
                  </Chip>
                </Td>
                <Td className="whitespace-nowrap text-right font-medium">
                  {formatARS(o.total)}
                  {parseFloat(o.discount_total) > 0 && (
                    <span className="mt-0.5 block text-xs font-normal text-emerald-700">
                      −{formatARS(o.discount_total)}
                    </span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
