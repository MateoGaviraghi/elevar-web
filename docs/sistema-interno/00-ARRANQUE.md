# Arranque — sistema interno de ELEVAR

Pegá este archivo entero en un chat nuevo. Quien lo recibe tiene solo esto y los dos repositorios.

---

Vas a construir el **sistema interno (panel) de ELEVAR**, una consultora argentina de calidad para laboratorios (ISO/IEC 17025) que vende cursos por internet. La parte pública del sitio la construye otra persona en paralelo (Mateo). Vos construís el panel. Los dos trabajan sobre los mismos repositorios, con las mismas reglas y el mismo diseño, sin pisarse archivos.

## Repositorios

| Repositorio | Qué tiene | Carpeta de trabajo |
|---|---|---|
| `MateoGaviraghi/elevar-web` | Sitio público en Next.js. Acá van las pantallas del panel | raíz del repo (`app/`, `components/`, `lib/`) |
| `MateoGaviraghi/elevar-backend` | API en Django + base Postgres. Acá van el login, los permisos y los datos del panel | raíz del repo (`config/`, `catalog/`, `orders/`, `leads/`, `core/`) |

Los documentos del plan están en `elevar-web`, carpeta `docs/sistema-interno/`.

## Orden de lectura (antes de tocar nada)

1. `docs/sistema-interno/01-QUE-ES.md` — qué es el panel y qué queda afuera.
2. `02-TECNOLOGIAS.md` — versiones exactas y lo prohibido.
3. `03-FRONTERA.md` — qué carpetas son tuyas, cuáles son compartidas, ramas y migraciones.
4. `07-SEGURIDAD.md` — entero. Es el más importante.
5. `09-ETAPAS.md` — la etapa en la que estás y su prueba.
6. Según la etapa: `04-DATOS.md`, `05-PANTALLAS.md`, `06-DISENO.md`, `08-CODIGO.md`.
7. `10-PENDIENTES.md` — lo que no está decidido. No lo decidas vos.

## Reglas que no se rompen

1. **Si el documento y el código no coinciden, parás y preguntás.** No elegís uno en silencio. Anotá la diferencia (archivo, línea, qué dice cada uno) y preguntale a quien te dio el trabajo.
2. **Lo marcado `{{CONFIRMAR}}` no se decide solo.** Se pregunta a quien figura en `10-PENDIENTES.md`. Mientras tanto se trabaja en lo que no depende de eso.
3. **No tocás archivos de la parte pública** (lista en `03-FRONTERA.md`). Si necesitás un cambio en un archivo compartido, lo pedís por PR y lo revisa Mateo.
4. **Nunca abrís un archivo `.env`** ni imprimís un secreto. De las variables, solo los nombres. **Nunca creás ni modificás un `.env.example`.**
5. **Ninguna versión se escribe de memoria.** Se lee del `pnpm-lock.yaml` (frontend) o se instala y se mira con `pip list` (backend).
6. **La seguridad se controla en el servidor (Django), siempre.** Esconder un botón en la pantalla no protege nada.
7. **Cada etapa termina con su prueba pasando** (`09-ETAPAS.md`). Si la prueba no se puede escribir, la etapa no está terminada.
8. **Nada se publica a producción** sin pasar la lista de `07-SEGURIDAD.md`, sección «Antes de publicar».
9. **Datos de prueba inventados.** Nunca una copia de la base de producción en local ni en una prueba.

## Cómo levantar todo en local

Backend (`elevar-backend`):
```
docker compose up -d            # Postgres 16 en el puerto que define docker-compose.yml
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt -r requirements-dev.txt   # Windows
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py runserver
.venv\Scripts\python -m pytest -q   # tienen que pasar todas antes de empezar
```
En Linux o Mac, `.venv/bin/python` en vez de `.venv\Scripts\python`.

Frontend (`elevar-web`):
```
pnpm install --frozen-lockfile
pnpm dev                        # http://localhost:3000
```
El backend local acepta pedidos del navegador solo desde `http://localhost:3000` (CORS en `config/settings/development.py`). Si el 3000 está ocupado, liberalo: no cambies el puerto sin revisar ese archivo.

**Nunca corras `next build` con `pnpm dev` levantado**: pisa la carpeta `.next` y rompe el servidor de desarrollo.

## Al empezar cada sesión de trabajo

1. `git status` y `git log --oneline -10` en los dos repos. Traé lo último de `main`.
2. Releé la etapa en curso en `09-ETAPAS.md`.
3. Corré las pruebas existentes. Si alguna falla antes de tocar nada, avisá: no la arregles sin preguntar.

## Al terminar cada sesión

1. Las pruebas de la etapa, con su salida a la vista.
2. Un resumen en el PR: qué quedó andando, qué no se probó y por qué, qué sigue.
3. Si cambió una decisión, se actualiza el documento que la contiene en el mismo PR.
