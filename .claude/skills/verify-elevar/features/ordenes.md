# Órdenes (`/admin/ordenes`)

Rediseñada el 2026-11-25 con la forma del portal CESS, igual que Consultas (D-004). Banda azul con cuatro cifras que filtran y lo cobrado en el mes por moneda; barra de filtros; tabla en su tarjeta con la paginación abajo; tocar una fila abre la tarjeta de la orden al centro (`?ver=<public_id>`). Sale de `GET /api/v1/panel/ordenes/`, `GET /api/v1/panel/ordenes/cifras/` y `GET /api/v1/panel/ordenes/<public_id>/`. El menú lateral cuenta con `GET /api/v1/panel/contadores/`.

## Qué comprobar

- **Recorrido:** `--rutas "/admin/ordenes,/admin/ordenes?estado=TODAS,/admin/ordenes?estado=DEVUELTAS&ver=<public_id>"` a los cinco anchos, con 0 saltos, 0 desborde y consola limpia.
- **Entra en pantalla:** la lista y la tarjeta abierta entran sin scrollear a 1366×650, 1440×900 y 1920×1080.
- **Cifras:** «Falta dar acceso» = `estado=PAID` sin devolver, con «N hace más de 24 h» en naranja; «Sin completar» = `estado=SIN_COMPLETAR` (la misma regla del Inicio: fallidas, canceladas o pendientes de más de 1 h en 30 días, sin las de quien después pagó); «Cumplidas» = `estado=FULFILLED` sin devolver; «Devueltas» = `refunded_at` puesto. «Cobrado en <mes>»: una cifra por moneda, sin las devueltas. Nunca se suman pesos con dólares.
- **Orden de la lista:** en «Falta dar acceso», de la más vieja a la más nueva (primero la que más espera); en el resto, al revés.
- **Filtros:** Estado, Medio (Mercado Pago, Stripe), Curso (lista con scroll), Fecha. El buscador busca nombre, empresa o el número corto (`#F66DC23D`, con o sin `#`); el correo no viaja en la dirección.
- **Dar acceso:** el botón de la fila abre la tarjeta con «Dar acceso al aula» a mano (`?accion=acceso`). «Ya le di el acceso» pide confirmar; «Volver» no marca nada; «Sí, ya tiene el acceso» la pasa a cumplida (`orden.cumplida` en la auditoría), la tarjeta muestra «Acceso dado», la fila sale del filtro, aparece el aviso y el número del menú baja sin cambiar de pantalla. No hay «Deshacer»: no se deshace desde el panel.
- **Tarjeta:** cursos con fecha, lugares y **participantes con su correo**; correo del comprador con «Copiar»; teléfono, empresa y DNI tapado (`**.***.456`) con «Mostrar» (deja `orden.ver_dni` y avisa «Queda registrado que viste el DNI»); pago con el id de Mercado Pago o de Stripe; «Escribirle» abre el correo propio (`mailto:` con asunto) o WhatsApp (no se envía desde el panel); notas internas (en la auditoría queda solo el largo); historial. ↑ ↓ recorren, Esc cierra. La dirección vieja `/admin/ordenes/<public_id>` lleva a la lista de todas con la tarjeta abierta.
- **Devuelta:** chip rojo «Devuelta», total tachado y el aviso arriba de la tarjeta («No le des el acceso», o, si ya estaba cumplida, «revisá si hay que darlo de baja en el aula»). El estado de la orden no cambia.
- **Celular:** cifras de a dos, menús de a dos; cada fila es una tarjeta: nombre y curso, estado con el total, y abajo número, medio y hace cuánto.

## Devoluciones (backend)

- Mercado Pago: un aviso de pago con estado `refunded` o `charged_back`, del mismo pago que pagó la orden, la marca devuelta (`refunded_at`), libera los lugares y deja `orden.devuelta`. Una devolución parcial deja el pago «approved» y no se marca.
- Stripe: el evento `charge.refunded`; se consulta el cobro a Stripe y solo una devolución total marca la orden. **Hay que sumar `charge.refunded` al destino del aviso en el panel de Stripe.**
- Pruebas: `backend/tests/test_devoluciones.py` (proveedores simulados, firmas reales). En local no se prueban avisos reales.

## Selectores

- Tabla: `table[aria-label=Órdenes]`, filas `tr[data-fila=<public_id>]`, acciones `[data-accion]` («Dar acceso a …», «Escribirle a …»).
- Tarjeta: `div[role=dialog]`; confirmación `[role=alertdialog]`; aviso `[role=status]`.
- Script de la sesión que lo armó: `ordenes-flujo.mjs` (entra en pantalla, dar acceso, teclado, DNI, devueltas, búsqueda por número, celular); vive en el scratchpad.
