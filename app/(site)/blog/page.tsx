import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";
import { BLOG_POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Elevar",
  description:
    "Cápsulas informativas sobre calidad de laboratorios, ISO/IEC 17025, incertidumbre, auditorías y no conformidades.",
};

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-ink-900 text-neutral-0">
        <Container className="py-16 md:py-20">
          <Reveal>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-brand-500" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Blog
              </span>
            </div>
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              Cápsulas informativas
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
              Notas breves sobre calidad, metrología y la norma ISO/IEC 17025 para el
              día a día del laboratorio.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Grilla de notas */}
      <section className="bg-neutral-0 py-16 md:py-24">
        <Container>
          <Reveal
            as="div"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            stagger={0.06}
          >
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden border border-neutral-200 bg-neutral-0 transition-all duration-300 hover:-translate-y-1 hover:border-ink-900 hover:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
                  <img
                    src={`/assets/blog/${post.slug}.jpg`}
                    alt={post.hook}
                    className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-display text-lg font-semibold leading-snug tracking-tight text-ink-900 transition-colors group-hover:text-brand-600">
                    {post.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600 line-clamp-2">
                    {post.teaser}
                  </p>
                  <span className="mt-5 text-sm font-semibold text-brand-600 transition-colors group-hover:text-brand-700">
                    [ Leer más ]
                  </span>
                </div>
              </Link>
            ))}
          </Reveal>
        </Container>
      </section>
    </>
  );
}
