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

