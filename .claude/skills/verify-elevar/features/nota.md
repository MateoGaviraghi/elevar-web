# Nota del blog (`/blog/<slug>`) — sitio público

«Cartas», elegida el 2026-11-26 entre tres prototipos (Etapas, Capítulos, Cartas; ref. Skiper UI · Sticky Card 003) y corregida en dos vueltas. Código: `components/blog/nota.tsx` (`NotaCapsula`), `components/blog/nota-datos.ts` (`datosNota`: intro, partes, una foto por parte, anterior y siguiente), `lib/pegar-en-vivo.ts`. No necesita el backend: el texto sale de `lib/blog-content.ts` y las fotos de `public/assets/blog/fotos/<slug>.webp`.

## Cómo se prueba

1. Recorrido: `MSYS_NO_PATHCONV=1 node recorrer-sitio.mjs --salida "$EV" --rutas /blog/componentes-incertidumbre-microbiologia-iso-19036` (con `--salida` en formato `C:/…`: con `/c/…` la carpeta queda en `C:\c\…`).
2. Lo que hace la página: `node acciones-nota.mjs --salida "$EV"` (escritorio 1440 y celular 375; la nota de 7 partes a 1366×650; la nota sin subtítulos; menos movimiento). Deja `acciones-nota.json` y capturas `nota-<escritorio|celular>-<paso>.png`.
3. Saltos de línea: `node scripts/saltos-de-linea.mjs http://localhost:3100` (repo) incluye una nota; para las nueve, cambiar `PAGES` por sus rutas en una copia.

## Qué comprobar

- **Cabecera azul:** migas, «Cápsula informativa», el título en mayúsculas con el punto naranja (entra por líneas), la bajada y los datos «fecha · N minutos de lectura · N partes» (las partes solo si hay dos o más). A la derecha el isotipo se arma al cargar (barras 1,3 s, arcos dibujados) y se mueve con el scroll; en el celular va debajo del texto. El título se achica en el celular para que su bloque más largo entre a 360.
- **Introducción:** el texto sube por líneas desde una máscara; «En esta cápsula» dibuja su línea y las tarjetitas (01, 02, 03…) entran de a una girando apenas. Tocar una lleva a su tarjeta a 88 px del borde. No aparece si la nota tiene menos de dos partes.
- **Cada tarjeta:** llega 160 px más abajo girada 4° y se endereza atada a la rueda; adentro, en orden, el número, el rótulo, el isotipo chico, el título por líneas, la línea, el texto y el pie. La foto se mueve adentro mientras se lee. El pie «Sigue: …» lleva a la próxima; en la última, «Terminaste la cápsula · Seguí con …» lleva a la anterior por fecha.
- **Apilado:** cuando una tarjeta se leyó entera queda fija y la siguiente sube por encima (cada una con su `z-index`; antes la fijada tapaba a la que llegaba). La de abajo pasa a escala 0,90, sube 36 px, gira 3° y se oscurece. La llegada girada no puede ensanchar la página (en el celular la corría a 406 px y escondía el header: `overflow-x-clip` en el contenedor).
- **Final:** «Seguí leyendo» con «Cápsula anterior» y «Cápsula siguiente» (en la más nueva, «Otra cápsula»), que al pasar el mouse se llenan de tinta; «Ver todas las cápsulas»; la banda naranja de la comunidad. No hay regla de lectura ni «Volver al blog» (rechazados).
- **Texto:** 16 px en el celular, 17 px desde 768; ninguna línea termina en «de», «la», «y»… y ningún párrafo deja una palabra sola abajo (`usePegarEnVivo`). Sin emojis ni viñetas dobles.
- **Menos movimiento:** todo visible al cargar.

## Lo que no prueba

- Un celular real ni Safari.
- Lighthouse y axe: no están instalados en el proyecto.
