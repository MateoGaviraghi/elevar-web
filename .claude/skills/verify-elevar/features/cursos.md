# Cursos (`/admin/cursos`)

Rediseñada el 2026-11-26 con la forma del portal CESS, como Consultas, Órdenes e Inscripciones (D-006). Banda azul con cuatro cifras que filtran y «Nuevo curso»; barra de filtros; tabla de cursos en su tarjeta con la paginación abajo; tocar una fila abre la tarjeta del curso (`?ver=<id>`); «Editar» y «Nuevo curso» abren el formulario en pasos (`?editar=<id>` o `?editar=nuevo`). Sale de `GET /api/v1/panel/cursos/?estado=&modalidad=&categoria=&q=`, `GET …/cursos/cifras/`, `GET …/cursos/<id>/` y `GET …/categorias/`; guarda con `POST …/cursos/`, `PATCH …/cursos/<id>/` y las rutas de fechas (`cursos/<id>/fechas/`, `fechas/<id>/`, `fechas/<id>/cancelar/`).

## Qué comprobar

- **Recorrido:** `--base http://localhost:3110 --rutas "/admin/cursos,/admin/cursos?estado=SIN_FECHA,/admin/cursos?ver=<id>,/admin/cursos?editar=nuevo,/admin/cursos?editar=<id>"` a los cinco anchos, con 0 saltos, 0 desborde y consola limpia. **Ojo con `--base`:** sin él, `recorrer.mjs` va al 3100.
- **Entra en pantalla:** la lista entra sin scrollear a 1366×650, 1440×900 y 1920×1080.
- **Cifras:** Publicados, Borradores, Con fecha (webinars y en vivo con fecha programada por venir), Sin fecha (webinars y en vivo **publicados** sin fecha por venir; aviso «No se venden»). Tocar la elegida la suelta.
- **Filtros:** Cuáles, Modalidad, Categoría y el buscador por título o código. «Con fecha» ordena por la fecha más cercana.
- **Fila:** sigla (VIVO naranja, WEB azul, ASIN y TALL claros), título, código · modalidad · categoría y etiqueta; precio en pesos y dólares («Gratis» si es 0); próxima fecha con «en N días» o «Sin fecha»; Publicado o Borrador; «Editar» abre el formulario directo.
- **Tarjeta:** Fechas (solo en vivo y webinar): agregar y editar en la tarjeta, cancelar pide confirmar con inscriptos y compras; «Ver inscriptos» lleva a `/admin/inscripciones?cuando=TODAS&ver=<fecha>`. «La ficha» con «Falta cargar: …». Historial con los campos en castellano («Editó un curso: precio»). «En el sitio»: Editar curso, Publicar o Sacar del sitio (al toque, aviso con **Deshacer**), Ver en el sitio. ↑ ↓ recorren, Esc cierra.
- **Formulario:** pasos Datos · Precio · Ficha · Temario · Revisar. Nuevo: «Siguiente» valida el paso (título, dirección, código, categoría; precio) y deja el foco en el primer error; «Crear curso» en Revisar; se crea sin publicar y abre su tarjeta. Editar: los cinco pasos con tilde, «Guardar cambios» en todos (apagado si no hay cambios). Un código o una dirección repetidos vuelven a Datos con «Ya hay un curso con ese código.». Esc con cambios pregunta «¿Los descartás?» (Seguir editando / Descartar). Plata como texto: «66.500,5» → `66500.50`.
- **Sin «Taller»:** el formulario ofrece Asincrónico, En vivo y Webinar; un curso que ya es taller (SEM4) muestra «Taller» con el aviso de que su página da error. El filtro Modalidad no tiene Taller. `/cursos/prueba-sem4` en el sitio local da 500: es lo que reproduce el pendiente del sitio.
- **Direcciones viejas:** `/admin/cursos/<id>` → tarjeta abierta; `/admin/cursos/nuevo` → alta abierta.
- **Celular:** cifras de a dos; cada fila es una tarjeta; en el formulario, los pasos muestran solo el nombre del actual, los botones van de a dos y «Guardar cambios» abajo a todo el ancho; campos de 16 px; el título de la cabecera se corta en 2 renglones (formulario) o 3 (tarjeta).

## Datos de muestra

`scripts/sembrar_inicio.py`, quinta tanda (códigos `SEM*`): un borrador sin ficha (SEM1), un borrador en vivo con el título largo y precio en dólares (SEM2), un webinar publicado sin fecha (SEM3) y un taller en dólares (SEM4). Las pruebas con clics dejan cursos `ZN<número>` y fechas canceladas en `elevar_e2e`.

## Selectores

- Tabla: `table[aria-label="Cursos"]`, filas `tr[data-fila=<id>]`, acción `[data-accion]` («Editar <título>»).
- Tarjeta y formulario: `div[role=dialog]`. Pasos: botones «Paso N de 5: <nombre>, …». Campos: `#curso-<campo>` (por ejemplo `#curso-title`, `#curso-price`); fechas: `#fecha-starts_at`, `#fecha-ends_at`, `#fecha-capacity`. Aviso: `[role=status]`.
- Script de la sesión que lo armó: `cursos-flujo.mjs` (vive en el scratchpad).
