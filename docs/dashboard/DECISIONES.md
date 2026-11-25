# Decisiones de diseño del panel

> Lo elegido y lo rechazado por pantalla. Lo rechazado no se vuelve a ofrecer.

## D-001 — 2026-11-18 — Ingreso (`/admin/ingresar`, `/admin/ingresar/codigo`, `/admin/primer-ingreso`)

Elegido: «Medidor» con la franja naranja del título (ronda 3). Fondo azul tinta liso, tarjeta a la izquierda, isotipo de ELEVAR grande a la derecha, todo naranja y animado con GSAP (arcos que se dibujan, barras que suben). Campos inspirados en `CampoDuo` del portal de CESS.

Rechazado:
- Pantalla partida con foto (bloque login-02 de shadcn): «súper insulso, nada de movimiento, no hace».
- «Laboratorio» (foto que se abre como ventana) y «Trazos» (arcos con luz, como el Escenario de CESS): no elegidos.
- En Medidor: los pasos «01 Contraseña / 02 Código / 03 Adentro», las líneas horizontales del fondo y las barras en azul («que esté todo naranja»). Pidió «algo más tranqui».
- «Tarjeta naranja» (toda la tarjeta naranja): no elegida.

Actualización (rondas 4 y 5, mismo día):
- Elegido: título grande en blanco fuera de la tarjeta con las últimas palabras sobre un bloque naranja; humo animado a la derecha (ref. «Smoke Login», https://21st.dev/@aakashmehra/components/smoke-login, hecho desde cero en `components/admin/humo.tsx`); código en casillas redondeadas que se ponen verdes al acertar (ref. «BeUI OTP Input», https://21st.dev/@starc007/components/be-ui-otp-input); botón verde con tilde al acertar la contraseña; ojo en vez de «Mostrar»; bordes redondeados en todo el ingreso.
- Rechazado: «me quedó demasiado insulso»; casillas del código cuadradas («no los quiero así… está siendo muy feo»); las ondas y el brillo de la ronda 4 (los reemplaza el humo).

Archivos: `components/admin/humo.tsx`, `components/admin/ingreso.tsx`, `components/admin/ingreso-escenario.tsx`, `app/admin/(ingreso)/layout.tsx`, `app/admin/(ingreso)/ingresar/page.tsx`, `app/admin/(ingreso)/ingresar/codigo/page.tsx`, `app/admin/(ingreso)/primer-ingreso/page.tsx`.

## D-002 — 2026-11-24 — Marco (barra lateral) e Inicio (`/admin`)
Elegido: versión A «Protagonista» (Finance Bento de romanvasnev en 21st.dev + Growth Benchmark de Evil Charts, https://evilcharts.com/docs/echarts/area-chart/blocks), con el contenido de tres pisos que pidió Mateo: «pensá como si fueras el profesional y dueño de esta empresa, qué es lo que importa el día a día ver». Mateo: «el que me recomiendes».
- **Para hacer hoy:** aviso de arrepentimiento con su plazo de 24 h; consultas sin contestar (tarjeta naranja con la línea de 30 días contra los 30 anteriores); pagaron y no tienen el curso; a quién contestar primero; compras que no se completaron.
- **Lo que viene:** próxima fecha con medidor de cupo y días que faltan; ritmo de inscripción con el cupo punteado (solo webinars).
- **Cómo va el negocio:** cobrado del mes contra el anterior, por moneda; ventas de 12 meses; mosaico de cursos más vendidos; de dónde llegan las consultas; del webinar a la compra; tiempo de respuesta.
- Marco: barra azul tinta con contadores y la cuenta abajo. Tres colores con trabajo (azul superficie, naranja lo que espera, blanco para leer), tres fuentes (DM Sans, Space Grotesk, Inter), tres botones, cada tarjeta con etiqueta e ícono propio, pregunta, «Sirve para…», referencia, conclusión y acción.

Rechazado:
- Ronda 1 de referencias (Halcyon, Serf, Square UI, Nuxt UI, shadcn sidebar-09, Magic UI Animated List, Linear): «todas malísimas, estáticas».
- Versión B «Mosaico» y versión C «Centro de mando» (columna de íconos que se abre, pila de fechas, columnas de puntos): no elegidas.
- Primera pasada de la A: «solamente usás el blanco y el naranja y te olvidás del azul… queda muy insulso».
- Íconos de 18 px sobre un cuadro del mismo tono: «ni se notan y no se entienden».
- Fuera del Inicio: mapa de días y horas (queda `MapaCalor` para la pantalla de Consultas), puntos y área del año, actividad reciente.

Archivos: `components/admin/shell.tsx`, `components/admin/iconos.tsx`, `components/admin/inicio/{Protagonista,piezas,graficos}.tsx`, `app/admin/(panel)/page.tsx`, `app/admin/(panel)/layout.tsx`, `tailwind.config.ts`, `lib/admin/tipos.ts`, `lib/admin/formato.ts`; backend `panel/services/inicio.py`, `panel/serializers.py`, `tests/panel/test_inicio.py`. Verificación: `.claude/skills/verify-elevar/`.
- Corrección (mismo día): la franja roja de arrepentimientos debajo de «Para hacer hoy» se rechazó («esto no va, quiero como lo tiene el del portal de CESS»). En su lugar, la pila de urgencias dentro de la banda azul, como la `PilaUrgente` del portal CESS: `components/admin/inicio/PilaUrgente.tsx`.
- Corrección (mismo día, después de publicar): «los componentes a veces son tan grandes… que ya arrancás y no ves ninguno… mínimo debería haber 4 o 5 gráficos fundamentales y luego, como hay tantos, podrías poner una nav bar para recorrer entre ellos; si entran dentro de la pantalla mejor, porque el scrollear te pierde». El Inicio pasa a una banda baja (unos 150 px) con la pila de urgencias y tres pestañas (Hoy · Lo que viene · Negocio), cada una entera en la pantalla a 1366×650, 1440×900 y 1920×1080. Tarjetas compactas; el «Sirve para…» va en un «?»; en pantallas de menos de 780 px de alto se esconden la oración de la banda, las referencias y las conclusiones. Rechazado: el Inicio largo en tres pisos (unos 4000 px de alto; a 1440×900 solo entraba la banda).


## D-003 — 2026-11-24 — Consultas (`/admin/consultas`)
Elegido: la forma del portal CESS, no una referencia de afuera. Mateo, después de la ronda de 5 referencias: «mantené el diseño como el del portal, o sea no idéntico pero sí lo de las cards para las plantillas, los filtros, la paginación, el formulario». Y a las dos preguntas: «lo que recomendás».
- Banda azul tinta con «Atender», el título, «N sin contestar» y cuatro cifras que filtran (Sin contestar, Arrepentimiento con sus vencidos, Contactadas, Cerradas); la elegida queda blanca, como las del portal.
- Pestañas «Lista · Cuándo llegan» arriba a la derecha de la banda (el lugar del «Nuevo…» del portal: las consultas entran solas). El mapa de días y horas va en «Cuándo llegan», con el resumen y las barras por día.
- Barra de filtros del portal (su D-033): buscador ancho, menús Estado, Origen, Fecha y Ordenar con la etiqueta arriba, pastillas y «Limpiar todo».
- Tabla en tarjeta, filas de 56 px, chips con punto, acciones a la vista (marcar contactada y abrir); la tabla corre por dentro y la paginación del portal (10/25/50 por página, páginas numeradas) queda abajo. Toda la pantalla entra a 1366×650, 1440×900 y 1920×1080.
- Ficha al centro como la del portal (su D-030): cabecera azul con chips y el plazo, ↑ ↓ para recorrer, Esc para cerrar; mensaje, correo, teléfono, empresa, recibida e historial. La dirección `/admin/consultas/<id>` lleva a la lista con la ficha abierta.
- Marcar contactada se hace al toque con «Deshacer» (no pide confirmación): es reversible.
- Formulario: Consultas no carga nada; el formulario en tarjeta con pasos del portal queda para Órdenes o Cursos.

Rechazado (ronda de referencias, no elegida; Mateo pidió la forma del portal en su lugar): Front (bandeja de tres paneles, SaaSFrame), Decision Inbox y Kanban Card Movement (21st.dev), Flexbox Filtering (GSAP), tablecn.

Archivos: `components/admin/lista/{Banda,BarraFiltros,Tabla,Paginacion,Ficha}.tsx`, `app/admin/(panel)/consultas/page.tsx`, `app/admin/(panel)/consultas/[id]/page.tsx`, `lib/admin/{tipos,formato,api}.ts`; backend `panel/services/consultas.py` (cifras, `vence`, `orden`), `panel/serializers.py`, `panel/views.py`, `panel/urls.py`, `tests/panel/test_consultas.py`, `tests/panel/test_permisos.py`. Verificación: `.claude/skills/verify-elevar/features/consultas.md`.
- Corrección (2026-11-25), Mateo: «el heads-up que hace cuando entrás a cada consulta es malísimo» (es la tarjeta que se abre), «estaría bueno que puedas escribir desde acá y enviar… o que te aparezca el correo abierto», «los íconos de las acciones no tienen explicación, son insulsos», «no está bien centrada como en el portal», «la paginación tiene que ser de 10 en 10», «cuándo llegan… no se entiende nada, muy insulso», «lo de resumen, todo compactado ahí, malísimo». Respuestas: «1 el card de cada consulta… 2 las dos 3 barras» y GO-AHEAD.
  - La tarjeta a dos columnas (unos 1040 px): a la izquierda lo que escribió, el correo, teléfono y empresa solo si existen, y el historial; a la derecha **Contestar** (asunto y mensaje editables) con «Enviar desde el panel» (pide confirmar; sale por Resend con respuesta a info@, queda en el historial y la pasa a contactada), «Abrir en mi correo» (mailto con todo puesto) y «Mandar por WhatsApp». Con texto sin mandar, pregunta antes de cerrar o de pasar a otra.
  - Acciones de la fila con texto: «Contestar» y «Contactada». Columnas centradas como en el portal, salvo la persona. De 10 en 10. Sin la frase de la banda ni la columna «Asunto».
  - «Cuándo llegan»: una frase («Llegan sobre todo los miércoles, entre las 9 y las 12 h»), tres cifras separadas (la hora con más, el día con más, a la mañana) y dos gráficos de barras (por hora y por día).
  - Rechazado: el mapa de puntos de días y horas («no se entiende nada»), el resumen azul apretado, los íconos sueltos ✓ y › de la fila, la tarjeta con mensaje, datos y botones en una sola columna.
  - Backend: `POST consultas/<id>/respuesta/` (permiso `consulta.responder`, una vez por clave, 30 por hora por cuenta, evento `consulta.respuesta` con el texto), plantilla `templates/emails/respuesta_consulta.{html,txt}`.
- Corrección (2026-11-25), Mateo: «sigue sin entrar de manera inmersiva y movimiento… toqué prueba de arrepentimiento y volvió a entrar así como tildada… no hizo nada». Causas medidas: (1) cada clic cambiaba la dirección con `router.replace`, que primero le pide la página al servidor (un pedido `_rsc`; en local 60 a 120 ms, publicado más) y recién después abre la tarjeta; (2) la animación de entrada se preparaba antes de que la tarjeta estuviera en la página y no se volvía a correr: aparecía entera de una; (3) el esqueleto era más bajo que el contenido y la tarjeta saltaba de alto. Arreglo: la dirección cambia con el historial del navegador (sin pedido al servidor); la tarjeta crece desde la fila tocada como la `TarjetaModal` del portal (0,55 s expo.out; contenido a los 0,16 s; partes en cascada desde 0,26 s) y vuelve a su fila al cerrar (0,38 s); la cabecera sale de la fila y no espera al servidor; alto fijo en la computadora (`min(88dvh, 760px)`); los bloques del cuerpo entran en cascada cuando llegan.

## D-004 — 2026-11-25 — Órdenes (`/admin/ordenes`)
Elegido: la forma del portal CESS, como Consultas (D-003; sin ronda de referencias: las pantallas de lista del panel ya tienen forma decidida). Mateo, al plan: «GO-AHEAD, 1 2 3 sí» (devueltas marcadas aparte sin cambiar el estado; participantes con su correo en la tarjeta; escribirle solo desde el correo propio o WhatsApp).
- Banda azul «Atender · Órdenes · N para dar acceso» con cuatro cifras que filtran: Falta dar acceso (con «N hace más de 24 h»), Sin completar (la regla del Inicio), Cumplidas, Devueltas. A la derecha, «Cobrado en <mes>» con una cifra por moneda.
- Filtros Estado, Medio, Curso y Fecha, y el buscador por nombre, empresa o número corto. Sin menú «Ordenar»: «Falta dar acceso» va de la más vieja a la más nueva (primero la que más espera) y el resto al revés; con cinco menús el buscador quedaba apretado.
- Tabla: comprador y curso, número y fecha, total y medio, estado («Pagó hace…» en rojo pasadas las 24 h), y una acción con texto: «Dar acceso» (naranja) o «Escribirle». De 10 en 10.
- Tarjeta que crece desde la fila, a dos columnas: cursos con participantes, comprador (DNI tapado con «Mostrar»), pago e historial; a la derecha «Dar acceso al aula» (dos pasos y confirmación, porque no se deshace), «Escribirle» y notas internas.
- Devoluciones: una devolución total o un contracargo en Mercado Pago o Stripe marca la orden «Devuelta» (`refunded_at`), libera los lugares y queda en la auditoría; el estado no cambia (la página pública de la orden no lo conoce). Las devueltas no cuentan como cobradas ni esperan acceso, tampoco en el Inicio.
- Menú lateral: los números salen de `GET contadores/` y se vuelven a pedir cuando una pantalla avisa (`avisarContadores()`), no solo al navegar.

Rechazado: ninguno nuevo (no hubo ronda).

Archivos: `app/admin/(panel)/ordenes/page.tsx` (reescrito), `app/admin/(panel)/ordenes/[publicId]/page.tsx` (redirige), `components/admin/lista/Botones.tsx` (nuevo: botones y chips compartidos), `components/admin/lista/BarraFiltros.tsx` (menús largos con scroll), `components/admin/shell.tsx` (contadores), `lib/admin/{api,tipos,formato}.ts` (sin PayPal); backend `orders/models.py` + `0005_orden_devuelta`, `orders/services.py` (`apply_refund`), `orders/payments_stripe.py` (`fetch_charge`), `webhooks/services.py` (`charge.refunded`), `panel/services/{ordenes,inicio}.py`, `panel/{serializers,views,urls,auditoria}.py`, `tests/test_devoluciones.py`, `tests/panel/{test_ordenes,test_permisos}.py`. Verificación: `.claude/skills/verify-elevar/features/ordenes.md`.
