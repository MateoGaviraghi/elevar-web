# 10 — Lo que falta decidir

Todo lo marcado `{{CONFIRMAR}}` en estos documentos está acá, con quién lo decide. **No se decide solo.** Mientras una decisión está abierta, se trabaja en lo que no depende de ella. Cuando se decide, se anota la respuesta y la fecha en esta tabla y se saca la marca del documento que la tenía, en el mismo PR.

| # | Qué falta decidir | Opción recomendada | Decide | Bloquea |
|---|---|---|---|---|
| 1 | Cómo viaja la sesión entre el sitio (Vercel) y el backend (Railway), que están en dominios distintos | **Decidido 2026-11-17 (Mateo: «sesión por el puente de Next»):** puente en Next (`app/api/panel/[...ruta]/route.ts`) hacia Django, con la cookie en el dominio del sitio (`07-SEGURIDAD.md`, sección 4) | Mateo | — |
| 2 | Cuántas personas usan el panel y con qué permisos | **Decidido 2026-11-17 (Mateo: «solamente va a haber un usuario para ella en el admin»):** un solo usuario, el de Laura, rol `admin`. Sin rol `operador` ni pantalla de usuarios; soporte por comandos de Django | Mateo | — |
| 3 | Qué pasa con el admin de Django (`/admin/` del backend) cuando exista el panel | Dejarlo solo para un superusuario técnico, con el mismo segundo factor (`django-otp` trae una versión del admin que lo exige) y límite de intentos. Hoy no tiene ninguna de las dos cosas | Mateo | Etapa 8 |
| 4 | Promociones y cupones editables desde el panel | Afuera de la primera versión: siguen en el código del frontend | Mateo | — |
| 5 | Subir archivos desde el panel (portadas, PDF de cursos) | Afuera de la primera versión | Mateo y Laura | Etapa 6 |
| 6 | Alta de usuario: contraseña temporal mostrada una vez, o link por mail | **Ya no aplica (2026-11-17):** el alta la hace el comando `crear_usuario_panel`, con contraseña temporal mostrada una vez | — | — |
| 7 | Cifrar en la base el secreto del segundo factor, con una clave aparte (`PANEL_CLAVE_CIFRADO`) | Sí | Mateo | Etapa 1 (se puede hacer sin cifrar y agregarlo antes de la etapa 8) |
| 8 | Qué encabezado de IP es confiable detrás del proxy de Railway | Verificarlo en un despliegue de prueba antes de contar intentos por IP en producción | Quien construye el panel, mostrándole la evidencia a Mateo | Etapa 8 (en local la IP es la directa) |
| 9 | Dónde corre la tarea que borra `IntentoIngreso` de más de 90 días | Un comando de Django corrido por una tarea programada de Railway | Mateo | Etapa 8 |
| 10 | Retención de la auditoría | No se borra nada hasta que Laura decida | Laura | — |
| 11 | Dónde están los datos (Railway no tiene región en Sudamérica) y si hace falta consentimiento o cláusulas por la ley 25.326 | Lo decide ELEVAR con su abogado; se le avisa por escrito la región de la base | Laura y su abogado | Etapa 8 |
| 12 | Cómo se pide acceso, corrección o borrado de datos de un comprador | A mano por info@elevar.com.ar en la primera versión, con los plazos de la ley | Laura | Etapa 8 |
| 13 | Copias de seguridad de la base en Railway: si existen, cada cuánto, y cómo se restauran | Copia nocturna fuera de Railway y una restauración probada antes de la etapa 8 | Mateo | Etapa 8 |
| 14 | Si Sentry está configurado en producción (`SENTRY_DSN`) | Configurarlo, sin datos personales | Mateo | Etapa 8 |
| 15 | Ruta de salud que consulte la base, para el monitor externo | Agregar `/api/v1/health/db/` | Mateo (`core/` es compartido) | Etapa 8 |
| 16 | Política de contenido (CSP) para `/admin/**` | Agregarla en la etapa 2 junto con las demás cabeceras | Mateo (archivo compartido) | Etapa 2 |
| 17 | Quién publica el backend en Railway (hoy solo Mateo, desde su máquina) | Mateo publica; el panel le avisa cuando un PR del backend queda unido | Mateo | Cada publicación |
| 18 | Versión de Node que usa Vercel; versión y región de Postgres en Railway | Leerlas de los paneles de Vercel y Railway y anotarlas en `02-TECNOLOGIAS.md` | Mateo | — |
| 19 | Columnas que faltan en `catalog.Course` (objetivos, temario, rol del disertante, precio en dólares, gratuito, PDF) y en `orders.Order` (`buyer_dni`, `buyer_company`): nombres y tipos | Las define Mateo al pasar cursos y órdenes a la base | Mateo | Etapas 6 y 7 |
| 20 | Versiones exactas de `django-otp`, `argon2-cffi` y `@playwright/test` | La última sin alertas publicadas al momento de instalar | Quien construye el panel | Etapas 1 y 2 |
| 21 | Parámetros de Argon2 que usa Django por defecto (memoria, vueltas, hilos) | Verificar que cumplan el piso de `07-SEGURIDAD.md` (19 MiB, 2, 1) | Quien construye el panel | Etapa 1 |
| 22 | Acceso del compañero a los dos repositorios privados | Invitación de Mateo en GitHub | Mateo | Todo |

## Trabajo de Mateo que el panel espera

| Qué | Para qué etapa |
|---|---|
| Subir Next.js a 15.5.29 o más | Etapa 8 (antes de mostrar datos reales) |
| Columna `Lead.updated_at` | Etapa 3 |
| Que el sitio mande las inscripciones a webinars a la base | Etapa 5 |
| Pasar el catálogo de cursos del JSON a la base, con las columnas que faltan | Etapa 6 |
| Que el checkout guarde la orden en la base (con DNI y empresa) y que el aviso de pago de Mercado Pago la marque como pagada | Etapa 7 |
