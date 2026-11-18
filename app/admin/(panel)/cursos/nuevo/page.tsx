"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CURSO_VACIO, CursoFormulario } from "@/components/admin/curso-formulario";
import { EstadoNoListo, Titulo, useDatos } from "@/components/admin/datos";
import { panel } from "@/lib/admin/api";

export default function NuevoCursoPage() {
  const router = useRouter();
  const categorias = useDatos(() => panel.categorias(), []);
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link href="/admin/cursos" className="text-sm text-neutral-700 hover:text-ink-900">← Cursos</Link>
      <Titulo bajada="Se crea sin publicar: revisalo y publicalo cuando esté listo.">Nuevo curso</Titulo>
      {categorias.estado.tipo !== "listo" ? (
        <EstadoNoListo estado={categorias.estado} recargar={categorias.recargar} />
      ) : (
        <CursoFormulario
          inicial={CURSO_VACIO}
          categorias={categorias.estado.datos}
          textoBoton="Crear curso"
          onGuardar={async (datos) => {
            const curso = await panel.crearCurso(datos);
            router.push(`/admin/cursos/${curso.id}`);
          }}
        />
      )}
    </div>
  );
}
