/* Aviso corto debajo de cada formulario (KAN-41; Ley 25.326 art. 6, Res. AAIP 14/2018): para qué
 * se usan los datos, quién los recibe y dónde está el detalle. `tono="oscuro"` sobre fondo oscuro. */

import Link from "next/link";
import { pegar } from "@/lib/texto";

export function AvisoDatos({ para, tono = "claro", className = "" }: { para: string; tono?: "claro" | "oscuro"; className?: string }) {
  const dark = tono === "oscuro";
  return (
    <p className={`text-xs leading-relaxed ${dark ? "text-neutral-0/60" : "text-neutral-600"} ${className}`}>
      {pegar(`Tus datos los guarda ELEVAR y los usa solo para ${para}. Podés pedir verlos, corregirlos o borrarlos cuando quieras.`)}{" "}
      <Link
        href="/privacidad"
        className={`font-semibold underline underline-offset-2 transition-colors ${dark ? "text-neutral-0/85 hover:text-neutral-0" : "text-ink-900 hover:text-brand-600"}`}
      >
        Política de privacidad
      </Link>
    </p>
  );
}
