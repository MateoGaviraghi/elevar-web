"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Course, Modality } from "@/types";
import { deleteCourse, listCourses, saveCourse } from "@/lib/content";
import { resetCollection } from "@/lib/local-db";
import { formatARS } from "@/lib/formatters";
import { useCollection } from "@/components/admin/use-collection";
import { MODALITY_LABEL } from "@/components/admin/labels";
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

type Filter = "ALL" | Modality | "DRAFT";

export default function AdminCoursesPage() {
  const { rows: courses, refresh } = useCollection(listCourses);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [toDelete, setToDelete] = useState<Course | null>(null);
  const { toast, showToast } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (filter === "DRAFT" && c.is_published !== false) return false;
      if (filter !== "ALL" && filter !== "DRAFT" && c.modality !== filter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.category?.name.toLowerCase().includes(q)
      );
    });
  }, [courses, query, filter]);

  function togglePublished(course: Course) {
    saveCourse({ ...course, is_published: course.is_published === false });
    refresh();
    showToast(
      course.is_published === false ? "Curso publicado." : "Curso ocultado del sitio."
    );
  }

  function confirmDelete() {
    if (!toDelete) return;
    deleteCourse(toDelete.id);
    setToDelete(null);
    refresh();
    showToast("Curso eliminado.");
  }

  return (
    <>
      <PageHeader
        title="Cursos"
        description="Alta, edición, baja y publicación de los cursos disponibles para la venta."
        actions={
          <>
            <AdminButton
              tone="ghost"
              onClick={() => {
                resetCollection("courses");
                showToast("Catálogo restablecido a los datos originales.");
              }}
            >
              Restablecer
            </AdminButton>
            <AdminButton href="/admin/cursos/nuevo">Nuevo curso</AdminButton>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por título, código o categoría…" />
        <FilterTabs<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ALL", label: "Todos", count: courses.length },
            { value: "ASYNC", label: "Asincrónicos" },
            { value: "LIVE", label: "En vivo" },
            { value: "WEBINAR", label: "Webinars" },
            { value: "WORKSHOP", label: "Talleres" },
            {
              value: "DRAFT",
              label: "Ocultos",
              count: courses.filter((c) => c.is_published === false).length,
            },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No hay cursos que coincidan"
          description="Probá con otro texto o cambiá el filtro de modalidad."
          action={<AdminButton href="/admin/cursos/nuevo">Crear un curso</AdminButton>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Curso</Th>
              <Th>Modalidad</Th>
              <Th>Categoría</Th>
              <Th className="text-right">Precio</Th>
              <Th>Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-neutral-50">
                <Td>
                  <Link
                    href={`/admin/cursos/${c.id}`}
                    className="block max-w-md font-medium text-ink-900 hover:text-brand-600"
                  >
                    {c.title}
                  </Link>
                  <span className="mt-0.5 block font-mono text-xs text-neutral-400">{c.code}</span>
                </Td>
                <Td>
                  <Chip tone="neutral">{MODALITY_LABEL[c.modality]}</Chip>
                </Td>
                <Td className="text-neutral-600">{c.category?.name ?? "—"}</Td>
                <Td className="whitespace-nowrap text-right font-medium">
                  {parseFloat(c.price) === 0 ? "Gratis" : formatARS(c.price)}
                </Td>
                <Td>
                  <button type="button" onClick={() => togglePublished(c)} title="Cambiar estado">
                    <Chip tone={c.is_published === false ? "neutral" : "ok"}>
                      {c.is_published === false ? "Oculto" : "Publicado"}
                    </Chip>
                  </button>
                </Td>
                <Td className="whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/cursos/${c.id}`}
                      className="text-xs font-semibold text-neutral-500 transition-colors hover:text-ink-900"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => setToDelete(c)}
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
        title="Eliminar curso"
        description={
          toDelete
            ? `Se va a quitar "${toDelete.title}" del catálogo. Esta acción no se puede deshacer.`
            : undefined
        }
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      {toast}
    </>
  );
}
