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
