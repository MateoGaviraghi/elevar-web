/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: `output: "export"` queda diferido a Fase 1 (deploy estático). En `next dev`
  // bloquea el render on-demand de rutas dinámicas (/formacion/[modality], /cursos/[slug],
  // /orden/[public_id]). El mockup de Fase 0 corre sobre `next dev`, sin SEO ni deploy aún.
  // Fase 1: re-agregar output:"export" + generateStaticParams en [slug]/[modality] +
  // rewrite/query-param para la orden.
  images: { unoptimized: true },
};
export default nextConfig;
