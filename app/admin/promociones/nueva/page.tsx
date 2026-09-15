"use client";

import { useState } from "react";
import { emptyPromo } from "@/lib/content";
import { PromoForm } from "@/components/admin/promo-form";
import { PageHeader } from "@/components/admin/ui";

export default function NewPromoPage() {
  const [draft] = useState(() => emptyPromo());

  return (
    <>
      <PageHeader
        title="Nueva promoción"
        description="Definí el beneficio, el alcance y la vigencia."
        back={{ href: "/admin/promociones", label: "Promociones" }}
      />
      <PromoForm promo={draft} isNew />
    </>
  );
}
