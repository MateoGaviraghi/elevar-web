# 07 — Seguridad

Este documento está completo a propósito: no hay que ir a buscar nada afuera. Las reglas salen de OWASP ASVS 5.0 (capítulos de autenticación V6, sesiones V7 y autorización V8), de NIST SP 800-63B-4 y de las hojas de OWASP sobre contraseñas, sesiones, cabeceras y registros, leídas en noviembre de 2026. Los números entre paréntesis son la referencia de ASVS.

**Nivel del sistema: S3** (el más alto de tres). Guarda datos personales de compradores (nombre, correo, teléfono, empresa, DNI) y registra pagos. Todo lo de abajo es obligatorio salvo que diga «recomendado».

**Regla madre:** toda decisión de seguridad se toma **en Django, en cada pedido**. Next solo muestra. Un middleware de Next que mira si existe la cookie **no** es control de acceso.

## 1. Login

| Regla | Valor | Referencia |
|---|---|---|
| Quién puede entrar | Solo usuarios con `panel.Perfil` activo y rol asignado | |
| Identificador | El correo, en minúsculas. Único entre usuarios del panel | |
| Mensaje de error | Siempre «Correo o contraseña incorrectos.», exista o no la cuenta. Mismo tiempo de respuesta en los dos casos | Evita adivinar cuentas |
| Límite por cuenta | 5 fallos en 15 minutos → la cuenta no puede entrar por 15 minutos | ASVS 6.3.1 |
| Límite por IP | 20 fallos en 15 minutos → esa IP recibe 429 por 15 minutos | ASVS 6.3.1. Se limita por cuenta **y** por IP: solo por IP no frena un ataque repartido |
| Dónde se cuenta | Por cuenta: tabla `panel.IntentoIngreso`. Por IP: `django-ratelimit` (ya instalado) sobre la vista de ingreso | |
| IP real | Detrás del proxy de Railway, la IP viene en `X-Forwarded-For`. {{CONFIRMAR}} cuál es el salto confiable antes de usarla (si se lee mal, se puede falsificar) | |
| Cuentas por defecto | Ninguna («admin», «root», «test»). Las cuentas se crean con nombre de persona | ASVS 6.3.2 |
| Registro | Ingreso correcto, fallido y bloqueado van a `panel.EventoAuditoria` | |

## 2. Contraseñas

| Regla | Valor | Referencia |
|---|---|---|
| Largo mínimo | 8 caracteres (hay segundo factor obligatorio) | NIST 3.1.1.2; ASVS 6.2.1 |
| Largo máximo | Aceptar al menos 64; el panel acepta hasta 128 | ASVS 6.2.9 |
| Reglas de composición | **Prohibidas**: no se exige mayúscula, número ni símbolo | NIST 3.1.1.2 |
| Cambio periódico | **Prohibido**. Se cambia solo si se sabe o sospecha comprometida | ASVS 6.2.10 |
| Contraseñas comunes | Rechazadas: `CommonPasswordValidator` de Django (ya configurado en `config/settings/base.py`) | ASVS 6.2.4 |
| Contraseñas filtradas | Recomendado: chequear contra una base de contraseñas filtradas | ASVS 6.2.12 |
| Pegar y gestores de contraseñas | Permitidos | ASVS 6.2.7 |
| Sin recortes | Se verifica tal como llega: sin recortar espacios ni cambiar mayúsculas | ASVS 6.2.8 |
| Preguntas secretas | No se usan | ASVS 6.4.2 |
| Cómo se guardan | **Argon2id** con `django.contrib.auth.hashers.Argon2PasswordHasher` primero en `PASSWORD_HASHERS` (requiere `argon2-cffi`). Piso: memoria 19 MiB, 2 vueltas, 1 hilo; los valores por defecto de Django cumplen {{CONFIRMAR}} al instalar mirando `Argon2PasswordHasher.memory_cost`, `time_cost` y `parallelism`. Las contraseñas viejas en PBKDF2 se actualizan solas al próximo ingreso | Hoja de OWASP de contraseñas |
| Contraseña temporal (alta de usuario) | Generada con `secrets`, mostrada una sola vez, obliga a cambiarla en el primer ingreso y vence a las 72 horas | |

## 3. Segundo factor

| Regla | Valor | Referencia |
|---|---|---|
| Obligatorio | Para **todos** los usuarios del panel. Sin segundo factor confirmado, la sesión solo puede entrar a `/admin/primer-ingreso` | ASVS 6.3.3 |
| Tipo | Código de 6 dígitos de una app autenticadora (TOTP, RFC 6238, 30 s), con `django-otp` | |
| SMS | **No** | ASVS 6.6.1 |
| Códigos de respaldo | 10, de un solo uso, generados con azar criptográfico, guardados como hash. Mostrados una sola vez | ASVS 6.5.1 a 6.5.5 |
| Ventana | Se acepta el código actual y uno anterior o siguiente (±30 s). Un código ya usado no se acepta dos veces | |
| Límite de intentos | 5 códigos fallidos en 15 minutos → bloqueo de 15 minutos, contado en `panel.IntentoIngreso` con `paso='codigo'` | ASVS 6.6.3 |
| Paso intermedio | Después de la contraseña correcta, la sesión queda «a medio ingresar» por 5 minutos como máximo; si no llega el código, se descarta | |
| Recupero | No hay recupero solo. Si alguien pierde el teléfono y los códigos, un `admin` reinicia su segundo factor desde `/admin/usuarios`, **después de confirmar por otro medio que es esa persona** (llamada o en persona). Queda en la auditoría | ASVS 6.4.3 y 6.4.4 |
| Recupero de contraseña | Lo hace un `admin`, igual que el alta: contraseña temporal. Nunca saltea el segundo factor | ASVS 6.4.3 |
| Recomendado a futuro | Llaves de acceso (passkeys), resistentes al phishing | NIST 2.2.2 |
| Secreto TOTP en la base | {{CONFIRMAR}} si se cifra la columna con una clave aparte (variable `PANEL_CLAVE_CIFRADO`, distinta de `DJANGO_SECRET_KEY`) | |

## 4. Sesión

| Regla | Valor | Referencia |
|---|---|---|
| Dónde vive | Sesión de Django en la base (`django.contrib.sessions`, ya instalada). El navegador solo tiene una cookie con el identificador | |
| Cookie | Nombre `__Host-elevar_panel` · `HttpOnly` · `Secure` · `SameSite=Lax` · `Path=/` · sin `Domain` | Hoja de sesiones de OWASP |
| **Nunca** | Un token en `localStorage` o `sessionStorage`, ni en la dirección | |
| Al entrar | Identificador nuevo (`request.session.cycle_key()`, lo hace `django.contrib.auth.login`) | ASVS 7.2.4 |
| Corte por inactividad | **30 minutos** sin pedidos | ASVS 7.3.1; NIST 2.3.3 (S3: 15 a 30 min) |
| Duración máxima | **12 horas** desde el ingreso, se use o no | ASVS 7.3.2 |
| Cómo se controlan los dos tiempos | Un middleware de la app `panel` guarda en la sesión `ingreso_en` y `ultimo_uso_en`; en cada pedido a `/api/v1/panel/` compara contra `timezone.now()` y, si venció, hace `logout()` y responde 401. Variables: `PANEL_SESION_HORAS=12`, `PANEL_INACTIVIDAD_MINUTOS=30` | |
| Por escrito | Los dos tiempos y su motivo (datos de compradores y pagos) quedan en este documento | ASVS 7.1.1 |
| Salir | Botón «Salir» visible en toda pantalla. Borra la sesión en la base, no solo la cookie | ASVS 7.4.1 y 7.4.4 |
| Dar de baja | `activo=false` cierra todas las sesiones de esa persona (se borran sus filas de `django_session`) | ASVS 7.4.2 |
| Cambiar contraseña o factor | Se ofrece cerrar las otras sesiones | ASVS 7.4.3 |
| Un `admin` puede | Cerrar todas las sesiones de un usuario | ASVS 7.4.5 |
| Cada pedido | Se vuelve a leer el `Perfil` (rol y `activo`) de la base: un cambio de rol o una baja vale desde el próximo pedido | |
| CSRF | Toda escritura (POST, PUT, PATCH, DELETE) lleva el token CSRF de Django en el encabezado `X-CSRFToken` | |

### Cómo viaja la sesión (decisión 1 de `10-PENDIENTES.md`)

El sitio está en Vercel y el backend en Railway, en dominios distintos. Una cookie `SameSite=Lax` de Railway **no** viaja en un pedido que el navegador hace desde el dominio de Vercel. Hay dos caminos:

- **Recomendado: puente en Next.** El navegador le pide todo a `/api/panel/...` del mismo sitio. Un route handler de Next (`app/api/panel/[...ruta]/route.ts`) reenvía el pedido a `https://<backend>/api/v1/panel/...` con la cookie y el token CSRF, y devuelve la respuesta tal cual, incluidas sus `Set-Cookie`. La cookie queda en el dominio del sitio. El puente no decide nada de seguridad: solo reenvía. Reenvía solo a la dirección del backend fijada en una variable del servidor (`PANEL_API_URL`), nunca a una que venga del pedido.
- Alternativa: sitio y backend bajo el mismo dominio (`elevar.com.ar` y `api.elevar.com.ar`). Requiere los dominios definitivos, que hoy no están.

Hasta que se decida, la etapa 1 se hace y se prueba solo en el backend (no depende de esto).

## 5. Permisos

### Reglas

| Regla | Cómo | Referencia |
|---|---|---|
| Cerrado por defecto | Toda vista de `/api/v1/panel/` hereda de una clase base del panel que exige sesión + segundo factor + perfil activo. Una vista nueva nace cerrada. Las vistas públicas del sitio siguen con `AllowAny` explícito | A01 de OWASP Top 10 2025 |
| Un solo lugar | La autorización vive en `panel/permisos.py`: la matriz de abajo y las clases de permiso de DRF que la aplican. Ninguna vista decide por su cuenta | API5 de OWASP |
| Permiso por acción | Cada acción, solo para el rol que la tiene en la matriz | ASVS 8.2.1 |
| Permiso por campo | El DNI de un comprador se manda enmascarado; completo solo con la acción «ver DNI», que queda en la auditoría | ASVS 8.2.3 |
| En el servidor | Nunca se confía en lo que oculta o manda el navegador (un `rol` en el cuerpo del pedido se ignora) | ASVS 8.3.1 |
| Respuestas | Sin sesión: 401. Con sesión y sin permiso para la acción: 403. Registro que no existe: 404 | |
| Registro | Cada 403 se guarda como `permiso.denegado` en la auditoría | A01 |
| Límite de escrituras | 120 escrituras por minuto por usuario → 429 | |
| Por escrito | La matriz de abajo es la regla; si el código no coincide, el código está mal | ASVS 8.1.1 |

### Matriz rol × acción

| Acción | `admin` | `operador` |
|---|---|---|
| Ver inicio | Sí | Sí |
| Ver y filtrar consultas | Sí | Sí |
| Cambiar estado de una consulta | Sí | Sí |
| Ver órdenes | Sí | Sí |
| Ver DNI completo de un comprador | Sí | {{CONFIRMAR}} |
| Marcar orden como cumplida / escribir notas | Sí | Sí |
| Ver inscripciones | Sí | Sí |
| Exportar inscripciones o consultas | Sí | No {{CONFIRMAR}} |
| Crear y editar cursos y fechas | Sí | No {{CONFIRMAR}} |
| Ver, crear, dar de baja usuarios; cambiar roles; reiniciar segundo factor; cerrar sesiones de otro | Sí | No |
| Ver auditoría | Sí | No |
| Mi cuenta (contraseña, códigos de respaldo, mis sesiones) | Sí | Sí |

### La prueba que lo demuestra

Sin esta prueba, «los permisos están bien» es una opinión. Vive en `tests/panel/test_permisos.py` y corre en cada PR.

1. Crear un `admin` y un `operador`, los dos con segundo factor confirmado, y datos propios de prueba (una consulta, una orden, un usuario).
2. Armar una lista con **cada** ruta de `/api/v1/panel/` y el método.
3. Sin sesión: todas responden 401.
4. Con sesión del `operador`: cada ruta que la matriz le niega responde 403 y deja un `permiso.denegado`.
5. Con sesión de contraseña correcta pero sin código: todas responden 401 o 403, salvo las del paso del código.
6. Con un `id` o `public_id` que no existe: 404.
7. Una prueba aparte falla si aparece una ruta en `panel/urls.py` que no está en la lista del paso 2 (así nadie agrega una ruta sin probarla).

## 6. Auditoría

- Tabla `panel.EventoAuditoria` (ver `04-DATOS.md`): de solo agregado, con disparador en Postgres que rechaza `UPDATE` y `DELETE`.
- Se escribe con una sola función, `panel.auditoria.registrar(actor, accion, entidad, entidad_id, detalle, request)`, **dentro de la misma transacción** que el cambio.
- El actor sale de `request.user` de la sesión verificada; nunca de un campo del pedido.
- Qué se registra: ingresos (correctos, fallidos, bloqueados), códigos fallidos, salidas y vencimientos, todo cambio de estado, altas, bajas y cambios de rol, reinicios de segundo factor, cierres de sesión de otro, cada «ver DNI», cada exportación con la cantidad de filas, cada 403.
- Qué no se guarda en el detalle: contraseñas, códigos, tokens, ni datos personales enteros.

## 7. Datos personales

| Regla | Cómo |
|---|---|
| Lo mínimo | Cada pantalla trae solo las columnas que muestra. Las listas no traen DNI ni mensaje completo |
| Nunca en la dirección | Ni DNI, ni correo, ni teléfono en `?q=...`. Una búsqueda por esos campos va en el cuerpo de un POST |
| Nunca en registros | Ni en los registros del servidor, ni en el monitoreo de errores, ni en la auditoría. `PaymentEvent.raw_payload` tiene datos del comprador: no se manda entero a la pantalla ni a los registros |
| Caché | Las respuestas de `/api/v1/panel/` llevan `Cache-Control: no-store`. Las páginas del panel en Next son dinámicas: nada de `use cache`, `unstable_cache` ni `fetch` con caché para datos del panel |
| Exportar | Solo los roles de la matriz, y queda en la auditoría con la cantidad de filas |
| Base de prueba | Datos inventados. Nunca una copia de producción |
| Ley 25.326 (Argentina) | Esto es un mapa, no asesoramiento legal: lo revisa un abogado de ELEVAR. ELEVAR es responsable de la base; quien construye y aloja el sistema no puede usar los datos para otro fin ni cederlos, y al terminar los destruye (art. 25). La base de producción está en Railway, que no tiene región en Sudamérica: los datos salen del país, y Estados Unidos no está en la lista de países adecuados de la autoridad de datos (AAIP). Lo decide ELEVAR con su abogado {{CONFIRMAR}} |
| Pedidos de las personas | Debe existir una forma de pedir acceso, corrección o borrado de sus datos: 10 días corridos para el acceso, 5 hábiles para corregir o borrar (arts. 14 y 16). {{CONFIRMAR}} si se hace a mano o con una acción del panel |

## 8. Secretos

1. Un secreto nunca va en el código, en un archivo del repo, en un registro, en un mensaje de chat ni en una captura.
2. **Nunca se crea ni se modifica un `.env.example`.** Nunca se abre un `.env`: de las variables se conocen solo los nombres, leídos del código (`os.getenv(...)`).
3. Un secreto por ambiente: producción no comparte valores con pruebas ni con desarrollo.
4. Backend: las variables viven en Railway (servicio `backend`). Frontend: en Vercel, marcadas como **sensibles** (tras el incidente de seguridad de Vercel de abril de 2026, las variables no marcadas quedaron expuestas en un grupo de clientes).
5. En Next, una variable con `NEXT_PUBLIC_` la lee cualquiera en el navegador: ningún secreto ahí. `PANEL_API_URL` va **sin** ese prefijo.
6. Nombres nuevos del panel: `PANEL_SESION_HORAS`, `PANEL_INACTIVIDAD_MINUTOS`, `PANEL_API_URL`, `PANEL_CLAVE_CIFRADO` (si se decide cifrar). Los valores los carga quien publica.
7. **Si un secreto se filtró:** primero se cambia en el proveedor y se vuelve a publicar; después se revisan los registros del proveedor; recién al final se saca de los archivos. Cambiar `DJANGO_SECRET_KEY` cierra todas las sesiones: es lo que se quiere.
8. Antes de cada commit: revisar el diff buscando claves. Recomendado: `gitleaks` como hook local.

## 9. Cabeceras y errores

- El backend en producción ya tiene: HSTS de 1 año con subdominios y preload, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options` (middleware de Django), redirección a HTTPS, cookies `Secure` y `HttpOnly` (`config/settings/production.py`). No se aflojan.
- Las páginas `/admin/**` de Next llevan además `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, `Permissions-Policy: geolocation=(), camera=(), microphone=()` y `Cache-Control: no-store`, desde `next.config.mjs` (`headers()`, archivo compartido: por PR). Política de contenido (CSP) con valor aleatorio por pedido: {{CONFIRMAR}} en qué etapa.
- Errores: a la pantalla llega un mensaje genérico y un código corto de incidente; el detalle queda solo en el registro del servidor. `DEBUG=False` en producción.
- Formato de error de la API del panel: el mismo que ya usa todo el backend (`core/exceptions.py`): `{"error": {"code": "...", "message": "...", "field_errors": {...}}}`. La pantalla elige el texto por `code`; `field_errors` solo aparece en errores de validación (422).

## 10. Registros y avisos

- Se registra: fallos de ingreso, permisos denegados, fallos de validación, acciones de alto riesgo.
- No se registra: contraseñas, códigos, identificadores de sesión, cadenas de conexión, claves, datos de tarjeta, datos personales que no hagan falta.
- Monitoreo de errores: el backend inicializa Sentry si existe `SENTRY_DSN`, con `send_default_pii=False` (`config/settings/production.py`). {{CONFIRMAR}} si está configurado.
- Monitor externo cada 5 minutos a `/api/v1/health/`. Hoy esa ruta no consulta la base: {{CONFIRMAR}} si se agrega una ruta de salud que sí lo haga.
- Avisos de seguridad automáticos (Dependabot) activos en los dos repositorios desde el 2026-11-17.

## 11. Antes de publicar

### En cada publicación del panel

1. Pruebas, tipos y lint en verde, con la salida a la vista: `pytest -q` y `ruff check .` en el backend; `pnpm lint` y la compilación en el frontend (con el servidor de desarrollo apagado).
2. La prueba de permisos (sección 5) pasa.
3. Probado antes en una vista previa de Vercel contra un backend que **no** es el de producción.
4. Variables nuevas cargadas en producción (solo se miran los nombres).
5. Si hay migración: no rompe el código que está publicado (no borra ni renombra nada que se use); los índices sobre tablas con datos se crean sin bloquear (`03-FRONTERA.md`).
6. Se sabe cómo volver atrás: Vercel, la publicación anterior; Railway, «Rollback» del despliegue anterior (vuelve imagen y variables; la base **no** vuelve).
7. Después de publicar: ingresar con segundo factor en el dominio real, abrir una pantalla con datos, salir.

### La primera vez que el panel ve datos reales

8. Next.js en 15.5.29 o más (hoy 15.5.28: `02-TECNOLOGIAS.md`).
9. Las cuentas de hosting, base, dominio y correo están a nombre de ELEVAR o de Mateo, con segundo factor.
10. Copia de seguridad de la base programada y **una restauración probada**, con la fecha anotada {{CONFIRMAR}} cómo se hace en Railway.
11. Monitoreo de errores activo y sin datos personales.
12. Plan para un incidente (sección 12) leído por quien publica.
13. Laura tiene su usuario con segundo factor; no queda ninguna cuenta de prueba en producción.

## 12. Si pasa algo (incidente)

Cuenta como incidente: un acceso no autorizado, una fuga de datos o de un secreto, un servicio caído por un ataque, o un aviso de un proveedor de que la cuenta fue afectada.

1. Confirmar que de verdad pasó algo.
2. Anotar la hora y todo lo que se hace desde ese momento.
3. **Guardar evidencia antes de tocar nada:** exportar registros de Railway, Vercel y la auditoría; capturas; el commit publicado.
4. Contener: volver a la publicación anterior; cambiar la credencial filtrada; dar de baja al usuario comprometido.
5. Cambiar **toda** credencial que pudo quedar expuesta, no solo la que se sabe. Cambiar `DJANGO_SECRET_KEY` cierra todas las sesiones.
6. Entender el alcance con la auditoría: qué datos, de quién, desde cuándo.
7. Avisar a Mateo y a ELEVAR enseguida, con lo que se sabe y lo que no. Qué corresponde avisar a la autoridad de datos lo define el abogado de ELEVAR.
8. Escribir qué pasó, cómo entraron, qué se hizo y qué cambia.

No se hace: borrar o reiniciar antes de guardar evidencia; cambiar una sola credencial cuando pudieron exponerse varias; esperar a entender todo para avisar.
