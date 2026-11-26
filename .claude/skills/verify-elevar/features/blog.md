# Blog (`/blog`) — sitio público

Elegido el 2026-11-24 («Revista», ref. The Explora Journal, con el encabezado de la lista de cursos). Código: `components/blog/lista.tsx` (`BlogLista`), `piezas.tsx`, `datos.ts`. No necesita el backend: las notas salen de `lib/blog.ts` y `lib/blog-content.ts`, y las fotos de `public/assets/blog/fotos/<slug>.webp`.

## Cómo se prueba

1. Recorrido: `MSYS_NO_PATHCONV=1 node recorrer-sitio.mjs --salida "$EV" --rutas /blog` (cinco anchos, menos movimiento y links).
2. Lo que hace la página: `node acciones-blog.mjs --salida "$EV"` (escritorio 1440 y celular 375, más menos movimiento). Deja `acciones-blog.json` y capturas `blog-<escritorio|celular>-<paso>.png`.

## Qué comprobar

- **Encabezado:** «CÁPSULAS» de lado a lado sin pasarse de su columna; el número (`[data-contador]`) cuenta desde 0 hasta la cantidad de cápsulas publicadas (hoy 9) en ~1,4 s; el `h1` tiene `aria-label="Cápsulas informativas"`. En la entrada (cuadros 0,4 · 1,2 · 2,8 s) no asoma nada antes de tiempo.
- **La destacada (la más nueva):** al llegar, la foto (`.ds-ventana`) es una ventana chica (`clip-path: inset(18% 26% …)` en escritorio, `inset(14% 10% 30% 10%)` en celular) y al bajar ~110 % de pantalla (70 % en celular) se abre a `inset(0)`; el recuadro (`.ds-caja`) pasa de opacidad 0 a 1. La sección queda fija mientras se abre y después sigue la página.
- **Todas las cápsulas (`#capsulas`):** la grilla muestra todas menos la destacada, cada una con su foto cargada; «Lista» (`role=tab`) cambia a una fila por cápsula (`li.re-fila`) y queda `aria-selected=true`; «Grilla» vuelve. Cada tarjeta, fila y la destacada abren `/blog/<slug>` y responden 200.
- **Cierre:** banda naranja con «COMUNIDAD ELEVAR» (en el celular, en dos renglones), el texto de la comunidad y el botón «Sumarme a la comunidad».
- **Menos movimiento:** la cantidad se ve sin contar, la foto de la destacada entera (sin ventana) y su recuadro visible; nada queda oculto.
- **A ojo (las capturas):** la tarjeta al pasar el mouse se llena de azul desde abajo (0,8 s) y la foto se acerca; en la lista, las demás filas se apagan. Esto depende del mouse: no se prueba en celular.

## Lo que no prueba

- Un celular real ni Safari.
- La página de cada nota (`/blog/<slug>`): tiene su ficha, `nota.md`.
