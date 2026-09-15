"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deletePost, listPosts, savePost, type FullPost } from "@/lib/content";
import { resetCollection } from "@/lib/local-db";
import { formatBlogDate } from "@/lib/blog-date";
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

type Filter = "ALL" | "PUBLISHED" | "DRAFT";

export default function AdminBlogPage() {
  const { rows: posts, refresh } = useCollection(listPosts);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [toDelete, setToDelete] = useState<FullPost | null>(null);
  const { toast, showToast } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => {
        if (filter === "PUBLISHED" && !p.published) return false;
        if (filter === "DRAFT" && p.published) return false;
        if (!q) return true;
        return p.title.toLowerCase().includes(q) || p.teaser.toLowerCase().includes(q);
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [posts, query, filter]);

  function togglePublished(post: FullPost) {
    savePost({ ...post, published: !post.published });
    refresh();
    showToast(post.published ? "Nota pasada a borrador." : "Nota publicada.");
  }

  function confirmDelete() {
    if (!toDelete) return;
    deletePost(toDelete.slug);
    setToDelete(null);
    refresh();
    showToast("Nota eliminada.");
  }

  return (
    <>
      <PageHeader
        title="Blog"
        description="Cápsulas informativas publicadas en el sitio."
        actions={
          <>
            <AdminButton
              tone="ghost"
              onClick={() => {
                resetCollection("posts");
                showToast("Notas restablecidas.");
              }}
            >
              Restablecer
            </AdminButton>
            <AdminButton href="/admin/blog/nueva">Nueva nota</AdminButton>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por título o bajada…" />
        <FilterTabs<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ALL", label: "Todas", count: posts.length },
            {
              value: "PUBLISHED",
              label: "Publicadas",
              count: posts.filter((p) => p.published).length,
            },
            {
              value: "DRAFT",
              label: "Borradores",
              count: posts.filter((p) => !p.published).length,
            },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No hay notas que coincidan"
          action={<AdminButton href="/admin/blog/nueva">Escribir una nota</AdminButton>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nota</Th>
              <Th>Categoría</Th>
              <Th>Fecha</Th>
              <Th>Bloques</Th>
              <Th>Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.slug} className="transition-colors hover:bg-neutral-50">
                <Td>
                  <Link
                    href={`/admin/blog/${p.slug}`}
                    className="block max-w-md font-medium text-ink-900 hover:text-brand-600"
                  >
                    {p.title}
                  </Link>
                  <span className="mt-0.5 block text-xs text-neutral-400">{p.slug}</span>
                </Td>
                <Td className="text-neutral-600">{p.category}</Td>
                <Td className="whitespace-nowrap text-neutral-500">{formatBlogDate(p.date)}</Td>
                <Td className="text-neutral-500">{p.body.length}</Td>
                <Td>
                  <button type="button" onClick={() => togglePublished(p)} title="Cambiar estado">
                    <Chip tone={p.published ? "ok" : "neutral"}>
                      {p.published ? "Publicada" : "Borrador"}
                    </Chip>
                  </button>
                </Td>
                <Td className="whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/blog/${p.slug}`}
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
        title="Eliminar nota"
        description={toDelete ? `Se va a eliminar "${toDelete.title}".` : undefined}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
      {toast}
    </>
  );
}
