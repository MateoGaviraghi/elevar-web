import Link from "next/link";
import { Card } from "@/components/ui/card";

interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
}

export function ServiceCard({ icon, title, description, href }: ServiceCardProps) {
  return (
    <Card hover className="overflow-hidden">
      <Link href={href} className="flex flex-col p-6 gap-3 h-full group">
        <img src={icon} className="h-12 w-12 object-contain" alt="" />
        <h3 className="font-display text-lg font-semibold text-ink-900">
          {title}
        </h3>
        <p className="text-sm text-neutral-700 flex-1">{description}</p>
        <span className="text-brand-500 text-sm font-semibold group-hover:underline">
          Ver más →
        </span>
      </Link>
    </Card>
  );
}
