"use client";

import { useMemo, useState } from "react";
import type { Lead, LeadSource } from "@/types";
import { deleteLead, listLeads } from "@/lib/content";
import { formatDate } from "@/lib/formatters";
import { useCollection } from "@/components/admin/use-collection";
import { downloadCsv } from "@/components/admin/csv";
import {
  AdminButton,
  Chip,
  ConfirmDialog,
  EmptyState,
  FilterTabs,
  PageHeader,
  SearchInput,
  StatCard,
  Table,
  Td,
  Th,
  useToast,
} from "@/components/admin/ui";

const SOURCE_LABEL: Record<LeadSource, string> = {
  CONTACTO: "Formulario",
  WEBINAR: "Webinar",
  COMPRA: "Compra",
  COMUNIDAD: "Comunidad",
};

const SOURCE_TONE: Record<LeadSource, string> = {
  CONTACTO: "neutral",
  WEBINAR: "brand",
  COMPRA: "ok",
  COMUNIDAD: "warn",
};

type Filter = "ALL" | LeadSource;

export default function AdminLeadsPage() {
  const { rows: leads, refresh } = useCollection(listLeads);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [detail, setDetail] = useState<Lead | null>(null);
  const { toast, showToast } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (filter !== "ALL" && l.source !== filter) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.company ?? "").toLowerCase().includes(q) ||
        (l.subject ?? "").toLowerCase().includes(q)
      );
    });
  }, [leads, query, filter]);

  function exportCsv() {
    downloadCsv(
      "elevar-contactos.csv",
      ["Fecha", "Nombre", "Email", "Teléfono", "Empresa", "Origen", "Asunto", "Mensaje"],
      filtered.map((l) => [
        formatDate(l.created_at),
        l.name,
        l.email,
        l.phone ?? "",
        l.company ?? "",
        SOURCE_LABEL[l.source],
        l.subject ?? "",
        l.message ?? "",
      ])
    );
  }

  function confirmDelete() {
    if (!toDelete) return;
    deleteLead(toDelete.id);
    setToDelete(null);
    refresh();
    showToast("Contacto eliminado.");
  }

  const counts = (source: LeadSource) => leads.filter((l) => l.source === source).length;

  return (
    <>
      <PageHeader
        title="Contactos"
        description="Consultas del formulario, altas a la comunidad, inscripciones y compradores."
        actions={
          <AdminButton tone="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
            Exportar CSV
          </AdminButton>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Contactos" value={leads.length} />
        <StatCard label="Consultas" value={counts("CONTACTO")} />
        <StatCard label="Compradores" value={counts("COMPRA")} />
        <StatCard label="Comunidad WhatsApp" value={counts("COMUNIDAD")} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre, email, empresa o asunto…" />
        <FilterTabs<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ALL", label: "Todos", count: leads.length },
            { value: "CONTACTO", label: "Formulario", count: counts("CONTACTO") },
            { value: "COMPRA", label: "Compras", count: counts("COMPRA") },
            { value: "WEBINAR", label: "Webinars", count: counts("WEBINAR") },
            { value: "COMUNIDAD", label: "Comunidad", count: counts("COMUNIDAD") },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin contactos registrados"
          description="Los datos que dejan los visitantes en el sitio se listan acá y se pueden exportar a CSV."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Contacto</Th>
              <Th>Teléfono</Th>
              <Th>Empresa</Th>
              <Th>Origen</Th>
              <Th>Fecha</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-neutral-50">
                <Td>
                  <span className="block font-medium text-ink-900">{l.name}</span>
                  <span className="block text-xs text-neutral-500">{l.email}</span>
                  {l.subject && (
                    <span className="mt-0.5 block max-w-sm truncate text-xs text-neutral-400">
                      {l.subject}
                    </span>
                  )}
                </Td>
                <Td className="whitespace-nowrap text-neutral-600">{l.phone || "—"}</Td>
                <Td className="text-neutral-600">{l.company || "—"}</Td>
                <Td>
                  <Chip tone={SOURCE_TONE[l.source]}>{SOURCE_LABEL[l.source]}</Chip>
                </Td>
                <Td className="whitespace-nowrap text-neutral-500">{formatDate(l.created_at)}</Td>
                <Td className="whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setDetail(l)}
                      className="text-xs font-semibold text-neutral-500 transition-colors hover:text-ink-900"
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(l)}
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

      {/* Detalle del contacto */}
      {detail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink-900/50"
            onClick={() => setDetail(null)}
            aria-hidden
          />
          <div className="relative w-full max-w-lg border border-neutral-200 bg-neutral-0 shadow-lg">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-6">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                  {detail.name}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">{detail.email}</p>
              </div>
              <Chip tone={SOURCE_TONE[detail.source]}>{SOURCE_LABEL[detail.source]}</Chip>
            </div>
            <div className="space-y-4 p-6 text-sm">
              {detail.phone && <Detail label="Teléfono" value={detail.phone} />}
              {detail.company && <Detail label="Empresa" value={detail.company} />}
              {detail.subject && <Detail label="Asunto" value={detail.subject} />}
              {detail.message && <Detail label="Mensaje" value={detail.message} />}
              <Detail label="Fecha" value={formatDate(detail.created_at)} />
            </div>
            <div className="flex justify-end gap-3 border-t border-neutral-200 p-6">
              <AdminButton tone="secondary" onClick={() => setDetail(null)}>
                Cerrar
              </AdminButton>
              <a
                href={`mailto:${detail.email}`}
                className="inline-flex items-center justify-center gap-2 bg-ink-900 px-4 py-2.5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-ink-800"
              >
                Responder por email
              </a>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar contacto"
        description={toDelete ? `Se va a eliminar el contacto de ${toDelete.name}.` : undefined}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      {toast}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 whitespace-pre-line leading-relaxed text-ink-800">{value}</p>
    </div>
  );
}
