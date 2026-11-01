/**
 * Tokens del kit. Los efectos nunca traen colores ni curvas propias: leen
 * variables `--fx-*` que el proyecto mapea a sus tokens una sola vez
 * (ver docs/CONTRACT.md):
 *
 *   :root {
 *     --fx-ground: var(--color-ground);
 *     --fx-ink: var(--color-ink);
 *     --fx-accent: var(--color-accent);
 *     --fx-ease: cubic-bezier(0.16, 1, 0.3, 1);
 *     --fx-duration: 900ms;
 *   }
 */

export const FX_TOKENS = ['--fx-ground', '--fx-ink', '--fx-muted', '--fx-accent', '--fx-on-accent', '--fx-ease', '--fx-duration'] as const;

export type FxToken = (typeof FX_TOKENS)[number] | `--fx-${string}`;

/** Lee un token resuelto desde el elemento (hereda del :root). */
export function token(el: Element, name: FxToken, fallback = ''): string {
  if (typeof getComputedStyle === 'undefined') return fallback;
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

/** Duración del token en milisegundos (acepta `900ms` o `0.9s`). */
export function durationMs(el: Element, name: FxToken = '--fx-duration', fallback = 900): number {
  const raw = token(el, name);
  if (!raw) return fallback;
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return fallback;
  return raw.endsWith('ms') ? n : n * 1000;
}

/** La curva del sitio como array para GSAP/Motion: `cubic-bezier(a,b,c,d)` → `[a,b,c,d]`. */
export function easeArray(el: Element, name: FxToken = '--fx-ease'): [number, number, number, number] {
  const m = token(el, name).match(/cubic-bezier\(([^)]+)\)/);
  const parts = m?.[1]?.split(',').map((s) => parseFloat(s));
  if (parts && parts.length === 4 && parts.every((n) => !Number.isNaN(n))) return parts as [number, number, number, number];
  return [0.16, 1, 0.3, 1]; // la curva de la casa (docs/SIGNATURE-OBLIVION.md)
}
