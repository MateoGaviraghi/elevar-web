"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Modality, Promo, PromoKind, PromoScope, PromoTrigger } from "@/types";
import { CATEGORIES } from "@/lib/mock-catalog";
import { savePromo } from "@/lib/content";
import { promoBadge } from "@/lib/promos";
import {
  AdminButton,
  CardSection,
  Field,
  Input,
  Select,
  Textarea,
  Toggle,
} from "@/components/admin/ui";

const TRIGGERS: { value: PromoTrigger; label: string }[] = [
  { value: "AUTO", label: "Automática (se aplica sola)" },
  { value: "COUPON", label: "Cupón (requiere código)" },
];

const KINDS: { value: PromoKind; label: string }[] = [
  { value: "PERCENT", label: "Porcentaje (%)" },
  { value: "AMOUNT", label: "Monto fijo (ARS)" },
];

const SCOPES: { value: PromoScope; label: string }[] = [
  { value: "ALL", label: "Todos los cursos" },
  { value: "MODALITY", label: "Una modalidad" },
  { value: "CATEGORY", label: "Una categoría" },
];

const MODALITIES: { value: Modality; label: string }[] = [
  { value: "ASYNC", label: "Cursos asincrónicos" },
  { value: "LIVE", label: "Cursos online en vivo" },
  { value: "WEBINAR", label: "Webinars" },
  { value: "WORKSHOP", label: "Talleres" },
];

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export function PromoForm({ promo, isNew }: { promo: Promo; isNew: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<Promo>({ ...promo });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof Promo>(key: K, value: Promo[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key as string]: "" }));
  }

  function submit() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Ingresá un nombre para la promoción.";
    if (!form.code.trim()) e.code = "Ingresá un código identificatorio.";
    if (!form.value || form.value <= 0) e.value = "El beneficio debe ser mayor a cero.";
    if (form.kind === "PERCENT" && form.value > 100)
      e.value = "Un porcentaje no puede superar 100.";
    if (form.scope === "MODALITY" && !form.modality) e.modality = "Elegí una modalidad.";
    if (form.scope === "CATEGORY" && !form.categorySlug) e.categorySlug = "Elegí una categoría.";
    if (form.startsAt && form.endsAt && new Date(form.startsAt) > new Date(form.endsAt))
      e.endsAt = "La fecha de fin debe ser posterior al inicio.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    savePromo({
      ...form,
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      value: Number(form.value),
      modality: form.scope === "MODALITY" ? form.modality : null,
      categorySlug: form.scope === "CATEGORY" ? form.categorySlug : null,
    });
    router.push("/admin/promociones");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-6">
        <CardSection title="Datos de la promoción">
          <Field label="Nombre" error={errors.title}>
            <Input value={form.title} onChange={(v) => set("title", v)} error={errors.title} />
          </Field>
          <Field
            label="Código"
            error={errors.code}
            hint={
              form.trigger === "COUPON"
                ? "Es el código que ingresa el comprador en el carrito."
                : "Identificador interno; se muestra junto al descuento en el resumen."
            }
          >
            <Input
              value={form.code}
              onChange={(v) => set("code", v.toUpperCase())}
              error={errors.code}
            />
          </Field>
          <Field label="Descripción" hint="Texto que se ve en la página pública de promociones.">
            <Textarea value={form.description} onChange={(v) => set("description", v)} rows={3} />
          </Field>
        </CardSection>

        <CardSection title="Beneficio y condiciones">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Tipo de descuento">
              <Select<PromoKind>
                value={form.kind}
                onChange={(v) => set("kind", v)}
                options={KINDS}
              />
            </Field>
            <Field
              label={form.kind === "PERCENT" ? "Porcentaje" : "Monto (ARS)"}
              error={errors.value}
            >
              <Input
                type="number"
                min={0}
                value={form.value}
                onChange={(v) => set("value", Number(v))}
                error={errors.value}
              />
            </Field>
          </div>

          <Field label="Aplicación">
            <Select<PromoTrigger>
              value={form.trigger}
              onChange={(v) => set("trigger", v)}
              options={TRIGGERS}
            />
          </Field>

          <Field label="Alcance">
            <Select<PromoScope>
              value={form.scope}
              onChange={(v) => set("scope", v)}
              options={SCOPES}
            />
          </Field>

          {form.scope === "MODALITY" && (
            <Field label="Modalidad alcanzada" error={errors.modality}>
              <Select<Modality>
                value={(form.modality ?? "ASYNC") as Modality}
                onChange={(v) => set("modality", v)}
                options={MODALITIES}
                error={errors.modality}
              />
            </Field>
          )}

          {form.scope === "CATEGORY" && (
            <Field label="Categoría alcanzada" error={errors.categorySlug}>
              <Select
                value={form.categorySlug ?? CATEGORIES[0].slug}
                onChange={(v) => set("categorySlug", v)}
                options={CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
                error={errors.categorySlug}
              />
            </Field>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Cantidad mínima"
              hint="Inscripciones necesarias para que aplique. Vacío = sin mínimo."
            >
              <Input
                type="number"
                min={0}
                value={form.minQuantity ?? ""}
                onChange={(v) => set("minQuantity", v === "" ? null : Number(v))}
              />
            </Field>
            <Field label="Compra mínima (ARS)" hint="Vacío = sin mínimo.">
              <Input
                type="number"
                min={0}
                value={form.minAmount ?? ""}
                onChange={(v) => set("minAmount", v === "" ? null : Number(v))}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Desde" hint="Vacío = ya vigente.">
              <Input
                type="date"
                value={toDateInput(form.startsAt)}
                onChange={(v) => set("startsAt", v ? new Date(`${v}T00:00:00`).toISOString() : null)}
              />
            </Field>
            <Field label="Hasta" error={errors.endsAt} hint="Vacío = sin vencimiento.">
              <Input
                type="date"
                value={toDateInput(form.endsAt)}
                onChange={(v) => set("endsAt", v ? new Date(`${v}T23:59:59`).toISOString() : null)}
                error={errors.endsAt}
              />
            </Field>
          </div>
        </CardSection>
      </div>

      <div className="space-y-6">
        <CardSection title="Publicación">
          <Toggle
            checked={form.active}
            onChange={(v) => set("active", v)}
            label="Promoción activa"
            description="Si la apagás, deja de aplicarse en el carrito."
          />
          <Toggle
            checked={form.featured}
            onChange={(v) => set("featured", v)}
            label="Destacada"
            description="Se muestra en la ficha de los cursos alcanzados."
          />
        </CardSection>

        <CardSection title="Vista previa">
          <div className="border border-neutral-200">
            <div className="bg-ink-900 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-300">
                {form.trigger === "COUPON" ? "Cupón" : "Descuento automático"}
              </p>
              <p className="mt-1.5 font-display text-3xl font-semibold text-neutral-0">
                {promoBadge(form)}
              </p>
            </div>
            <div className="p-5">
              <p className="font-display text-sm font-semibold text-ink-900">
                {form.title || "Nombre de la promoción"}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                {form.description || "Descripción que verá el visitante."}
              </p>
            </div>
          </div>
        </CardSection>

        <div className="flex flex-col gap-3">
          <AdminButton onClick={submit} className="w-full">
            {isNew ? "Crear promoción" : "Guardar cambios"}
          </AdminButton>
          <AdminButton tone="secondary" href="/admin/promociones" className="w-full">
            Cancelar
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
