# 03 — La frontera: qué es de cada uno

Dos personas trabajan en paralelo sobre los mismos dos repositorios:

- **Mateo** — parte pública: el sitio, el carrito, el checkout, el cobro, los mails a compradores.
- **Panel** — quien construye el sistema interno (este plan).

La regla es simple: **cada archivo tiene un dueño**. Un archivo que no es tuyo se cambia solo por PR que revisa su dueño. Un archivo compartido, por PR que revisan los dos.

## `elevar-web` (frontend)

| Carpeta o archivo | Dueño | Nota |
|---|---|---|
| `app/admin/**` | Panel | Las pantallas del panel viven acá (reemplazan la demo) |
| `components/admin/**` | Panel | |
| `lib/admin/**` | Panel | El cliente de la API del panel y los tipos del panel |
| `app/api/panel/**` | Panel | El puente (proxy) de Next hacia la API del panel en Django (decisión 1 de `10-PENDIENTES.md`, tomada el 2026-11-17) |
| `docs/sistema-interno/**` | Los dos | Se actualiza en el mismo PR que cambia la decisión |
| `app/(site)/**`, `app/checkout/**`, `app/pago-mp/**`, `app/pago-paypal/**`, `app/api/mercadopago/**` | Mateo | |
| `components/**` salvo `components/admin/**` y `components/ui/**` | Mateo | |
| `lib/**` salvo `lib/admin/**` | Mateo | Incluye `lib/api.ts`, `lib/local-db.ts`, `lib/orders-store.ts`, `lib/data/cursos-elevar.json` |
| `components/ui/**` | Compartido | Botón, campo de formulario, insignia de estado. El panel puede usarlos; cambiarlos, por PR revisado por Mateo |
| `tailwind.config.ts`, `styles/tokens.css`, `app/globals.css`, `app/layout.tsx` | Compartido | Colores, tipografías y medidas. Un color o tamaño nuevo se agrega acá como token, por PR revisado por Mateo |
| `types/index.ts` | Compartido | Tipos que usan los dos. Los tipos solo del panel van en `lib/admin/` |
| `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | Compartido | Ver «Dependencias nuevas» |
| `next.config.mjs`, `tsconfig.json`, `.eslintrc*` | Compartido | |
| `scripts/**` | Mateo | |

La demo actual (`app/admin/**`, `components/admin/**`, `lib/admin/**`) pasa a ser del panel desde el primer PR. Las páginas de la demo que quedan afuera de la primera versión (`app/admin/blog/**`, `app/admin/promociones/**`) se borran en la etapa 2, salvo que `10-PENDIENTES.md` diga otra cosa.

## `elevar-backend`

| Carpeta o archivo | Dueño | Nota |
|---|---|---|
| `panel/` (app nueva de Django) | Panel | Usuarios del panel, roles, segundo factor, intentos de ingreso, auditoría, vistas de la API del panel (`/api/v1/panel/...`) |
| `tests/panel/` | Panel | Pruebas del panel |
| `catalog/`, `orders/`, `leads/`, `webhooks/` | Mateo | Modelos y API pública. Los usa el panel, pero los cambia Mateo |
| `core/` | Compartido | Hoy: login por correo o usuario (`core/auth_backends.py`), envío de mails, paginación, errores. Cambios por PR revisado por los dos |
| `config/settings/**`, `config/urls.py` | Compartido | El panel agrega su app en `INSTALLED_APPS` y su ruta en `urls.py`; todo cambio de seguridad (sesión, cookies, CORS) lo revisan los dos |
| `requirements.txt`, `requirements-dev.txt` | Compartido | Ver «Dependencias nuevas» |
| `Dockerfile`, `railway.json`, `docker-compose.yml` | Mateo | |
| `templates/emails/**`, `static/emails/**` | Mateo | |

### Si el panel necesita un cambio en un modelo de Mateo

Ejemplo: una columna nueva en `Lead` para guardar una nota interna.

1. El panel abre un issue o un PR chico **solo con el cambio del modelo y su migración**, en una rama propia.
2. Mateo lo revisa y lo une a `main` antes de que nadie cree otra migración en esa app.
3. Recién después, el panel usa la columna en su código.

No se mezcla en el mismo PR un cambio de modelo de Mateo con pantallas del panel.

## Migraciones de base

| Regla | Por qué |
|---|---|
| Cada app tiene un solo autor de migraciones: `panel` el panel; `catalog`, `orders`, `leads` Mateo | Dos migraciones con el mismo número en la misma app chocan al unirse |
| Nunca hay dos PR abiertos con migraciones de la misma app | Ídem |
| Antes de crear una migración: `git pull` de `main` y `python manage.py makemigrations --check --dry-run` en limpio | Evita partir de una base vieja |
| Las migraciones se generan con `makemigrations`, se leen antes de subir y van al repositorio | Producción se actualiza solo con ellas: el contenedor corre `migrate` al arrancar |
| Renombrar o borrar una columna que algo usa: en dos publicaciones | Primero se agrega lo nuevo y se copian los datos; cuando nada lee lo viejo, se borra. Nadie vuelve atrás una base |
| Índice sobre una tabla con datos: `AddIndexConcurrently` (`django.contrib.postgres.operations`) en una migración con `atomic = False` | Un índice normal bloquea las escrituras mientras se crea |
| Orden entre los dos | Las migraciones de Mateo que el panel necesita (`10-PENDIENTES.md`, columnas faltantes) van **antes** que las pantallas del panel que las usan. `09-ETAPAS.md` marca cuáles etapas esperan cuáles |

## Ramas y PR

Hoy los dos repos tienen solo `main` y Mateo publica directo ahí. Desde que empieza el panel:

| Regla | Ejemplo |
|---|---|
| El panel trabaja en ramas `panel/etapa-<n>-<tema>` y entra a `main` por PR | `panel/etapa-1-login`, `panel/etapa-3-consultas` |
| Mateo, en ramas `sitio/<tema>` cuando toca un archivo compartido o un modelo que el panel usa | `sitio/ordenes-en-la-base` |
| Commits con el formato `tipo(área): descripción` en castellano | `feat(panel): ingreso con segundo factor`, `fix(panel): la sesión vence a los 30 min sin uso` |
| Tipos permitidos | `feat`, `fix`, `docs`, `chore`, `refactor`, `test` |
| Un PR del panel incluye sus pruebas y la actualización de estos documentos si cambió una decisión | |
| Un PR de más de unas cientas de líneas se parte | |
| `main` se publica sola: el frontend en Vercel al hacer push; el backend lo publica Mateo con la CLI de Railway | {{CONFIRMAR}} si el panel también publica el backend (ver `10-PENDIENTES.md`) |

Lo que Mateo tiene en curso en `main` no se reescribe: nada de `push --force` sobre `main`.

## Dependencias nuevas

- Las del panel que ya están acordadas están en `02-TECNOLOGIAS.md`. Se agregan en un PR propio que toca solo `package.json` + `pnpm-lock.yaml` (o `requirements*.txt`), con la versión exacta y la revisión de alertas.
- Cualquier otra: se pregunta antes de instalarla.

## Nombres compartidos

| Qué | Nombre | Dónde |
|---|---|---|
| Ruta base de las pantallas | `/admin` | `elevar-web/app/admin/` |
| Ruta base de la API del panel en Django | `/api/v1/panel/` | `elevar-backend/panel/urls.py` |
| Ruta del puente en Next | `/api/panel/` | `elevar-web/app/api/panel/` |
| App de Django | `panel` | |
| Roles | `admin`, `operador` | `elevar-backend/panel/` (ver `04-DATOS.md`) |
| Nombre de la cookie de sesión del panel | `__Host-elevar_panel` | `07-SEGURIDAD.md` |
| Variables de entorno nuevas | Prefijo `PANEL_` (por ejemplo `PANEL_SESION_HORAS`) | Solo nombres; los valores los carga quien publica |
| Estados de una orden | `PENDING`, `PAID`, `FAILED`, `CANCELLED`, `FULFILLED` | `orders/models.py`. Transiciones válidas: PENDING→PAID, PENDING→FAILED, PENDING→CANCELLED, PAID→FULFILLED. Cualquier otra es un error |
| Estados de una consulta | `NEW`, `CONTACTED`, `CLOSED` | `leads/models.py` |
| Orígenes de una consulta | `CONTACTO`, `COMUNIDAD`, `WEBINAR` | `leads/models.py` |
