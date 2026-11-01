/** Utilidades numéricas compartidas por todos los efectos. */

export const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

export const clamp01 = (n: number): number => clamp(n, 0, 1);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Lleva `value` del rango [inMin, inMax] al rango [0, 1], recortado. */
export const progress = (value: number, inMin: number, inMax: number): number =>
  clamp01((value - inMin) / Math.max(1e-9, inMax - inMin));

/**
 * Suavizado exponencial independiente del frame rate: el valor se acerca al
 * objetivo con la misma sensación a 30, 60 o 120 fps. `retain` es la fracción
 * que queda por recorrer después de un segundo (0.0015 ≈ planea, 0.05 ≈ rápido).
 */
export const damp = (current: number, target: number, retain: number, dt: number): number =>
  lerp(current, target, 1 - Math.pow(retain, dt));
