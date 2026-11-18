# 09 — Etapas de armado

Cada etapa termina con algo que funciona y una prueba que **puede fallar**. Si la prueba no pasa, la etapa no terminó. Una etapa entra a `main` por PR (`03-FRONTERA.md`).

| Etapa | Qué queda andando | Depende de |
|---|---|---|
| 1 | Login, segundo factor, sesión, roles y auditoría en Django (sin pantallas) | Nada: se puede empezar ya |
| 2 | Pantallas de ingreso y el esqueleto del panel | Etapa 1 (la decisión 1 ya está tomada: puente en Next) |
| 3 | Consultas | Etapa 2 y la columna `Lead.updated_at` (Mateo) |
| 4 | Auditoría, Mi cuenta y comandos de soporte | Etapa 2 |
| 5 | Inscripciones a webinars | Etapa 2 y que el sitio guarde las inscripciones en la base (Mateo) |
| 6 | Cursos y fechas | Etapa 2 y que el sitio lea los cursos de la base (Mateo) |
| 7 | Órdenes | Etapa 2 y que el checkout guarde la orden en la base con su aviso de pago (Mateo) |
| 8 | Publicación con datos reales | Todas las anteriores que entren en la primera versión, y la lista de `07-SEGURIDAD.md`, sección 11 |

Las etapas 3 y 4 se pueden hacer en cualquier orden. Las 5, 6 y 7 esperan trabajo de Mateo: mientras tanto se avanza en las que no esperan.

---

## Etapa 1 — Login, segundo factor, sesión, roles y auditoría (solo backend)

Rama: `panel/etapa-1-login`. Repo: `elevar-backend`.

**Qué se hace**
1. Instalar `django-otp` y `argon2-cffi` (versiones anotadas en `02-TECNOLOGIAS.md` en el mismo PR, después de revisar alertas publicadas). Agregar `django_otp` y `django_otp.plugins.otp_totp` a `INSTALLED_APPS` (sin `otp_static`: los códigos de respaldo van en `panel.CodigoRespaldo`, con hash) y `django_otp.middleware.OTPMiddleware` después de `AuthenticationMiddleware`.
2. Poner `Argon2PasswordHasher` primero en `PASSWORD_HASHERS`.
3. Crear la app `panel` con `Perfil`, `IntentoIngreso` y `EventoAuditoria` (`04-DATOS.md`) y sus migraciones, incluida la del disparador que rechaza `UPDATE` y `DELETE` en la auditoría.
4. `panel/auditoria.py` con `registrar(...)` y la lista cerrada de acciones.
5. `panel/permisos.py` con la matriz de `07-SEGURIDAD.md` y la clase base `PanelView` (cerrada por defecto).
6. `panel/sesion.py`: middleware de 30 minutos de inactividad y 12 horas de máximo, solo sobre `/api/v1/panel/`.
7. Endpoints bajo `/api/v1/panel/`:
   - `GET csrf/` → pone la cookie del token CSRF.
   - `POST ingreso/` (correo, contraseña) → «a medio ingresar» o error; con los límites por cuenta e IP.
   - `POST ingreso/codigo/` (código o código de respaldo) → sesión completa.
   - `GET primer-ingreso/` → datos para el QR (`otpauth_url` y la clave en texto; el dibujo del QR es de la etapa 2); `POST primer-ingreso/` (código, y `clave_nueva` si entró con la contraseña temporal) → confirma el factor y devuelve los 10 códigos de respaldo una sola vez.
   - `POST salida/` → cierra la sesión en el servidor.
   - `GET yo/` → nombre, correo, rol y si tiene el factor listo.
8. La cookie de sesión del panel con los valores de `07-SEGURIDAD.md` (nombre `__Host-elevar_panel` en producción; en desarrollo sin el prefijo `__Host-`, porque exige HTTPS).
9. Un comando `python manage.py crear_usuario_panel --correo ... --rol admin` que crea el usuario con contraseña temporal (mostrada una vez) para la primera cuenta.

**Prueba que demuestra que terminó** (`tests/panel/`, todas tienen que pasar con `pytest -q`; cada una falla si la regla no se cumple)
- `test_ingreso.py`
  - Contraseña correcta sin código → `GET yo/` responde 401.
  - Contraseña correcta + código correcto → `GET yo/` responde 200 con el rol.
  - Correo inexistente y contraseña mala devuelven el mismo mensaje y el mismo código HTTP.
  - El sexto intento fallido de la misma cuenta en 15 minutos responde bloqueado, aunque la contraseña sea la correcta.
  - El 21.º fallo desde la misma IP en 15 minutos responde 429.
  - El sexto código fallido responde bloqueado.
  - Un código de respaldo sirve una vez; la segunda vez falla.
  - Un usuario sin factor confirmado solo puede llamar a `primer-ingreso/`, `yo/` y `salida/`.
  - Un usuario con `activo=false` no entra, aunque la contraseña y el código sean correctos.
- `test_sesion.py` (moviendo el reloj con `unittest.mock.patch` sobre `django.utils.timezone.now`)
  - 31 minutos sin pedidos → 401.
  - Pedidos cada 10 minutos durante 12 h 10 min → 401 al pasar las 12 horas.
  - Después de `salida/`, la cookie anterior ya no sirve (la fila de `django_session` no existe).
  - Al ingresar, el identificador de sesión cambia.
  - Dar de baja a un usuario borra todas sus sesiones.
- `test_auditoria.py`
  - Un ingreso correcto y uno fallido dejan cada uno su evento, con `actor` y `ip`.
  - `EventoAuditoria.objects.filter(...).update(...)` y `.delete()` fallan (lo frena el disparador de Postgres).
  - Si el servicio falla después de registrar, no queda el evento (misma transacción).
- `test_permisos.py`
  - La prueba de la sección 5 de `07-SEGURIDAD.md`, con las rutas que existen en esta etapa.
  - La prueba que falla si hay una ruta en `panel/urls.py` que no está en la lista.
- Además: `ruff check .` sin avisos nuevos y las pruebas que ya existían siguen pasando.

---

## Etapa 2 — Pantallas de ingreso y esqueleto del panel

Rama: `panel/etapa-2-ingreso`. Repos: `elevar-web` (y `elevar-backend` si el puente necesita ajustar el nombre de la cookie o el CSRF; esos ajustes son compartidos, por PR).

**Qué se hace**
1. El puente `app/api/panel/[...ruta]/route.ts` (decisión 1): reenvía a `PANEL_API_URL`, nunca a una dirección que venga del pedido, con la cookie y el token CSRF, y devuelve la respuesta tal cual, incluidas sus `Set-Cookie`.
2. `lib/admin/api.ts` y `lib/admin/tipos.ts` (`08-CODIGO.md`).
3. Pantallas `/admin/ingresar`, `/admin/ingresar/codigo`, `/admin/primer-ingreso` (`05-PANTALLAS.md`).
4. `app/admin/layout.tsx` con la barra superior, el menú por rol y «Salir»; `/admin` (inicio) vacío con «Todo al día».
5. Borrar la demo: el login de `lib/admin/auth.ts` (con su contraseña escrita en el código), el uso de `lib/local-db.ts` dentro de `app/admin/**`, y las páginas de blog, promociones, contactos y webinars de la demo.
6. Cabeceras de `/admin/**` en `next.config.mjs` (archivo compartido: PR revisado por Mateo).
7. Agregar `@playwright/test` como dependencia de desarrollo y su configuración.

**Prueba que demuestra que terminó**
- Playwright (`tests-e2e/panel/ingreso.spec.ts`, contra el backend local con un usuario de prueba creado por el comando de la etapa 1; `pnpm e2e` levanta el backend sobre una base aparte, `elevar_e2e`, y `next dev` con `PANEL_API_URL`):
  - Ingresar con contraseña y código lleva a `/admin` y muestra el nombre.
  - Contraseña mala muestra «Correo o contraseña incorrectos.» y no entra.
  - Abrir `/admin` sin sesión lleva a `/admin/ingresar`.
  - «Salir» lleva a `/admin/ingresar` y volver atrás con el navegador no muestra el panel.
  - Un usuario sin factor configurado termina en `/admin/primer-ingreso`.
- `grep -rn "localStorage\|sessionStorage" app/admin components/admin lib/admin` no encuentra nada.
- `grep -rn "DEMO_CREDENTIALS" .` (sin `node_modules`) no encuentra nada.
- En el navegador, la cookie de sesión figura `HttpOnly` y `Secure` (en la vista previa de Vercel), y `document.cookie` no la muestra.
- Las pantallas de ingreso miradas a 360, 375, 412, 1440 y 1920 px, sin nada cortado ni errores en la consola.

---

## Etapa 3 — Consultas

Rama: `panel/etapa-3-consultas`. Antes: Mateo une la columna `Lead.updated_at` (`03-FRONTERA.md`, «Si el panel necesita un cambio en un modelo de Mateo»).

**Qué se hace**
- API: `GET consultas/` (filtros estado, origen, desde, hasta; búsqueda por nombre o empresa; paginada), `GET consultas/<id>/`, `POST consultas/<id>/estado/` (con auditoría).
- Pantallas `/admin/consultas` y `/admin/consultas/[id]`, y el número «consultas nuevas» en el inicio.

**Prueba que demuestra que terminó**
- `pytest`:
  - La lista nunca devuelve más de 100 filas aunque se pida `page_size=1000`.
  - Un estado inválido en el filtro cae al valor por defecto (no da 500).
  - Cambiar el estado deja un evento `consulta.estado` con el antes y el después; el mismo cambio repetido no deja un segundo evento.
  - La respuesta de la lista no trae `message` ni `phone`.
  - La prueba de permisos suma las rutas nuevas.
- Playwright: filtrar por «Comunidad de WhatsApp», abrir una consulta, marcarla «Contactada» y verla con ese estado en la lista; recargar la página mantiene los filtros.
- Los cuatro estados (cargando, vacía, error, sin permiso) se ven: el error forzado apagando el backend; vacía con un filtro sin resultados.

---

## Etapa 4 — Auditoría, Mi cuenta y comandos de soporte

Rama: `panel/etapa-4-cuenta`. Hay un solo usuario, el de Laura: no hay pantalla de usuarios.

**Qué se hace**
- API: listar auditoría con filtros y paginación por cursor; cambiar mi contraseña; generar códigos de respaldo nuevos; ver y cerrar mis otras sesiones.
- Pantallas `/admin/auditoria` y `/admin/cuenta`.
- Comandos de Django (los corre Mateo en el backend): `baja_usuario_panel --correo ...` (pone `activo=false` y cierra todas sus sesiones) y `reiniciar_segundo_factor_panel --correo ...` (borra sus dispositivos de segundo factor y códigos de respaldo, cierra sus sesiones y la obliga a pasar por `/admin/primer-ingreso`). Cada uno deja su evento en la auditoría.

**Prueba que demuestra que terminó**
- `pytest`:
  - `baja_usuario_panel` borra las sesiones de esa persona y su próximo pedido da 401.
  - `reiniciar_segundo_factor_panel` deja la cuenta sin dispositivos: el código viejo ya no sirve y el próximo ingreso termina en `primer-ingreso/`.
  - Cada comando deja su evento en la auditoría.
  - Generar códigos de respaldo nuevos invalida los anteriores.
  - Una contraseña de 7 caracteres o de la lista de comunes se rechaza; una de 64 se acepta.
  - Cambiar la contraseña con «cerrar las otras sesiones» deja viva solo la actual.
  - La auditoría pagina por cursor sin repetir ni saltear eventos cuando entran eventos nuevos entre una página y otra.
- Playwright: Laura entra, ve en `/admin/auditoria` su propio ingreso, cambia su contraseña y vuelve a entrar con la nueva.

---

## Etapa 5 — Inscripciones a webinars

Antes: Mateo hace que el sitio mande las inscripciones a `catalog.WebinarRegistration`.

- API: `GET inscripciones/?sesion=<id>`, `GET inscripciones/exportar/?sesion=<id>` (CSV, rol según la matriz, con auditoría).
- Pantalla `/admin/inscripciones`.
- **Prueba:** `pytest` — la exportación deja un evento `exportacion` con la cantidad de filas, y una sesión sin segundo factor confirmado recibe 403; Playwright — elegir un webinar muestra sus inscriptos y el cupo.

## Etapa 6 — Cursos y fechas

Antes: Mateo pasa el catálogo a la base y agrega las columnas que faltan (`04-DATOS.md`).

- API: listar, crear y editar cursos; agregar, editar y cancelar fechas.
- Pantallas `/admin/cursos` y `/admin/cursos/[id]`.
- **Prueba:** `pytest` — una fecha con compras o inscriptos no se borra (se cancela); una fecha con fin antes del inicio se rechaza; un precio llega y sale como texto con dos decimales y nunca como número; Playwright — agregar una fecha a un curso y verla en la ficha pública del curso.

## Etapa 7 — Órdenes

Antes: Mateo hace que el checkout cree la orden en la base (con `buyer_dni` y `buyer_company`) y que el aviso de pago de Mercado Pago la marque como pagada.

- API: listar con filtros y totales, detalle (DNI enmascarado), «ver DNI» (con auditoría), «marcar como cumplida» y notas.
- Pantallas `/admin/ordenes` y `/admin/ordenes/[publicId]`, y el número «órdenes pagadas sin cumplir» en el inicio.
- **Prueba:** `pytest` — PAID → FULFILLED funciona una vez; repetirlo responde 409 y no deja otro evento; PENDING → FULFILLED responde 409; ningún endpoint del panel acepta el `id` numérico de la orden (solo `public_id`); el detalle no incluye `raw_payload`; Playwright — marcar una orden como cumplida y verla con ese estado.

## Etapa 8 — Publicación con datos reales

- Recorrer `07-SEGURIDAD.md`, sección 11, punto por punto, anotando «cumple», «no cumple» o «no se pudo verificar» con la evidencia.
- Crear la cuenta de Laura con `crear_usuario_panel` y acompañarla a configurar su segundo factor, en persona o por llamada.
- **Prueba:** la lista completa en «cumple», o lo que no cumple aceptado por escrito por Mateo antes de publicar; un ingreso real en el dominio de producción con segundo factor; la restauración de la copia de seguridad hecha y anotada con su fecha.
