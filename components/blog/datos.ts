// Datos de la lista del blog (/blog): fecha, minutos de lectura y foto de cada cápsula.
import { BLOG_POSTS, type BlogPost } from "@/lib/blog";
import { BLOG_CONTENT } from "@/lib/blog-content";
import { formatBlogDate } from "@/lib/blog-date";

export interface Capsula extends BlogPost {
  href: string;
  fecha: string;
  minutos: number;
  /** Foto de Unsplash (licencia Unsplash, sin caras), en `public/assets/blog/fotos/`. */
  foto: string;
}

/** Minutos de lectura según el largo real de la nota (200 palabras por minuto). */
function minutos(slug: string): number {
  const palabras = (BLOG_CONTENT[slug] ?? [])
    .map((b) => b.text)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 200));
}

export const CAPSULAS: Capsula[] = [...BLOG_POSTS]
  .sort((a, b) => (a.date < b.date ? 1 : -1))
  .map((p) => ({
    ...p,
    href: `/blog/${p.slug}`,
    fecha: formatBlogDate(p.date),
    minutos: minutos(p.slug),
    foto: `/assets/blog/fotos/${p.slug}.webp`,
  }));
