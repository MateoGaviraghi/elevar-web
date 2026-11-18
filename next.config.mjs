/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: `output: "export"` queda diferido a Fase 1 (deploy estático). En `next dev`
  // bloquea el render on-demand de rutas dinámicas (/formacion/[modality], /cursos/[slug],
  // /orden/[public_id]). El mockup de Fase 0 corre sobre `next dev`, sin SEO ni deploy aún.
  // Fase 1: re-agregar output:"export" + generateStaticParams en [slug]/[modality] +
  // rewrite/query-param para la orden.
  images: { unoptimized: true },
  // Talleres se quitó (KAN-30, 2026-11-04). En elevar.com.ar el link "E-Books" apunta a
  // /formacion/talleres, así que esa dirección lleva a E-Books.
  // Panel (docs/sistema-interno/07-SEGURIDAD.md §9): sin marcos, sin caché y sin permisos del
  // navegador que no usa. La política de contenido (CSP) está pendiente (10-PENDIENTES #16).
  async headers() {
    const panel = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
      { key: "Cache-Control", value: "no-store" },
      { key: "Referrer-Policy", value: "same-origin" },
    ];
    return [
      { source: "/admin", headers: panel },
      { source: "/admin/:ruta*", headers: panel },
      { source: "/api/panel/:ruta*", headers: panel },
    ];
  },
  async redirects() {
    return [{ source: "/formacion/talleres", destination: "/formacion/e-books", permanent: true }];
  },
};
export default nextConfig;
