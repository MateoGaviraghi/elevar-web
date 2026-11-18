# 04 — Modelo de datos

Fuente: los modelos de Django en `elevar-backend` (`catalog/models.py`, `orders/models.py`, `leads/models.py`), leídos el 2026-11-17. **Si esto y los modelos no coinciden, se para y se pregunta.**

Leyenda: **Existe** = ya está en la base. **Nuevo (panel)** = lo crea el panel en su app `panel`. **Nuevo (Mateo)** = lo agrega Mateo en su app, antes de la etapa que lo usa.

## Reglas para toda tabla nueva

- Plata: `DecimalField(max_digits=12, decimal_places=2)`. Nunca `FloatField`.
- Fechas con hora: `DateTimeField`, guardadas en UTC (`USE_TZ = True`). Se muestran en hora de Argentina (`America/Argentina/Cordoba`) recién en la pantalla.
- Texto: `CharField`/`TextField` con `blank=True, default=""`. Nunca `null=True` en texto.
- Toda tabla nueva lleva `created_at` (`auto_now_add`) y `updated_at` (`auto_now`).
- Estados: `TextChoices` en el modelo, como los que ya existen.
- Lo que se vendió se copia al momento de la compra (`OrderItem.title_snapshot`, `unit_price`): nunca se recalcula con el precio de hoy.
- Un cambio de estado se hace con condición y se mira cuántas filas cambió:
  `Order.objects.filter(pk=..., status="PAID").update(status="FULFILLED", fulfilled_at=now())` → si devuelve 0, otro ya lo hizo: no se repite el efecto ni la auditoría.
- Varias tablas en un mismo cambio: `transaction.atomic()`.
- Nombres de tabla de Django por defecto (`<app>_<modelo>`).

## Lo que ya existe (lo creó la parte pública)

### `catalog.Category` — Existe
`name` (único), `slug` (único), `order`.

### `catalog.Course` — Existe
`code` (único, p. ej. `CV57`), `title`, `slug` (único), `summary`, `description`, `category` → Category (PROTECT), `modality` (`ASYNC`, `LIVE`, `WEBINAR`, `WORKSHOP`), `price` Decimal(12,2), `currency` (default `ARS`), `cover_image`, `level`, `duration_hours`, `instructor_names`, `is_published`, `is_featured`, `badge` (`NUEVO`, `PROXIMO` o vacío), `created_at`, `updated_at`.
`WORKSHOP` queda en el modelo a propósito, aunque el sitio ya no muestra talleres: no se borra.

**Hoy el sitio no lee esta tabla.** Los cursos que se ven en el sitio salen de `elevar-web/lib/data/cursos-elevar.json` (78 cursos). Pasar el catálogo a la base es trabajo de Mateo y es condición de la etapa de cursos del panel. Columnas que el JSON tiene y el modelo no: objetivos, temario (lista), rol del disertante, precio en dólares, si es gratuito, PDF del curso. **Nuevo (Mateo)**, {{CONFIRMAR}} nombres y tipos con Mateo.

### `catalog.CourseSession` — Existe
Una fecha de un curso. `course` → Course (CASCADE), `starts_at`, `ends_at` (UTC), `timezone` (default `America/Argentina/Cordoba`, solo para mostrar), `capacity` (vacío = sin cupo), `seats_taken`, `status` (`SCHEDULED`, `CANCELLED`, `FINISHED`).
- Solo existe para `LIVE` y `WEBINAR` (lo valida `clean()`).
- **Un curso tiene muchas fechas.** Para repetir un curso se le agrega una fecha nueva; nunca se duplica el curso.
- `seats_taken` se suma **solo** cuando el pago se confirma, dentro de una transacción con `select_for_update()`. El panel no lo toca a mano.
- En el sitio, un curso en vivo o un webinar cuyas fechas ya pasaron todas no se muestra; vuelve solo cuando tiene una fecha nueva.

### `catalog.WebinarRegistration` — Existe
`session` → CourseSession (CASCADE), `email`, `name`, `created_at`. Único por (`session`, `email`).
**Hoy el sitio no la usa:** las inscripciones quedan en el navegador. Mandarlas al backend es trabajo de Mateo y es condición de la etapa de inscripciones.

### `orders.Order` — Existe
`public_id` (UUID, único, el único identificador que sale afuera), `buyer_email`, `buyer_name`, `buyer_phone`, `status` (`PENDING`, `PAID`, `FAILED`, `CANCELLED`, `FULFILLED`), `subtotal`, `total`, `currency`, `mp_preference_id`, `mp_payment_id`, `mp_status`, `created_at`, `paid_at`, `fulfilled_at`, `admin_notes`.
- **Nunca** se muestra ni se usa en una URL el `id` numérico: siempre `public_id`.
- Faltan para el panel: `buyer_dni` y `buyer_company` (el checkout ya los pide). **Nuevo (Mateo).**
- **Hoy el sitio no guarda órdenes en esta tabla.** El checkout crea el cobro de Mercado Pago desde Next (`app/api/mercadopago/`) y guarda la orden en el navegador del comprador. Tampoco existe todavía el aviso de pago (webhook) que marca la orden como pagada. Las dos cosas son de Mateo y son condición de la etapa de órdenes.

### `orders.OrderItem` — Existe
`order` → Order (CASCADE), `course` → Course (PROTECT), `session` → CourseSession (SET_NULL, opcional), `title_snapshot`, `unit_price`, `quantity`.

### `orders.PaymentEvent` — Existe
Cada aviso de pago recibido. `order` (opcional), `mp_event_id` (**único**: evita procesar dos veces el mismo aviso), `mp_payment_id`, `event_type`, `raw_payload` (JSON, **tiene datos personales del comprador: no se muestra entero en el panel ni va a ningún registro de errores**), `status`, `processed_at`. El panel solo lee.

### `leads.Lead` — Existe
Consultas del formulario de contacto y de la comunidad de WhatsApp. `name`, `email`, `company`, `phone`, `subject`, `message`, `source` (`CONTACTO`, `COMUNIDAD`, `WEBINAR`), `status` (`NEW`, `CONTACTED`, `CLOSED`), `created_at`.
- **Esta es la única tabla que hoy recibe datos reales del sitio.** Por eso la primera pantalla con datos del panel es la de consultas.
- Faltan para el panel: `updated_at`. **Nuevo (Mateo)**, pedido por el panel según `03-FRONTERA.md`.
- En la base de producción hay consultas de prueba («Prueba…», «Comunidad…», «Ana Pérez», «Prueba de mails»). Se borran desde el panel o el admin cuando Laura lo decida; nunca por SQL directo.

### `auth.User` — Existe (de Django)
Hoy hay un superusuario (`laura`) para el admin de Django. El login acepta usuario o correo (`core/auth_backends.py`); un correo repetido entre dos usuarios no entra. **Los correos de usuarios del panel tienen que ser únicos.**

## Lo nuevo del panel (app `panel`)

### `panel.Perfil` — Nuevo (panel)
Uno por cada usuario del panel. Atado a `auth.User`.

| Columna | Tipo | Regla |
|---|---|---|
| `user` | OneToOne → `auth.User` (CASCADE) | |
| `rol` | texto con una sola opción hoy: `admin` | Obligatorio. Sin rol, no entra. Se deja el campo para poder sumar un rol más adelante sin migrar datos |
| `activo` | booleano, default `true` | Dar de baja = `activo=false` y cerrar todas sus sesiones. No se borra el usuario (la auditoría lo referencia) |
| `email` | texto, en minúsculas | Identificador del panel. Único entre usuarios del panel: `UniqueConstraint(Lower("email"))` (decidido 2026-11-18) |
| `segundo_factor_listo` | booleano, default `false` | `true` recién cuando confirmó un código de su app |
| `debe_cambiar_clave` | booleano, default `false` | `true` con la contraseña temporal del alta: se cambia en el primer ingreso |
| `clave_temporal_vence` | fecha y hora, opcional | 72 h después del alta. Vencida, no entra |
| `created_at`, `updated_at` | fecha y hora | |

El correo del panel vive en `Perfil.email`, en minúsculas y único entre usuarios del panel (restricción en la base sobre `lower(email)`). No se pone un índice único en `auth_user`: valdría para todos los usuarios de Django (decidido 2026-11-18).

### Segundo factor — Nuevo (panel, tablas de `django-otp`)
`otp_totp.TOTPDevice` (la app autenticadora), con las migraciones de la librería. Los 10 códigos de respaldo de un solo uso van en `panel.CodigoRespaldo` (`user`, `hash` SHA-256, `usado_en`, `created_at`, `updated_at`): `otp_static` los guarda en texto plano y 07 pide hash (decidido 2026-11-18). Lo que se guarda en la base para la app autenticadora es un secreto: {{CONFIRMAR}} si se cifra la columna (ver `07-SEGURIDAD.md`).

### `panel.IntentoIngreso` — Nuevo (panel)
Para el límite de intentos por cuenta.

| Columna | Tipo |
|---|---|
| `email` | texto, en minúsculas (aunque la cuenta no exista) |
| `ip` | `GenericIPAddressField` |
| `paso` | `clave` o `codigo` |
| `ok` | booleano |
| `created_at` | fecha y hora |

Índice: (`email`, `created_at`). Se borran las filas de más de 90 días con una tarea programada {{CONFIRMAR}} dónde corre.

### `panel.EventoAuditoria` — Nuevo (panel)
Registro de solo agregado: quién hizo qué, sobre qué y cuándo.

| Columna | Tipo | Regla |
|---|---|---|
| `actor` | FK → `auth.User` (PROTECT), opcional | Sale de la sesión del servidor, **nunca** del pedido. Vacío solo en eventos del sistema o en ingresos fallidos |
| `accion` | texto | Lista cerrada en `panel/auditoria.py`, p. ej. `ingreso.ok`, `ingreso.fallido`, `ingreso.bloqueado`, `codigo.fallido`, `sesion.cerrada`, `consulta.estado`, `orden.cumplida`, `usuario.alta`, `usuario.baja`, `usuario.rol`, `exportacion`, `permiso.denegado` |
| `entidad` | texto | `lead`, `order`, `course`, `course_session`, `user`, … |
| `entidad_id` | texto | `public_id` en órdenes; el id en lo demás |
| `detalle` | JSON | Qué cambió (`{"status": ["NEW", "CONTACTED"]}`) o cuántas filas se exportaron. **Sin datos personales enteros**: ni DNI, ni teléfono, ni el mensaje |
| `ip` | `GenericIPAddressField` | |
| `created_at` | fecha y hora | |

- No se puede modificar ni borrar: el modelo lanza un error en `save()` sobre un registro existente y en `delete()`, y una migración agrega un disparador de Postgres que rechaza `UPDATE` y `DELETE` en la tabla (funciona aunque el usuario de la base sea el dueño de la tabla).
- Se escribe **en la misma transacción** que el cambio que registra. Si el cambio falla, no queda evento; si el evento falla, el cambio no se hace.
- Índices: (`created_at`), (`entidad`, `entidad_id`), (`actor`, `created_at`).
- Retención: {{CONFIRMAR}} con Laura. Mientras no se decida, no se borra nada.

### Sesiones
Las de Django (`django_session`, ya existe la tabla). El panel guarda en la sesión: la hora de ingreso y la hora del último uso (ver `07-SEGURIDAD.md`).

## Relaciones

```
auth.User 1──1 panel.Perfil
auth.User 1──* panel.EventoAuditoria (actor)
auth.User 1──* otp TOTPDevice
auth.User 1──* panel.CodigoRespaldo
catalog.Category 1──* catalog.Course 1──* catalog.CourseSession 1──* catalog.WebinarRegistration
orders.Order 1──* orders.OrderItem *──1 catalog.Course
orders.OrderItem *──1 catalog.CourseSession (opcional)
orders.Order 1──* orders.PaymentEvent
leads.Lead (sola)
```

## Lo que el panel puede escribir

| Tabla | El panel puede | Rol |
|---|---|---|
| `leads.Lead` | Cambiar `status` | `admin` |
| `orders.Order` | PAID → FULFILLED (con `fulfilled_at`), escribir `admin_notes` | `admin` |
| `catalog.Course`, `CourseSession` | Crear y editar (etapa de cursos) | `admin` |
| `auth.User` + `panel.Perfil` | Nada desde el panel: alta, baja y reinicio del segundo factor por comandos de Django | — |
| `orders.PaymentEvent`, `catalog.WebinarRegistration` | Solo leer | `admin` |
| `panel.EventoAuditoria` | Solo leer | `admin` |

Rutas del panel en `/api/v1/panel/` (etapas 3 a 7): `inicio/`, `consultas/`, `consultas/<id>/`, `consultas/<id>/estado/`, `auditoria/` (cursor), `cuenta/clave/`, `cuenta/codigos-respaldo/`, `cuenta/sesiones/`, `cuenta/sesiones/cerrar-otras/`, `inscripciones/fechas/`, `inscripciones/?sesion=`, `inscripciones/exportar/?sesion=`, `categorias/`, `cursos/` (GET y POST), `cursos/<id>/` (GET y PATCH), `cursos/<id>/fechas/`, `fechas/<id>/` (PATCH), `fechas/<id>/cancelar/`, `ordenes/`, `ordenes/<public_id>/`, `ordenes/<public_id>/dni/`, `ordenes/<public_id>/cumplida/`, `ordenes/<public_id>/nota/`. Ninguna borra: una fecha se cancela.

Nada se borra desde el panel en la primera versión, salvo lo que diga `10-PENDIENTES.md`.
