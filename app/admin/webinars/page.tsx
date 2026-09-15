"use client";

import { useMemo, useState } from "react";
import type { WebinarRegistration } from "@/types";
import {
  deleteWebinarRegistration,
  listWebinarRegistrations,
} from "@/lib/content";
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

export default function AdminWebinarsPage() {
  const { rows: registrations, refresh } = useCollection(listWebinarRegistrations);
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState<string>("ALL");
  const [toDelete, setToDelete] = useState<WebinarRegistration | null>(null);
  const { toast, showToast } = useToast();

  const courses = useMemo(() => {
    const map = new Map<string, number>();
    registrations.forEach((r) => map.set(r.course_title, (map.get(r.course_title) ?? 0) + 1));
    return Array.from(map.entries());
  }, [registrations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return registrations.filter((r) => {
      if (course !== "ALL" && r.course_title !== course) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.company ?? "").toLowerCase().includes(q)
      );
    });
  }, [registrations, query, course]);

  function exportCsv() {
    downloadCsv(
      "elevar-inscripciones-webinars.csv",
      ["Fecha de alta", "Webinar", "Encuentro", "Nombre", "Email", "Teléfono", "Empresa"],
      filtered.map((r) => [
        formatDate(r.created_at),
        r.course_title,
        r.session_label ?? "",
        r.name,
        r.email,
        r.phone ?? "",
        r.company ?? "",
      ])
    );
  }

  function confirmDelete() {
    if (!toDelete) return;
    deleteWebinarRegistration(toDelete.id);
    setToDelete(null);
    refresh();
    showToast("Inscripción eliminada.");
  }

  return (
    <>
      <PageHeader
        title="Inscripciones a webinars"
        description="Altas registradas desde el formulario de inscripción del sitio."
        actions={
          <AdminButton tone="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
            Exportar CSV
          </AdminButton>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Inscripciones" value={registrations.length} />
        <StatCard label="Webinars con inscriptos" value={courses.length} />
        <StatCard
          label="Correos únicos"
          value={new Set(registrations.map((r) => r.email.toLowerCase())).size}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre, email o empresa…" />
        {courses.length > 0 && (
          <FilterTabs
            value={course}
            onChange={setCourse}
            options={[
              { value: "ALL", label: "Todos", count: registrations.length },
              ...courses.map(([title, count]) => ({
                value: title,
                label: title.length > 28 ? `${title.slice(0, 28)}…` : title,
                count,
              })),
            ]}
          />
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin inscripciones registradas"
          description="Cuando alguien se anote a un webinar gratuito desde el sitio, su inscripción aparece acá."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Participante</Th>
              <Th>Webinar</Th>
              <Th>Encuentro</Th>
              <Th>Contacto</Th>
              <Th>Alta</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-neutral-50">
                <Td>
                  <span className="block font-medium text-ink-900">{r.name}</span>
                  <span className="block text-xs text-neutral-500">{r.email}</span>
                </Td>
                <Td className="max-w-xs text-neutral-700">{r.course_title}</Td>
                <Td className="whitespace-nowrap">
                  {r.session_label ? (
                    <Chip tone="neutral">{r.session_label}</Chip>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </Td>
                <Td className="text-neutral-600">
                  {r.phone || "—"}
                  {r.company && (
                    <span className="mt-0.5 block text-xs text-neutral-400">{r.company}</span>
                  )}
                </Td>
                <Td className="whitespace-nowrap text-neutral-500">{formatDate(r.created_at)}</Td>
                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => setToDelete(r)}
                    className="text-xs font-semibold text-neutral-400 transition-colors hover:text-red-600"
                  >
                    Eliminar
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar inscripción"
        description={toDelete ? `Se va a eliminar la inscripción de ${toDelete.name}.` : undefined}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      {toast}
    </>
  );
}
