# Pantallas del panel

| Ruta | Qué es | Ficha |
|---|---|---|
| `/admin` | Inicio: lo que hay que hacer hoy, lo que viene y cómo va el negocio | `inicio.md` |
| `/admin/consultas` | Consultas que entran por el sitio: cifras que filtran, lista, ficha y «Cuándo llegan» | `consultas.md` |
| `/admin/ordenes` | Compras: cifras que filtran, lista, tarjeta con «Dar acceso», devoluciones | `ordenes.md` |
| `/admin/inscripciones` | Fechas de webinars y cursos en vivo: cifras que filtran, quién viene (en vivo, de las órdenes pagadas), copiar correos y descargar | `inscripciones.md` |
| `/admin/cursos` | Catálogo y fechas | sin ficha todavía |
| `/admin/auditoria` | Registro de lo que se hizo | sin ficha todavía |
| `/admin/cuenta` | Clave, códigos de respaldo y sesiones | sin ficha todavía |

Cuando se rediseña una pantalla, se le escribe su ficha con lo que hay que comprobar.

# Páginas del sitio público (sin sesión)

Se recorren con `scripts/recorrer-sitio.mjs` (ver SKILL.md, «Sitio público»). Las que leen el catálogo necesitan el backend arriba con cursos (`node doctor.mjs --sitio` lo avisa).

| Ruta | Qué es | Necesita backend | Ficha |
|---|---|---|---|
| `/` | Inicio del sitio | sí | sin ficha todavía |
| `/formacion` · `/formacion/<modalidad>` | Portada de Formación y lista de cursos por modalidad | sí | sin ficha todavía |
| `/cursos/<slug>` | Ficha de un curso | sí | sin ficha todavía |
| `/servicios` · `/servicios/<slug>` | Servicios | no | sin ficha todavía |
| `/nosotros` | Nosotros | no | sin ficha todavía |
| `/blog` | Lista del blog: encabezado, destacada que se abre, grilla/lista, cierre | no | `blog.md` (con `scripts/acciones-blog.mjs`) |
| `/blog/<slug>` | Una nota del blog («Cartas»): cabecera con isotipo, partes en tarjetas que se apilan, anterior y siguiente | no | `nota.md` (con `scripts/acciones-nota.mjs`) |
| `/promociones` | Calculadora del descuento por equipo | sí | sin ficha todavía |
| `/contacto` | Contacto | no (enviar sí) | sin ficha todavía |
| `/carrito` · `/checkout` | Compra (prueba con pago simulado, nunca con plata real) | sí | sin ficha todavía |
| `/orden/<id>` · `/orden/<id>/comprobante` | Pase de la orden y comprobante: pagada, devuelta, fallida, pendiente | sí | `orden.md` (con `scripts/acciones-orden.mjs`) |
| `/privacidad` · `/terminos` · `/arrepentimiento` | Textos legales y botón de arrepentimiento | no (enviar sí) | sin ficha todavía |

Cuando se rediseña una página, se le escribe su ficha y, si tiene interacciones propias, su `scripts/acciones-<pagina>.mjs` (modelo: `acciones-blog.mjs`).
