"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BlogBlock } from "@/lib/blog";
import { savePost, type FullPost } from "@/lib/content";
import {
  AdminButton,
  CardSection,
  Field,
  Input,
  Select,
  Textarea,
  Toggle,
} from "@/components/admin/ui";

const BLOCK_TYPES: { value: BlogBlock["type"]; label: string }[] = [
  { value: "p", label: "Párrafo" },
  { value: "h", label: "Subtítulo" },
  { value: "li", label: "Ítem de lista" },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function PostForm({ post, isNew }: { post: FullPost; isNew: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<FullPost>({ ...post });
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const originalSlug = post.slug;

  function set<K extends keyof FullPost>(key: K, value: FullPost[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key as string]: "" }));
  }

  function setTitle(value: string) {
    setForm((f) => ({ ...f, title: value, slug: slugTouched ? f.slug : slugify(value) }));
    setErrors((e) => ({ ...e, title: "" }));
  }

  function updateBlock(index: number, patch: Partial<BlogBlock>) {
    set(
      "body",
      form.body.map((b, i) => (i === index ? { ...b, ...patch } : b))
    );
  }

  function addBlock(type: BlogBlock["type"]) {
    set("body", [...form.body, { type, text: "" }]);
  }

  function moveBlock(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= form.body.length) return;
    const next = [...form.body];
    [next[index], next[target]] = [next[target], next[index]];
    set("body", next);
  }

  function removeBlock(index: number) {
    set(
      "body",
      form.body.filter((_, i) => i !== index)
    );
  }

  function submit() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Ingresá el título de la nota.";
    if (!form.slug.trim()) e.slug = "El slug no puede quedar vacío.";
    if (!form.teaser.trim()) e.teaser = "Ingresá la bajada que se ve en el listado.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) e.date = "Elegí una fecha válida.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    savePost(
      {
        ...form,
        title: form.title.trim(),
        slug: slugify(form.slug),
        body: form.body.filter((b) => b.text.trim()),
      },
      isNew ? undefined : originalSlug
    );
    router.push("/admin/blog");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-6">
        <CardSection title="Encabezado">
          <Field label="Título" error={errors.title}>
            <Input value={form.title} onChange={setTitle} error={errors.title} />
          </Field>
          <Field label="Slug" error={errors.slug} hint="Se usa en la URL de la nota.">
            <Input
              value={form.slug}
              onChange={(v) => {
                setSlugTouched(true);
                set("slug", v);
              }}
              error={errors.slug}
            />
          </Field>
          <Field label="Gancho" hint="Frase corta que se superpone a la imagen de portada.">
            <Input value={form.hook} onChange={(v) => set("hook", v)} />
          </Field>
          <Field label="Bajada" error={errors.teaser} hint="Resumen que aparece en el listado.">
            <Textarea
              value={form.teaser}
              onChange={(v) => set("teaser", v)}
              rows={3}
              error={errors.teaser}
            />
          </Field>
        </CardSection>

        <CardSection
          title="Cuerpo de la nota"
          description="Armá el contenido con párrafos, subtítulos e ítems de lista."
        >
          {form.body.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Todavía no hay contenido. Agregá el primer bloque abajo.
            </p>
          ) : (
            <div className="space-y-3">
              {form.body.map((b, i) => (
                <div key={i} className="border border-neutral-200 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="w-40">
                      <Select<BlogBlock["type"]>
                        value={b.type}
                        onChange={(v) => updateBlock(i, { type: v })}
                        options={BLOCK_TYPES}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
                      <button
                        type="button"
                        onClick={() => moveBlock(i, -1)}
                        disabled={i === 0}
                        className="px-1.5 transition-colors hover:text-ink-900 disabled:opacity-30"
                        aria-label="Mover arriba"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(i, 1)}
                        disabled={i === form.body.length - 1}
                        className="px-1.5 transition-colors hover:text-ink-900 disabled:opacity-30"
                        aria-label="Mover abajo"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(i)}
                        className="px-1.5 transition-colors hover:text-red-600"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                  <Textarea
                    value={b.text}
                    onChange={(v) => updateBlock(i, { text: v })}
                    rows={b.type === "p" ? 4 : 2}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {BLOCK_TYPES.map((t) => (
              <AdminButton key={t.value} tone="secondary" onClick={() => addBlock(t.value)}>
                + {t.label}
              </AdminButton>
            ))}
          </div>
        </CardSection>
      </div>

      <div className="space-y-6">
        <CardSection title="Publicación">
          <Toggle
            checked={form.published}
            onChange={(v) => set("published", v)}
            label="Publicada"
            description="Las notas en borrador no se listan en el sitio."
          />
          <Field label="Fecha" error={errors.date}>
            <Input
              type="date"
              value={form.date}
              onChange={(v) => set("date", v)}
              error={errors.date}
            />
          </Field>
          <Field label="Categoría">
            <Input value={form.category} onChange={(v) => set("category", v)} />
          </Field>
          <Field
            label="Imagen de portada"
            hint="Ruta dentro de /public, p. ej. /assets/blog/mi-nota.jpg"
          >
            <Input value={form.image ?? ""} onChange={(v) => set("image", v || null)} />
          </Field>
        </CardSection>

        <div className="flex flex-col gap-3">
          <AdminButton onClick={submit} className="w-full">
            {isNew ? "Crear nota" : "Guardar cambios"}
          </AdminButton>
          <AdminButton tone="secondary" href="/admin/blog" className="w-full">
            Cancelar
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
