// Textos legales del sitio (KAN-41, 2026-11-18): política de privacidad, términos de inscripción
// y botón de arrepentimiento. Son un BORRADOR para que lo revise el abogado de ELEVAR: ordenan lo
// que piden la Ley 25.326 (art. 6), la Res. AAIP 14/2018, la Res. 424/2020 y la Res. 271/2020,
// con los datos que ya publica el sitio. No es asesoramiento legal.
//
// Marcas dentro de los textos (las dibuja `components/legal/documento.tsx`):
//   [texto](/ruta)              → link
//   {{CONFIRMAR: qué falta}}    → dato que tiene que pasar ELEVAR; se ve resaltado en la página
//
// Lo que falta se le pidió a Laura en su doc de Drive («Preguntas para Laura»).

import { CONTACT } from "@/lib/contact";

/** Quién es el responsable de los datos y quién vende (Ley 25.326 art. 6; Res. AAIP 14/2018 art. 2). */
export const RESPONSABLE = {
  razonSocial: "{{CONFIRMAR: razón social}}",
  cuit: "{{CONFIRMAR: CUIT}}",
  domicilio: CONTACT.address,
  email: CONTACT.email,
  telefono: CONTACT.phoneDisplay,
} as const;

/** Fecha desde la que rige cada texto. Cambia cada vez que se cambia el texto. */
export const VIGENCIA = "18 de noviembre de 2026";

/** Texto literal de la Res. AAIP 14/2018, art. 3. No se edita. */
export const LEYENDA_AAIP =
  "LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.";

export type Bloque = string | { lista: string[] } | { cita: string };

export interface Seccion {
  id: string;
  titulo: string;
  bloques: Bloque[];
}

const MAIL = `[${RESPONSABLE.email}](mailto:${RESPONSABLE.email})`;

export const PRIVACIDAD: Seccion[] = [
  {
    id: "responsable",
    titulo: "Quién guarda tus datos",
    bloques: [
      `Los datos que cargás en esta web los recibe y los guarda ELEVAR (${RESPONSABLE.razonSocial}, CUIT ${RESPONSABLE.cuit}), con domicilio en ${RESPONSABLE.domicilio}. Para cualquier tema de tus datos nos escribís a ${MAIL}.`,
    ],
  },
  {
    id: "que-datos",
    titulo: "Qué datos pedimos y para qué",
    bloques: [
      "Pedimos solo lo que hace falta para lo que vos nos pedís, y lo usamos para eso:",
      {
        lista: [
          "Formulario de contacto: nombre, correo, asunto y mensaje, y si querés empresa y teléfono. Los usamos para responderte.",
          "Comunidad de WhatsApp: nombre, correo y número de WhatsApp. Los usamos para sumarte al grupo y mandarte novedades de cursos, promociones y contenido técnico.",
          "Inscripción a un webinar: nombre y correo, y si querés teléfono y empresa. Los usamos para inscribirte y mandarte el enlace del encuentro.",
          "Compra de un curso: nombre, apellido, correo, teléfono y DNI de quien compra, empresa si querés, y nombre y correo de cada participante. Los usamos para la inscripción, el acceso a la plataforma, el comprobante, la factura y el certificado.",
          "Botón de arrepentimiento: nombre y correo, y si querés el número de orden y el motivo. Los usamos para tramitar tu pedido.",
        ],
      },
      "Los campos que no dicen «opcional» son obligatorios: sin ellos no podemos responderte, inscribirte ni hacer la compra. No pedimos datos sensibles, como salud, religión u opiniones políticas.",
    ],
  },
  {
    id: "quien-mas",
    titulo: "Quién más los recibe",
    bloques: [
      "No vendemos ni cedemos tus datos. Los ven solo las personas de ELEVAR que atienden tu pedido y los servicios que usamos para que la web funcione, que los tratan por cuenta nuestra:",
      {
        lista: [
          "Mercado Pago, para cobrar. Los datos de tu tarjeta los cargás en Mercado Pago y nunca pasan por esta web.",
          "El servicio de correo que manda los mails de confirmación, con servidores en Estados Unidos.",
          "El alojamiento de la web y de la base de datos, también en Estados Unidos.",
        ],
      },
    ],
  },
  {
    id: "navegador",
    titulo: "Qué guarda tu navegador",
    bloques: [
      "El carrito se guarda en tu propio navegador para que no lo pierdas al cambiar de página. No usamos cookies de publicidad ni herramientas que midan tu navegación.",
    ],
  },
  {
    id: "plazo",
    titulo: "Cuánto tiempo los guardamos",
    bloques: [
      "Las consultas y las altas a la comunidad, {{CONFIRMAR: plazo}}. Las compras, el tiempo que pidan las normas impositivas {{CONFIRMAR: plazo}}. Después se borran.",
    ],
  },
  {
    id: "derechos",
    titulo: "Cómo ver, corregir o borrar tus datos",
    bloques: [
      `Podés pedirnos ver qué datos tuyos tenemos, corregirlos, actualizarlos o borrarlos, sin costo, escribiendo a ${MAIL} desde el correo que usaste. Si pedís verlos te respondemos dentro de los 10 días corridos, y si pedís corregirlos o borrarlos, dentro de los 5 días hábiles.`,
      "De la comunidad de WhatsApp salís cuando quieras, desde el mismo grupo o avisándonos.",
    ],
  },
  {
    id: "seguridad",
    titulo: "Cómo los cuidamos",
    bloques: [
      "La web funciona con conexión cifrada y los datos se guardan en una base a la que solo entra el equipo de ELEVAR, con usuario, contraseña y un segundo código de verificación.",
    ],
  },
  {
    id: "aaip",
    titulo: "Dónde reclamar",
    bloques: [
      `Si creés que no respetamos tus derechos, escribinos primero a ${MAIL}. También podés reclamar ante la Agencia de Acceso a la Información Pública:`,
      { cita: LEYENDA_AAIP },
    ],
  },
  {
    id: "cambios",
    titulo: "Cambios en esta política",
    bloques: [
      "Si cambiamos esta política, publicamos la versión nueva en esta página con su fecha. La fecha de arriba es la de la versión que rige hoy.",
    ],
  },
];

export const TERMINOS: Seccion[] = [
  {
    id: "quien-vende",
    titulo: "Quién vende",
    bloques: [
      `Los cursos de esta web los vende ELEVAR (${RESPONSABLE.razonSocial}, CUIT ${RESPONSABLE.cuit}), con domicilio en ${RESPONSABLE.domicilio}. Correo ${MAIL}, teléfono y WhatsApp ${RESPONSABLE.telefono}.`,
      "Al comprar aceptás estos términos. Leelos antes de pagar: si algo no te queda claro, escribinos.",
    ],
  },
  {
    id: "inscripcion",
    titulo: "Cómo te inscribís",
    bloques: [
      "Elegís el curso, cargás tus datos y los de cada participante y pagás. La inscripción queda confirmada cuando el pago se aprueba: en ese momento te llega un mail de confirmación y podés ver y descargar el comprobante de tu orden.",
      "El comprobante no reemplaza a la factura. {{CONFIRMAR: cuándo y cómo se manda la factura}}.",
    ],
  },
  {
    id: "precios",
    titulo: "Precios y medios de pago",
    bloques: [
      "Los precios están en pesos argentinos {{CONFIRMAR: si incluyen IVA}}. El total que vas a pagar se ve en el carrito antes de cargar tus datos.",
      {
        lista: [
          "Desde Argentina: Mercado Pago (tarjeta de crédito o débito, efectivo o dinero en cuenta, con las cuotas que ofrezca Mercado Pago) o transferencia bancaria.",
          "Desde otros países: transferencia bancaria o Western Union.",
          "La transferencia, el pago por Western Union y la factura a nombre de una empresa se coordinan por WhatsApp.",
        ],
      },
    ],
  },
  {
    id: "descuentos",
    titulo: "Descuentos",
    bloques: [
      {
        lista: [
          "Grupos: 10 % de descuento cuando se inscriben 2 personas o más en el mismo curso. El carrito lo calcula solo.",
          "Pago desde el exterior por Western Union: 20 % de descuento.",
          "Cupones: si un cupón se suma o no al descuento por grupo, lo ves en el carrito antes de pagar.",
        ],
      },
    ],
  },
  {
    id: "acceso",
    titulo: "Acceso al curso",
    bloques: [
      "Dentro de las 24 horas de aprobado el pago te mandamos un usuario y una contraseña para entrar a la plataforma de capacitación de ELEVAR, donde descargás la documentación, ves el video y hacés el ejercicio final. En los cursos en vivo, el enlace a la sala está en la misma plataforma.",
      `El acceso dura 90 días corridos. Pasado ese plazo se cierra solo; si te falta terminar, pedinos acceso de nuevo a ${MAIL} para completar el curso y obtener el certificado.`,
    ],
  },
  {
    id: "certificado",
    titulo: "Certificado",
    bloques: [
      "Al terminar el curso recibís un certificado de participación si el puntaje del ejercicio final es menor al 70 %, o de aprobación si es mayor al 70 %.",
    ],
  },
  {
    id: "cancelaciones",
    titulo: "Arrepentimiento, cambios y reintegros",
    bloques: [
      "Si compraste por esta web podés arrepentirte de la compra {{CONFIRMAR: plazo con el abogado}}, sin dar motivo y sin costo, desde el [Botón de arrepentimiento](/arrepentimiento). No hace falta crear una cuenta: al enviarlo te damos un código y te lo mandamos por mail.",
      "{{CONFIRMAR: qué pasa si un curso en vivo cambia de fecha o se suspende, y si se puede pasar la inscripción a otra persona o a otro curso}}.",
      "Los reintegros se hacen por el mismo medio con el que pagaste {{CONFIRMAR: plazo}}.",
    ],
  },
  {
    id: "datos",
    titulo: "Tus datos",
    bloques: ["Cómo usamos y cuidamos los datos que cargás está en la [política de privacidad](/privacidad)."],
  },
  {
    id: "consultas",
    titulo: "Consultas y reclamos",
    bloques: [
      `Por cualquier consulta o reclamo escribinos a ${MAIL} o por WhatsApp al ${RESPONSABLE.telefono}. Te respondemos por el mismo medio.`,
      "Si cambiamos estos términos, la versión nueva rige para las compras hechas desde su fecha.",
    ],
  },
];
