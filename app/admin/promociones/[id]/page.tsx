"use client";

import { useEffect, useState } from "react";
import type { Promo } from "@/types";
import { getPromo } from "@/lib/content";
import { PromoForm } from "@/components/admin/promo-form";
import { AdminButton, EmptyState, PageHeader } from "@/components/admin/ui";

export default function EditPromoPage({ params }: { params: { id: string } }) {
  const [promo, setPromo] = useState<Promo | null | undefined>(undefined);

  useEffect(() => {
    setPromo(getPromo(params.id) ?? null);
  }, [params.id]);

  if (promo === undefined) {
    return <p className="text-sm text-neutral-500">Cargando promoción…</p>;
  }

  if (promo === null) {
    return (
      <>
        <PageHeader
          title="Promoción no encontrada"
          back={{ href: "/admin/promociones", label: "Promociones" }}
        />
        <EmptyState
          title="No encontramos esta promoción"
          action={<AdminButton href="/admin/promociones">Volver al listado</AdminButton>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={promo.title}
        description={`Código ${promo.code}`}
        back={{ href: "/admin/promociones", label: "Promociones" }}
      />
      <PromoForm promo={promo} isNew={false} />
    </>
  );
}
