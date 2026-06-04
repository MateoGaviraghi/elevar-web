import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/anim/reveal";
import { buttonClasses } from "@/components/ui/button";
import { BLOG_POSTS, getPostBySlug, type BlogBlock } from "@/lib/blog";
import { getBlogContent } from "@/lib/blog-content";
import { formatBlogDate } from "@/lib/blog-date";

function ArticleBody({ blocks }: { blocks: BlogBlock[] }) {
  const out: React.ReactNode[] = [];
  let li: string[] = [];
  let k = 0;
  const flush = () => {
    if (li.length) {
      const items = li;
      out.push(
        <ul key={`ul-${k++}`} className="list-disc space-y-2 pl-6 text-ink-700">
          {items.map((t, i) => (
            <li key={i} className="leading-relaxed">
              {t}
            </li>
          ))}
        </ul>
      );
      li = [];
    }
  };
  for (const b of blocks) {
    if (b.type === "li") {
      li.push(b.text);
      continue;
    }
    flush();
    if (b.type === "h") {
      out.push(
        <h2 key={`h-${k++}`} className="pt-4 font-display text-xl font-semibold tracking-tight text-ink-900">
          {b.text}
        </h2>
      );
    } else {
      out.push(
        <p key={`p-${k++}`} className="leading-relaxed text-ink-700">
          {b.text}
        </p>
      );
    }
  }
  flush();
  return <div className="space-y-5 text-[15px]">{out}</div>;
}

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Nota no encontrada — Elevar" };
  return { title: `${post.title} — Blog Elevar`, description: post.teaser };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();
  const content = getBlogContent(post.slug);

  return (
    <article className="bg-neutral-0">
      {/* Hero prolijo: solo info, sin la foto del post */}
      <header className="bg-ink-900 text-neutral-0">
        <Container className="max-w-3xl py-14 md:py-20">
          <Reveal>
            <nav className="mb-8 flex items-center gap-2 text-xs text-neutral-400" aria-label="Migas de pan">
              <Link href="/blog" className="transition-colors hover:text-neutral-0">
                Blog
              </Link>
              <span aria-hidden>/</span>
              <span className="text-neutral-300">{post.category}</span>
            </nav>

            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-brand-500" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-400">
                {post.category}
              </span>
              <span className="h-1 w-1 rounded-full bg-neutral-600" aria-hidden />
              <span className="text-xs text-neutral-400">{formatBlogDate(post.date)}</span>
            </div>

            <h1 className="font-display text-3xl font-semibold leading-[1.12] tracking-tight md:text-[2.6rem]">
              {post.title}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
              {post.teaser}
            </p>
          </Reveal>
        </Container>
      </header>

      {/* Cuerpo real de la nota (extraído del sitio) */}
      <Container className="max-w-2xl py-14 md:py-20">
        <Reveal as="div">
          {content.length > 0 ? (
            <ArticleBody blocks={content} />
          ) : (
            <div className="border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
              <p className="text-sm leading-relaxed text-neutral-600">
                Estamos preparando el contenido completo de esta nota. Muy pronto vas a
                poder leerla acá.
              </p>
            </div>
          )}

          <div className="mt-12 flex flex-wrap gap-4 border-t border-neutral-200 pt-8">
            <Link href="/blog" className={buttonClasses({ variant: "outline", size: "md" })}>
              Volver al blog
            </Link>
            <Link href="/contacto" className={buttonClasses({ variant: "link" })}>
              ¿Tenés una consulta?
            </Link>
          </div>
        </Reveal>
      </Container>
    </article>
  );
}
