import { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`bg-neutral-0 border border-neutral-200 rounded-md shadow-sm ${
        hover ? "transition hover:shadow-md hover:-translate-y-0.5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
