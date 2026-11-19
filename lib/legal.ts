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
export const VIGENCIA = "19 de noviembre de 2026";

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
      "La base de datos está inscripta en el Registro Nacional de Bases de Datos de la Agencia de Acceso a la Información Pública con el número {{CONFIRMAR: número de inscripción}}.",
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
          "Compra de un curso: nombre, apellido, correo, teléfono y DNI de quien compra, empresa si querés, y nombre y correo de cada participante. Los usamos para la inscripción, el acceso al aula virtual, el comprobante, la factura y el certificado, que lleva el nombre de cada participante.",
          "Botón de arrepentimiento: nombre y correo, y si querés el número de orden y el motivo. Los usamos para tramitar tu pedido.",
        ],
      },
      "Cuando entrás a la web, el servicio que la aloja registra datos técnicos de la visita, como la dirección IP y el navegador. Sirven para que la web funcione y para frenar abusos, como alguien que manda cientos de formularios. No los usamos para saber quién sos.",
      "Los campos que no dicen «opcional» son obligatorios: sin ellos no podemos responderte, inscribirte ni hacer la compra. No pedimos datos sensibles, como salud, religión u opiniones políticas. Tampoco tomamos decisiones sobre vos de forma automática: cada pedido lo mira una persona de ELEVAR.",
    ],
  },
  {
    id: "quien-mas",
    titulo: "Quién más los recibe",
    bloques: [
      "No vendemos ni cedemos tus datos. Los ven solo las personas de ELEVAR que atienden tu pedido y los servicios que usamos para que la web funcione, que los tratan por cuenta nuestra y solo para eso:",
      {
        lista: [
          "Mercado Pago, para cobrar. Recibe tu nombre, tu correo y tu DNI. Los datos de tu tarjeta los cargás en Mercado Pago y nunca pasan por esta web.",
          "El servicio de correo que manda los mails de confirmación, con servidores en Estados Unidos.",
          "El alojamiento de la web y de la base de datos, también en Estados Unidos.",
          "El aula virtual de ELEVAR (aulavirtual.elevar.com.ar), donde cargamos el nombre y el correo de cada participante para darle acceso. Sus servidores están en {{CONFIRMAR: país}}.",
          "WhatsApp, si te sumás a la comunidad. En el grupo, tu nombre y tu número los ven WhatsApp y las demás personas del grupo.",
          "ARCA, cuando emitimos una factura, porque lo pide la ley.",
          "El banco o Western Union, si elegís pagar por transferencia o por Western Union: reciben los datos que cargás para el pago.",
        ],
      },
      "Fuera de eso, solo damos datos si nos los pide un juez o una autoridad con una ley que lo permita.",
    ],
  },
  {
    id: "fuera-del-pais",
    titulo: "Datos que se guardan fuera de Argentina",
    bloques: [
      "El correo y el alojamiento de la web guardan tus datos en Estados Unidos. La Agencia de Acceso a la Información Pública no incluye a Estados Unidos entre los países con un nivel de protección igual al de Argentina. Por eso te lo pedimos de forma expresa: al marcar la casilla de cada formulario aceptás que tus datos se guarden ahí.",
      `Esos servicios se comprometen por contrato a usarlos solo para prestarnos el servicio y a protegerlos. Si no estás de acuerdo, escribinos a ${MAIL} y te atendemos por otro medio.`,
    ],
  },
  {
    id: "navegador",
    titulo: "Qué guarda tu navegador",
    bloques: [
      "El carrito se guarda en tu propio navegador para que no lo pierdas al cambiar de página. No usamos cookies de publicidad ni herramientas que midan tu navegación. Las letras de la web se cargan desde nuestro propio servidor, así que tu visita no le avisa a ningún otro servicio.",
    ],
  },
  {
    id: "plazo",
    titulo: "Cuánto tiempo los guardamos",
    bloques: [
      {
        lista: [
          "Consultas: {{CONFIRMAR: propuesta, 2 años}} desde la última respuesta.",
          "Inscripciones a webinars: {{CONFIRMAR: propuesta, 1 año}} desde el encuentro.",
          "Comunidad de WhatsApp: mientras sigas en el grupo. Si salís, borramos tu alta.",
          "Compras y facturas: 10 años desde la compra, el plazo que fija el Código Civil y Comercial (art. 328) para la documentación contable.",
          "Pedidos de arrepentimiento: lo mismo que la compra a la que corresponden.",
          "Datos técnicos de las visitas: los borra el servicio de alojamiento, como máximo a los 90 días.",
        ],
      },
      "Pasado el plazo se borran, también de las copias de seguridad.",
    ],
  },
  {
    id: "derechos",
    titulo: "Cómo ver, corregir o borrar tus datos",
    bloques: [
      `Podés pedirnos ver qué datos tuyos tenemos, corregirlos, actualizarlos o borrarlos, sin costo, escribiendo a ${MAIL} desde el correo que usaste. Si pedís verlos te respondemos dentro de los 10 días corridos, y si pedís corregirlos o borrarlos, dentro de los 5 días hábiles.`,
      "Ver tus datos es gratis cada seis meses, o antes si tenés un motivo. Para cuidarlos, si escribís desde otro correo te vamos a pedir algo que confirme que sos vos.",
      "Lo que tenemos que guardar por ley, como una factura, no lo podemos borrar antes de tiempo: te avisamos qué es y hasta cuándo.",
      "De la comunidad de WhatsApp salís cuando quieras, desde el mismo grupo o avisándonos.",
    ],
  },
  {
    id: "novedades",
    titulo: "Novedades y promociones",
    bloques: [
      `Solo te mandamos novedades si te sumaste a la comunidad. Podés pedir que te saquemos de la lista cuando quieras, y cada mensaje de novedades dice cómo hacerlo: escribís «baja» en el grupo o a ${MAIL}.`,
    ],
  },
  {
    id: "seguridad",
    titulo: "Cómo los cuidamos",
    bloques: [
      "La web funciona con conexión cifrada y los datos se guardan en una base a la que solo entra el equipo de ELEVAR, con usuario, contraseña y un segundo código de verificación. Cada ingreso al panel queda registrado.",
      "Si alguna vez pasara algo que pusiera en riesgo tus datos, te avisamos por correo apenas lo sepamos, con lo que pasó y qué hacer.",
    ],
  },
  {
    id: "menores",
    titulo: "Menores de edad",
    bloques: [
      "Los cursos están pensados para profesionales y la compra la hace una persona mayor de edad. Si tenés menos de 18 años, pedile a tu madre, tu padre o tu tutor que haga la compra.",
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
      "Si cambiamos esta política, publicamos la versión nueva en esta página con su fecha. La fecha de arriba es la de la versión que rige hoy. Si el cambio afecta cómo usamos datos que ya nos diste, te lo avisamos por correo antes de que rija.",
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
      "Dentro de las 24 horas de aprobado el pago te mandamos un usuario y una contraseña para entrar al aula virtual de ELEVAR, donde descargás la documentación, ves el video y hacés el ejercicio final. En los cursos en vivo, el enlace a la sala está en la misma aula virtual.",
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
