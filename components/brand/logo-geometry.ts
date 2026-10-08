// Geometría del isologotipo de ELEVAR, redibujada en SVG a partir de
// `public/assets/isologotipo.png` (2947 × 981, 300 dpi); coincide en un 98,6 %.
// Isotipo: 3 barras y 2 arcos sobre un círculo de centro (336, 641), radio
// exterior 338 e interior 277. Cada pieza va por separado para poder animarla.
// El logotipo "ELEVAR" es una máscara del PNG recortado (`logotipo-elevar.png`)
// hasta tener el SVG del diseñador {{CONFIRMAR}}.

export const LOGO_ORANGE = "#E94E1B"; // brand-500, medido en el PNG
export const LOGO_GRAY = "#575756"; // gris del logotipo sobre fondo claro, medido en el PNG
export const LOGO_VIEWBOX = "-2 0 2949 981";

export type LogoBar = { id: "l" | "c" | "r"; d: string };
export type LogoArc = { id: "l" | "r"; d: string; /** Línea central que dibuja la máscara, de abajo hacia arriba. */ draw: string };

export const LOGO_BARS: LogoBar[] = [
  { id: "l", d: "M202 229Q226 196 262 191L262 970.8A338 338 0 0 1 202 951.3Z" },
  { id: "c", d: "M307 1Q345 4 367 40L367 977.6A338 338 0 0 1 307 977.8Z" },
  { id: "r", d: "M411 155Q447 160 471 191L471 950.9A338 338 0 0 1 411 970.6Z" },
];

export const LOGO_ARCS: LogoArc[] = [
  {
    id: "l",
    d: "M157 354.3A338 338 0 0 0 202 951.3L202 883.4A277 277 0 0 1 157 429.6Z",
    draw: "M241 933.4A307.5 307.5 0 0 1 191.6 369.5",
  },
  {
    id: "r",
    d: "M515 354.3A338 338 0 0 1 470 951.3L470 883.4A277 277 0 0 0 515 429.6Z",
    draw: "M431 933.4A307.5 307.5 0 0 0 480.4 369.5",
  },
];

/** Columnas de cada letra de "ELEVAR" en el PNG original. */
export const LOGO_LETTERS: [number, number][] = [
  [900, 1166],
  [1251, 1485],
  [1544, 1810],
  [1861, 2206],
  [2226, 2569],
  [2641, 2945],
];
export const LOGO_WORD = { src: "/assets/logotipo-elevar.png", x: 900, y: 415, w: 2047, h: 412 };
