# Avisos del panel — cobros e inscripción

> Tabla de reglas de los avisos (plugin `dashboard`, ficha de alertas). Decidido con Mateo el 2026-11-27 («Dale, 1 2 3 sí» y «GO-AHEAD, 1 2 sí»). El código que decide está en `elevar-backend/panel/services/avisos.py` (nivel y umbrales) y `elevar-backend/orders/avisos.py` (el único que los escribe). Si esta tabla y el código no coinciden, gana el código y se corrige esta tabla.

| Aviso | Cuándo salta | Nivel | Quién lo ve | Dónde | Acción |
|---|---|---|---|---|---|
| Pagó otro monto | Mercado Pago o Stripe aprueban un pago cuyo monto o moneda no son los de la orden. La orden queda pendiente | Urgente | Administración | Inicio (pila Urgente), Órdenes → A revisar, tarjeta de la orden | Copiar el número del pago, revisarlo en Mercado Pago o Stripe, Resolver con nota |
| Pagó sin lugar | Entra el pago y la fecha ya está llena (no se reservó el lugar) | Urgente | Administración | Ídem | Reubicar o devolver, Resolver con nota |
| No le llegó la confirmación | Falla el mail de compra confirmada al comprador | Urgente | Administración | Ídem | Reenviar la confirmación (cierra el aviso si sale) |
| No llegó el aviso de venta | Falla el mail de venta a ELEVAR | Para mirar | Administración | Ídem | Resolver con nota |
| Pago sin orden | Mercado Pago avisa de un pago aprobado o devuelto, o Stripe de uno pagado o devuelto, que no es de ninguna orden | Para mirar | Administración | Inicio, Órdenes → A revisar (arriba de la lista) | Copiar el número del pago, Resolver con nota |
| Devolución parcial | Stripe devuelve una parte del cobro, o Mercado Pago marca el pago «devuelto en parte». La orden no se marca devuelta | Para mirar | Administración | Inicio, Órdenes → A revisar, tarjeta | Resolver con nota |
| Devolución de otro pago | Se devuelve un pago de la orden que no es el que la pagó | Para mirar | Administración | Ídem | Resolver con nota |
| Lugares sin nombre | Una orden cobrada y sin devolver tiene lugares sin participante cargado y la fecha empieza dentro de **3 días** | Para mirar | Administración | Inicio, Órdenes → A revisar, tarjeta | Escribirle al comprador. Se calcula al pedir: se va sola cuando se completan los nombres o pasa la fecha (no se resuelve ni se pospone) |

## Reglas

- **Umbrales** (en `panel/services/avisos.py`, decisión de Mateo: un solo archivo, sin pantalla por ahora): lugares sin nombre a **3 días**, reenvío de la confirmación **una vez cada 10 minutos** por orden, posponer **7 días**.
- **Dos niveles** de los tres que permite la ficha: Urgente (actuar hoy) y Para mirar. No hay avisos «info».
- **Un aviso abierto por tipo y orden** (o por tipo y número de pago, si no hay orden). Si el problema se repite se actualiza el mismo y, si estaba pospuesto, vuelve a verse.
- **Resolver** pide una nota de al menos 3 caracteres. **Resolver, posponer y reenviar** quedan en la auditoría con quién y cuándo; la nota no se guarda en la auditoría (puede tener datos personales), solo su largo. Con orden, el evento va al historial de la orden.
- **Sin datos personales:** el aviso guarda montos, monedas, números de pago y de fecha; nunca correo, teléfono ni DNI.
- **Sin links a Mercado Pago ni a Stripe:** la dirección de la pantalla de un pago no figura en su documentación (buscado el 2026-11-27). El aviso muestra el número del pago con «Copiar el número» para buscarlo en el panel del proveedor.
- **Sin avisos por mail** por ahora: primero en el panel (ficha de alertas: mail solo para lo urgente o un resumen diario).

## Descartado (2026-11-27)

- «Pago pendiente hace más de 48 h»: el sistema no guarda si un pago quedó pendiente en Mercado Pago (efectivo, transferencia), y «Compras para recuperar» ya muestra las pendientes de más de una hora.
- Mails de webinar que fallan: no son cobros.
- «Marcar pagada igual» ante un monto distinto: cambia plata a mano; queda para cuando Mateo lo pida.
- Cruce automático con los reportes de Mercado Pago y Stripe: necesita las cuentas reales de Laura.
