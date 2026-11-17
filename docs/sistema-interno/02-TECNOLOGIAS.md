# 02 — Tecnologías y versiones

Leídas el 2026-11-17 de `elevar-web/pnpm-lock.yaml` (versión instalada, no la del rango del `package.json`), de `elevar-backend/requirements.txt` con `pip list` sobre el entorno instalado, del `Dockerfile` y del `docker-compose.yml`. **Antes de usar un dato de esta tabla, volvé a leerlo de esos archivos.** Si no coincide, gana el archivo y se avisa (regla 1 del arranque).

## Cómo está armado

```
Navegador ──► elevar-web (Next.js, en Vercel) ──► elevar-backend (Django + DRF, en Railway) ──► Postgres (Railway)
               sitio público + pantallas del panel      API pública + API del panel + login
```

- Las **pantallas** del panel son páginas de Next.js dentro de `elevar-web`.
- El **login, la sesión, los permisos, la auditoría y los datos** viven en Django, en `elevar-backend`.
- El navegador del panel le habla a Django **a través de Next** (misma dirección del sitio). Decidido por Mateo el 2026-11-17 (decisión 1 de `10-PENDIENTES.md`); el detalle, en `07-SEGURIDAD.md`, «Cómo viaja la sesión».

## Frontend — `elevar-web`

| Qué | Versión instalada | Nota |
|---|---|---|
| Next.js | 15.5.28 | App Router. **Ver «Versiones bajo el piso» abajo** |
| React / React DOM | 19.3.1 | |
| TypeScript | 5.9.3 | `strict: true` en `tsconfig.json` |
| Tailwind CSS | 3.4.19 | Colores y medidas en `tailwind.config.ts` (ver `06-DISENO.md`) |
| PostCSS / Autoprefixer | 8.5.32 / 10.5.0 | |
| ESLint / eslint-config-next | 8.57.1 / 15.5.28 | `pnpm lint` |
| Radix UI (dialog, dropdown-menu, accordion) | 1.1.15 / 2.1.16 / 1.2.12 | Ya instalados: usarlos para diálogos y menús del panel |
| big.js | 6.2.2 | Para cuentas con plata en el navegador. Nunca `Number` para plata |
| GSAP / @gsap/react | 3.15.0 / 2.1.2 | Animaciones del sitio público. En el panel, solo para avisos cortos (ver `06-DISENO.md`) |
| framer-motion | 11.18.2 | Ídem |
| lenis | 1.3.23 | Scroll suave del sitio público. **No va en el panel** |
| Gestor de paquetes | pnpm, con `pnpm-lock.yaml` | Instalar siempre con `pnpm install --frozen-lockfile` |
| Hosting | Vercel (proyecto `elevar`, dirección de prueba `elevar-sandy.vercel.app`) | |
| Node.js | {{CONFIRMAR}} la versión que usa Vercel en el proyecto. No hay `engines` ni `.nvmrc` | |

No están instalados: librería de íconos (los íconos son SVG escritos a mano en cada componente), Zod, una librería de tablas, ni herramientas de pruebas del frontend. Lo que haga falta agregar se pide según `03-FRONTERA.md` («Dependencias nuevas»).

## Backend — `elevar-backend`

| Qué | Versión instalada | Nota |
|---|---|---|
| Python | 3.12 | Imagen `python:3.12-slim` del `Dockerfile` |
| Django | 5.2.19 | Rama con soporte hasta 2028-04. Pin: `>=5.2.19,<5.3` |
| Django REST framework | 3.18.3 | Pin: `>=3.18.2,<3.19` (arregla tres alertas de seguridad publicadas el 2026-10-22) |
| django-cors-headers | 4.9.0 | |
| psycopg | 3.2.13 | Pin `<3.3` |
| django-ratelimit | 4.1.0 | Límite de pedidos por IP. Ya instalado |
| django-storages / boto3 | 1.14.6 / 1.43.126 | Archivos en S3 si se configura `AWS_STORAGE_BUCKET_NAME` |
| django-ses | 4.9.0 | Instalado, pero los mails salen por la API de Resend (`core/email_backends.py`): Railway bloquea SMTP |
| mercadopago (SDK) | 3.6.0 | El cobro hoy lo hace el frontend (ver `04-DATOS.md`) |
| gunicorn | 26.2.0 | Servidor de producción (`Dockerfile`) |
| whitenoise | 6.12.0 | Archivos estáticos del admin de Django |
| Pillow | 13.0.0 | |
| requests | 2.34.2 | API de Resend |
| Pruebas | pytest 9.2.0 + pytest-django 4.14.0 + factory-boy 3.3.3 | Configuración en `pyproject.toml`: carpeta `tests/`, ajustes `config.settings.development` |
| Calidad | ruff 0.17.4, black, isort, mypy + django-stubs | `ruff check .` tiene hoy 10 avisos B904 heredados: no sumar nuevos |
| Base local | Postgres 16 (`docker-compose.yml`, puerto 5434 de la máquina) | |
| Base de producción | Postgres en Railway, mismo proyecto que el backend | {{CONFIRMAR}} versión y región |
| Hosting | Railway: proyecto `elevar`, entorno `production`, servicio `backend` | La cuenta de Railway es de ELEVAR. Las migraciones corren al arrancar el contenedor (`CMD` del `Dockerfile`) |

## Dependencias nuevas que el panel necesita

Ninguna está instalada. Se agregan **en la etapa que las usa**, con la versión exacta anotada acá en el mismo PR, después de revisar que no tenga alertas publicadas para esa versión (`pip-audit` o los avisos de seguridad de GitHub del paquete).

| Paquete | Para qué | Etapa |
|---|---|---|
| `django-otp` | Segundo factor con código de una app autenticadora (TOTP) y códigos de respaldo | 1 |
| `argon2-cffi` | Guardar contraseñas con Argon2id | 1 |
| `@playwright/test` (frontend, solo desarrollo) | Pruebas de punta a punta del panel | 2 |

Versiones: {{CONFIRMAR}} al instalar. Cualquier otra dependencia: se pregunta antes.

## Versiones bajo el piso de seguridad

| Qué | Instalada | Piso | Por qué | Quién la sube |
|---|---|---|---|---|
| Next.js 15 | 15.5.28 | 15.5.29 | Tanda de seguridad de Next del 2026-11-03: siete fallas; la más grave hace que la caché le sirva a un usuario datos de otro. Fuente: https://nextjs.org/blog/november-2026-security-release | Mateo (el `package.json` es compartido). **Tiene que estar subida antes de que el panel muestre datos reales** |

## Prohibido

| Prohibido | Motivo |
|---|---|
| Guardar un token o la sesión en `localStorage` o `sessionStorage` | Cualquier script que corra en la página lo lee. La sesión va en una cookie que el navegador no deja leer a JavaScript (`07-SEGURIDAD.md`) |
| Usar la demo de login de `lib/admin/auth.ts` | No verifica nada en el servidor y tiene una contraseña escrita en el código |
| Leer o escribir datos del panel desde `lib/local-db.ts` | Es el «mockup» del navegador; el panel trabaja solo contra la API de Django |
| Hacer la autorización solo en Next (middleware, layout, componente) | Se saltea pidiendo la API directo. La autorización es de Django |
| `float` para plata, en Python o en TypeScript | Redondeos. `Decimal` en Python, `big.js` en el navegador, texto (`"15000.00"`) en el JSON |
| `datetime.now()` | Sin zona. Siempre `django.utils.timezone.now()`. Todo se guarda en UTC |
| Cambiar de librería (de tablas, de formularios, de íconos) o sumar una sin acordarlo | Dos personas trabajando en paralelo: cada librería nueva la paga el otro |
| Crear o modificar un `.env.example` | Regla del dueño del proyecto |
| Subir `.env`, claves, certificados o datos reales al repositorio | Ver `07-SEGURIDAD.md`, «Secretos» |
| `next build` con el servidor de desarrollo levantado | Rompe `.next` |
| Tocar archivos de la parte pública sin PR revisado por Mateo | `03-FRONTERA.md` |
