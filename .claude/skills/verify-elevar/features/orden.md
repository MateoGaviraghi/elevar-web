# Orden (`/orden/<id>`) y comprobante (`/orden/<id>/comprobante`) — sitio público

La pantalla que el comprador abre desde el mail de compra: el pase impreso con su sello y los próximos pasos; y el comprobante con su PDF. Código: `components/order/order-status-client.tsx`, `pase-impreso.tsx`, `comprobante.tsx`, `comprobante-pdf.tsx`, `lib/comprobante.ts`; los datos los da `GET /api/v1/orders/<id>/` (`lib/api.ts`, `getOrder`). Necesita el backend.

Estados: **pagada** (sello «Pagado»), **devuelta** (pagada y devuelta entera por Mercado Pago o Stripe: `refunded_at`; sello «Devuelto», desde 2026-11-25), **fallida** (rechazada o cancelada: «Sin cobrar» y las filas para reintentar) y **pendiente**.

## Cómo se prueba

Con el backend local en el pago simulado de Mercado Pago (pasos 1 a 4 de «Launch»), parado en `<scratchpad>/verify-elevar/pw`:

1. Órdenes: `node ordenes-prueba.mjs --salida "$EV"` → `$EV/ordenes.json`.
2. La devolución (desde `backend/`, con las variables del paso 3): `MODO=devolver ORDENES="$EV/ordenes.json" .venv/Scripts/python manage.py shell -c "exec(open(r'<skill>/scripts/ordenes_prueba.py', encoding='utf-8').read())"` → `devolución: refunded`.
3. Lo que hace la página: `node acciones-orden.mjs --salida "$EV" --ordenes "$EV/ordenes.json"` (1440 y 375, más menos movimiento).
4. Recorrido: `MSYS_NO_PATHCONV=1 node recorrer-sitio.mjs --salida "$EV" --rutas /orden/<devuelta>,/orden/<devuelta>/comprobante,/orden/<pagada>,/orden/<pagada>/comprobante,/orden/<fallida>,/orden/<pendiente>`.
5. Al terminar: `MODO=borrar` con el mismo comando del paso 2.

## Qué comprobar

- **Cada estado** muestra su sello y su línea de arriba: «PAGADO / Pago aprobado», «DEVUELTO / Pago devuelto», «SIN COBRAR / Pago no aprobado» (con «Pagar con Mercado Pago»), «PENDIENTE / Pago pendiente».
- **Devuelta:** el título «<nombre>, te devolvimos el pago.» / «La inscripción se anuló.», la fecha y el medio de la devolución; sin «Tu lugar está reservado», sin «Pago aprobado» y sin «Agendá la fecha». El paso «Tu comprobante» abre el comprobante.
- **Comprobante devuelto:** etiqueta DEVUELTO, estado «Devuelto», dato «Devolución» con fecha, pie «El pago de esta compra se devolvió: la inscripción no está vigente», sin los pasos de acceso; «Descargar PDF» baja el archivo.
- **Comprobante pagado:** PAGADO, «acredita tu inscripción» y los pasos de acceso, sin rastro de devolución.
- **Menos movimiento:** el sello se ve sin la animación.
- **Saltos:** 0 a los cinco anchos en las seis pantallas (títulos de cursos largos, fecha y hora del comprobante, «Pesos argentinos (ARS)»).

## Lo que no prueba

- Una devolución real hecha desde el panel de Mercado Pago o de Stripe (el aviso real y la consulta a su API).
- Un pago real, un celular real ni Safari.
- El mail de compra (sale del backend).
