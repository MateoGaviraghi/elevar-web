import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CommunityButton, WhatsAppIcon } from "@/components/common/whatsapp";

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative inline-block text-sm text-neutral-400 transition-colors hover:text-neutral-0"
    >
      {children}
      <span className="pointer-events-none absolute -bottom-0.5 left-0 h-px w-0 bg-brand-500 transition-all duration-300 ease-out group-hover:w-full" />
    </Link>
  );
}

const IconInstagram = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const IconLinkedin = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="3" />
    <line x1="8" y1="11" x2="8" y2="17" />
    <line x1="8" y1="7" x2="8" y2="8" />
    <path d="M12 17v-4a2 2 0 014 0v4" />
    <line x1="12" y1="11" x2="12" y2="17" />
  </svg>
);

const IconFacebook = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="3" />
    <path d="M15 8h-2a2 2 0 00-2 2v2H9v3h2v5h3v-5h2l1-3h-3v-2" />
  </svg>
);

const SERVICIOS_LINKS = [
  { label: "Formación profesional", href: "/formacion" },
  { label: "Asistencia técnica", href: "/servicios/asistencia-tecnica" },
  { label: "Implementación normativa", href: "/servicios/implementacion-normativa" },
  { label: "Auditorías internas", href: "/servicios/auditorias-internas" },
  { label: "Acreditación ISO/IEC 17025", href: "/servicios/acreditacion-iso-17025" },
  { label: "Servicios de gestión", href: "/servicios/gestion" },
];

export function Footer() {
  return (
    <footer className="bg-ink-900 text-neutral-300">
      <Container className="py-14 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Col 1 — Logo + tagline */}
          <div>
            <img
              src="/assets/isologotipo.png"
              alt="Elevar"
              className="h-12 w-auto mb-4"
            />
            <p className="max-w-xs text-sm leading-relaxed text-neutral-400">
              Consultoría de calidad para laboratorios. Formación y asistencia técnica bajo ISO/IEC&nbsp;17025 en Argentina y LATAM.
            </p>
          </div>

          {/* Col 2 — Dónde estamos */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-500">
              ¿Dónde estamos?
            </h3>
            <p className="text-sm leading-relaxed text-neutral-400">
              Bolívar 393 C (E2820), Gualeguaychú, Provincia de Entre Ríos, República Argentina.
            </p>
            <a
              href="https://wa.me/5493446507779"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-sm text-neutral-400 hover:text-neutral-0 transition-colors"
            >
              (+54) 9 3446 507779
            </a>
            <a
              href="mailto:info@elevar.com.ar"
              className="mt-1.5 block text-sm text-neutral-400 hover:text-neutral-0 transition-colors"
            >
              info@elevar.com.ar
            </a>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Síganos en:
            </p>
            <div className="mt-2 flex items-center gap-4">
              <a
                href="https://instagram.com/elevarcalidad"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @elevarcalidad"
                className="text-neutral-400 hover:text-neutral-0 transition-colors"
              >
                <IconInstagram />
              </a>
              <a
                href="https://linkedin.com/company/elevarcalidad"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn Elevar Calidad"
                className="text-neutral-400 hover:text-neutral-0 transition-colors"
              >
                <IconLinkedin />
              </a>
              <a
                href="https://facebook.com/elevarcalidad"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook @elevarcalidad"
                className="text-neutral-400 hover:text-neutral-0 transition-colors"
              >
                <IconFacebook />
              </a>
            </div>
          </div>

          {/* Col 3 — Servicios */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-500">
              Servicios
            </h3>
            <ul className="space-y-2.5">
              {SERVICIOS_LINKS.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Comunidad de WhatsApp */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-500">
              Comunidad Elevar
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-neutral-400">
              Sumate a nuestra comunidad de WhatsApp y recibí novedades de cursos, promociones y
              contenido técnico sobre ISO/IEC&nbsp;17025.
            </p>
            <CommunityButton tone="dark" className="w-full sm:w-auto" />
            <p className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
              <WhatsAppIcon className="h-3.5 w-3.5" />
              Sin spam. Salís cuando quieras.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-0/10 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              © 2026 Elevar — Consultoría de Calidad para Laboratorios
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <FooterLink href="/promociones">Promociones</FooterLink>
              <FooterLink href="/formacion">Formación</FooterLink>
              <FooterLink href="/contacto">Contacto</FooterLink>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
