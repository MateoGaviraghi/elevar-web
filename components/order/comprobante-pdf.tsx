/**
 * PDF del comprobante de inscripción (2026-11-18). Mismo contenido que la página
 * (lib/comprobante.ts), armado en el navegador con @react-pdf/renderer: no pasa por ningún
 * servidor, así el DNI del comprador no sale de su navegador. Tipografía Helvetica (viene en
 * todo lector de PDF); colores de la marca. Se carga recién al tocar «Descargar PDF».
 */
import { Document, Font, Page, Path, StyleSheet, Svg, Text, View, pdf } from "@react-pdf/renderer";
import type { Comprobante } from "@/lib/comprobante";
import { LOGO_ARCS, LOGO_BARS, LOGO_ORANGE } from "@/components/brand/logo-geometry";

// Sin cortar palabras con guion (partía los correos: «prue-ba.tanda4@…»).
Font.registerHyphenationCallback((palabra) => [palabra]);

const INK = "#0B1E33";
const GRIS = "#706F6F";
const GRIS_CLARO = "#929292";
const BORDE = "#E5EAEE";
const FONDO = "#F9F8FB";
const NARANJA = "#E94E1B";
const NARANJA_OSCURO = "#9A2F0C";
const NARANJA_FONDO = "#FEF3EF";
const VERDE = "#1E7E4A";
const AMBAR = "#C47D0E";
const ROJO = "#B91C1C";

const s = StyleSheet.create({
  page: { paddingBottom: 48, fontFamily: "Helvetica", fontSize: 9.5, color: INK },
  barra: { height: 5, backgroundColor: NARANJA },
  cuerpo: { paddingHorizontal: 44, paddingTop: 32 },
  fila: { flexDirection: "row" },
  entre: { flexDirection: "row", justifyContent: "space-between" },
  etiqueta: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 1.1, color: GRIS_CLARO, textTransform: "uppercase" },
  marca: { fontSize: 18, fontFamily: "Helvetica-Bold", letterSpacing: 1.6 },
  bajada: { fontSize: 8, color: GRIS_CLARO, marginTop: 2 },
  numero: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 3 },
  chico: { fontSize: 8.5, color: GRIS, marginTop: 3 },
  estado: { marginTop: 7, paddingVertical: 3, paddingHorizontal: 8, fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 1, alignSelf: "flex-end" },
  bloque: { marginTop: 26, paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDE, flexDirection: "row" },
  mitad: { width: "50%", paddingRight: 16 },
  dato: { flexDirection: "row", marginTop: 4 },
  datoEtiqueta: { width: 58, color: GRIS_CLARO },
  datoValor: { flex: 1, fontFamily: "Helvetica-Bold" },
  cabecera: { flexDirection: "row", marginTop: 10, paddingBottom: 5, borderBottomWidth: 1, borderColor: INK },
  colCurso: { flex: 1, paddingRight: 10 },
  colCant: { width: 38, textAlign: "right" },
  colPrecio: { width: 78, textAlign: "right" },
  colImporte: { width: 82, textAlign: "right" },
  linea: { flexDirection: "row", paddingVertical: 11, borderBottomWidth: 1, borderColor: BORDE },
  codigo: { alignSelf: "flex-start", backgroundColor: NARANJA_FONDO, color: NARANJA_OSCURO, fontFamily: "Helvetica-Bold", fontSize: 7.5, paddingVertical: 2, paddingHorizontal: 5, letterSpacing: 0.8 },
  titulo: { fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 5, lineHeight: 1.3 },
  totales: { marginTop: 12, alignSelf: "flex-end", width: 210 },
  total: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6, paddingTop: 7, borderTopWidth: 1, borderColor: INK },
  totalNum: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  pago: { marginTop: 22, padding: 12, backgroundColor: FONDO, flexDirection: "row" },
  pagoCol: { width: "25%", paddingRight: 8 },
  paso: { width: "50%", flexDirection: "row", paddingRight: 14, marginTop: 10 },
  pasoNum: { width: 20, color: NARANJA, fontFamily: "Helvetica-Bold" },
  pie: { position: "absolute", bottom: 22, left: 44, right: 44, paddingTop: 8, borderTopWidth: 1, borderColor: BORDE, fontSize: 7.5, color: GRIS_CLARO },
});

function Isotipo() {
  return (
    <Svg viewBox="150 0 372 985" style={{ width: 13, height: 34 }}>
      {LOGO_BARS.map((b) => (
        <Path key={b.id} d={b.d} fill={LOGO_ORANGE} />
      ))}
      {LOGO_ARCS.map((a) => (
        <Path key={a.id} d={a.d} fill={LOGO_ORANGE} />
      ))}
    </Svg>
  );
}

function Documento({ d }: { d: Comprobante }) {
  const color = d.estado === "PAGADO" ? VERDE : d.estado === "PENDIENTE" ? AMBAR : ROJO;
  return (
    <Document title={`Comprobante ELEVAR #${d.numero}`} author="ELEVAR" subject="Comprobante de inscripción">
      <Page size="A4" style={s.page}>
        <View style={s.barra} fixed />
        <View style={s.cuerpo}>
          {/* Encabezado */}
          <View style={s.entre}>
            <View style={[s.fila, { alignItems: "center" }]}>
              <Isotipo />
              <View style={{ marginLeft: 9 }}>
                <Text style={s.marca}>ELEVAR</Text>
                <Text style={s.bajada}>Consultoría de calidad para laboratorios</Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.etiqueta}>Comprobante de inscripción</Text>
              <Text style={s.numero}>#{d.numero}</Text>
              <Text style={s.chico}>Emitido el {d.emitido} h</Text>
              <Text style={[s.estado, { color, backgroundColor: `${color}1A` }]}>{d.estado}</Text>
            </View>
          </View>

          {/* Participante y emisor */}
          <View style={s.bloque}>
            <View style={s.mitad}>
              <Text style={s.etiqueta}>Participante</Text>
              {d.comprador.map((f) => (
                <View key={f.etiqueta} style={s.dato}>
                  <Text style={s.datoEtiqueta}>{f.etiqueta}</Text>
                  <Text style={s.datoValor}>{f.valor}</Text>
                </View>
              ))}
            </View>
            <View style={s.mitad}>
              <Text style={s.etiqueta}>Emitido por</Text>
              {d.emisor.map((l, i) => (
                <Text key={l} style={{ marginTop: 4, color: i === 0 ? INK : GRIS, fontFamily: i === 0 ? "Helvetica-Bold" : "Helvetica" }}>
                  {l}
                </Text>
              ))}
            </View>
          </View>

          {/* Detalle */}
          <View style={{ marginTop: 22 }}>
            <Text style={s.etiqueta}>Detalle de la inscripción</Text>
            <View style={s.cabecera}>
              <Text style={[s.etiqueta, s.colCurso]}>Curso</Text>
              <Text style={[s.etiqueta, s.colCant]}>Cant.</Text>
              <Text style={[s.etiqueta, s.colPrecio]}>Precio</Text>
              <Text style={[s.etiqueta, s.colImporte]}>Importe</Text>
            </View>
            {d.lineas.map((l, i) => (
              <View key={i} style={s.linea} wrap={false}>
                <View style={s.colCurso}>
                  {l.codigo ? <Text style={s.codigo}>{l.codigo}</Text> : null}
                  <Text style={s.titulo}>{l.titulo}</Text>
                  <Text style={[s.chico, { marginTop: 2 }]}>{[l.modalidad, l.cuando].filter(Boolean).join(" · ")}</Text>
                  {l.participantes.length > 0 && (
                    <View style={{ marginTop: 6 }}>
                      <Text style={{ fontSize: 7.5, color: GRIS_CLARO, fontFamily: "Helvetica-Bold" }}>Participantes</Text>
                      {l.participantes.map((p, j) => (
                        <Text key={j} style={{ marginTop: 2, color: GRIS }}>
                          {j + 1}. {p.nombre}
                          {p.correo ? ` · ${p.correo}` : ""}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
                <Text style={s.colCant}>{l.cantidad}</Text>
                <Text style={s.colPrecio}>{l.unitario}</Text>
                <Text style={[s.colImporte, { fontFamily: "Helvetica-Bold" }]}>{l.importe}</Text>
              </View>
            ))}

            <View style={s.totales}>
              <View style={s.entre}>
                <Text style={{ color: GRIS }}>Subtotal</Text>
                <Text>{d.subtotal}</Text>
              </View>
              {d.descuento && (
                <View style={[s.entre, { marginTop: 4 }]}>
                  <Text style={{ color: GRIS }}>{d.descuento.etiqueta}</Text>
                  <Text style={{ color: VERDE }}>{d.descuento.importe.replace("−", "-")}</Text>
                </View>
              )}
              <View style={s.total}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Total</Text>
                <Text style={s.totalNum}>{d.total}</Text>
              </View>
            </View>
          </View>

          {/* Pago */}
          <View style={s.pago} wrap={false}>
            {d.pago.map((p) => (
              <View key={p.etiqueta} style={s.pagoCol}>
                <Text style={s.etiqueta}>{p.etiqueta}</Text>
                <Text style={{ marginTop: 3, fontFamily: "Helvetica-Bold" }}>{p.valor}</Text>
              </View>
            ))}
          </View>

          {/* Qué sigue */}
          <View style={{ marginTop: 22 }} wrap={false}>
            <Text style={s.etiqueta}>Qué sigue</Text>
            <View style={[s.fila, { flexWrap: "wrap" }]}>
              {d.pasos.map((p, i) => (
                <View key={p.titulo} style={s.paso}>
                  <Text style={s.pasoNum}>{String(i + 1).padStart(2, "0")}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>{p.titulo}</Text>
                    <Text style={{ marginTop: 2, color: GRIS }}>{p.texto}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={s.pie} fixed>
          <Text>{d.estado === "DEVUELTO" ? "El pago de esta compra se devolvió: la inscripción no está vigente. No reemplaza a la factura." : "Este comprobante acredita tu inscripción. No reemplaza a la factura."}</Text>
          <Text style={{ marginTop: 2 }}>Versión online: {d.url}</Text>
        </View>
      </Page>
    </Document>
  );
}

/** Arma el PDF y lo descarga con el nombre ELEVAR-comprobante-<número>.pdf. */
export async function descargarComprobante(d: Comprobante): Promise<void> {
  const blob = await pdf(<Documento d={d} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = d.archivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
