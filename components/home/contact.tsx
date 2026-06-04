"use client";

import { useState, FormEvent } from "react";
import { Container } from "@/components/ui/container";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Reveal } from "@/components/anim/reveal";
import { createLead, ApiError } from "@/lib/api";

interface FormState {
  name: string;
  email: string;
  company: string;
  phone: string;
  subject: string;
  message: string;
}

const EMPTY: FormState = {
  name: "",
  email: "",
  company: "",
  phone: "",
  subject: "",
  message: "",
};

const IconPin = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mt-0.5 text-brand-500 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const IconPhone = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mt-0.5 text-brand-500 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const IconMail = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mt-0.5 text-brand-500 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
);

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

export function ContactSection({ showHeading = true }: { showHeading?: boolean }) {
  const [fields, setFields] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setFieldErrors({});

    try {
      await createLead({
        name: fields.name,
        email: fields.email,
        subject: fields.subject,
        message: fields.message,
        company: fields.company || undefined,
        phone: fields.phone || undefined,
      });
      setSuccess(true);
      setFields(EMPTY);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          const mapped: Partial<FormState> = {};
          for (const [k, msgs] of Object.entries(err.fieldErrors)) {
            const key = k as keyof FormState;
            mapped[key] = msgs[0];
          }
          setFieldErrors(mapped);
        } else {
          setErrorMsg(err.message);
        }
      } else {
        setErrorMsg("Ocurrió un error inesperado. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-neutral-50 py-20 md:py-28">
      <Container>
        {showHeading && (
          <Reveal>
            <div className="mb-12 text-center">
              <div className="mb-4 flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-brand-500" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                  Contacto
                </span>
                <span className="h-px w-8 bg-brand-500" aria-hidden />
              </div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl">
                ¿Tiene alguna consulta?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-neutral-600">
                Dejanos tu consulta y te respondemos a la brevedad.
              </p>
            </div>
          </Reveal>
        )}

        <Reveal as="div" className={showHeading ? "" : ""}>
          <div className="grid overflow-hidden border border-neutral-200 bg-neutral-0 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] lg:grid-cols-[0.82fr_1.18fr]">
            {/* Panel de info (oscuro, branded) */}
            <div className="relative overflow-hidden bg-ink-900 p-8 text-neutral-0 md:p-10">
              <span
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl"
                aria-hidden
              />

              <div className="relative">
                <h3 className="font-display text-2xl font-semibold tracking-tight">Hablemos</h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-300">
                  Estamos en Gualeguaychú y trabajamos con laboratorios de toda América Latina.
                </p>

                <ul className="mt-8 space-y-5">
                  <li className="flex items-start gap-4">
                    <IconPin />
                    <span className="text-sm leading-relaxed text-neutral-300">
                      Bolívar 393 C (E2820), Gualeguaychú, Entre Ríos, Argentina.
                    </span>
                  </li>
                  <li className="flex items-start gap-4">
                    <IconPhone />
                    <a
                      href="https://wa.me/5493446507779"
                      className="text-sm text-neutral-300 transition-colors hover:text-neutral-0"
                    >
                      (+54) 9 3446 507779
                    </a>
                  </li>
                  <li className="flex items-start gap-4">
                    <IconMail />
                    <a
                      href="mailto:info@elevar.com.ar"
                      className="text-sm text-neutral-300 transition-colors hover:text-neutral-0"
                    >
                      info@elevar.com.ar
                    </a>
                  </li>
                </ul>

                <div className="mt-10">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Seguinos
                  </p>
                  <div className="flex items-center gap-3">
                    {[
                      { href: "https://instagram.com/elevarcalidad", label: "Instagram", Icon: IconInstagram },
                      { href: "https://linkedin.com/company/elevarcalidad", label: "LinkedIn", Icon: IconLinkedin },
                      { href: "https://facebook.com/elevarcalidad", label: "Facebook", Icon: IconFacebook },
                    ].map(({ href, label, Icon }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="grid h-10 w-10 place-items-center border border-neutral-0/15 text-neutral-300 transition-colors hover:border-brand-500 hover:text-brand-500"
                      >
                        <Icon />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario (claro) */}
            <div className="p-8 md:p-10">
              {success && (
                <AlertBanner variant="success" className="mb-6">
                  ¡Mensaje enviado! Te respondemos a la brevedad.
                </AlertBanner>
              )}
              {errorMsg && (
                <AlertBanner variant="error" className="mb-6">
                  {errorMsg}
                </AlertBanner>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Nombre y apellido"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={fields.name}
                    onChange={set("name")}
                    error={fieldErrors.name}
                  />
                  <FormField
                    label="Empresa (opcional)"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    value={fields.company}
                    onChange={set("company")}
                    error={fieldErrors.company}
                  />
                  <FormField
                    label="Correo electrónico"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={fields.email}
                    onChange={set("email")}
                    error={fieldErrors.email}
                  />
                  <FormField
                    label="Teléfono (opcional)"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={fields.phone}
                    onChange={set("phone")}
                    error={fieldErrors.phone}
                  />
                </div>
                <FormField
                  label="Asunto"
                  name="subject"
                  type="text"
                  required
                  value={fields.subject}
                  onChange={set("subject")}
                  error={fieldErrors.subject}
                />
                <FormField
                  as="textarea"
                  label="Mensaje"
                  name="message"
                  required
                  rows={4}
                  value={fields.message}
                  onChange={set("message")}
                  error={fieldErrors.message}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Enviando…" : "Enviar consulta"}
                </Button>
              </form>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
