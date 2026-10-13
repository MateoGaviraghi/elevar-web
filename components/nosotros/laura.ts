// Datos de la sección "Dirección" de /nosotros: Laura Delissi (reemplaza "El equipo"
// por pedido de ella). Fuente: su CV (`public/docs/cv-laura-delissi.pdf`) y elevar.com.ar/nosotros.

export const LAURA = {
  name: "Laura Delissi",
  role: "Directora de ELEVAR",
  photo: "/assets/equipo/laura.png",
  lead: "Auditora líder de gestión. Asesora en implementación de Sistemas de Calidad basados en la norma ISO/IEC 17025.",
  cv: "/docs/cv-laura-delissi.pdf",
  cvFileName: "CV Laura Delissi.pdf",
  /** Credencial destacada (el "sello"). */
  seal: { title: "Experta técnica del OAA", detail: "Organismo Argentino de Acreditación" },
};

export interface CredRow {
  /** Años o fecha; vacío si no aplica. */
  when: string;
  title: string;
  place: string;
}

export interface CredGroup {
  id: "trayectoria" | "acreditacion" | "formacion";
  label: string;
  rows: CredRow[];
}

export const CRED_GROUPS: CredGroup[] = [
  {
    id: "trayectoria",
    label: "Trayectoria",
    rows: [
      { when: "2020 — hoy", title: "Directora", place: "ELEVAR" },
      { when: "2015 — 2020", title: "Responsable de Calidad, sede Entre Ríos", place: "INTI" },
      { when: "2010 — 2015", title: "Analista, Laboratorio de Espectrometría", place: "INTI" },
      { when: "2006 — 2010", title: "Analista, Laboratorio de Química", place: "INTI" },
      { when: "2003 — 2006", title: "Becaria", place: "Laboratorio de Obras Sanitarias de Gualeguaychú" },
    ],
  },
  {
    id: "acreditacion",
    label: "Acreditación",
    rows: [
      { when: "", title: "Experta técnica en pH y conductividad en agua y efluentes", place: "Organismo Argentino de Acreditación (OAA)" },
      { when: "2019", title: "Formación de Auditores Líderes ISO 19011:2018", place: "Organismo Argentino de Acreditación (OAA)" },
    ],
  },
  {
    id: "formacion",
    label: "Formación",
    rows: [
      { when: "", title: "Licenciada en Bromatología", place: "Universidad Nacional de Entre Ríos (UNER)" },
      { when: "", title: "Diplomada en Calidad en la Gestión Integral de Procesos", place: "INCALIN · INTI · UNSAM" },
      { when: "+50", title: "Cursos de capacitación técnica y de gestión", place: "INTI · OAA · GQSP" },
    ],
  },
];
