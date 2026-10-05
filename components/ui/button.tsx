import Link from "next/link";
import { ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "link";
type Size = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  target?: string;
  rel?: string;
  arrow?: boolean;
}

// Relleno que sube al pasar el mouse (0,8 s expo.out), como los botones de Sanalys:
// una placa ::before crece desde abajo detrás del texto.
const BASE =
  "group relative isolate inline-flex items-center justify-center gap-2 overflow-hidden font-semibold tracking-wide rounded-none transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:transition-transform before:duration-[800ms] before:ease-[cubic-bezier(0.16,1,0.3,1)] hover:before:scale-y-100 motion-reduce:before:duration-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none";

const VARIANTS: Record<Exclude<Variant, "link">, string> = {
  primary: "bg-brand-500 text-neutral-0 before:bg-ink-900 active:before:bg-ink-800",
  outline: "border border-ink-900 text-ink-900 before:bg-ink-900 hover:text-neutral-0",
  ghost: "text-ink-800 before:hidden hover:text-brand-500",
};

const SIZES: Record<Size, string> = {
  sm: "h-11 px-5 text-xs",
  md: "h-12 px-7 text-sm",
  lg: "h-14 px-8 text-sm",
};

const LINK_CLASSES =
  "group inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-ink-900 transition-colors hover:text-brand-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 focus-visible:ring-offset-4";

export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  if (variant === "link") return `${LINK_CLASSES} ${className}`.trim();
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}

const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="4" y1="12" x2="19" y2="12" />
    <polyline points="13 6 19 12 13 18" />
  </svg>
);

function Inner({ variant, arrow, children }: { variant: Variant; arrow?: boolean; children: ReactNode }) {
  if (variant === "link") {
    return (
      <>
        <span className="relative">
          {children}
          <span className="pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 ease-out group-hover:scale-x-100" />
        </span>
        <ArrowIcon className="transition-transform duration-300 ease-out group-hover:translate-x-1" />
      </>
    );
  }
  return (
    <>
      {children}
      {arrow && <ArrowIcon className="transition-transform duration-300 ease-out group-hover:translate-x-1" />}
    </>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  disabled,
  type = "button",
  onClick,
  target,
  rel,
  arrow,
}: ButtonProps) {
  const classes = buttonClasses({ variant, size, className });
  const content = (
    <Inner variant={variant} arrow={arrow}>
      {children}
    </Inner>
  );

  if (href) {
    return (
      <Link href={href} className={classes} target={target} rel={rel}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  );
}
