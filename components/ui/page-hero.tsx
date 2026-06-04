import { Container } from "./container";
import { Breadcrumb, BreadcrumbItem } from "./breadcrumb";

export interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function PageHero({ eyebrow, title, subtitle, breadcrumbs, className = "" }: PageHeroProps) {
  return (
    <section className={`bg-neutral-0 py-12 md:py-16 ${className}`}>
      <Container>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb items={breadcrumbs} className="mb-4" />
        )}
        {eyebrow && (
          <p className="text-xs font-semibold tracking-widest uppercase text-brand-500 mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-900 mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-neutral-700 max-w-2xl">{subtitle}</p>
        )}
      </Container>
    </section>
  );
}
