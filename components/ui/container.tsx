import { ElementType, ReactNode } from "react";

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export function Container({ children, className = "", as: Tag = "div" }: ContainerProps) {
  return (
    <Tag className={`mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </Tag>
  );
}
