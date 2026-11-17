# 01 — Qué es el sistema interno

## En una oración

Un panel con login donde Laura, de ELEVAR, atiende lo que entra por el sitio: consultas, inscripciones a webinars y compras de cursos, y mantiene al día los cursos y sus fechas.

## Quién lo usa

| Persona | Qué hace en el panel | Rol |
|---|---|---|
| Laura (dirección de ELEVAR) | Todo: consultas, órdenes, inscripciones, cursos, auditoría y su cuenta | `admin` |

**Hay un solo usuario: el de Laura** (Mateo, 2026-11-17). No hay rol `operador` ni pantalla de usuarios. Ni Mateo ni quien construye el panel tienen cuenta: el soporte (alta, baja, reinicio del segundo factor) se hace con comandos de Django desde el backend (`09-ETAPAS.md`).

No hay usuarios externos: los compradores **no** tienen cuenta. Un comprador ve su orden por un link con un identificador aleatorio (UUID), sin login.

## Las tareas concretas

| # | Tarea | Hoy se hace en | Qué resuelve el panel |
|---|---|---|---|
| 1 | Ver las consultas que llegan por el formulario de contacto y la comunidad de WhatsApp, y marcar cuáles se contestaron | El admin de Django (`/admin/` del backend) y un mail de aviso a info@elevar.com.ar | Una lista con filtros por estado y origen, y el cambio de estado queda registrado con quién y cuándo |
| 2 | Ver las compras y marcar como «cumplida» la orden después de darle acceso al alumno en el aula virtual | Las órdenes hoy quedan solo en el navegador del comprador (ver `04-DATOS.md`) | La lista de órdenes pagadas pendientes de cumplir, con el comprador y el curso |
| 3 | Ver quién se anotó a cada webinar | Las inscripciones hoy quedan solo en el navegador | Lista por webinar, con exportación |
| 4 | Cargar cursos y fechas nuevas | Un archivo JSON dentro del repo del frontend | Alta y edición de cursos y fechas sin tocar código |
| 5 | Dar de alta la cuenta de Laura y reiniciarle el segundo factor si pierde el teléfono | Solo por consola en el backend | Sigue por consola: comandos de Django con su auditoría (no hay pantalla de usuarios) |
| 6 | Saber quién hizo qué | No existe | Pantalla de auditoría, solo para `admin` |

Las tareas 2, 3 y 4 dependen de que la parte pública guarde sus datos en la base. Eso lo hace Mateo (ver `03-FRONTERA.md` y `09-ETAPAS.md`).

## Qué queda afuera de la primera versión

| Afuera | Por qué |
|---|---|
| Facturación electrónica (ARCA) | Fase 2. Hoy Laura emite la factura a mano |
| Alta automática del alumno en el aula virtual (aulavirtual.elevar.com.ar) | Fase 2. Hoy Laura lo hace a mano y después marca la orden como cumplida |
| Blog | Mateo no quiere blog en esta etapa |
| Promociones y cupones editables desde el panel | {{CONFIRMAR}} con Mateo. Hoy viven en el código del frontend |
| Cuentas de compradores, reseñas, programa de referidos | Fuera del alcance del proyecto |
| Gráficos y tableros de ventas | Después de que haya datos reales de ventas en la base |
| Mails o WhatsApp enviados desde el panel | Los mails automáticos ya los manda el backend; el panel no envía nada nuevo en esta versión |
| Subida de archivos (portadas, PDF de cursos) | {{CONFIRMAR}} si hace falta en la primera versión |

## Qué existe hoy y se reemplaza

En `elevar-web` hay una **demo** del panel en `app/admin/`, `components/admin/` y `lib/admin/`. Guarda todo en el `localStorage` del navegador y tiene un usuario y una contraseña escritos en `lib/admin/auth.ts`: **no protege nada y no ve datos reales**. El panel nuevo la reemplaza. Se puede reusar su estructura de pantallas y sus componentes visuales (`components/admin/ui.tsx`), pero nada de su login ni de su forma de guardar datos.

En `elevar-backend` está el admin de Django en `/admin/`, que hoy usa Laura para ver las consultas. Qué pasa con él cuando exista el panel está en `10-PENDIENTES.md`.

## Nivel de seguridad

**El más alto de los tres que usamos: S3.** El sistema guarda nombre, correo, teléfono, empresa y DNI de compradores, y registra pagos. Eso obliga a segundo factor para todos, sesiones cortas y auditoría. El detalle está en `07-SEGURIDAD.md`.
