# Consultas (`/admin/consultas`)

Elegido el 2026-11-24, con la forma del portal CESS. Banda azul con cuatro cifras que filtran y las pestañas «Lista» y «Cuándo llegan» (`?vista=cuando`); barra de filtros; tabla en su tarjeta con la paginación abajo; tocar una fila abre la ficha al centro (`?consulta=<id>`). Sale de `GET /api/v1/panel/consultas/`, `GET /api/v1/panel/consultas/cifras/` y `GET /api/v1/panel/consultas/<id>/`.

## Qué comprobar

- **Recorrido:** `--rutas "/admin/consultas,/admin/consultas?vista=cuando,/admin/consultas?consulta=<id>"` a los cinco anchos, con 0 saltos, 0 desborde y consola limpia.
- **Entra en pantalla:** lista, «Cuándo llegan» y la ficha abierta entran sin scrollear a 1366×650, 1440×900 y 1920×1080 (la misma medida que el Inicio). La tabla corre por dentro y la paginación (de 10 en 10) queda abajo, a la vista.
- **Cifras de la banda:** «Sin contestar» = `estado=NEW` (con arrepentimientos), «Arrepentimiento» = `estado=NEW&origen=ARREPENTIMIENTO` con «N vencidos» en naranja si alguno pasó las 24 h, «Contactadas» y «Cerradas». La elegida queda blanca (`a[aria-current=true]`). Tocar una lleva a la página 1 y conserva búsqueda, fecha y orden.
- **Filtros:** cada menú (`button[aria-haspopup=listbox]`) abre con click, Enter, Espacio o ↓; ↑ ↓, Inicio y Fin recorren; Enter elige; Esc y un click afuera cierran y el foco vuelve al menú. Con un filtro puesto el menú queda naranja claro y aparece su pastilla; «Limpiar todo» vuelve a «Sin contestar». El buscador aplica a los 350 ms y busca solo nombre o empresa.
- **Plazo de arrepentimiento:** cada fila de arrepentimiento sin contestar dice «Quedan N h» (naranja) o «Venció hace…» (rojo). `vence` llega del backend = `created_at` + 24 h; las demás filas traen `vence: null`.
- **Ficha:** `div[role=dialog]` montada en `body`, con «CONSULTA · N de M». ↑ ↓ pasan a la anterior o siguiente de la página; Esc, la cruz o un click afuera la cierran, la dirección pierde `consulta=` y el foco vuelve al botón de la fila (`[data-abrir=<id>]`). En el celular sube desde abajo y ocupa la pantalla. La dirección vieja `/admin/consultas/<id>` lleva a la lista con la ficha abierta.
- **Marcar contactada:** desde la fila («Contactada») o la tarjeta. Se hace sin preguntar; si la consulta deja de entrar en el filtro, su fila se corre y se pliega (0,22 s) y aparece el aviso con «Deshacer» (6 s; se queda con el mouse encima). «Deshacer» la devuelve al estado anterior. Cada cambio deja un evento `consulta.estado` en la auditoría. Ojo: el contador del menú lateral se actualiza recién al cambiar de pantalla (deuda anotada en 15-MEMORY).
- **Contestar (2026-11-25):** «Contestar» en la fila abre la tarjeta con el cursor en el mensaje (`?contestar=1`). «Abrir en mi correo» es un `mailto:` con destinatario, asunto y texto. «Enviar desde el panel» pide confirmar («Sí, enviar»), manda por `POST consultas/<id>/respuesta/` con una clave por intento, deja «Le escribió por correo» en el historial y pasa la consulta a contactada. Con texto escrito sin mandar, Esc o ↑ ↓ preguntan («Seguir escribiendo» / «Descartar»). **En local el correo no sale:** el backend se levanta con `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` y el correo se lee en su salida (Subject, From, To, Reply-To). Nunca se prueba contra producción. Script de la sesión: `contestar.mjs`.
- **Cuándo llegan:** una frase arriba (se esconde en pantallas de menos de 780 px de alto), tres cifras (hora con más, día con más, a la mañana) y dos gráficos de barras: por hora (la más alta en naranja) y por día.
- **Celular:** las cifras van de a dos, el nombre arriba y el número abajo; los menús de a dos; cada fila es una tarjeta de dos líneas (nombre arriba, estado, origen y hace cuánto abajo).

## Selectores

- Banda: `section[aria-labelledby=titulo-lista]`; cifras: sus `a` (la elegida con `aria-current=true`); pestañas: `[role=tab]#pestana-lista|#pestana-cuando`.
- Tabla: `table[aria-label=Consultas]`, filas `tr[data-fila=<id>]`, botón principal `[data-abrir=<id>]`, acciones `[data-accion]`.
- Ficha: `div[role=dialog]`; aviso: `[role=status]` con el botón «Deshacer».
- Script de prueba de la sesión que lo armó: `probar-consultas.mjs` (menú, cifras, ficha, teclado, Deshacer, dirección vieja); vive en el scratchpad, no en el repo.
