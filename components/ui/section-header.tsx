import { Button } from "@/components/ui/button";

interface SectionHeaderAction {
  label: string;
  href: string;
}

export interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  lead?: string;
  dark?: boolean;
  align?: "left" | "center";
  action?: SectionHeaderAction;
}

export function SectionHeader({
  eyebrow,
  title,
  lead,
  dark = false,
  align = "left",
  action,
}: SectionHeaderProps) {
  const isCentered = align === "center";

  return (
    <div className={isCentered ? "text-center" : ""}>
      <div
        className={`flex items-center gap-3 mb-5 ${
          isCentered ? "justify-center" : ""
        }`}
      >
        <span className="h-px w-8 bg-brand-500 shrink-0" />
        <span
          className={`text-xs uppercase tracking-widest ${
            dark ? "text-neutral-400" : "text-neutral-500"
          }`}
        >
          {eyebrow}
        </span>
      </div>

      <div
        className={`flex flex-col ${
          action && !isCentered
            ? "md:flex-row md:items-end md:justify-between md:gap-8"
            : ""
        }`}
      >
        <div>
          <h2
            className={`font-display text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl ${
              dark ? "text-neutral-0" : "text-ink-900"
            } ${isCentered ? "mx-auto" : ""}`}
          >
            {title}
          </h2>

          {lead && (
            <p
              className={`mt-4 max-w-xl ${
                dark ? "text-neutral-300" : "text-neutral-700"
              } ${isCentered ? "mx-auto" : ""}`}
            >
              {lead}
            </p>
          )}
        </div>

        {action && (
          <div className={`mt-5 md:mt-0 shrink-0 ${isCentered ? "mt-6 flex justify-center" : ""}`}>
            <Button
              variant="link"
              href={action.href}
              className={dark ? "text-neutral-0 hover:text-brand-400" : ""}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
