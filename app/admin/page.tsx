"use client";

import Link from "next/link";
import { useMemo } from "react";
import { listCourses, listLeads, listPromos, listWebinarRegistrations } from "@/lib/content";
import { listOrders } from "@/lib/orders-store";
import { isPromoLive } from "@/lib/promos";
import { formatARS, formatDateShort } from "@/lib/formatters";
import { useCollection } from "@/components/admin/use-collection";
import {
  AdminButton,
  Chip,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { ORDER_STATUS_CHIP } from "@/components/admin/order-status";

export default function AdminDashboardPage() {
  const { rows: courses } = useCollection(listCourses);
  const { rows: promos } = useCollection(listPromos);
  const { rows: orders } = useCollection(listOrders);
  const { rows: leads } = useCollection(listLeads);
  const { rows: webinars } = useCollection(listWebinarRegistrations);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status === "PAID" || o.status === "FULFILLED");
    const revenue = paid.reduce((acc, o) => acc + parseFloat(o.total), 0);
    return {
      published: courses.filter((c) => c.is_published !== false).length,
      totalCourses: courses.length,
      activePromos: promos.filter((p) => isPromoLive(p)).length,
      orders: orders.length,
      pending: orders.filter((o) => o.status === "PENDING").length,
      revenue,
      leads: leads.length,
      webinars: webinars.length,
    };
  }, [courses, promos, orders, leads, webinars]);

  const recentOrders = orders.slice(0, 5);
  const recentLeads = leads.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Panel"
        description="Resumen de cursos, ventas y contactos de Elevar."
        actions={
          <>
            <AdminButton tone="secondary" href="/admin/cursos/nuevo">
              Nuevo curso
            </AdminButton>
            <AdminButton href="/admin/promociones/nueva">Nueva promoción</AdminButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Cursos publicados"
          value={stats.published}
          hint={`${stats.totalCourses} en total`}
          href="/admin/cursos"
        />
        <StatCard
          label="Promos activas"
          value={stats.activePromos}
          hint="vigentes hoy"
          href="/admin/promociones"
        />
        <StatCard
          label="Órdenes"
          value={stats.orders}
          hint={`${stats.pending} pendientes`}
          href="/admin/ordenes"
        />
        <StatCard
          label="Ingresos confirmados"
          value={formatARS(stats.revenue)}
          hint="órdenes pagadas"
          href="/admin/ordenes"
        />
        <StatCard
          label="Contactos"
          value={stats.leads}
          hint="formularios, comunidad y compras"
          href="/admin/contactos"
        />
        <StatCard
          label="Inscripciones a webinars"
          value={stats.webinars}
          href="/admin/webinars"
        />
      </div>

      {/* Últimas órdenes */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
            Últimas órdenes
          </h2>
          <Link href="/admin/ordenes" className="text-xs font-semibold text-neutral-500 hover:text-ink-900">
            Ver todas →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <EmptyState
            title="Todavía no hay órdenes"
            description="Cuando alguien compre un curso desde el sitio, la operación aparece acá."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Orden</Th>
                <Th>Comprador</Th>
                <Th>Fecha</Th>
                <Th>Estado</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.public_id} className="transition-colors hover:bg-neutral-50">
                  <Td>
                    <Link
                      href={`/admin/ordenes/${o.public_id}`}
                      className="font-mono text-xs font-semibold text-ink-900 hover:text-brand-600"
                    >
                      #{o.public_id.slice(0, 8).toUpperCase()}
                    </Link>
                  </Td>
                  <Td>
                    <span className="block font-medium text-ink-900">{o.buyer_name}</span>
                    <span className="block text-xs text-neutral-500">{o.buyer_email}</span>
                  </Td>
                  <Td className="whitespace-nowrap text-neutral-500">
                    {formatDateShort(o.created_at)}
                  </Td>
                  <Td>
                    <Chip tone={ORDER_STATUS_CHIP[o.status].tone}>
                      {ORDER_STATUS_CHIP[o.status].label}
                    </Chip>
                  </Td>
                  <Td className="whitespace-nowrap text-right font-medium">
                    {formatARS(o.total)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      {/* Últimos contactos */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
            Últimos contactos
          </h2>
          <Link href="/admin/contactos" className="text-xs font-semibold text-neutral-500 hover:text-ink-900">
            Ver todos →
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <EmptyState
            title="Sin contactos registrados"
            description="Acá se listan las consultas del formulario, las altas a la comunidad de WhatsApp y los compradores."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nombre</Th>
                <Th>Email</Th>
                <Th>Origen</Th>
                <Th>Fecha</Th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-neutral-50">
                  <Td className="font-medium text-ink-900">{l.name}</Td>
                  <Td className="text-neutral-600">{l.email}</Td>
                  <Td>
                    <Chip tone="neutral">{l.source}</Chip>
                  </Td>
                  <Td className="whitespace-nowrap text-neutral-500">
                    {formatDateShort(l.created_at)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>
    </>
  );
}
