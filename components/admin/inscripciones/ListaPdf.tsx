/**
 * PDF de la lista de inscriptos de una fecha (2026-11-25, Mateo: «debe ser un pdf con un diseño profesional que
 * sea con los colores y logo del sistema, que se entienda todo, nombre, correo, teléfonos con links para que pueda
 * entrar a su WhatsApp o correo»). Reemplaza al CSV. Se arma en el navegador con @react-pdf/renderer (la misma del
 * comprobante del sitio) y se carga recién al tocar «Descargar PDF». Tipografías del panel (DM Sans, Inter, Space
 * Grotesk; `public/fonts/pdf`) y colores de la marca. El pedido de los datos queda en la auditoría (backend).
 */
import { Document, Font, Image, Link, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { FechaInscripciones, PersonaInscripta } from "@/lib/admin/tipos";

Font.register({ family: "Inter", fonts: [{ src: "/fonts/pdf/inter-400.woff", fontWeight: 400 }, { src: "/fonts/pdf/inter-600.woff", fontWeight: 600 }] });
Font.register({ family: "DM Sans", fonts: [{ src: "/fonts/pdf/dm-sans-600.woff", fontWeight: 600 }, { src: "/fonts/pdf/dm-sans-700.woff", fontWeight: 700 }] });
Font.register({ family: "Space Grotesk", fonts: [{ src: "/fonts/pdf/space-grotesk-600.woff", fontWeight: 600 }, { src: "/fonts/pdf/space-grotesk-700.woff", fontWeight: 700 }] });
// Sin cortar palabras con guion (partía los correos).
Font.registerHyphenationCallback((palabra) => [palabra]);

const INK = "#0B1E33";
const INK_500 = "#2A4560";
const INK_100 = "#DCE4EC";
const INK_50 = "#F2F5F8";
const GRIS = "#6B7C8F";
const NARANJA = "#E94E1B";
const NARANJA_CLARO = "#F79268";
const NARANJA_FONDO = "#FEF3EF";
const NARANJA_OSCURO = "#C43E12";
const VERDE = "#1FA855";
const ZONA = "America/Argentina/Cordoba";

const s = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 44, paddingHorizontal: 30, fontFamily: "Inter", fontSize: 9, color: INK },
  banda: { backgroundColor: INK, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, color: "#FFFFFF", borderBottomWidth: 3, borderBottomColor: NARANJA },
  arriba: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { width: 78, height: 26 },
  sobre: { fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 7, letterSpacing: 1.2, textTransform: "uppercase", color: NARANJA_CLARO },
  medio: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12 },
  titulo: { fontFamily: "DM Sans", fontWeight: 600, fontSize: 17, lineHeight: 1.2, maxWidth: 380 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 9 },
  chip: { fontFamily: "Inter", fontWeight: 600, fontSize: 7.5, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 99, borderWidth: 1, borderColor: "#3A4B5E", backgroundColor: "#1A2C40", marginRight: 5, marginTop: 3 },
  chipMarca: { backgroundColor: NARANJA, borderColor: NARANJA },
  cupo: { alignItems: "flex-end", width: 150 },
  cupoNum: { fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 26, lineHeight: 1 },
  cupoDe: { fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 12, color: "#9AA8B6" },
  cupoTexto: { fontSize: 7.5, color: "#C4CDD6", marginTop: 4 },
  barra: { width: 140, height: 5, borderRadius: 3, backgroundColor: "#2B3D51", marginTop: 6 },
  barraLlena: { height: 5, borderRadius: 3 },
  resumen: { flexDirection: "row", marginTop: 9, marginBottom: 10 },
  dato: { flex: 1, borderWidth: 1, borderColor: INK_100, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 11, marginRight: 7 },
  datoEtiqueta: { fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 6.5, letterSpacing: 1, textTransform: "uppercase", color: INK_500 },
  datoValor: { fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 12, marginTop: 2 },
  datoChico: { fontFamily: "Inter", fontWeight: 400, fontSize: 7.5, color: GRIS },
  cabecera: { flexDirection: "row", backgroundColor: INK_50, borderWidth: 1, borderColor: INK_100, borderTopLeftRadius: 10, borderTopRightRadius: 10, paddingVertical: 7, paddingHorizontal: 9 },
  th: { fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 6.5, letterSpacing: 1, textTransform: "uppercase", color: INK_500 },
  fila: { flexDirection: "row", alignItems: "center", borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: INK_100, paddingVertical: 4.5, paddingHorizontal: 9, minHeight: 26 },
  par: { backgroundColor: "#FAFBFC" },
  n: { fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 7.5, color: INK_500 },
  nombre: { fontFamily: "Inter", fontWeight: 600, fontSize: 8.5 },
  compro: { alignSelf: "flex-start", marginTop: 2, backgroundColor: NARANJA_FONDO, color: NARANJA_OSCURO, fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 6.5, paddingVertical: 1.5, paddingHorizontal: 6, borderRadius: 99 },
  enlace: { color: INK, textDecoration: "none", fontSize: 8 },
  subrayado: { borderBottomWidth: 0.75, borderColor: "#B9C7D5", paddingBottom: 1, flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  punto: { width: 4, height: 4, borderRadius: 2, marginRight: 4 },
  de: { fontSize: 6.5, color: GRIS, marginTop: 2 },
  nada: { fontSize: 7.5, color: "#8A99A8" },
  mono: { fontFamily: "Courier", fontSize: 7.5 },
  fecha: { fontSize: 7.5, color: INK_500 },
  hora: { fontSize: 6.5, color: GRIS, marginTop: 1 },
  nota: { marginTop: 9, fontSize: 7, color: GRIS, lineHeight: 1.4 },
  pie: { position: "absolute", bottom: 18, left: 30, right: 30, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: GRIS },
});

const dia = (iso: string) => new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
const hora = (iso: string) => new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
const diaArchivo = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: ZONA }).format(new Date(iso));
/** wa.me necesita el número con país: 3446 123456 → 5493446123456. */
export function numeroWhatsApp(tel: string): string {
  let d = tel.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("54")) d = `549${d}`;
  return d;
}
const telLindo = (tel: string) => {
  const d = tel.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 6)}-${d.slice(6)}` : tel;
};

function Lista({ f, personas, generada }: { f: FechaInscripciones; personas: PersonaInscripta[]; generada: Date }) {
  const vivo = f.modalidad === "LIVE";
  const conTel = personas.filter((p) => p.telefono).length;
  const lleno = f.capacity !== null && f.inscriptos >= f.capacity;
  const parte = f.capacity ? Math.min(1, f.inscriptos / f.capacity) : 0;
  const ancho = vivo
    ? { n: "5%", persona: "25%", correo: "31%", wa: "17%", orden: "10%", fecha: "12%" }
    : { n: "5%", persona: "30%", correo: "37%", wa: "16%", orden: "0%", fecha: "12%" };
  const cabecera = (
    <View style={s.cabecera}>
      <Text style={[s.th, { width: ancho.n }]}>#</Text>
      <Text style={[s.th, { width: ancho.persona }]}>Persona</Text>
      <Text style={[s.th, { width: ancho.correo }]}>Correo</Text>
      <Text style={[s.th, { width: ancho.wa }]}>WhatsApp</Text>
      {vivo && <Text style={[s.th, { width: ancho.orden }]}>Orden</Text>}
      <Text style={[s.th, { width: ancho.fecha }]}>{vivo ? "Pagó" : "Se anotó"}</Text>
    </View>
  );
  return (
    <Document title={`Inscriptos · ${f.curso} · ${dia(f.starts_at)}`} author="ELEVAR" creator="Panel de ELEVAR" language="es">
      <Page size="A4" style={s.page}>
        {/* De la segunda hoja en adelante, el encabezado de la tabla arriba de todo. */}
        <View fixed render={({ pageNumber }) => (pageNumber > 1 ? cabecera : null)} />
        <View style={s.banda}>
          <View style={s.arriba}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- la Image de react-pdf no tiene alt; el título del documento dice ELEVAR */}
            <Image src="/assets/isologotipo.png" style={s.logo} />
            <Text style={s.sobre}>Lista de inscriptos</Text>
          </View>
          <View style={s.medio}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={s.titulo}>{f.curso}</Text>
              <View style={s.chips}>
                <Text style={[s.chip, s.chipMarca]}>{vivo ? "En vivo" : "Webinar"}</Text>
                <Text style={s.chip}>{dia(f.starts_at)}</Text>
                <Text style={s.chip}>{hora(f.starts_at)} a {hora(f.ends_at)} h</Text>
                <Text style={s.chip}>{f.codigo}</Text>
                {f.status === "CANCELLED" && <Text style={[s.chip, { backgroundColor: "#7F1D1D", borderColor: "#7F1D1D" }]}>Cancelada</Text>}
              </View>
            </View>
            <View style={s.cupo}>
              <Text style={s.cupoNum}>{f.inscriptos}{f.capacity !== null && <Text style={s.cupoDe}> / {f.capacity}</Text>}</Text>
              <Text style={s.cupoTexto}>{f.capacity === null ? "Sin cupo" : lleno ? "Cupo completo" : `Quedan ${f.capacity - f.inscriptos} lugares`}</Text>
              {f.capacity !== null && (
                <View style={s.barra}><View style={[s.barraLlena, { width: `${Math.max(parte * 100, 3)}%`, backgroundColor: lleno ? "#F37040" : NARANJA }]} /></View>
              )}
            </View>
          </View>
        </View>

        <View style={s.resumen}>
          <View style={s.dato}>
            <Text style={s.datoEtiqueta}>{vivo ? "Lugares pagos" : "Personas anotadas"}</Text>
            <Text style={s.datoValor}>{f.inscriptos}{vivo && personas.length !== f.inscriptos ? <Text style={s.datoChico}>  en {personas.length} filas</Text> : null}</Text>
          </View>
          <View style={s.dato}>
            <Text style={s.datoEtiqueta}>Con WhatsApp</Text>
            <Text style={s.datoValor}>{conTel} de {personas.length}</Text>
          </View>
          <View style={[s.dato, { marginRight: 0 }]}>
            <Text style={s.datoEtiqueta}>Generada</Text>
            <Text style={s.datoValor}>{dia(generada.toISOString())} {hora(generada.toISOString())}</Text>
          </View>
        </View>

        {cabecera}
        {personas.map((p, i) => (
          <View key={i} style={[s.fila, i % 2 === 1 ? s.par : {}]} wrap={false}>
            <Text style={[s.n, { width: ancho.n }]}>{i + 1}</Text>
            <View style={{ width: ancho.persona, paddingRight: 6 }}>
              <Text style={s.nombre}>{p.nombre || "Sin nombre"}</Text>
              {p.comprador && <Text style={s.compro}>Compró · {p.sin_nombre === 1 ? "1 lugar sin nombre" : `${p.sin_nombre} lugares sin nombre`}</Text>}
            </View>
            <View style={{ width: ancho.correo, paddingRight: 6 }}>
              {p.correo ? (
                <Link src={`mailto:${p.correo}`} style={s.enlace}>
                  <View style={s.subrayado}><View style={[s.punto, { backgroundColor: NARANJA }]} /><Text>{p.correo}</Text></View>
                </Link>
              ) : <Text style={s.nada}>Sin correo</Text>}
            </View>
            <View style={{ width: ancho.wa, paddingRight: 6 }}>
              {p.telefono && numeroWhatsApp(p.telefono) ? (
                <>
                  <Link src={`https://wa.me/${numeroWhatsApp(p.telefono)}`} style={s.enlace}>
                    <View style={s.subrayado}><View style={[s.punto, { backgroundColor: VERDE }]} /><Text>{telLindo(p.telefono)}</Text></View>
                  </Link>
                  {p.telefono_de ? <Text style={s.de}>de {p.telefono_de}</Text> : null}
                </>
              ) : <Text style={s.nada}>Sin teléfono</Text>}
            </View>
            {vivo && <Text style={[s.mono, { width: ancho.orden }]}>{p.numero ? `#${p.numero}` : "—"}</Text>}
            <View style={{ width: ancho.fecha }}>
              <Text style={s.fecha}>{dia(p.fecha)}</Text>
              <Text style={s.hora}>{hora(p.fecha)} h</Text>
            </View>
          </View>
        ))}
        {personas.length === 0 && (
          <View style={[s.fila, { justifyContent: "center", minHeight: 48 }]}><Text style={s.nada}>{vivo ? "Todavía no hay órdenes pagadas para esta fecha." : "Todavía no se anotó nadie."}</Text></View>
        )}

        <Text style={s.nota}>
          Tocá un correo o un número para escribirle. {vivo ? "En los cursos en vivo, el teléfono es el de quien compró la orden. " : ""}Contiene datos personales: no la reenvíes fuera de ELEVAR.
        </Text>
        <View style={s.pie} fixed>
          <Text>ELEVAR · {f.codigo} · {dia(f.starts_at)}</Text>
          <Text render={({ pageNumber, totalPages }) => `Hoja ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Arma el PDF y lo baja como `inscriptos-<código>-<AAAA-MM-DD>.pdf`. */
export async function descargarListaPdf(f: FechaInscripciones, personas: PersonaInscripta[]): Promise<void> {
  const blob = await pdf(<Lista f={f} personas={personas} generada={new Date()} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inscriptos-${f.codigo}-${diaArchivo(f.starts_at)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
