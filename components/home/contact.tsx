"use client";

import { useRef, useState, FormEvent } from "react";
import { Container } from "@/components/ui/container";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Reveal } from "@/components/anim/reveal";
import { gsap, prefersReducedMotion, START, useGSAP } from "@/lib/gsap";
import { ChannelGroup, ChannelIcon, ChannelRow } from "@/components/common/channel-link";
import { CONTACT_CHANNELS, SOCIAL_CHANNELS } from "@/lib/contact";
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

  const stage = useRef<HTMLDivElement>(null);

  // Entrada en 3D: la tarjeta llega inclinada hacia atrás y se endereza; el panel
  // aterriza sobre el formulario 0,12 s después y la sombra crece al asentarse.
  useGSAP(
    () => {
      const el = stage.current!;
      if (prefersReducedMotion()) {
        gsap.set(el, { visibility: "inherit" });
        return;
      }
      const mobile = window.matchMedia("(max-width: 1023px)").matches;
      gsap.set(el, { visibility: "inherit" });
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: START, once: true } })
        .fromTo(
          ".ct-card",
          { rotateX: mobile ? 8 : 12, y: 80, scale: 0.94, autoAlpha: 0, transformOrigin: "50% 100%" },
          { rotateX: 0, y: 0, scale: 1, autoAlpha: 1, duration: 1.4, ease: "expo.out", clearProps: "transform" }
        )
        .fromTo(
          ".ct-panel",
          { y: -28, scale: 1.03, autoAlpha: 0 },
          { y: 0, scale: 1, autoAlpha: 1, duration: 1.2, ease: "expo.out", clearProps: "transform" },
          0.12
        )
        .fromTo(".ct-shadow", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: "power2.out" }, 0.2);
    },
    { scope: stage }
  );

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
    <section className="bg-neutral-50 py-14 sm:py-20 md:py-28">
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

        {/* Tarjeta en dos piezas: el panel oscuro se apoya sobre el formulario
            (sobresale 24 px arriba y abajo en escritorio, 16 px sobre él en el
            teléfono) y la tarjeta entra en 3D al llegar con el scroll. */}
        <div ref={stage} data-reveal="" className="[perspective:1600px]">
          <div className="ct-card relative isolate grid lg:grid-cols-[0.82fr_1.18fr]">
            {/* Panel de info (oscuro, branded) */}
            <div className="ct-panel relative z-10 overflow-hidden bg-ink-900 p-6 text-neutral-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_40px_-16px_rgba(11,30,51,0.55)] sm:p-8 md:p-10 lg:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),24px_0_48px_-16px_rgba(11,30,51,0.45),0_48px_96px_-24px_rgba(11,30,51,0.45)]">
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

                <ChannelGroup className="mt-8 space-y-4">
                  {CONTACT_CHANNELS.map((c) => (
                    <ChannelRow key={c.brand} channel={c} />
                  ))}
                </ChannelGroup>

                <div className="mt-10">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Seguinos
                  </p>
                  <ChannelGroup className="flex items-center gap-3">
                    {SOCIAL_CHANNELS.map((c) => (
                      <ChannelIcon key={c.brand} channel={c} />
                    ))}
                  </ChannelGroup>
                </div>
              </div>
            </div>

            {/* Formulario (claro): la pieza de base, con borde, filo de luz y sombra en tres capas */}
            <div className="relative mx-3 -mt-4 border border-neutral-200 bg-neutral-0 p-6 pt-10 shadow-[inset_0_1px_0_rgba(255,255,255,1)] sm:p-8 sm:pt-12 md:p-10 md:pt-14 lg:mx-0 lg:my-6 lg:mt-6 lg:border-l-0 lg:p-10">
              <span
                aria-hidden
                className="ct-shadow pointer-events-none absolute inset-0 -z-10 shadow-[0_1px_2px_rgba(11,30,51,0.06),0_12px_24px_-8px_rgba(11,30,51,0.12),0_48px_96px_-24px_rgba(11,30,51,0.28)]"
              />
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
        </div>
      </Container>
    </section>
  );
}
