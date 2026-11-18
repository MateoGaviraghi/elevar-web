import { EscenarioIngreso } from "@/components/admin/ingreso-escenario";

/** Las tres pantallas de ingreso comparten el escenario: no se vuelve a armar al pasar de la
 * contraseña al código, solo cambia la tarjeta de adentro. */
export default function IngresoLayout({ children }: { children: React.ReactNode }) {
  return <EscenarioIngreso>{children}</EscenarioIngreso>;
}
