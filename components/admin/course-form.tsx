"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Course, CourseSession, Modality, SessionStatus } from "@/types";
import { CATEGORIES } from "@/lib/mock-catalog";
import { saveCourse } from "@/lib/content";
import {
  AdminButton,
  CardSection,
  Field,
  Input,
  Select,
  Textarea,
  Toggle,
} from "@/components/admin/ui";

const MODALITIES: { value: Modality; label: string }[] = [
  { value: "ASYNC", label: "Curso asincrónico" },
  { value: "LIVE", label: "Curso online en vivo" },
  { value: "WEBINAR", label: "Webinar gratuito" },
  { value: "WORKSHOP", label: "Taller" },
];

const LEVELS = ["Introductorio", "Intermedio", "Avanzado"].map((l) => ({ value: l, label: l }));

const BADGES: { value: string; label: string }[] = [
  { value: "", label: "Sin distintivo" },
  { value: "NUEVO", label: "Nuevo" },
  { value: "PROXIMO", label: "Próximo" },
];

const SESSION_STATUS: { value: SessionStatus; label: string }[] = [
  { value: "SCHEDULED", label: "Programada" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "FINISHED", label: "Finalizada" },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** "2026-06-17T15:25" ↔ ISO, para los inputs datetime-local. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CourseForm({ course, isNew }: { course: Course; isNew: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<Course>({ ...course });
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const sessionBased = form.modality === "LIVE" || form.modality === "WEBINAR";

  function set<K extends keyof Course>(key: K, value: Course[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key as string]: "" }));
  }

  function setTitle(value: string) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
    setErrors((e) => ({ ...e, title: "" }));
  }

  function updateSession(index: number, patch: Partial<CourseSession>) {
    set(
      "sessions",
      form.sessions.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  }

  function addSession() {
    const nextId = form.sessions.reduce((max, s) => Math.max(max, s.id), 0) + 1;
    const start = new Date();
    start.setDate(start.getDate() + 14);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    set("sessions", [
      ...form.sessions,
      {
        id: nextId,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        timezone: "America/Argentina/Cordoba",
        capacity: 30,
        seats_available: 30,
        status: "SCHEDULED",
      },
    ]);
  }

  function removeSession(index: number) {
    set(
      "sessions",
      form.sessions.filter((_, i) => i !== index)
    );
  }

  function submit() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Ingresá el título del curso.";
    if (!form.code.trim()) e.code = "Ingresá el código (p. ej. CA17).";
    if (!form.slug.trim()) e.slug = "El slug no puede quedar vacío.";
    if (Number.isNaN(parseFloat(form.price))) e.price = "Ingresá un precio válido.";
    if (sessionBased && form.sessions.length === 0)
      e.sessions = "Esta modalidad necesita al menos una fecha.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    saveCourse({
      ...form,
      title: form.title.trim(),
      code: form.code.trim().toUpperCase(),
      slug: slugify(form.slug),
      price: parseFloat(form.price).toFixed(2),
      badge: form.badge || null,
      duration_hours:
        form.duration_hours == null || Number.isNaN(form.duration_hours)
          ? null
          : Number(form.duration_hours),
    });
    router.push("/admin/cursos");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-6">
        <CardSection title="Contenido">
          <Field label="Título" error={errors.title}>
            <Input value={form.title} onChange={setTitle} error={errors.title} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Código" error={errors.code} hint="Identificador interno, p. ej. CA17.">
              <Input value={form.code} onChange={(v) => set("code", v)} error={errors.code} />
            </Field>
            <Field
              label="Slug"
              error={errors.slug}
              hint="Se usa en la URL del curso."
            >
              <Input
                value={form.slug}
                onChange={(v) => {
                  setSlugTouched(true);
                  set("slug", v);
                }}
                error={errors.slug}
              />
            </Field>
          </div>

          <Field label="Resumen" hint="Aparece en las tarjetas del catálogo y en el hero del curso.">
            <Textarea value={form.summary} onChange={(v) => set("summary", v)} rows={3} />
          </Field>

          <Field label="Descripción" hint="Separá los párrafos con una línea en blanco.">
            <Textarea
              value={form.description ?? ""}
              onChange={(v) => set("description", v)}
              rows={8}
            />
          </Field>
        </CardSection>

        {sessionBased && (
          <CardSection
            title="Fechas y cupos"
            description="Los cursos en vivo y los webinars se venden contra una fecha."
          >
            {errors.sessions && (
              <p className="border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                {errors.sessions}
              </p>
            )}

            {form.sessions.length === 0 ? (
              <p className="text-sm text-neutral-500">Todavía no cargaste fechas.</p>
            ) : (
              <div className="space-y-4">
                {form.sessions.map((s, i) => (
                  <div key={s.id} className="border border-neutral-200 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Inicio">
                        <Input
                          type="datetime-local"
                          value={toLocalInput(s.starts_at)}
                          onChange={(v) =>
                            updateSession(i, { starts_at: new Date(v).toISOString() })
                          }
                        />
                      </Field>
                      <Field label="Fin">
                        <Input
                          type="datetime-local"
                          value={toLocalInput(s.ends_at)}
                          onChange={(v) => updateSession(i, { ends_at: new Date(v).toISOString() })}
                        />
                      </Field>
                      <Field label="Cupo total">
                        <Input
                          type="number"
                          min={0}
                          value={s.capacity ?? ""}
                          onChange={(v) =>
                            updateSession(i, { capacity: v === "" ? null : Number(v) })
                          }
                        />
                      </Field>
                      <Field label="Cupos disponibles">
                        <Input
                          type="number"
                          min={0}
                          value={s.seats_available ?? ""}
                          onChange={(v) =>
                            updateSession(i, { seats_available: v === "" ? null : Number(v) })
                          }
                        />
                      </Field>
                      <Field label="Estado">
                        <Select<SessionStatus>
                          value={s.status}
                          onChange={(v) => updateSession(i, { status: v })}
                          options={SESSION_STATUS}
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSession(i)}
                      className="mt-3 text-xs font-semibold text-neutral-400 transition-colors hover:text-red-600"
                    >
                      Quitar fecha
                    </button>
                  </div>
                ))}
              </div>
            )}

            <AdminButton tone="secondary" onClick={addSession}>
              Agregar fecha
            </AdminButton>
          </CardSection>
        )}
      </div>

      {/* Columna lateral */}
      <div className="space-y-6">
        <CardSection title="Publicación">
          <Toggle
            checked={form.is_published !== false}
            onChange={(v) => set("is_published", v)}
            label="Publicado en el sitio"
            description="Si lo apagás, el curso deja de listarse y de venderse."
          />
          <Toggle
            checked={form.is_featured}
            onChange={(v) => set("is_featured", v)}
            label="Destacado"
            description="Aparece en la home y en las secciones destacadas."
          />
          <Field label="Distintivo">
            <Select
              value={form.badge ?? ""}
              onChange={(v) => set("badge", v || null)}
              options={BADGES}
            />
          </Field>
        </CardSection>

        <CardSection title="Clasificación">
          <Field label="Modalidad">
            <Select<Modality>
              value={form.modality}
              onChange={(v) => set("modality", v)}
              options={MODALITIES}
            />
          </Field>
          <Field label="Categoría">
            <Select
              value={String(form.category?.id ?? CATEGORIES[0].id)}
              onChange={(v) => {
                const cat = CATEGORIES.find((c) => String(c.id) === v);
                if (cat) set("category", cat);
              }}
              options={CATEGORIES.map((c) => ({ value: String(c.id), label: c.name }))}
            />
          </Field>
          <Field label="Nivel">
            <Select value={form.level} onChange={(v) => set("level", v)} options={LEVELS} />
          </Field>
          <Field label="Disertante">
            <Input
              value={form.instructor_names}
              onChange={(v) => set("instructor_names", v)}
            />
          </Field>
          <Field label="Duración (horas)">
            <Input
              type="number"
              min={0}
              value={form.duration_hours ?? ""}
              onChange={(v) => set("duration_hours", v === "" ? null : Number(v))}
            />
          </Field>
        </CardSection>

        <CardSection title="Precio">
          <Field
            label="Precio (ARS)"
            error={errors.price}
            hint="Poné 0 para inscripciones gratuitas (webinars)."
          >
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(v) => set("price", v)}
              error={errors.price}
            />
          </Field>
        </CardSection>

        <div className="flex flex-col gap-3">
          <AdminButton onClick={submit} disabled={saving} className="w-full">
            {saving ? "Guardando…" : isNew ? "Crear curso" : "Guardar cambios"}
          </AdminButton>
          <AdminButton tone="secondary" href="/admin/cursos" className="w-full">
            Cancelar
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
