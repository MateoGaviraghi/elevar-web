# 06 — Diseño

El panel tiene que verse de la misma familia que el sitio público: mismos colores, mismas tipografías, mismas esquinas casi rectas. Los valores salen de `tailwind.config.ts`, `app/layout.tsx`, `styles/tokens.css` y `components/ui/`, leídos el 2026-11-17. **Si un valor de acá no coincide con esos archivos, gana el archivo y se avisa.**

Un panel se usa todos los días, muchas horas, para encontrar algo y actuar. Se juzga por lo rápido que se entiende, no por lo lindo en una captura.

## Colores (clases de Tailwind que ya existen)

| Token | Hex | En el panel se usa para |
|---|---|---|
| `ink-900` | `#0B1E33` | Títulos, barra superior, botón principal del panel |
| `ink-800` | `#0B2C3D` | Texto de tabla, hover del botón principal |
| `ink-700` | `#112130` | Fondos oscuros secundarios |
| `ink-600` | `#1A3247` | Bordes sobre fondo oscuro |
| `neutral-0` | `#FFFFFF` | Superficie de tarjetas, tablas, formularios |
| `neutral-50` | `#F9F8FB` | Fondo general del panel, encabezado de tabla |
| `neutral-200` | `#E5EAEE` | Todos los bordes y divisores, esqueletos de carga |
| `neutral-500` | `#929292` | Texto secundario, etiquetas, fechas (solo en texto de 14 px o más: contraste justo) |
| `neutral-700` | `#706F6F` | Texto común |
| `neutral-900` | `#333333` | Texto de alto contraste |
| `brand-500` | `#E94E1B` | Foco del teclado, ítem activo del menú, como mucho una acción destacada por pantalla |
| `brand-600` | `#C43E12` | Texto naranja chico (el 500 no llega al contraste sobre blanco) |
| `brand-50` / `brand-100` / `brand-700` | `#FEF3EF` / `#FDDDD4` / `#9A2F0C` | Fondo y texto de una ficha de filtro activa |
| `status-success` | `#1E7E4A` | Estados buenos: Pagada, Cumplida, Activo |
| `status-warning` | `#C47D0E` | Atención: Pendiente, Nueva, segundo factor sin configurar |
| `status-error` | `#B91C1C` | Problemas: Fallida, errores de formulario, Dado de baja, acción destructiva |
| `status-info` | `#1D4ED8` | Avisos informativos |

Reglas de color:
- **Verde, ámbar y rojo son solo para estados.** No para decorar, no para botones principales.
- **Un estado nunca se dice solo con color:** color + texto («Pagada»), y un ícono si ayuda. Se tiene que entender en blanco y negro.
- Fondos de estado: el color al 10 % (`bg-status-success/10 text-status-success`), como `components/ui/badge.tsx`.
- **No se usan los colores por defecto de Tailwind** (`emerald-*`, `amber-*`, `red-*`, `gray-*`, `neutral-100/300/400/600`). La demo actual los usa en `components/admin/ui.tsx` y se cambian por los de esta tabla.
- Un color nuevo se agrega como token en `tailwind.config.ts` por PR (ver `03-FRONTERA.md`). Nunca un hexadecimal en una clase.

## Tipografía

| Familia | Clase | Pesos cargados | Para qué |
|---|---|---|---|
| DM Sans | `font-display` | 400, 500, 600, 700 | Títulos de página y números grandes |
| Inter | `font-sans` (por defecto) | 400, 500, 600 | Todo lo demás |

Las dos se cargan en `app/layout.tsx` con `next/font/google`. No se agregan otras.

| Uso en el panel | Clase | Tamaño |
|---|---|---|
| Título de página | `font-display text-2xl font-semibold tracking-tight text-ink-900` | 24 px |
| Título de sección | `font-display text-lg font-semibold text-ink-900` | 18 px |
| Número grande del inicio | `font-display text-3xl font-semibold tabular-nums` | 30 px |
| Texto común y celdas de tabla | `text-sm` | 14 px |
| Encabezado de tabla, etiquetas | `text-xs font-semibold uppercase tracking-wider text-neutral-500` | 12 px |
| Fechas y datos secundarios | `text-xs text-neutral-500` o `text-sm text-neutral-500` | 12–14 px |

- Números en tablas: alineados a la derecha y con `tabular-nums`.
- Plata: `$ 48.000` (formato argentino, punto de miles, sin decimales si son cero). Fechas: `17/11/2026 13:00` (24 horas). Usar los formateadores de `lib/formatters.ts` (son de Mateo: se usan, no se cambian).

## Espacios

Escala fija de Tailwind: 4, 8, 12, 16, 24, 32 px (`1`, `2`, `3`, `4`, `6`, `8`). No se usan otros valores.

| Elemento | Medida |
|---|---|
| Fila de tabla | 44–48 px de alto (`py-3` con texto de 14 px) |
| Celda | `px-4` |
| Separación entre bloques de una página | 24 px (`gap-6`) |
| Margen de la página | 16 px en celular (`px-4`), 24 px desde 640 (`sm:px-6`), 32 px desde 1024 (`lg:px-8`) |
| Barra superior | 56 px (`h-14`) |
| Menú lateral | 240 px (`w-60`), fijo desde 1024; menú desplegable debajo de eso |
| Todo lo que se toca | 44 × 44 px como mínimo |

## Esquinas y sombras

| Token | Valor | Uso |
|---|---|---|
| `rounded-none` | 0 | Botones (así están en el sitio) |
| `rounded-sm` / `rounded` / `rounded-md` | 2 px | Campos, fichas, tarjetas |
| `rounded-lg` | 3 px | Diálogos |
| `rounded-full` | círculo | Solo avatares y puntos de estado |
| `shadow-sm` | `0 1px 2px rgba(11,30,51,0.05)` | Casi nunca: se separa con bordes de 1 px |
| `shadow-md` | `0 10px 30px -14px rgba(11,30,51,0.16)` | Menús desplegables |
| `shadow-lg` | `0 24px 60px -24px rgba(11,30,51,0.20)` | Diálogos |

Nada de esquinas muy redondeadas ni sombras grandes: el sitio es de esquinas rectas y bordes finos.

## Componentes

### Los que ya existen y se reusan
| Componente | Archivo | En el panel |
|---|---|---|
| Botón del sitio | `components/ui/button.tsx` | **No** en el panel: su relleno animado (0,8 s) es del sitio público |
| Campo de formulario | `components/ui/form-field.tsx` | Sí: etiqueta arriba en `text-xs uppercase`, campo de 48 px, fondo `neutral-50`, borde `neutral-200`, foco `brand-500`, error en `status-error` debajo |
| Insignia de estado | `components/ui/badge.tsx`, `status-badge.tsx` | Sí: para estados de órdenes y consultas |
| Piezas de la demo del panel | `components/admin/ui.tsx` | Sí, como punto de partida: `PageHeader`, `Card`, `StatCard`, `EmptyState`, `Field`, `Input`, `Select`, `SearchInput`, `FilterTabs`, `Table`/`Th`/`Td`, `Chip`, `ConfirmDialog`, `useToast`. Cambiar sus colores por los tokens de arriba |

### Botones del panel
| Tipo | Clases | Uso |
|---|---|---|
| Principal | `bg-ink-900 text-neutral-0 hover:bg-ink-800` | La acción principal de la pantalla (una sola) |
| Secundario | `border border-neutral-200 bg-neutral-0 text-ink-900 hover:border-ink-900` | Acciones comunes |
| Fantasma | `text-neutral-700 hover:text-ink-900` | Cancelar, links de acción |
| Peligro | `border border-status-error/40 bg-neutral-0 text-status-error hover:bg-status-error/10` | Dar de baja, cancelar una fecha |
Todos: `px-4 py-2.5 text-sm font-semibold`, 44 px de alto, `focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2`, `disabled:opacity-50`. Con estado de envío: el texto cambia («Guardando…») y el botón queda deshabilitado.

### Tablas
- `<table>` de verdad, con `<th scope="col">`.
- Encabezado fijo al bajar (`sticky top-0`), fondo `neutral-50`.
- Ordenar por columna con indicador visible; solo por columnas de una lista permitida.
- Filtros visibles como fichas, cada una con su ✕, y «Limpiar filtros». El total de resultados a la vista.
- Filtros, orden y página **en la dirección** (`?estado=NEW&pagina=2`): el botón «atrás» funciona y se puede compartir el link. Un valor inválido en la dirección cae al valor por defecto, nunca rompe la pantalla.
- Acciones de cada fila a la derecha o en un menú `⋯` (Radix `DropdownMenu`).
- En celular (menos de 768 px) la tabla pasa a tarjetas apiladas. Nunca se corta.

### Diálogos y avisos
- Confirmación antes de toda acción que cambia un estado o da de baja: Radix `Dialog`, título que dice qué pasa, botón que dice la acción («Marcar como cumplida», no «Aceptar»).
- Después de guardar: aviso corto («Guardado») abajo a la derecha, 3 segundos, con `role="status"`.

### Menú
- Barra superior `bg-ink-900` de 56 px: logo, nombre de la persona, «Salir».
- Menú lateral agrupado por tarea: **Atender** (Inicio, Consultas, Órdenes, Inscripciones) · **Catálogo** (Cursos) · **Administración** (Usuarios, Auditoría) · **Mi cuenta**. Un rol solo ve lo que puede usar (esconder el ítem es comodidad: el control lo hace la API).
- Ítem activo: texto `ink-900`, barra izquierda de 2 px `brand-500`.
- Título de cada página que diga dónde se está.

## Movimiento
- Solo para dar respuesta: abrir un diálogo, el aviso de guardado. 150–250 ms.
- Nada de animaciones de entrada en cada carga, ni scroll suave (Lenis no va en el panel).
- Respetar `prefers-reduced-motion`: con esa preferencia, sin animación.

## Accesibilidad mínima
- Contraste de texto 4,5:1 como mínimo (`neutral-500` solo en texto de 14 px o más; texto naranja chico en `brand-600`).
- Todo se usa con teclado, con el foco visible.
- Cada campo con su `<label>`; los errores con `role="alert"`.
- Íconos con `aria-label` o `aria-hidden` si están al lado de un texto.
- Un `<h1>` por página.

## Textos
- En castellano rioplatense, de vos, cortos: «Guardá», «Marcar como cumplida», «No hay consultas con estos filtros».
- Sin jerga técnica en la pantalla: «Algo falló. Reintentá.» en vez de «Error 500».
- **Saltos de línea:** ningún texto queda con una sola palabra en la última línea. Ya está resuelto en `app/globals.css` (`text-wrap: pretty` en párrafos, `balance` en títulos); no lo pises con estilos propios.

## Lo que hace que un panel se vea genérico (evitarlo)
Todo centrado, tarjetas con sombra grande y bordes muy redondeados, degradés, un ícono decorativo en cada título, todo con el mismo peso, números sin contexto.
