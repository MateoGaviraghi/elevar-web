# Inscripciones (`/admin/inscripciones`)

Rediseñada el 2026-11-25 con la forma del portal CESS, como Consultas y Órdenes (D-005). Cada fila es una fecha de un webinar o de un curso en vivo. Banda azul con cuatro cifras que filtran y cuántas personas vienen a lo próximo; barra de filtros; tabla de fechas en su tarjeta con la paginación abajo; tocar una fila abre la tarjeta de la fecha al centro (`?ver=<id de la fecha>`). Sale de `GET /api/v1/panel/inscripciones/lista/`, `GET …/inscripciones/cifras/` y `GET …/inscripciones/personas/?sesion=<id>`; «Copiar correos» pide `GET …/inscripciones/correos/?sesion=<id>` y «Descargar PDF», `GET …/inscripciones/pdf/?sesion=<id>` (los dos quedan en la auditoría como `exportacion`, con `que` = `correos` o `pdf`). El PDF lo arma el navegador (`components/admin/inscripciones/ListaPdf.tsx`, @react-pdf/renderer, fuentes en `public/fonts/pdf`). La ruta vieja del CSV (`exportar/`) sigue en el backend, sin botón.

## De dónde sale quién viene

- **Webinar:** los que se anotaron en el sitio (`WebinarRegistration`). El número de la fecha es cuántos se anotaron.
- **Curso en vivo:** los participantes de las órdenes **pagadas o cumplidas y sin devolver** de esa fecha (`OrderItem.attendees`). Si una orden no cargó a sus participantes, aparece el comprador con «Comprador · N lugares sin nombre». El número de la fecha son sus lugares pagos (`seats_taken`, como el Inicio). Las pendientes, fallidas y devueltas no aparecen.
- Antes del 2026-11-25 la pantalla solo leía los webinars: una fecha en vivo salía siempre vacía.

## Qué comprobar

- **Recorrido:** `--base http://localhost:3110 --rutas "/admin/inscripciones,/admin/inscripciones?cuando=PASADAS,/admin/inscripciones?tipo=LIVE,/admin/inscripciones?ver=<id>"` a los cinco anchos, con 0 saltos, 0 desborde y consola limpia. **Ojo con `--base`:** sin él, `recorrer.mjs` va al 3100, que puede ser otro chat con otro código.
- **Entra en pantalla:** la lista entra sin scrollear a 1366×650, 1440×900 y 1920×1080.
- **Cifras:** Próximas (`cuando=PROXIMAS`, la de por defecto), Esta semana (los próximos 7 días), Llenas (próximas con cupo y sin lugar), Pasadas. «Vienen a lo próximo»: la suma de inscriptos de las próximas.
- **Orden:** las que vienen, de la más cercana a la más lejana; Pasadas y Todas, al revés.
- **Filtros:** Cuándo, Tipo (Webinar, En vivo), Curso (solo webinars y cursos en vivo). El buscador busca el curso (título o código) o **el nombre** de una persona anotada o participante; el correo no viaja en la dirección.
- **Fila:** fecha con día de la semana y «en N días», curso con «WEB» o «VIVO», «47 de 60» con barra (roja si está llena; «sin cupo» si no tiene), estado, «Ver inscriptos».
- **Tarjeta:** cabecera con estado, día y horario, «en N días» y «N de M lugares». Izquierda: la gente con su correo; en vivo, el número de orden lleva a Órdenes (`/admin/ordenes?estado=TODAS&ver=<public_id>`) y «pagó hace…»; en webinar, «se anotó hace…». Con más de 6 personas aparece un buscador por nombre o correo (filtra en la tarjeta). Derecha: Cupo («Quedan N lugares», «No quedan lugares», «Sin cupo») y «Llevarte la lista» (Copiar correos sin repetir, separados por coma, con el aviso «Copiados N correos para pegar en CCO.»; Descargar PDF: baja `inscriptos-<código>-<AAAA-MM-DD>.pdf` con «Armando el PDF…» mientras tanto y el aviso «PDF descargado.»). Fecha cancelada: aviso rojo. ↑ ↓ recorren, Esc cierra.
- **Inicio:** «Ver los inscriptos» del Inicio lleva a `?fecha=<id>`: abre esa tarjeta.
- **Celular:** cifras de a dos; cada fila es una tarjeta (curso, fecha, cupo); en la tarjeta, cada persona en dos renglones con la orden y hace cuánto abajo.

## El PDF

- Banda azul con el isologotipo, «Lista de inscriptos», curso, chips (modalidad, día, horario, código) y el cupo con su barra; tres datos (lugares o personas, con WhatsApp, generada); la tabla con número, persona, correo, WhatsApp, orden (en vivo) y cuándo pagó o se anotó; el encabezado de la tabla se repite en cada hoja; «Hoja N de M» al pie; la nota de datos personales.
- Correos (`mailto:`) y WhatsApp (`https://wa.me/549…`) se pueden tocar: contar los `/URI` del archivo.
- Teléfono: en un webinar, el de la consulta que se creó al anotarse (opcional en el sitio); en vivo, el de quien compró, con «de <comprador>».
- Script: `inscripciones-pdf.mjs <visor> <salida> <id> <id>` baja el PDF a 1440 y a 375 (toque) y mira el nombre y el aviso; después se mira hoja por hoja.

## Datos de muestra

`scripts/sembrar_inicio.py`, cuarta tanda (`semilla.vivo*@ejemplo.com`): en las tres próximas fechas en vivo, una llena (4 de 4), una con 3 participantes + un comprador con 2 lugares sin nombre + una devuelta que no cuenta (5 de 20), y una con un nombre largo.

## Selectores

- Tabla: `table[aria-label="Fechas con inscripciones"]`, filas `tr[data-fila=<id>]`, acción `[data-accion]` («Ver quién viene a …»).
- Tarjeta: `div[role=dialog]`; bloque `section[aria-label=Cupo]`; botón «Copiar correos»; link «Descargar la lista»; aviso `[role=status]`.
- Script de la sesión que lo armó: `inscripciones-flujo.mjs` (vive en el scratchpad).
