---
name: verify-elevar
description: Manejar ELEVAR (Next.js en frontend/ + Django en backend/) como una persona y probar que una pantalla funciona - el panel interno con sesión (cuenta inventada con segundo factor y datos de muestra) y el sitio público sin sesión (Inicio, Formación, cursos, Servicios, Nosotros, Blog, Promociones, compra, textos legales) - levantar la base local, el backend y el sitio, recorrer rutas a 360/375/412/1440/1920 bajando la página, con capturas de la entrada y de la página entera, chequeo de saltos de línea, desborde, consola, imágenes rotas, textos que se salen, lo que queda oculto, «menos movimiento» y links rotos, y probar las interacciones de cada página con su ficha. Usar cuando Mateo dice «verificá», o antes de entregar un cambio que se ve en el panel o en el sitio público.
---

# Verificar ELEVAR: el panel y el sitio público

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

**Estados de cada control (obligatorio en toda verificación del panel; Mateo, 2026-11-26: «la función de verificar no la estás usando como corresponde»).** El recorrido mira saltos, desborde y consola; no mira cómo se ve y se mueve cada botón al usarlo, que es lo primero que Mateo toca:

`MSYS_NO_PATHCONV=1 node estados.mjs --visor "$EV/../visor.json" --salida "$EV/estados" --rutas /admin,/admin/cursos [--abrir-fila] [--tiempos] [--max 40]`

- Por cada botón, link y tarjeta de `main` (y de la tarjeta de la primera fila con `--abrir-fila`), una vez por tipo: reposo, mouse a 80/250/600 ms, salida a 100/300/800 ms, foco y apretado (apretar y salir sin soltar: no dispara la acción).
- FALLA si el control queda **cortado** dentro de su caja (una tabla que lo empuja fuera: el recorrido no lo ve porque no hay desborde de la página), si con el mouse queda **ilegible** (texto del color del relleno), si al salir quedan **restos** (una línea del relleno) o si su ícono del panel queda **quieto** al entrar el mouse, la primera o la segunda vez.
- `--tiempos`: pasar de pantalla por el menú, dos vueltas, con clic directo y con el mouse 300 ms antes. Medido en `next dev` incluye compilar y armar la pantalla en el servidor; para un número como el de producción, parar el dev, `next build`, `next start -p <puerto>` y medir ahí (nunca `next build` con el dev prendido: confirmar con `netstat -ano | grep :<puerto>` que no quedó un hijo vivo).
- Deja `estados.json` y una hoja de contacto por ruta (`hoja-<ruta>.png`): **mirarla**, no solo los números. Tarda unos 5 s por control.

## Sitio público (sin sesión)

Lo mismo que el panel pero sin cuenta: el sitio se recorre como alguien que entra desde Google. Base local igual (`elevar_e2e`): nada de producción.

1. **Launch:** los pasos 1 a 4 de «Launch» (base, ajuste, backend y sitio). El paso 5 (cuenta y datos del panel) no hace falta. El backend solo lo necesitan las páginas que leen el catálogo (Inicio, Formación, cursos, Promociones, compra): sin él, `/` da 500 y el recorrido lo marca como link roto. El blog, Servicios, Nosotros y los textos legales andan sin backend.
   - Si el sitio público se prueba desde otro checkout (por ejemplo `wt-muestra`), se levanta igual con `npx next dev -p 3100` desde esa carpeta, con las mismas variables. Si el 3100 está ocupado por el panel, se usa otro puerto y se pasa `--base`.
2. **Doctor:** `node scripts/doctor.mjs --sitio` — el sitio y `/blog` responden, y avisa si el catálogo del backend no tiene cursos.
3. **Recorrido** (parado en `<scratchpad>/verify-elevar/pw`):
   `MSYS_NO_PATHCONV=1 node recorrer-sitio.mjs --salida "$EV" --rutas /,/blog [--anchos 360,375,412,1440,1920] [--base http://localhost:3100] [--sin-links]`
   - Por cada ruta y ancho: cuadros de la entrada a 0,4 · 1,2 · 2,8 s (a 375 y 1440), baja la página de a 60 % de pantalla cada 0,7 s para que disparen las animaciones, y mide saltos de línea, desborde, consola, imágenes rotas, textos que se salen de su caja y lo que quedó invisible (una entrada que no se disparó). Captura la página entera.
   - Por cada ruta, una vez: una pasada con «menos movimiento» (nada puede quedar oculto) y los links internos de `main` (todos responden por debajo de 400).
   - Sale con 1 si algo falla y deja `informe.json` en `$EV`.
4. **Lo que hace cada página:** su ficha en `features/` y, si tiene, su script de acciones. Hoy: `/blog` → `node acciones-blog.mjs --salida "$EV"` (el número que cuenta, la destacada que se abre al bajar, grilla y lista, que cada tarjeta abra su nota, el cierre y «menos movimiento», en 1440 y 375); `/orden/<id>` y su comprobante → `ordenes-prueba.mjs` arma cuatro órdenes inventadas (pagada, devuelta, fallida, pendiente), `ordenes_prueba.py` con `MODO=devolver` aplica la devolución y `node acciones-orden.mjs --salida "$EV" --ordenes "$EV/ordenes.json"` prueba los cuatro estados, el comprobante y el PDF (pasos en `features/orden.md`; al terminar, `MODO=borrar`). Una página nueva con interacciones propias lleva su `acciones-<página>.mjs` con el mismo formato: un `ok`/`FALLA` por paso, capturas `<página>-<ancho>-<paso>.png` y salida 1 si algo falla.
5. **Compra:** solo con pago simulado (`STRIPE_FAKE_MODE` o el simulador de Mercado Pago del backend local). Nunca una tarjeta real ni producción.

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
| `scripts/estados.mjs` | Cada control en reposo, con el mouse, al salir, con foco y apretado: cortado, ilegible, restos, ícono quieto; tiempos entre pantallas |
| `scripts/saltos.mjs` | La función del chequeo de saltos (`page.evaluate(revisar, [ENLACE, "main"])`) |
| `scripts/usuario_visor.py` | La cuenta inventada con segundo factor (escribe clave y secreto en un archivo) |
| `scripts/sembrar_inicio.py` | Un año de datos inventados para el Inicio |
| `scripts/panel_local_3100.py` | Ajuste de Django para el sitio en el 3100 |
| `scripts/recorrer-sitio.mjs` | Sitio público sin sesión: entrada, bajar leyendo, saltos, desborde, consola, imágenes, textos que se salen, ocultos, menos movimiento y links |
| `scripts/acciones-blog.mjs` | Interacciones de `/blog` (ficha `features/blog.md`) |
| `scripts/ordenes-prueba.mjs` | Cuatro órdenes inventadas por el checkout del backend con pago simulado; deja `ordenes.json` |
| `scripts/ordenes_prueba.py` | `MODO=devolver` devuelve la orden «devuelta» como el aviso de Mercado Pago; `MODO=borrar` saca las órdenes de prueba (solo `elevar_e2e`) |
| `scripts/acciones-orden.mjs` | `/orden/<id>` y su comprobante en los cuatro estados, con el PDF (ficha `features/orden.md`) |

Mapa de pantallas del panel y del sitio público: `features/README.md`.
