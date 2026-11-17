# 05 — Pantallas

Todas viven en `elevar-web/app/admin/`. Todas, salvo las de ingreso, exigen sesión con segundo factor; el control real lo hace Django en cada pedido de datos (`07-SEGURIDAD.md`).

## Estados que tiene toda pantalla con datos

| Estado | Qué se ve | Regla |
|---|---|---|
| **Cargando** | Esqueleto con la forma real del contenido (filas grises del alto de una fila, no un círculo girando) | Título, filtros y menú aparecen enseguida; solo el bloque de datos espera |
| **Vacía** | Por qué está vacía y qué hacer: «No hay consultas con estos filtros · Limpiar filtros» o «Todavía no entró ninguna consulta» | Distinguir «no hay nada» de «los filtros no encuentran nada» |
| **Error** | Qué pasó en palabras simples y un botón «Reintentar». Un código corto de incidente para pasarle a soporte | Nunca el detalle técnico, el SQL ni la traza |
| **Sin permiso** | «No tenés acceso a esta sección.» con un link al inicio | La API responde 403 a una sesión sin permiso (por ejemplo, sin segundo factor confirmado) y 404 a un registro que no existe; la pantalla muestra este estado, no una página rota |

Además: si la sesión venció mientras la pantalla estaba abierta, el próximo pedido devuelve 401 y la pantalla lleva a `/admin/ingresar?volver=<ruta>`, sin perder lo que se estaba escribiendo si es posible avisarlo antes.

## Lista

| Ruta | Para qué | Rol | Etapa |
|---|---|---|---|
| `/admin/ingresar` | Correo y contraseña | Sin sesión | 2 |
| `/admin/ingresar/codigo` | Código de 6 dígitos de la app, o un código de respaldo | Con contraseña ok, sin código | 2 |
| `/admin/primer-ingreso` | Configurar el segundo factor la primera vez | Con contraseña ok, sin factor configurado | 2 |
| `/admin` | Inicio: lo que hay que atender hoy | `admin` | 2 (vacío), se completa en 3 y 7 |
| `/admin/consultas` | Lista de consultas | `admin` | 3 |
| `/admin/consultas/[id]` | Detalle de una consulta | `admin` | 3 |
| `/admin/auditoria` | Quién hizo qué | `admin` | 4 |
| `/admin/cuenta` | Mi cuenta: contraseña, segundo factor, sesiones | `admin` | 4 |
| `/admin/inscripciones` | Inscriptos por webinar | `admin` | 5 |
| `/admin/cursos` | Cursos | `admin` | 6 |
| `/admin/cursos/[id]` | Un curso y sus fechas | `admin` | 6 |
| `/admin/ordenes` | Órdenes | `admin` | 7 |
| `/admin/ordenes/[publicId]` | Detalle de una orden | `admin` | 7 |

Las rutas de la demo `/admin/blog/**`, `/admin/promociones/**`, `/admin/contactos` y `/admin/webinars` se borran (las reemplazan las de arriba). No hay pantalla de usuarios: hay un solo usuario, el de Laura, y su alta y soporte se hacen por comandos (`09-ETAPAS.md`).

## Cada pantalla, en orden de arriba hacia abajo

### `/admin/ingresar`
1. Logo de ELEVAR (isologotipo + palabra) y el título «Ingresar al panel».
2. Campo «Correo» (`type=email`, `autocomplete=username`).
3. Campo «Contraseña» (`autocomplete=current-password`, se puede pegar, botón para mostrarla).
4. Botón «Continuar», deshabilitado mientras envía.
5. Error: siempre el mismo texto, sea el correo inexistente o la contraseña mala: «Correo o contraseña incorrectos.» Con bloqueo: «Demasiados intentos. Probá de nuevo en 15 minutos.»
- No hay «crear cuenta». «Olvidé mi contraseña» lo resuelve un `admin` (ver `10-PENDIENTES.md`).
- Estados: cargando = botón con estado de envío; vacía y sin permiso no aplican; error = el texto de arriba o «No pudimos conectar. Reintentá.»

### `/admin/ingresar/codigo`
1. «Escribí el código de 6 dígitos de tu app autenticadora.»
2. Campo de código (`inputmode=numeric`, `autocomplete=one-time-code`).
3. Link «Usar un código de respaldo» que cambia el campo a texto.
4. Botón «Ingresar».
5. Error: «Código incorrecto.» Con bloqueo, el mismo texto que en la contraseña.

### `/admin/primer-ingreso`
1. Paso 1: el código QR para escanear con la app (Google Authenticator, Microsoft Authenticator, 1Password u otra) y la clave en texto para cargarla a mano.
2. Paso 2: campo para el primer código. Hasta que no confirma, no entra.
3. Paso 3: los 10 códigos de respaldo, una sola vez, con «Descargar» y «Ya los guardé». No se vuelven a mostrar.

### `/admin` (inicio)
1. Título «Hola, <nombre>» y la fecha de hoy.
2. Hasta 4 números, cada uno con el link a la lista que lo explica:
   - Consultas nuevas sin contestar (etapa 3).
   - Órdenes pagadas sin cumplir (etapa 7).
   - Próximo curso en vivo o webinar y cuántos inscriptos tiene (etapas 5 y 6).
3. Las 5 consultas nuevas más viejas, con «Ver todas».
- Vacía: «Todo al día. No hay nada pendiente.»

### `/admin/consultas`
1. Título «Consultas» y el total con los filtros puestos («24 consultas»).
2. Filtros como fichas, en la URL: Estado (Nueva, Contactada, Cerrada; por defecto Nueva), Origen (Formulario, Comunidad de WhatsApp, Webinar), Fecha (Hoy, 7 días, 30 días, Personalizado). «Limpiar filtros».
3. Búsqueda por nombre o empresa. **No** por correo ni teléfono en la URL: si se busca por esos, el texto va en el cuerpo del pedido, no en la dirección.
4. Tabla: Recibida (fecha y hora), Nombre, Empresa, Origen, Asunto (recortado), Estado. Ordenada por Recibida, la más nueva arriba.
5. Paginación: 25 por página (opciones 25, 50, 100), «1–25 de 124».
- En el celular, cada fila pasa a ser una tarjeta con nombre, origen, fecha y estado.

### `/admin/consultas/[id]`
1. Nombre, empresa y la fecha en que llegó.
2. Datos de contacto: correo y teléfono, con botones «Escribir por correo» (`mailto:`) y «Escribir por WhatsApp» (`https://wa.me/<teléfono>`).
3. Asunto y mensaje completos.
4. Estado actual y botones para cambiarlo (Contactada, Cerrada). Cada cambio pide confirmación y queda en la auditoría.
5. Historial de cambios de esa consulta (de la auditoría): quién, qué y cuándo.
- Si el `id` no existe: estado «No encontramos esa consulta», con link a la lista.

### `/admin/auditoria` (solo `admin`)
1. Filtros en la URL: Persona, Acción, Entidad, Fecha.
2. Tabla: Fecha y hora, Persona, Acción (en palabras: «Cambió el estado de una consulta»), Sobre qué (con link), Detalle (el cambio), IP.
3. Paginación por cursor (la tabla crece siempre), 50 por página, la más nueva arriba.
- Solo lectura. Sin exportación en la primera versión.

### `/admin/cuenta`
1. Nombre y correo (solo lectura; los cambia un `admin`).
2. Cambiar contraseña: actual, nueva (mínimo 8 caracteres porque hay segundo factor; máximo 128; sin reglas de mayúsculas o números) y confirmación. Al cambiarla, ofrecer «Cerrar las otras sesiones».
3. Segundo factor: «Generar códigos de respaldo nuevos» (invalida los anteriores).
4. Sesiones abiertas: dispositivo y fecha; «Cerrar todas las otras».
5. Botón «Salir».

### `/admin/inscripciones`
1. Selector de webinar o curso en vivo (los que tienen fecha, la próxima arriba).
2. Fecha, cupo y cuántos inscriptos.
3. Tabla: Nombre, Correo, Fecha de inscripción.
4. «Exportar CSV»: queda en la auditoría con la cantidad de filas.

### `/admin/cursos`
1. Filtros: Modalidad, Publicado, Con fecha próxima.
2. Tabla: Código, Título, Modalidad, Precio, Próxima fecha, Publicado.
3. Botón «Nuevo curso».

### `/admin/cursos/[id]`
1. Datos del curso (los campos de `catalog.Course` más los que agregue Mateo; ver `04-DATOS.md`).
2. Fechas: lista con inicio, fin, cupo, ocupados y estado; «Agregar fecha». Una fecha con inscriptos o compras no se borra: se cancela.
3. «Guardar» con confirmación; queda en la auditoría.

### `/admin/ordenes`
1. Filtros: Estado (por defecto Pagada), Fecha, Curso.
2. Tabla: Fecha, Orden (los primeros 8 caracteres del `public_id`), Comprador, Curso, Total, Estado.
3. Totales del filtro: cantidad y suma.

### `/admin/ordenes/[publicId]`
1. Estado y fechas (creada, pagada, cumplida).
2. Comprador: nombre, correo, teléfono, empresa, DNI. El DNI se muestra enmascarado (`**.***.456`) con «Mostrar», que queda en la auditoría.
3. Ítems: curso, fecha, cantidad, precio al momento de comprar, total.
4. Pago: medio, identificador de Mercado Pago y estado. Sin el contenido completo del aviso de pago.
5. Notas internas (editable).
6. Botón «Marcar como cumplida» (solo si está Pagada), con confirmación: «¿Ya le diste acceso al aula virtual?».
7. Historial de la orden (de la auditoría).
