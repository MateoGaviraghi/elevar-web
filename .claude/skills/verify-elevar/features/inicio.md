# Inicio (`/admin`)

Elegido el 2026-11-24. Una banda baja con la pila de urgencias y tres pestañas: «Hoy», «Lo que viene» y «Negocio» (`?vista=viene|negocio`). Todo sale de `GET /api/v1/panel/inicio/`.

## Qué comprobar

- **Recorrido:** `--rutas "/admin,/admin?vista=viene,/admin?vista=negocio"` a los cinco anchos, con 0 saltos, 0 desborde y consola limpia.
- **Entra en pantalla (regla de Mateo, 2026-11-24):** en la computadora cada pestaña entra entera sin scrollear a 1366×650, 1440×900 y 1920×1080, y ninguna tarjeta se desborda por dentro. Se mide: `document.documentElement.scrollHeight - innerHeight` tiene que dar ≤ 0, y ningún hijo de un `[data-tarjeta]` puede terminar más abajo que la tarjeta (sin contar lo que recorta un contenedor de adentro, lo `aria-hidden` ni el `role=tooltip`). Ojo: un elemento escondido con `invisible` igual suma alto; los tooltips van con `hidden`.
- **Pestañas:** flecha derecha/izquierda, Inicio y Fin cambian de pestaña y mueven el foco; la pestaña queda en la dirección y sobrevive a recargar; en el celular la barra queda pegada arriba (debajo del encabezado de 56 px) al scrollear.
- **Pila de urgencias (en la banda azul):** cerrada muestra la más grave, dos asomando y «Ver las N». Un click en `button[aria-haspopup=dialog]` abre `div[role=dialog][aria-label=Urgente]` (montada en `body`), con los grupos Urgente / Para mirar; los números cuentan desde 0 (esperar ~900 ms). Esc, la cruz o un click afuera la cierran y el foco vuelve a la pila. Cada fila es un link (arrepentimiento → `/admin/consultas/<id>`). Sin urgencias se ve «Nada urgente». Los arrepentimientos no se repiten en «¿A quién contestar primero?».
- **Pagaron y no tienen el curso:** el número es igual al contador de «Órdenes» del menú. «La que más espera» muestra cuándo pagó la orden pagada más vieja.
- **Compras que no se completaron:** hasta 5 filas con nombre, estado, medio de pago y monto, sin correo ni teléfono. Cada fila abre `/admin/ordenes/<public_id>`, y «Ver y escribirles» abre `/admin/ordenes?estado=FAILED`.
- **Ritmo de inscripción:** la línea punteada es el cupo y la última etiqueta es «Hoy». En un curso en vivo se ve el texto que explica por qué no hay ritmo.
- **Cobrado:** pesos y dólares en cajas separadas, cada uno contra el mes anterior. Nunca se suman.
- **Del webinar a la compra:** la franja naranja se angosta al entrar hasta su proporción.
- **Movimiento:** la cifra de consultas rueda, la línea de 30 días se revela, los íconos de las etiquetas se dibujan, las barras crecen y las líneas de los pisos se extienden. Con «menos movimiento» todo aparece quieto y completo.

## Selectores

- Pisos: `#piso-hoy`, `#piso-viene`, `#piso-negocio`.
- Tarjetas: `section[aria-labelledby=a-pendientes|a-acceso|a-viejas|a-intentos|a-webinar|a-ritmo|a-cobrado|a-compras|a-cursos|a-origen|a-embudo|a-respuesta]`.
- Pila: `button[aria-haspopup=dialog]`; bandeja: `div[role=dialog][aria-label=Urgente]`, filas `[data-fila]`.
