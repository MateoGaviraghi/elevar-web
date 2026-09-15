"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Promo } from "@/types";
import { deletePromo, listPromos, savePromo } from "@/lib/content";
import { resetCollection } from "@/lib/local-db";
import { isPromoLive, promoBadge, promoScopeLabel } from "@/lib/promos";
import { formatDateShort } from "@/lib/formatters";
import { useCollection } from "@/components/admin/use-collection";
import {
  AdminButton,
  Chip,
  ConfirmDialog,
  EmptyState,
  FilterTabs,
  PageHeader,
  SearchInput,
  Table,
  Td,
  Th,
  useToast,
} from "@/components/admin/ui";

type Filter = "ALL" | "AUTO" | "COUPON" | "INACTIVE";

export default function AdminPromosPage() {
  const { rows: promos, refresh } = useCollection(listPromos);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [toDelete, setToDelete] = useState<Promo | null>(null);
  const { toast, showToast } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return promos.filter((p) => {
      if (filter === "INACTIVE" && isPromoLive(p)) return false;
      if ((filter === "AUTO" || filter === "COUPON") && p.trigger !== filter) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    });
  }, [promos, query, filter]);

  function toggleActive(promo: Promo) {
    savePromo({ ...promo, active: !promo.active });
    refresh();
    showToast(promo.active ? "Promoción desactivada." : "Promoción activada.");
  }

  function confirmDelete() {
    if (!toDelete) return;
    deletePromo(toDelete.id);
    setToDelete(null);
    refresh();
    showToast("Promoción eliminada.");
  }

  return (
    <>
      <PageHeader
        title="Promociones y descuentos"
        description="Descuentos automáticos y cupones que se aplican en el carrito."
        actions={
          <>
            <AdminButton
              tone="ghost"
              onClick={() => {
                resetCollection("promos");
                showToast("Promociones restablecidas.");
              }}
            >
              Restablecer
            </AdminButton>
            <AdminButton tone="secondary" href="/promociones">
              Ver en el sitio
            </AdminButton>
            <AdminButton href="/admin/promociones/nueva">Nueva promoción</AdminButton>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre o código…" />
        <FilterTabs<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ALL", label: "Todas", count: promos.length },
            { value: "AUTO", label: "Automáticas" },
            { value: "COUPON", label: "Cupones" },
            { value: "INACTIVE", label: "No vigentes" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No hay promociones que coincidan"
          action={<AdminButton href="/admin/promociones/nueva">Crear promoción</AdminButton>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Promoción</Th>
              <Th>Tipo</Th>
              <Th>Beneficio</Th>
              <Th>Alcance</Th>
              <Th>Vigencia</Th>
              <Th>Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-neutral-50">
                <Td>
                  <Link
                    href={`/admin/promociones/${p.id}`}
                    className="block max-w-xs font-medium text-ink-900 hover:text-brand-600"
                  >
                    {p.title}
                  </Link>
                  <span className="mt-0.5 block font-mono text-xs text-neutral-400">{p.code}</span>
                </Td>
                <Td>
                  <Chip tone={p.trigger === "AUTO" ? "brand" : "neutral"}>
                    {p.trigger === "AUTO" ? "Automática" : "Cupón"}
                  </Chip>
                </Td>
                <Td className="whitespace-nowrap font-medium">{promoBadge(p)}</Td>
                <Td className="text-neutral-600">{promoScopeLabel(p)}</Td>
                <Td className="whitespace-nowrap text-neutral-500">
                  {p.startsAt || p.endsAt
                    ? `${p.startsAt ? formatDateShort(p.startsAt) : "—"} → ${
                        p.endsAt ? formatDateShort(p.endsAt) : "—"
                      }`
                    : "Sin límite"}
                </Td>
                <Td>
                  <button type="button" onClick={() => toggleActive(p)} title="Activar / desactivar">
                    <Chip tone={isPromoLive(p) ? "ok" : "neutral"}>
                      {isPromoLive(p) ? "Vigente" : p.active ? "Fuera de fecha" : "Inactiva"}
                    </Chip>
                  </button>
                </Td>
                <Td className="whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/promociones/${p.id}`}
                      className="text-xs font-semibold text-neutral-500 transition-colors hover:text-ink-900"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => setToDelete(p)}
                      className="text-xs font-semibold text-neutral-400 transition-colors hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar promoción"
        description={toDelete ? `Se va a eliminar "${toDelete.title}".` : undefined}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      {toast}
    </>
  );
}
