---
name: verify-elevar
description: Manejar el panel interno de ELEVAR (Next.js en frontend/ + Django en backend/) como una persona con sesión y probar que una pantalla funciona - levantar la base local, el backend y el sitio, crear la cuenta inventada con segundo factor, cargar datos de muestra, recorrer rutas a 360/375/412/1440/1920 con capturas, chequeo de saltos de línea, desborde y consola. Usar cuando Mateo dice «verificá», o antes de entregar un cambio que se ve en el panel (Inicio, Consultas, Órdenes, Inscripciones, Cursos, Auditoría, Mi cuenta).
---

# Verificar el panel de ELEVAR

El panel vive en `/admin` del sitio (`frontend/`) y le pide todo a Django (`backend/`, API en `/api/v1/panel/`). Se prueba **solo en local**, contra la base `elevar_e2e`, con una cuenta inventada (`visor.local@ejemplo.com`) y datos inventados (nombres «Prueba …», correos `@ejemplo.com`). **Nunca contra producción** ni con datos de personas reales. No se abre ningún `.env` ni se imprime un secreto: la clave y el secreto del segundo factor de la cuenta inventada van a un archivo, nunca al chat.

Todo lo que deja una corrida va **fuera del repo**: `$EV` = `<scratchpad>/verify-elevar/<AAAA-MM-DD-HHMM>/`, y la cuenta en `$EV/../visor.json`.

## Launch

1. **Docker Desktop prendido** y la base: `docker start elevar-db` (Postgres en `127.0.0.1:5434`). Si el contenedor está parado, los comandos de Django se cuelgan sin avisar.
2. **Ajuste local** (el 3000 lo usa otro proyecto, el sitio corre en 3100): `scripts/panel_local_3100.py` suma `http://localhost:3100` a CSRF y CORS. Se usa poniendo la carpeta `scripts/` en `PYTHONPATH`.
3. **Backend** en segundo plano (Bash con `run_in_background`), desde `backend/`:
   `export PYTHONPATH="<repo>/frontend/.claude/skills/verify-elevar/scripts" DB_PORT=5434 DB_NAME=elevar_e2e DJANGO_SETTINGS_MODULE=panel_local_3100 PANEL_PUENTE_CLAVE=clave-solo-local-de-prueba && .venv/Scripts/python manage.py runserver 8001 --noreload`
   Si una pantalla da 500 por una columna que falta: con las mismas variables, `.venv/Scripts/python manage.py migrate` (solo `elevar_e2e`).
4. **Sitio** en segundo plano, desde `frontend/`:
   `PANEL_API_URL=http://localhost:8001 NEXT_PUBLIC_API_URL=http://localhost:8001 PANEL_PUENTE_CLAVE=clave-solo-local-de-prueba npx next dev -p 3100`
   Listo cuando `curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/admin/ingresar` da `200`. Nunca `next build` con el dev prendido.
5. **Cuenta inventada y datos de muestra** (con las variables del paso 3, desde `backend/`):
   `SALIDA_VISOR="$EV/../visor.json" .venv/Scripts/python manage.py shell -c "exec(open(r'<skill>/scripts/usuario_visor.py', encoding='utf-8').read())"`
   `.venv/Scripts/python manage.py shell -c "exec(open(r'<skill>/scripts/sembrar_inicio.py', encoding='utf-8').read())"`
   Con `-c` y no con `<`: la consola interactiva de Django se traba con las funciones del archivo de siembra.
   Los dos se niegan a correr si la base no es `elevar_e2e`. El primero deja la cuenta lista con el segundo factor confirmado; el segundo carga en dos tandas un año de consultas, compras, fechas e inscripciones inventadas, más pedidos de arrepentimiento, compras sin completar, inscriptas que después compraron y consultas contestadas; no repite lo que ya cargó.
6. **Playwright**: una vez por scratchpad, `mkdir -p "<scratchpad>/verify-elevar/pw" && cd "<scratchpad>/verify-elevar/pw" && npm init -y >/dev/null && npm i playwright@1 && npx playwright install chromium`, y copiar ahí `scripts/*.mjs` (buscan `playwright` desde su propia carpeta).

## Doctor

`node scripts/doctor.mjs "$EV/../visor.json"` — de solo lectura: el backend responde (`/api/v1/panel/csrf/` → 200), el sitio responde (`/admin/ingresar` → 200), y la cuenta existe y es `@ejemplo.com`. Si falla la cuenta, se repite el paso 5.

## Drive

Parado en `<scratchpad>/verify-elevar/pw`:

`MSYS_NO_PATHCONV=1 node recorrer.mjs --visor "$EV/../visor.json" --salida "$EV" --rutas /admin,/admin/consultas [--anchos 360,375,412,1440,1920] [--espera 3000]`

- Entra por la pantalla real de ingreso (correo, contraseña y el código de 6 dígitos calculado con el secreto de la cuenta), y con esa sesión abre cada ruta a cada ancho. Menos de 768 se abre como celular táctil.
- Por cada una: chequeo de saltos de línea sobre `main` (`scripts/saltos.mjs`, el mismo del portal CESS: corta con lugar, palabra sola abajo, línea que termina en «de/la/y…», texto que se sale), desborde horizontal, errores de consola y captura de la página entera.
- Sale con 1 si algo falla e imprime cada hallazgo. Deja `informe.json` en `$EV`.
- Lo que hay que mirar en cada pantalla, además del recorrido: `features/`.
- Un flujo que escribe (contestar una consulta, marcar una orden cumplida) se prueba con un script chico de Playwright en el scratchpad que haga los clicks reales, y después se mira el efecto en la base local (consulta de solo lectura con `manage.py shell`).

## Evidence

- La prueba es el camino real: la pantalla de ingreso, los clicks, los teclados. Nada de llamar a la API a mano para dar algo por probado.
- Se capturan el estado de entrada y el que queda (cerrado y abierto, antes y después).
- Al reportar: qué pasó, qué falló, la ruta de `$EV` y las capturas a Mateo (SendUserFile). Lo que no se pudo probar (un celular real, producción, «menos movimiento») se dice como no probado.
- Saltos de línea: **0** a los cinco anchos antes de entregar, y además mirar la captura del celular.
- Las capturas en el panel de Chrome pueden tener la insignia de desarrollo de Next («N») abajo a la izquierda: no es parte del panel.

## Cleanup

- Backend y sitio: solo si los arrancaste en esta corrida, se paran con TaskStop de **esas** tareas. Nunca matar `node.exe` o `python.exe` por nombre: en esta máquina corren otros proyectos (el portal CESS en el 3000).
- La base: si la prendiste vos, `docker stop elevar-db`; si ya estaba arriba, se deja.
- Los datos inventados se quedan en `elevar_e2e` (sirven para la próxima corrida). Si hay que sacarlos: todo lo que tiene correo `semilla.*@ejemplo.com`, solo en esa base.
- **La carpeta `$EV` no se borra**: es la prueba.

## Helpers

| Script | Para qué |
|---|---|
| `scripts/doctor.mjs` | Chequeo de solo lectura de la instancia |
| `scripts/recorrer.mjs` | Ingreso real y recorrido con capturas, saltos, desborde y consola |
| `scripts/saltos.mjs` | La función del chequeo de saltos (`page.evaluate(revisar, [ENLACE, "main"])`) |
| `scripts/usuario_visor.py` | La cuenta inventada con segundo factor (escribe clave y secreto en un archivo) |
| `scripts/sembrar_inicio.py` | Un año de datos inventados para el Inicio |
| `scripts/panel_local_3100.py` | Ajuste de Django para el sitio en el 3100 |

Mapa de pantallas: `features/README.md`.
