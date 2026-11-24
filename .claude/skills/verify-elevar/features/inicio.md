# Inicio (`/admin`)

Elegido el 2026-11-24. Tres pisos: «Para hacer hoy», «Lo que viene», «Cómo va el negocio». Todo sale de `GET /api/v1/panel/inicio/`.

## Qué comprobar

- **Recorrido:** `--rutas /admin` a los cinco anchos, con 0 saltos, 0 desborde y consola limpia. Con los datos de la siembra la página mide unos 4500 px a 1440.
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
